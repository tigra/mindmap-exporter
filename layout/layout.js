// src/layout/layout.js

import ConnectionPoint from './connection-point.js';
import textMetrics from '../utils/text-metrics.js';

/**
 * Base Layout class that handles common functionality
 */
class Layout {
  /**
   * Calculate own dimensions of a node based on text and level style
   * @param {string} text - The text content of the node
   * @param {Object} levelStyle - The style for this node's level
   * @return {Object} The calculated width and height
   */
  getNodeSize(text, levelStyle) {
    // Use TextMetricsService to measure text
    const { width, height } = textMetrics.measureText(
      text,
      levelStyle.fontFamily,
      levelStyle.fontSize,
      levelStyle.fontWeight
    );

    return {
      width: width + (levelStyle.horizontalPadding * 2),
      height: height + (levelStyle.verticalPadding * 2)
    };
  }

  /**
   * Adjust position of node and all its children recursively
   * @param {Node} node - The node to adjust
   * @param {number} deltaX - Horizontal adjustment
   * @param {number} deltaY - Vertical adjustment
   */
  adjustPositionRecursive(node, deltaX, deltaY) {
    node.x += deltaX;
    node.y += deltaY;
    if (node.boundingBox) {
        node.boundingBox.x += deltaX;
        node.boundingBox.y += deltaY;
    }
    for (let i = 0; i < node.children.length; i++) {
      this.adjustPositionRecursive(node.children[i], deltaX, deltaY);
    }
  }

  /**
   * Apply layout to a node and its children.
   * x and y are only the initial position. The position may change after laying out children recursively
   * and finding out their positions/bounding boxes.
   * @param {Node} node - The node to layout
   * @param {number} x - The x coordinate
   * @param {number} y - The y coordinate
   * @param {Object} style - The style to apply
   * @return {Object} The size of the laid out subtree
   */
  applyLayout(node, x, y, style) {
    throw new Error('Method applyLayout must be implemented by subclasses');
  }

  /**
   * Get the connection point for a parent node connecting to its children
   * @param {Node} node - The parent node
   * @param {Object} levelStyle - The style for this node's level
   * @param {Node} childNode - The specific child node being connected to (optional)
   * @return {ConnectionPoint} The connection point
   */
  getParentConnectionPoint(node, levelStyle, childNode = null) {
    throw new Error('Method getParentConnectionPoint must be implemented by subclasses');
  }

  /**
   * Get the connection point for a child node connecting to its parent
   * @param {Node} node - The child node
   * @param {Object} levelStyle - The style for this node's level
   * @return {ConnectionPoint} The connection point
   */
  getChildConnectionPoint(node, levelStyle) {
    throw new Error('Method getChildConnectionPoint must be implemented by subclasses');
  }
}

// For backward compatibility
if (typeof window !== 'undefined') {
  window.BaseLayout = Layout;
}

export default Layout;
