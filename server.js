require('dotenv').config();
const express = require('express')
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const helmet = require('helmet');

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');

app.use('/public', express.static(process.cwd() + '/public'));
app.use('/assets', express.static(process.cwd() + '/assets'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set security headers
app.use(helmet.noSniff());
app.use((req, res, next) => {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('surrogate-control', 'no-store');
  res.setHeader('cache-control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('pragma', 'no-cache');
  res.setHeader('expires', '0');
  res.setHeader('X-Powered-By', 'PHP 7.4.3');
  next();
});

// Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  }); 

//For FCC testing purposes
fccTestingRoutes(app);
    
// 404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

// Set up multiplayer functionality
const players = [];
let item = null

const getPlayerIndex = (prop, value) => {
  let index = -1;
  for (let i = 0; i < players.length; i ++) {
    if (players[i][prop] === value) {
      index = i;
    }
  }
  return index;
}

io.on('connection', socket => {
  // Send socket id and item data to newly connected player
  socket.emit('socketId', socket.id);
  socket.emit('itemData', item);

  socket.on('updatePlayer', player => {
    const i = getPlayerIndex('id', player.id)
    if (i === -1) {
      players.push(player)
    } else {
      players[i] = player;
    }
    io.emit('playersData', players)
  });

  socket.on('updateItem', itm => {
    item = itm
    io.emit('itemData', item)
  });

  socket.on('disconnect', () => {
    const i = getPlayerIndex('socketId', socket.id)
    players.splice(i, 1)
    io.emit('playersData', players)
  });
});

// Set port number
const portNum = process.env.PORT || 3000;

// Set up server and tests
http.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch (error) {
        console.log('Tests are not valid:');
        console.error(error);
      }
    }, 1500);
  }
});

module.exports = app; // For testing
