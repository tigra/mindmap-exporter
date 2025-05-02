// src/layout/horizontal-layout.js - Update for direction inheritance

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
    this.direction = direction; // Store initial direction from constructor
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

    // Get effective direction for this node - use StyleManager if available, fall back to constructor value
    console.log('style', style);
    const effectiveDirection = style.getEffectiveDirection ?
      style.getEffectiveDirection(node) :
      this.direction || 'right';
    console.log("applyLayout", node, effectiveDirection);

//    if (effectiveDirection === 'left') {
//        node.x = x - nodeSize.width;
//    }

    // Use the effective direction for layout calculations
    const directionMultiplier = effectiveDirection === 'right' ? 1 : -1;
    const directionMultiplier1 = effectiveDirection === 'right' ? 0 : -1;

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
    var childX;
    if (effectiveDirection === 'right') {
       childX = x + nodeSize.width + this.parentPadding;
    } else {
//       childX = x - nodeSize.width - this.parentPadding;
       childX = x - this.parentPadding;
    }

    let totalHeight = 0;
    let maxChildWidth = 0;

    // Position children
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];

      // Get the appropriate layout for the child's level
      const childLevelStyle = style.getLevelStyle(child.level);
      const childLayoutType = childLevelStyle.layoutType;

      // Use the effective direction for the child - this will consider node overrides and inheritance
      const childDirection = style.getEffectiveDirection ?
        style.getEffectiveDirection(child) :
        (child.direction || childLevelStyle.direction || effectiveDirection);

      // Use LayoutFactory to create appropriate layout
      let childLayout = LayoutFactory.createLayout(
        childLayoutType,
        childLevelStyle.parentPadding,
        childLevelStyle.childPadding,
        childDirection
      );

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

    for (let i = 0; i < node.children.length; i++) {
      if (effectiveDirection === 'left') {
        this.adjustPositionRecursive(node.children[i], -node.children[i].width, 0);
//        this.adjustPositionRecursive(node.children[i], 0, 0);
      }
    }

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
    // Get the effective direction for this node
    let effectiveDirection = this.direction; // Default to constructor value

    // Use StyleManager if available
    if (levelStyle.styleManager && levelStyle.styleManager.getEffectiveDirection) {
      effectiveDirection = levelStyle.styleManager.getEffectiveDirection(node);
    }
    // Check node overrides
    else if (node.configOverrides && 'direction' in node.configOverrides) {
      effectiveDirection = node.configOverrides.direction;
    }

    // Direction determines which side of the node the connection points come from
    if (effectiveDirection === 'right') {
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
    // Get the effective direction for this node
//    let effectiveDirection = this.direction; // Default to constructor value

    console.log('HorizontalLayout.getChildConnectionPoint()');
    console.log('node', node);
    console.log('levelStyle', levelStyle);

    var effectiveDirection;
    // Use StyleManager if available
//    if (levelStyle.style && levelStyle.style.getEffectiveDirection) {
    if (levelStyle.styleManager) { // } && levelStyle.style.getEffectiveDirection) {
      console.log('1');
      effectiveDirection = levelStyle.styleManager.getEffectiveDirection(node);
    }
    // Check node overrides
    else if (node.configOverrides && 'direction' in node.configOverrides) {
      console.log('2');
      effectiveDirection = node.configOverrides.direction;  // TODO rely on getEffectiveProperty in StyleManager
    } else {
      effectiveDirection = 'right'; // TODO remove
    }
    console.log('effectiveDirection', effectiveDirection);

    // For the child node, connection point is always on the side facing the parent
    // In horizontal layout, this depends on the direction
    if (effectiveDirection === 'right') {
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