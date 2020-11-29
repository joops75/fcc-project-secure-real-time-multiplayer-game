import Player from './Player.mjs';
import Collectible from './Collectible.mjs';

const socket = io();
const canvas = document.getElementById('game-window');
const ctx = canvas.getContext('2d');

// game canvas constraints
const width = canvas.width;
const height = canvas.height;
const headerHeight = 40;
const border = 10;
const title = 'Marble Chase';
const titleFontSize = 30;
const subtitleFontSize = 20;
const titleCentreY = border + headerHeight / 2 + titleFontSize / 4;
const subtitleCentreY = border + headerHeight / 2 + subtitleFontSize / 4;
let rankTextWidthPrev = null;

// player constraints
const avatarSize = 10;
const playerMinX = border;
const playerMinY = headerHeight + 2 * border;
const playerMaxX = width - border - avatarSize;
const playerMaxY = height - border - avatarSize;
const moveSize = 10;

// item constraints
const itemSize = 5;
const itemMinX = border;
const itemMinY = headerHeight + 2 * border;
const itemMaxX = width - border - itemSize;
const itemMaxY = height - border - itemSize;

// colors
// const lightPink = 'rgb(253, 180, 193)';
// const palePink = 'rgb(255, 222, 218)';
// const indigo = 'rgb(197, 194, 223)'; // lightPeriwinkle
// const violet = 'rgb(155, 148, 190)'; // glossyGrape
// const deepPeach = 'rgb(249, 200, 160)';
const lightRed = 'rgb(242, 137, 151)'; // tulip
const lightGreen = 'rgb(185, 245, 169)'; // menthol
const lightYellow = 'rgb(248, 248, 176)'; // calamansi
// const red = 'rgb(238, 96, 85)';
const turquoise = 'rgb(96, 211, 148)';
// const green = 'rgb(170, 246, 131)';
// const orange = 'rgb(255, 217, 125)';
// const salmon = 'rgb(255, 155, 133)';
const blue = 'rgb(131, 188, 255)';
const darkGrey = 'rgb(50, 50, 50)';
const mediumGrey = 'rgb(65, 65, 65)';
const lightGrey = 'rgb(80, 80, 80)';

const frameColor = darkGrey;
const headerColor = mediumGrey;
const titleColor = lightGreen;
const subtitleColor = lightYellow;
const gameAreaColor = lightGrey;
const playerColor = lightRed;
const enemyColor = blue;
const itemColor = turquoise;

// fonts
const titleFont = titleFontSize + 'px isocteur';
const subtitleFont = subtitleFontSize + 'px geniso';

// fill in canvas frame
ctx.fillStyle = frameColor;
ctx.fillRect(0, 0, width, height);

// fill in canvas header
ctx.fillStyle = headerColor;
ctx.fillRect(border, border, width - 2 * border, headerHeight);

// fill in canvas title
ctx.font = titleFont;
ctx.fillStyle = titleColor;
ctx.textAlign = "center";
ctx.fillText(title, width / 2, titleCentreY);

// functions
const randomCoord = (min, max) => {
  return Math.floor((Math.round(Math.random() * (max - min)) + min) / moveSize) * moveSize;
}

const randomCoords = (minX, minY, maxX, maxY) => {
  return [
    randomCoord(minX, maxX),
    randomCoord(minY, maxY)
  ];
}

const makePlayer = () => {
  const [x, y] = randomCoords(playerMinX, playerMinY, playerMaxX, playerMaxY);
  player = new Player({ x, y, score: 0, id: Date.now(), avatarSize, playerMinX, playerMinY, playerMaxX, playerMaxY });
}

const makeItem = () => {
  const [x, y] = randomCoords(itemMinX, itemMinY, itemMaxX, itemMaxY);
  item = new Collectible({ x, y, value: 1, id: Date.now(), itemSize });
}

const updateCanvas = () => {
  // see if the player collects the item
  if (player.collision(item)) {
    // increment score and make new item if so
    player.score ++;
    makeItem();
    socket.emit('updateItem', item);
  }

  // calculate width and starting point of player's ranking score info
  ctx.font = subtitleFont;
  ctx.textAlign = "left";
  const rankText = player.calculateRank(players);
  const rankTextWidth = Math.ceil(ctx.measureText(rankText).width);
  if (!rankTextWidthPrev) rankTextWidthPrev = rankTextWidth;
  const rankTextStartXPrev = width - 2 * border - rankTextWidthPrev;
  const rankTextStartX = width - 2 * border - rankTextWidth;

  // draw in ranking score area over the top of the old
  ctx.fillStyle = headerColor;
  ctx.fillRect(rankTextStartXPrev, border, rankTextWidthPrev, headerHeight); // clear old text area
  rankTextWidthPrev = rankTextWidth;
  ctx.fillStyle = subtitleColor;
  ctx.fillText(rankText, rankTextStartX, subtitleCentreY); // fill new text areaY

  // draw game area background
  ctx.fillStyle = gameAreaColor;
  ctx.fillRect(playerMinX, playerMinY, width - 2 * border, height - 3 * border - headerHeight);

  // draw players
  for (let i = 0; i < players.length; i ++) {
    const p = players[i];
    if (p.id === player.id) {
      ctx.fillStyle = playerColor;
      ctx.fillRect(p.x, p.y, avatarSize, avatarSize);
    } else {
      ctx.fillStyle = enemyColor;
      ctx.fillRect(p.x, p.y, avatarSize, avatarSize);
    }
  }

  // draw item
  if (item) {
    ctx.fillStyle = itemColor;
    ctx.beginPath();
    ctx.arc(item.x + itemSize / 2, item.y + itemSize / 2, itemSize / 2, 0, 2 * Math.PI);
    ctx.fill(); 
  }
}

// listeners
socket.on('socketId', socketId => {
  player.socketId = socketId;
  socket.emit('updatePlayer', player);
});

socket.on('playersData', playersData => {
  players = playersData;
  updateCanvas();
});

socket.on('itemData', itm => {
  if (!itm) {
    makeItem();
    socket.emit('updateItem', item);
  } else {
    item = itm
    updateCanvas();
  }
});

window.addEventListener('keydown', e => {
  // e.preventDefault(); // prevents arrow keys from scrolling the screen

  const { key } = e;
  if (key === 'w' || key === 'ArrowUp') player.movePlayer('up', moveSize);
  if (key === 'a' || key === 'ArrowLeft') player.movePlayer('left', moveSize);
  if (key === 's' || key === 'ArrowDown') player.movePlayer('down', moveSize);
  if (key === 'd' || key === 'ArrowRight') player.movePlayer('right', moveSize);
  
  socket.emit('updatePlayer', player);
});

// game data
let players = [];
let player = null;
let item = null;

// create new player object
makePlayer();