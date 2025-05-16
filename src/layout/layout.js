// src/layout/layout.js

import ConnectionPoint from './connection-point.js';
import textMetrics from '../utils/text-metrics.js';
import { markdownToSvg } from '../utils/markdown-to-svg.js';

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
    try {
      // Simple estimation for immediate sizing
      const baseWidth = Math.min(text.length * 10, levelStyle.maxWidth || 200);
      const lines = text.split('\n').length;
      const baseHeight = Math.max(lines * 20, 30);
      
      // Use the synchronous method for now, but then trigger async rendering later
      // This is a workaround since we can't make this method async without changing the codebase significantly
      
      // Schedule async rendering for more accurate sizing later
      setTimeout(() => {
        this._calculateMarkdownSize(text, levelStyle).then(size => {
          // Store the calculated size for later use
          if (window._nodeSizeCache) {
            window._nodeSizeCache[text] = size;
          } else {
            window._nodeSizeCache = { [text]: size };
          }
        }).catch(error => {
          console.error('Error in async markdown size calculation:', error);
        });
      }, 0);
      
      // Check if we already have a cached size for this text
      if (window._nodeSizeCache && window._nodeSizeCache[text]) {
        return window._nodeSizeCache[text];
      }
      
      return {
        width: baseWidth + (levelStyle.horizontalPadding * 2),
        height: baseHeight + (levelStyle.verticalPadding * 2)
      };
    } catch (error) {
      console.error('Error calculating node size:', error);
      
      // Create a minimal fallback size as last resort
      return {
        width: 100 + (levelStyle.horizontalPadding * 2),
        height: 30 + (levelStyle.verticalPadding * 2)
      };
    }
  }
  
  /**
   * Calculate markdown size using the markdown-to-svg utility (async)
   * @private
   * @param {string} text - The text content of the node
   * @param {Object} levelStyle - The style for this node's level
   * @return {Promise<Object>} Promise resolving to the calculated width and height
   */
  async _calculateMarkdownSize(text, levelStyle) {
    try {
      // Get style properties for markdown rendering
      const maxWidth = levelStyle.maxWidth || 200;
      
      // Use markdownToSvg for size calculation
      const options = {
        fontFamily: levelStyle.fontFamily,
        fontSize: levelStyle.fontSize,
        fontWeight: levelStyle.fontWeight,
        calculateSizeOnly: true
      };
      
      const result = await markdownToSvg(text, maxWidth, options);
      
      // Return dimensions with padding
      return {
        width: result.dimensions.width + (levelStyle.horizontalPadding * 2),
        height: result.dimensions.height + (levelStyle.verticalPadding * 2)
      };
    } catch (error) {
      console.error('Error calculating markdown size:', error);
      throw error;
    }
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
   * Calculate horizontal position for parent connection points when distributed
   * @param {Node} node - The parent node
   * @param {Node} childNode - The child node
   * @param {string} connectionPointsType - Type of distribution ('single', 'distributedRelativeToParentSize', 'distributeEvenly')
   * @param {number} widthPortion - Portion of parent width to use for connections (0.0-1.0), default 0.8
   * @returns {number} The x-coordinate for the connection point
   */
  calculateConnectionPointX(node, childNode, connectionPointsType, widthPortion = 0.8) {
    // Default to center position
    if (!childNode || connectionPointsType === 'single') {
      return node.x + (node.width / 2);
    }
    
    // Calculate margins - evenly distribute remaining width to both sides
    const marginPortion = (1 - widthPortion) / 2;
    const parentWidth = node.width;
    
    // Handle specific distribution types
    if (connectionPointsType === 'distributedRelativeToParentSize') {
      // Position based on child's horizontal center
      const childCenterX = childNode.x + (childNode.width / 2);
      
      // Calculate relative position with configured margins
      let relativePosition = (childCenterX - node.x) / parentWidth;
      // Constrain within the usable range
      relativePosition = Math.max(marginPortion, Math.min(1 - marginPortion, relativePosition));
      
      return node.x + (parentWidth * relativePosition);
    }
    
    if (connectionPointsType === 'distributeEvenly') {
      // Position based on child's index among siblings
      const children = node.children;
      
      // Return center if no children or child not found
      if (!children || children.length === 0) {
        return node.x + (node.width / 2);
      }
      
      const childIndex = children.findIndex(child => child === childNode);
      if (childIndex === -1) {
        return node.x + (node.width / 2);
      }
      
      // Calculate evenly spaced positions
      const usableWidth = parentWidth * widthPortion;  // Configurable portion of width
      const startX = node.x + (parentWidth * marginPortion);  // Left margin
      
      // For one child, use center; otherwise space evenly
      if (children.length === 1) {
        return startX + (usableWidth / 2);
      } else {
        const gap = usableWidth / (children.length - 1);
        return startX + (gap * childIndex);
      }
    }
    
    // Default fallback to center
    return node.x + (node.width / 2);
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
