// src/layout/horizontal-layout.js

import Layout from './layout.js';
import ConnectionPoint from './connection-point.js';
import LayoutFactory from './layout-factory.js';

/**
 * Right column positioning for horizontal layout
 */
class RightColumn {
  constructor(parentPadding, childPadding) {
    this.parentPadding = parentPadding;
    this.childPadding = childPadding;
  }

  /**
   * Position nodes in a right column
   * @param {Array} nodes - The nodes to position
   * @param {Object} nodeSize - The parent node size
   * @param {Object} style - The style to apply
   * @return {Object} Total height and max child width
   */
  positionNodes(nodes, nodeSize, style) {
    // Calculate child X position for right direction
    const childX = nodeSize.width + this.parentPadding;

    let totalHeight = 0;
    let maxChildWidth = 0;

    // Position children
    for (let i = 0; i < nodes.length; i++) {
      const child = nodes[i];

      // Get the appropriate layout for the child's level
      const childLevelStyle = style.getLevelStyle(child.level);
      const childLayoutType = style.getEffectiveValue(child, 'layoutType');

      // Create appropriate layout for child using LayoutFactory
      const childLayout = LayoutFactory.createLayout(
        childLayoutType,
        childLevelStyle.parentPadding,
        childLevelStyle.childPadding
      );

      // Apply layout to child - call applyLayoutRelative recursively
      const childSize = childLayout.applyLayoutRelative(child, childX, totalHeight, style);

      totalHeight += childSize.height + this.childPadding;
      maxChildWidth = Math.max(maxChildWidth, childSize.width);
    }

    // Remove extra padding from last child
    if (nodes.length > 0) {
      totalHeight -= this.childPadding;
    }

    return { totalHeight, maxChildWidth };
  }
}

/**
 * Left column positioning for horizontal layout
 */
class LeftColumn {
  constructor(parentPadding, childPadding, adjustPositionRecursive) {
    this.parentPadding = parentPadding;
    this.childPadding = childPadding;
    this.adjustPositionRecursive = adjustPositionRecursive;
  }

