// src/layout/horizontal-layout.js

import Layout from './layout.js';
import ConnectionPoint from './connection-point.js';
import LayoutFactory from './layout-factory.js';

/**
 * Horizontal layout implementation
 */
class HorizontalLayout extends Layout {
  /**
   * Create a new HorizontalLayout
   * @param {number} parentPadding - Padding between parent and children
   * @param {number} childPadding - Padding between siblings
   * @param {string} direction - Direction of layout ('right' or 'left')
   */
  constructor(parentPadding = 80, childPadding = 20, direction = 'right') {
    super();
    this.parentPadding = parentPadding;
    this.childPadding = childPadding;
    this.direction = direction; // 'right' or 'left'
  }

  /**
   * Apply horizontal layout to a node and its children
   * @param {Node} node - The node to layout
   * @param {number} x - The x coordinate
   * @param {number} y - The y coordinate
   * @param {Object} style - The style to apply
   * @return {Object} The size of the laid out subtree
   */
  applyLayout(node, x, y, style) {
    const levelStyle = style.getLevelStyle(node.level);
    const nodeSize = this.getNodeSize(node.text, levelStyle);

    node.x = x;
    node.y = y - (nodeSize.height / 2);
    node.width = nodeSize.width;
    node.height = nodeSize.height;

    const directionMultiplier = this.direction === 'right' ? 1 : -1;
    const directionMultiplier1 = this.direction === 'right' ? 0 : -1;

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
        x: x, //+ directionMultiplier1 * nodeSize.width,
        y: y - 0.5 * nodeSize.height,
        width: nodeSize.width,
        height: nodeSize.height
      };
      return node.boundingBox;
    }

    // Calculate child X position based on direction
    const childX = x + (directionMultiplier * (nodeSize.width + this.parentPadding));
//    const childX = x + (directionMultiplier *  this.parentPadding);

    let totalHeight = 0;
    let maxChildWidth = 0;

    // Position children
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];

      // Get the appropriate layout for the child's level
      const childLevelStyle = style.getLevelStyle(child.level);
      const childLayoutType = childLevelStyle.layoutType;
      const childDirection = childLevelStyle.direction || this.direction; // Use level-specific direction or inherit

      // Use LayoutFactory to create appropriate layout
      let childLayout = LayoutFactory.createLayout(
        childLayoutType,
        childLevelStyle.parentPadding,
        childLevelStyle.childPadding,
        childDirection
      );

//      var childShift = 0;
//      if (this.direction === 'left') {
//        childShift = - 0.5* childLayout.getNodeSize(child.text, childLevelStyle);
//      }
      const childSize = childLayout.applyLayout(child, childX, y + totalHeight, style);

      totalHeight += childSize.height + this.childPadding;
      maxChildWidth = Math.max(maxChildWidth, childSize.width);
    }

    // Remove extra padding from last child
    totalHeight -= this.childPadding;

    // Center parent vertically
    if (totalHeight > nodeSize.height) {
      node.y = y - (nodeSize.height / 2) + ((totalHeight - nodeSize.height) / 2);
    }

//    for (let i = 0; i < node.children.length; i++) {
//      this.adjustPositionRecursive(node.children[i], childShift, 0);
//    }

    for (let i = 0; i < node.children.length; i++) {
      if (this.direction === 'left') {
        this.adjustPositionRecursive(node.children[i], node.children[i].width * directionMultiplier, 0);
      }
    }

    console.log('maxChildWidth', maxChildWidth);
    node.boundingBox = {
      x: x + directionMultiplier1 * maxChildWidth + directionMultiplier1 * this.parentPadding,
      y: y - nodeSize.height / 2,
      width: nodeSize.width + this.parentPadding + maxChildWidth,
      height: Math.max(nodeSize.height, totalHeight)
    };
    return node.boundingBox;
  }

  /**
   * Get the connection point for a parent node in horizontal layout
   * @param {Node} node - The parent node
   * @param {Object} levelStyle - The style for this node's level
   * @return {ConnectionPoint} The connection point
   */
  getParentConnectionPoint(node, levelStyle) {
    // Direction determines which side of the node the connection points come from
    if (this.direction === 'right') {
      // When direction is right, parent connects from its right side
      return new ConnectionPoint(node.x + node.width, node.y + node.height / 2, 'right');
    } else {
      // When direction is left, parent connects from its left side
      return new ConnectionPoint(node.x, node.y + node.height / 2, 'left');
    }
  }

  /**
   * Get the connection point for a child node in horizontal layout
   * @param {Node} node - The child node
   * @param {Object} levelStyle - The style for this node's level
   * @return {ConnectionPoint} The connection point
   */
  getChildConnectionPoint(node, levelStyle) {
    // For the child node, connection point is always on the side facing the parent
    // In horizontal layout, this depends on the direction
    if (this.direction === 'right') {
      // When the layout flows right, child connects on its left side (facing parent)
      return new ConnectionPoint(node.x, node.y + node.height / 2, 'left');
    } else {
      // When the layout flows left, child connects on its right side (facing parent)
      return new ConnectionPoint(node.x + node.width, node.y + node.height / 2, 'right');
    }
  }
}

// For backward compatibility
if (typeof window !== 'undefined') {
  window.HorizontalLayout = HorizontalLayout;
}

export default HorizontalLayout;