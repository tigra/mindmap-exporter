// src/layout/connection-point.js

/**
 * Represents a connection point on a node with position and direction
 */
class ConnectionPoint {
  /**
   * Create a connection point
   * @param {number} x - X coordinate of the connection point
   * @param {number} y - Y coordinate of the connection point
   * @param {string} direction - Direction of the connection ('top', 'right', 'bottom', 'left')
   */
  constructor(x, y, direction) {
    this.x = x;
    this.y = y;
    this.direction = direction;
  }
}

// For backward compatibility
if (typeof window !== 'undefined') {
  window.ConnectionPoint = ConnectionPoint;
}

//export default ConnectionPoint;