  /**
   * Position nodes in a left column
   * @param {Array} nodes - The nodes to position
   * @param {Object} nodeSize - The parent node size
   * @param {Object} style - The style to apply
   * @return {Object} Total height and max child width
   */
  positionNodes(nodes, nodeSize, style) {
    // Calculate child X position for left direction
    const childX = -this.parentPadding;

    let totalHeight = 0;
    let maxChildWidth = 0;

    // Position children
    for (let i = 0; i < nodes.length; i++) {
      const child = nodes[i];

      // Get the appropriate layout for the child's level
      const childLevelStyle = style.getLevelStyle(child.level);
      const childLayoutType = style.getEffectiveValue(child, 'layoutType');

      // Create appropriate layout for child using LayoutFactory
      const childLayout = LayoutFactory.createLayout(
        childLayoutType,
        childLevelStyle.parentPadding,
        childLevelStyle.childPadding
      );

      // Apply layout to child - call applyLayoutRelative recursively
      const childSize = childLayout.applyLayoutRelative(child, childX, totalHeight, style);

      totalHeight += childSize.height + this.childPadding;
      maxChildWidth = Math.max(maxChildWidth, childSize.width);
    }

    // Remove extra padding from last child
    if (nodes.length > 0) {
      totalHeight -= this.childPadding;
    }

    // Adjust positions for left-directed layouts
    for (let i = 0; i < nodes.length; i++) {
      this.adjustPositionRecursive(nodes[i], -nodes[i].width, 0);
    }

    return { totalHeight, maxChildWidth };
  }
}

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
    this.direction = direction; // Store direction from constructor
  }

  /**
   * Apply horizontal layout to a node and its children
   * @param {Node} node - The node to layout
   * @param {number} x - The x coordinate
   * @param {number} y - The y coordinate
   * @param {Object} style - The style to apply (StyleManager)
   * @return {Object} The size of the laid out subtree
   */
  applyLayout(node, x, y, style) {
    const boundingBox = this.applyLayoutRelative(node, x, y, style);
    return boundingBox;
  }

  /**
   * Apply horizontal layout to a node and its children (recursive implementation)
   * @param {Node} node - The node to layout
   * @param {number} x - The x coordinate
   * @param {number} y - The y coordinate
   * @param {Object} style - The style to apply (StyleManager)
   * @return {Object} The size of the laid out subtree
   */
  applyLayoutRelative(node, x, y, style) {
    console.groupCollapsed(`HorizontalLayout.applyLayoutRelative(${node.text})`);
    const levelStyle = style.getLevelStyle(node.level);
    const nodeSize = this.getNodeSize(node.text, levelStyle);

    node.x = x;
    node.y = y - (nodeSize.height / 2);
    node.width = nodeSize.width;
    node.height = nodeSize.height;

    // Direction is determined by StyleManager
    const effectiveDirection = style.getEffectiveValue(node, 'direction') || this.direction;

    // Direction multiplier for positioning (1 for right, -1 for left)
    const directionMultiplier = effectiveDirection === 'right' ? 1 : -1;

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
        y: y - 0.5 * nodeSize.height,
        width: nodeSize.width,
        height: nodeSize.height
      };
      console.groupEnd();
      return node.boundingBox;
    }

    // Calculate child position and dimensions using appropriate column class
    let column;
    if (effectiveDirection === 'right') {
      column = new RightColumn(this.parentPadding, this.childPadding);
    } else {
      column = new LeftColumn(this.parentPadding, this.childPadding, this.adjustPositionRecursive.bind(this));
    }
    
    const { totalHeight, maxChildWidth } = column.positionNodes(node.children, nodeSize, style);

    // Center parent relative to children
    this.centerParentAndChildren(node, x, y, nodeSize, totalHeight);

    // Adjust all children positions to compensate for relative positioning
    for (let i = 0; i < node.children.length; i++) {
      this.adjustPositionRecursive(node.children[i], x, y);
    }

    // Calculate bounding box
    this.calculateBoundingBox(node, x, y, nodeSize, maxChildWidth, effectiveDirection);

    console.groupEnd();
    return node.boundingBox;
  }

  /**
   * Get the connection point for a parent node in horizontal layout
   * @param {Node} node - The parent node
   * @param {Object} levelStyle - The style for this node's level
   * @param {Node} childNode - The specific child node being connected to (optional)
   * @return {ConnectionPoint} The connection point
   */
  getParentConnectionPoint(node, levelStyle, childNode = null) {
    // Direction is determined by StyleManager
    const effectiveDirection = levelStyle.styleManager.getEffectiveValue(node, 'direction') || this.direction;

    // Currently, we're not using childNode to determine the connection point
    // In the future, this could be enhanced to create multiple connection points
    // based on the specific child node's position or other attributes

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
   * Center parent node relative to children
   * @param {Node} node - The parent node
   * @param {number} x - The parent x coordinate
   * @param {number} y - The parent y coordinate
   * @param {Object} nodeSize - The parent node size
   * @param {number} totalHeight - Total height of children
   */
  centerParentAndChildren(node, x, y, nodeSize, totalHeight) {
    // Always center parent vertically against its children, regardless of which is taller
    // Calculate the vertical center point of all children combined
    const childrenVerticalCenter = y + (totalHeight / 2);
    // Place the node so its center aligns with the center of its children
    node.y = childrenVerticalCenter - (nodeSize.height / 2);
  }

  /**
   * Calculate bounding box for node and its children
   * @param {Node} node - The parent node
   * @param {number} x - The parent x coordinate
   * @param {number} y - The parent y coordinate
   * @param {Object} nodeSize - The parent node size
   * @param {number} maxChildWidth - Maximum width of children
   * @param {string} effectiveDirection - The layout direction
   */
  calculateBoundingBox(node, x, y, nodeSize, maxChildWidth, effectiveDirection) {
    // Calculate bounding box dimensions
    const bbX = effectiveDirection === 'right' ? x : x - maxChildWidth - this.parentPadding;
    const bbWidth = nodeSize.width + this.parentPadding + maxChildWidth;

    // Calculate bounding box dimensions by properly accounting for all children's actual bounding boxes
    // Start with the parent node's position and size
    let minX = x;
    let maxX = x + nodeSize.width;
    let minY = node.y;
    let maxY = node.y + nodeSize.height;

    // Now check all children's bounding boxes to ensure our bounding box contains them all
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      if (child.boundingBox) {
        minX = Math.min(minX, child.boundingBox.x);
        maxX = Math.max(maxX, child.boundingBox.x + child.boundingBox.width);
        minY = Math.min(minY, child.boundingBox.y);
        maxY = Math.max(maxY, child.boundingBox.y + child.boundingBox.height);
      }
    }

    node.boundingBox = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }


  /**
   * Get the connection point for a child node in horizontal layout
   * @param {Node} node - The child node
   * @param {Object} levelStyle - The style for this node's level
   * @return {ConnectionPoint} The connection point
   */
  getChildConnectionPoint(node, levelStyle) {
    // Direction is determined by StyleManager
    const effectiveDirection = levelStyle.styleManager.getEffectiveValue(node, 'direction') || this.direction;

    // For the child node, connection point is always on the side facing the parent
    if (effectiveDirection === 'right') {
      // When layout flows right, child connects on its left side
      return new ConnectionPoint(node.x, node.y + node.height / 2, 'left');
    } else {
      // When layout flows left, child connects on its right side
      return new ConnectionPoint(node.x + node.width, node.y + node.height / 2, 'right');
    }
  }
}

// For backward compatibility
if (typeof window !== 'undefined') {
  window.HorizontalLayout = HorizontalLayout;
}

export default HorizontalLayout;