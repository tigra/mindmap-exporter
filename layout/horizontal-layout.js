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
    console.groupCollapsed(`HorizontalLayout.applyLayout(${node.text})`);
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

    // Calculate child X position based on direction
    var childX;
    if (effectiveDirection === 'right') {
       childX = x + nodeSize.width + this.parentPadding;
    } else {
       childX = x - this.parentPadding;
    }

    let totalHeight = 0;
    let maxChildWidth = 0;

    // Position children
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];

      // Get the appropriate layout for the child's level
      const childLevelStyle = style.getLevelStyle(child.level);
      const childLayoutType = style.getEffectiveValue(child, 'layoutType');

      // Create appropriate layout for child using LayoutFactory
      const childLayout = LayoutFactory.createLayout(
        childLayoutType,
        childLevelStyle.parentPadding,
        childLevelStyle.childPadding
      );

      // Apply layout to child
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

    // Adjust positions for left-directed layouts
    if (effectiveDirection === 'left') {
      for (let i = 0; i < node.children.length; i++) {
        this.adjustPositionRecursive(node.children[i], -node.children[i].width, 0);
      }
    }

    // Calculate bounding box dimensions
    const bbX = effectiveDirection === 'right' ? x : x - maxChildWidth - this.parentPadding;
    const bbWidth = nodeSize.width + this.parentPadding + maxChildWidth;

      // Calculate bounding box dimensions by properly accounting for all children's actual bounding boxes
      // Start with the parent node's position and size
      let minX = x;
      let maxX = x + nodeSize.width;
      let minY = y - nodeSize.height / 2;
      let maxY = y + nodeSize.height / 2;

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

//      node.moveBoundingBoxTo(x, y);

      node.boundingBox = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };

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