class Player {
  constructor({x, y, score, id}) {
    this.x = x,
    this.y = y,
    this.score = score,
    this.id = id
  }

  movePlayer(dir, speed) {
    switch (dir) {
      case 'up':
        this.y -= speed;
        break;
        
      case 'down':
        this.y += speed;
        break;
        
      case 'left':
        this.x -= speed;
        break;
        
      case 'right':
        this.x += speed;
        break;
    }
  }

  collision(item) {
    return this.x === item.x && this.y === item.y
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
