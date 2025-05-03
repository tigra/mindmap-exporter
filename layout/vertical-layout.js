// src/layout/vertical-layout.js

import Layout from './layout.js';
import ConnectionPoint from './connection-point.js';
import LayoutFactory from './layout-factory.js';

/**
 * Vertical layout implementation
 */
class VerticalLayout extends Layout {
  /**
   * Create a new VerticalLayout
   * @param {number} parentPadding - Padding between parent and children
   * @param {number} childPadding - Padding between siblings
   * @param {string} direction - Direction of layout ('down' or 'up')
   */
  constructor(parentPadding = 30, childPadding = 30, direction = 'down') {
    super();
    this.parentPadding = parentPadding;
    this.childPadding = childPadding;
    this.direction = direction || 'down';
  }

  /**
   * Apply vertical layout to a node and its children
   * @param {Node} node - The node to layout
   * @param {number} x - The x coordinate
   * @param {number} y - The y coordinate
   * @param {Object} style - The style to apply (StyleManager)
   * @return {Object} The size of the laid out subtree
   */
  applyLayout(node, x, y, style) {
    console.groupCollapsed(`VerticalLayout.applyLayout(${node.text})`);
    console.log('node', node);
//    console.log('x', x, 'y', y);
    if (node.level == 1) {
        console.log('style', style);
    }
    const levelStyle = style.getLevelStyle(node.level);
    const nodeSize = this.getNodeSize(node.text, levelStyle);

    // The entire branch left top corner is (x, y)
    // Initially place the parent at this position
    node.x = x;
    node.y = y;
    node.width = nodeSize.width;
    node.height = nodeSize.height;

    // Get direction from StyleManager with fallback to default
    const effectiveDirection = style.getEffectiveValue(node, 'direction') || this.direction;
    console.log('effectiveDirection', effectiveDirection);

    // Direction multiplier for positioning (1 for down, -1 for up)
    const directionMultiplier = effectiveDirection === 'down' ? 1 : -1;

    // Apply style properties to the node for rendering later
    node.style = {
      fontSize: levelStyle.fontSize,
      fontWeight: levelStyle.fontWeight,
      fontFamily: levelStyle.fontFamily,
      backgroundColor: levelStyle.backgroundColor,
      textColor: levelStyle.textColor,
      borderColor: levelStyle.borderColor,
      borderWidth: levelStyle.borderWidth,
      borderRadius: levelStyle.borderRadius
    };

    // If the node has no children or is collapsed, return its dimensions
    if (node.children.length === 0 || node.collapsed) {
      node.boundingBox = {
        x: x,
        y: y,
        width: nodeSize.width,
        height: nodeSize.height
      };
      console.groupEnd();
      return node.boundingBox;
    }

    // Calculate child Y position based on direction
    const childY = y + (directionMultiplier * (nodeSize.height + this.parentPadding));

    let totalWidth = 0;
    let maxChildHeight = 0;

    // Position children
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];

      // Get layout type from StyleManager
      const childLayoutType = style.getEffectiveValue(child, 'layoutType');
      console.log('childLayoutType', childLayoutType);
      const childLevelStyle = style.getLevelStyle(child.level);

      // Create layout for child
      const childLayout = LayoutFactory.createLayout(
        childLayoutType,
        childLevelStyle.parentPadding,
        childLevelStyle.childPadding
      );

      // Apply layout to child
      const childSize = childLayout.applyLayout(child, x + totalWidth, childY, style);

