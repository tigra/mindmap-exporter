// src/layout/horizontal-layout.js

//import Layout from './layout.js';
//import ConnectionPoint from './connection-point.js';

/**
 * Horizontal layout implementation
 */
class HorizontalLayout extends Layout {
  /**
   * Create a new HorizontalLayout
   * @param {number} parentPadding - Padding between parent and children
   * @param {number} childPadding - Padding between siblings
   */
  constructor(parentPadding = 80, childPadding = 20) {
    super();
    this.parentPadding = parentPadding;
    this.childPadding = childPadding;
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
      return {
        width: nodeSize.width,
        height: nodeSize.height
      };
    }

    const childX = x + nodeSize.width + this.parentPadding;
    let totalHeight = 0;
    let maxChildWidth = 0;

    // Position children
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];

      // Get the appropriate layout for the child's level
      const childLevelStyle = style.getLevelStyle(child.level);
      const childLayoutType = childLevelStyle.layoutType;

      // Create appropriate layout based on type
      let childLayout;
      if (childLayoutType === 'vertical') {
        childLayout = new VerticalLayout(childLevelStyle.parentPadding, childLevelStyle.childPadding);
      } else {
        childLayout = new HorizontalLayout(childLevelStyle.parentPadding, childLevelStyle.childPadding);
      }

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

    return {
      width: nodeSize.width + this.parentPadding + maxChildWidth,
      height: Math.max(nodeSize.height, totalHeight)
    };
  }

  /**
   * Get the connection point for a parent node in horizontal layout
   * @param {Node} node - The parent node
   * @param {Object} levelStyle - The style for this node's level
   * @return {ConnectionPoint} The connection point
   */
  getParentConnectionPoint(node, levelStyle) {
    // For text-only nodes, use the exact text dimensions
    if (levelStyle.nodeType === 'text-only') {
      return new ConnectionPoint(node.x + node.width, node.y + node.height / 2, 'right');
    }

    // For box nodes, use the box dimensions
    return new ConnectionPoint(node.x + node.width, node.y + node.height / 2, 'right');
  }

  /**
   * Get the connection point for a child node in horizontal layout
   * @param {Node} node - The child node
   * @param {Object} levelStyle - The style for this node's level
   * @return {ConnectionPoint} The connection point
   */
  getChildConnectionPoint(node, levelStyle) {
    // In horizontal layout, child connects on its left side
    const x = node.x;
    const y = node.y + node.height / 2;

    return new ConnectionPoint(x, y, 'left');
  }
}

// For backward compatibility with how the original code refers to layouts
//import VerticalLayout from './vertical-layout.js';

// For backward compatibility
if (typeof window !== 'undefined') {
  window.HorizontalLayout = HorizontalLayout;
}

//export default HorizontalLayout;