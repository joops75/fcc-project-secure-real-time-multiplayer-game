class Collectible {
  constructor({ x, y, value, id, itemSize=5 }) {
    this.x = x,
    this.y = y,
    this.value = value,
    this.id = id,
    this.itemSize = itemSize
  }
}

/*
  Note: Attempt to export this for use
  in server.js
*/
try {
  module.exports = Collectible;
} catch(e) {}

export default Collectible;
