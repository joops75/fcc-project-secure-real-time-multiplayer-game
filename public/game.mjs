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
const gameAreaMinX = border;
const gameAreaMaxX = width - border;
const gameAreaMinY = headerHeight + 2 * border;;
const gameAreaMaxY = height - border;
const title = 'Apple Chase';
const titleFontSize = 20;
const subtitleFontSize = 10;
const titleCentreY = border + (headerHeight + titleFontSize) / 2;
const subtitleCentreY = border + (headerHeight + subtitleFontSize) / 2;
let rankTextWidthPrev = null;

// fonts
const titleFont = titleFontSize + 'px "Press Start 2P"';
const subtitleFont = subtitleFontSize + 'px "Press Start 2P"';

// player constraints
const avatarSize = 40;
const playerMinX = gameAreaMinX;
const playerMinY = gameAreaMinY;
const playerMaxX = gameAreaMaxX - avatarSize;
const playerMaxY = gameAreaMaxY - avatarSize;
const moveSize = 1;
const moveRate = 5;

// item constraints
const itemSize = 20;
const itemMinX = gameAreaMinX;
const itemMinY = gameAreaMinY;
const itemMaxX = gameAreaMaxX - itemSize;
const itemMaxY = gameAreaMaxY - itemSize;

// colors
const darkGreen = 'rgb(14, 153, 60)';
const yellow = 'rgb(255, 252, 0)';
const green = 'rgb(0, 198, 45)';

const frameColor = darkGreen;
const headerColor = green;
const titleColor = yellow;
const subtitleColor = yellow;

// images
const gameIcons = document.getElementById('smileys');
const backgroundTile = document.getElementById('grass');
const backgroundTileWidth = backgroundTile.width;
const backgroundTileHeight = backgroundTile.height;
const backgroundTileWidthPartial = (gameAreaMaxX - gameAreaMinX) % backgroundTileWidth;
const backgroundTileHeightPartial = (gameAreaMaxY - gameAreaMinY) % backgroundTileHeight;

// don't smooth images when scaled
ctx.mozImageSmoothingEnabled = false;
ctx.webkitImageSmoothingEnabled = false;
ctx.msImageSmoothingEnabled = false;
ctx.imageSmoothingEnabled = false;

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
  
  // fill in controls info
  ctx.font = subtitleFont;
  ctx.fillStyle = subtitleColor;
  ctx.textAlign = "left";
  ctx.fillText("Controls: WASD", 2 * border, subtitleCentreY);

  if (!player) return;
  
  // see if the player collects the item
  if (player.collision(item)) {
    // increment score and make new item
    player.score ++;
    makeItem();

    // send item to server
    socket.emit('updateItem', item);

    // change itemCollected for changing avatar when drawing
    itemCollected = true;
    // revert to original icon image a second after collecting an item
    
    clearTimeout(itemTimer);
    itemTimer = setTimeout(() => {
      itemCollected = false;
      ctx.drawImage(gameIcons, 0, 0, 15, 15, player.x, player.y, avatarSize, avatarSize);
    }, 1000);
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
  for (let i = 0; i < height; i += backgroundTileHeight) {
    for (let j = 0; j < width; j +=backgroundTileWidth) {
      const iFit = i + backgroundTileHeight <= gameAreaMaxY;
      const jFit = j + backgroundTileWidth <= gameAreaMaxX;
      if (iFit && jFit) {
        ctx.drawImage(backgroundTile, j + gameAreaMinX, i + gameAreaMinY, backgroundTileWidth, backgroundTileHeight);
      } else if (iFit) {
        ctx.drawImage(backgroundTile, 0, 0, backgroundTileWidthPartial, backgroundTileHeight, j + gameAreaMinX, i + gameAreaMinY, backgroundTileWidthPartial, backgroundTileHeight);
      } else if (jFit) {
        ctx.drawImage(backgroundTile, 0, 0, backgroundTileWidth, backgroundTileHeightPartial, j + gameAreaMinX, i + gameAreaMinY, backgroundTileWidth, backgroundTileHeightPartial);
      } else {
        ctx.drawImage(backgroundTile, 0, 0, backgroundTileWidthPartial, backgroundTileHeightPartial, j + gameAreaMinX, i + gameAreaMinY, backgroundTileWidthPartial, backgroundTileHeightPartial);
      }
    }
  }

  // draw item
  if (item) {
    ctx.drawImage(gameIcons, 6*15, 9*15, 15, 15, item.x, item.y, itemSize, itemSize);
  }

  // draw players
  for (let i = 0; i < players.length; i ++) {
    const p = players[i];
    if (p.id === player.id) {
      if (itemCollected) ctx.drawImage(gameIcons, 2*15, 0, 15, 15, p.x, p.y, avatarSize, avatarSize);
      else ctx.drawImage(gameIcons, 0, 0, 15, 15, p.x, p.y, avatarSize, avatarSize);
    } else {
      ctx.drawImage(gameIcons, 8*15, 2*15, 15, 15, p.x, p.y, avatarSize, avatarSize);
    }
  }
}

// listeners
socket.on('socketId', socketId => {
  makePlayer();
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
  if (key === 'w' || key === 'ArrowUp') keys.up = true;
  if (key === 'a' || key === 'ArrowLeft') keys.left = true;
  if (key === 's' || key === 'ArrowDown') keys.down = true;
  if (key === 'd' || key === 'ArrowRight') keys.right = true;

  if (!moveTimer) moveTimer = setInterval(() => {
    let dir = '';
    const dirY = keys.down - keys.up;
    const dirX = keys.right - keys.left;

    if      (dirY < 0) dir += 'up';
    else if (dirY > 0) dir += 'down';
    if      (dirX < 0) dir += 'left';
    else if (dirX > 0) dir += 'right';
    
    if (dir) {
      player.movePlayer(dir, moveSize);
      updateCanvas();
      socket.emit('updatePlayer', player);
    }
  }, moveRate);
});

window.addEventListener('keyup', e => {
  const { key } = e;
  if (key === 'w' || key === 'ArrowUp') keys.up = false;
  if (key === 'a' || key === 'ArrowLeft') keys.left = false;
  if (key === 's' || key === 'ArrowDown') keys.down = false;
  if (key === 'd' || key === 'ArrowRight') keys.right = false;

  if (!keys.up && !keys.left && !keys.right && !keys.down) {
    clearInterval(moveTimer);
    moveTimer = null;
  }
});

// game data
let players = [];
let player = null;
let item = null;
const keys = { up: false, left: false, right: false, down: false };
let moveTimer = null;
let itemCollected = false;
let itemTimer = null;

updateCanvas();