      totalWidth += childSize.width + this.childPadding;
      maxChildHeight = Math.max(maxChildHeight, childSize.height);
    }

    // Remove extra padding from last child
    totalWidth -= this.childPadding;

    // Depending on total size of children and the size of parent, adjust them
    // Both the parent, and all bounding boxes of children should have aligned centers
    let parentShift = 0;
    let childShift = 0;

    if (totalWidth < nodeSize.width) {
      childShift = (nodeSize.width - totalWidth) / 2;
    } else {
      parentShift = (totalWidth - nodeSize.width) / 2;
    }

    // Center parent horizontally
    node.x = x + parentShift;

    // Adjust children positions
    if (childShift !== 0) {
      for (let i = 0; i < node.children.length; i++) {
        this.adjustPositionRecursive(node.children[i], childShift, 0);
      }
    }

    // We don't need additional adjustment for up-directed layouts anymore
    // The directionMultiplier in childY calculation already handles this correctly
    
    // Calculate bounding box dimensions
    const bbHeight = nodeSize.height + this.parentPadding + maxChildHeight;
    const bbY = effectiveDirection === 'down' ? y : y - nodeSize.height;

    node.boundingBox = {
      x: x,
      y: bbY,
      width: Math.max(nodeSize.width, totalWidth),
      height: bbHeight
    };
    console.groupEnd();
    return node.boundingBox;
  }

  /**
   * Get the connection point for a parent node in vertical layout
   * @param {Node} node - The parent node
   * @param {Object} levelStyle - The style for this node's level
   * @param {Node} childNode - The specific child node being connected to (optional)
   * @return {ConnectionPoint} The connection point
   */
  getParentConnectionPoint(node, levelStyle, childNode = null) {
    // Get direction from StyleManager with fallback to default
    const effectiveDirection = levelStyle.styleManager.getEffectiveValue(node, 'direction') || this.direction;
    
    // Get parent connection points configuration from style
    const connectionPointsType = levelStyle.styleManager.getEffectiveValue(node, 'parentConnectionPoints') || 'single';
    
    // Use default center connection point if:
    // 1. No specific child node is provided, OR
    // 2. Connection points type is set to 'single'
    if (!childNode || connectionPointsType === 'single') {
      const x = node.x + node.width / 2;
      
      if (effectiveDirection === 'down') {
        return new ConnectionPoint(x, node.y + node.height, 'bottom');
      } else {
        return new ConnectionPoint(x, node.y, 'top');
      }
    }
    
    // If connection points type is set to 'distributed', use the distributed algorithm
    if (connectionPointsType === 'distributed') {
      return this.getDistributedParentConnectionPoint(node, childNode, effectiveDirection);
    }
    
    // Fallback to single connection point if type is not recognized
    const x = node.x + node.width / 2;
    
    if (effectiveDirection === 'down') {
      return new ConnectionPoint(x, node.y + node.height, 'bottom');
    } else {
      return new ConnectionPoint(x, node.y, 'top');
    }
  }
  
  /**
   * Get a distributed connection point for a parent node based on child position
   * @private
   * @param {Node} node - The parent node
   * @param {Node} childNode - The specific child node being connected to
   * @param {string} effectiveDirection - The layout direction ('down' or 'up')
   * @return {ConnectionPoint} The connection point
   */
  getDistributedParentConnectionPoint(node, childNode, effectiveDirection) {
    // Calculate the parent's horizontal range
    const parentLeft = node.x;
    const parentRight = node.x + node.width;
    const parentWidth = node.width;
    
    // Calculate child's center position
    const childCenterX = childNode.x + (childNode.width / 2);
    
    // Calculate the position along the parent's edge
    // Map the child's position to the parent's width with some margin
    // Constrain the x position to be within the parent's boundaries
    const minPercentage = 0.1;  // Keep connections at least 10% from edges
    const maxPercentage = 0.9;  // Keep connections at most 90% from left edge
    
    // Determine relative position of child's center within parent's width
    let relativePosition;
    
    // If child is completely to the left of parent
    if (childCenterX < parentLeft) {
      relativePosition = minPercentage;
    } 
    // If child is completely to the right of parent
    else if (childCenterX > parentRight) {
      relativePosition = maxPercentage;
    } 
    // If child overlaps with parent horizontally
    else {
      // Calculate position as percentage of parent width
      relativePosition = (childCenterX - parentLeft) / parentWidth;
      
      // Constrain to stay within our margins
      relativePosition = Math.max(minPercentage, Math.min(maxPercentage, relativePosition));
    }
    
    // Calculate the actual x coordinate
    const x = parentLeft + (parentWidth * relativePosition);
    
    // Return the appropriate connection point based on direction
    if (effectiveDirection === 'down') {
      return new ConnectionPoint(x, node.y + node.height, 'bottom');
    } else {
      return new ConnectionPoint(x, node.y, 'top');
    }
  }

  /**
   * Get the connection point for a child node in vertical layout
   * @param {Node} node - The child node
   * @param {Object} levelStyle - The style for this node's level
   * @return {ConnectionPoint} The connection point
   */
  getChildConnectionPoint(node, levelStyle) {
    // Get direction from StyleManager with fallback to default
    const effectiveDirection = levelStyle.styleManager.getEffectiveValue(node, 'direction') || this.direction;

    // In vertical layout, child connects on its top or bottom depending on direction
    const x = node.x + node.width / 2;

    if (effectiveDirection === 'down') {
      return new ConnectionPoint(x, node.y, 'top');
    } else {
      return new ConnectionPoint(x, node.y + node.height, 'bottom');
    }
  }
}

// For backward compatibility
if (typeof window !== 'undefined') {
  window.VerticalLayout = VerticalLayout;
}

export default VerticalLayout;