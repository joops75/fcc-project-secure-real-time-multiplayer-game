class Player {
  constructor({x, y, score, id, avatarSize=10, playerMinX=0, playerMinY=0, playerMaxX=1000, playerMaxY=1000}) {
    this.x = x,
    this.y = y,
    this.score = score,
    this.id = id,
    this.avatarSize = avatarSize,
    this.playerMinX = playerMinX,
    this.playerMinY = playerMinY,
    this.playerMaxX = playerMaxX,
    this.playerMaxY = playerMaxY
  }

  getCoords() {
    return [this.x, this.y]
  }

  movePlayer(dir, speed) {
    switch (dir) {
      case 'up':
        if (this.y - speed >= this.playerMinY) this.y -= speed;
        break;
        
      case 'down':
        if (this.y + speed <= this.playerMaxY) this.y += speed;
        break;
        
      case 'left':
        if (this.x - speed >= this.playerMinX) this.x -= speed;
        break;
        
      case 'right':
        if (this.x + speed <= this.playerMaxX) this.x += speed;
        break;
    }
  }

  collision(item) {
    let hit = true;
    if (
      item.x < this.x ||
      item.y < this.y ||
      item.x + item.itemSize > this.x + this.avatarSize ||
      item.y + item.itemSize > this.y + this.avatarSize
    ) {
      hit = false;
    }

    return hit;
  }

  calculateRank(arr) {
    let pointsBelow = 0
    arr.forEach(player => {
      if (player.id !== this.id) {
        if (
          (player.score < this.score) || 
          (player.score === this.score && player.id > this.id)
        ) {
          pointsBelow += 1
        }
      }
    });
    
    return `Rank: ${arr.length - pointsBelow} / ${arr.length}`
  }
}

export default Player;
