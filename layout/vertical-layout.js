// src/layout/vertical-layout.js

import Layout from './layout.js';
import ConnectionPoint from './connection-point.js';

/**
 * Vertical layout implementation
 */
class VerticalLayout extends Layout {
  /**
   * Create a new VerticalLayout
   * @param {number} parentPadding - Padding between parent and children
   * @param {number} childPadding - Padding between siblings
   */
  constructor(parentPadding = 30, childPadding = 30) {
    super();
    this.parentPadding = parentPadding;
    this.childPadding = childPadding;
  }

  /**
   * Apply vertical layout to a node and its children
   * @param {Node} node - The node to layout
   * @param {number} x - The x coordinate
   * @param {number} y - The y coordinate
   * @param {Object} style - The style to apply
   * @return {Object} The size of the laid out subtree
   */
  applyLayout(node, x, y, style) {
    const levelStyle = style.getLevelStyle(node.level);
    const nodeSize = this.getNodeSize(node.text, levelStyle);

    // the entire branch left top corner is (x, y)
    // initially place the parent at this position
    node.x = x;
    node.y = y;
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

    if (node.children.length === 0 || node.collapsed) {
      node.boundingBox = {
        x: x,
        y: y,
        width: nodeSize.width,
        height: nodeSize.height
      }
      return {
        width: nodeSize.width,
        height: nodeSize.height
      };
    }

    const childY = y + nodeSize.height + this.parentPadding;
    let totalWidth = 0;
    let maxChildHeight = 0;

    // Position children
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];

      // Get the appropriate layout for the child's level
      const childLevelStyle = style.getLevelStyle(child.level);
      const childLayoutType = childLevelStyle.layoutType;

      // Create appropriate layout based on type
      let childLayout;
      if (childLayoutType === 'horizontal') {
        childLayout = new HorizontalLayout(childLevelStyle.parentPadding, childLevelStyle.childPadding);
      } else {
        childLayout = new VerticalLayout(childLevelStyle.parentPadding, childLevelStyle.childPadding);
      }

      const childSize = childLayout.applyLayout(child, x + totalWidth, childY, style);

      totalWidth += childSize.width + this.childPadding;
      maxChildHeight = Math.max(maxChildHeight, childSize.height);
    }

    // Remove extra padding from last child
    totalWidth -= this.childPadding;

    // Depending on total size of children and the size of parent, adjust them relatively to x
    let parentShift = 0;
    let childShift = 0;

    if (totalWidth < nodeSize.width) {
      childShift = (nodeSize.width - totalWidth) / 2;
    } else {
      parentShift = (totalWidth - nodeSize.width) / 2;
    }

    node.x = x + parentShift;

    for (let i = 0; i < node.children.length; i++) {
      this.adjustPositionRecursive(node.children[i], childShift, 0);
    }

    node.boundingBox = {
      x: x,
      y: y,
      width: Math.max(nodeSize.width, totalWidth),
      height: nodeSize.height + this.parentPadding + maxChildHeight
    }

    return node.boundingBox;
  }

  /**
   * Get the connection point for a parent node in vertical layout
   * @param {Node} node - The parent node
   * @param {Object} levelStyle - The style for this node's level
   * @return {ConnectionPoint} The connection point
   */
  getParentConnectionPoint(node, levelStyle) {
    // In vertical layout, parent connects from its bottom
    const x = node.x + node.width / 2;
    const y = node.y + node.height;

    return new ConnectionPoint(x, y, 'bottom');
  }

  /**
   * Get the connection point for a child node in vertical layout
   * @param {Node} node - The child node
   * @param {Object} levelStyle - The style for this node's level
   * @return {ConnectionPoint} The connection point
   */
  getChildConnectionPoint(node, levelStyle) {
    // In vertical layout, child connects on its top
    const x = node.x + node.width / 2;
    const y = node.y;

    return new ConnectionPoint(x, y, 'top');
  }
}

// For backward compatibility with how the original code refers to layouts
//import HorizontalLayout from './horizontal-layout.js';

// For backward compatibility
if (typeof window !== 'undefined') {
  window.VerticalLayout = VerticalLayout;
}

export default VerticalLayout;