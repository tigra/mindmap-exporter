// src/layout/tap-root-layout.js

import Layout from './layout.js';
import ConnectionPoint from './connection-point.js';
import HorizontalLayout from './horizontal-layout.js';
import LayoutFactory from './layout-factory.js';

/**
 * TapRootLayout implementation that arranges children in balanced left and right columns
 */
class TapRootLayout extends Layout {
  /**
   * Create a new TapRootLayout
   * @param {number} parentPadding - Padding between parent and children
   * @param {number} childPadding - Padding between siblings
   * @param {number} columnGap - Gap between left and right columns
   */
  constructor(parentPadding = 50, childPadding = 20, columnGap = 80) {
    super();
    this.parentPadding = parentPadding;
    this.childPadding = childPadding;
    this.columnGap = columnGap;
  }

  /**
   * Apply tap root layout to a node and its children
   * @param {Node} node - The node to layout
   * @param {number} x - The x coordinate
   * @param {number} y - The y coordinate
   * @param {Object} style - The style to apply
   * @return {Object} The size of the laid out subtree
   */
  applyLayout(node, x, y, style) {
    const levelStyle = style.getLevelStyle(node.level);
    const nodeSize = this.getNodeSize(node.text, levelStyle);

    // Position the parent node at the specified coordinates
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

    // If the node has no children or is collapsed, return its dimensions
    if (node.children.length === 0 || node.collapsed) {
      node.boundingBox = {
        x: x,
        y: y,
        width: nodeSize.width,
        height: nodeSize.height
      };
      return node.boundingBox;
    }

    // Start positioning children below the parent
    const childStartY = y + nodeSize.height + this.parentPadding;

    // Use horizontal layouts for the children, left for left column and right for right column
    const leftLayout = LayoutFactory.createLayout('horizontal', levelStyle.parentPadding, levelStyle.childPadding, 'left');
    const rightLayout = LayoutFactory.createLayout('horizontal', levelStyle.parentPadding, levelStyle.childPadding, 'right');

    // Initialize variables for tracking the column heights and widths
    let leftColumnHeight = 0;
    let rightColumnHeight = 0;
    let leftColumnMaxWidth = 0;
    let rightColumnMaxWidth = 0;

    // Arrays to store children for each column
    const leftChildren = [];
    const rightChildren = [];

    // Copy the original array to avoid modifications
    const children = [...node.children];

    // Distribute children to left and right columns to balance heights
    let leftIndex = 0;
    let rightIndex = children.length - 1;

    // First, calculate sizes without actually applying layouts
    const childSizes = children.map(child => {
      const childLevelStyle = style.getLevelStyle(child.level);
      return this.getNodeSize(child.text, childLevelStyle);
    });

    // Distribute children until we've used all of them
    while (leftIndex <= rightIndex) {
      // If left column is shorter or equal, add to left
      if (leftColumnHeight <= rightColumnHeight && leftIndex <= rightIndex) {
        leftChildren.push(children[leftIndex]);
        leftColumnHeight += childSizes[leftIndex].height + this.childPadding;
        leftIndex++;
      }
      // If right column is shorter, add to right
      else if (leftIndex <= rightIndex) {
        rightChildren.push(children[rightIndex]);
        rightColumnHeight += childSizes[rightIndex].height + this.childPadding;
        rightIndex--;
      }
    }

    // Remove extra padding
    if (leftColumnHeight > 0) leftColumnHeight -= this.childPadding;
    if (rightColumnHeight > 0) rightColumnHeight -= this.childPadding;

    // Calculate the center point for the parent node
//    const parentCenterX = x + (nodeSize.width / 2);
    const parentCenterX = x + (nodeSize.width / 2);

    // Now actually apply layouts to the children
    let currentLeftY = childStartY;
    let currentRightY = childStartY;

    // Process left column (branches pointing left)
    for (let i = 0; i < leftChildren.length; i++) {
      const childSize = leftLayout.applyLayout(leftChildren[i], 0, currentLeftY, style);
      leftChildren[i].direction = 'left';
      leftColumnMaxWidth = Math.max(leftColumnMaxWidth, childSize.width);
      currentLeftY += childSize.height + this.childPadding;
    }

    // Process right column (branches pointing right)
    for (let i = 0; i < rightChildren.length; i++) {
      const childSize = rightLayout.applyLayout(rightChildren[i], 0, currentRightY, style);
      rightChildren[i].direction = 'right';
      rightColumnMaxWidth = Math.max(rightColumnMaxWidth, childSize.width);
      currentRightY += childSize.height + this.childPadding;
    }

    // Calculate positions for the columns relative to the parent
//    const totalWidth = leftColumnMaxWidth + rightColumnMaxWidth + this.columnGap;
//    const leftColumnX = parentCenterX - (totalWidth / 2);
    const leftColumnX = parentCenterX - this.columnGap / 2;
//    const rightColumnX = parentCenterX + (totalWidth / 2) - rightColumnMaxWidth;
    const rightColumnX = parentCenterX + this.columnGap / 2;

    // Adjust positions for left column
    for (let i = 0; i < leftChildren.length; i++) {
      const child = leftChildren[i];
      // Position each child so its right side aligns with leftColumnX
//      const targetX = leftColumnX + leftColumnMaxWidth - child.width;
      const targetX = leftColumnX  - child.width;
      const deltaX = targetX - child.x;
      this.adjustPositionRecursive(child, deltaX, 0);
    }

    // Adjust positions for right column
    for (let i = 0; i < rightChildren.length; i++) {
      const child = rightChildren[i];
      // Position each child so its left side aligns with rightColumnX
      const deltaX = rightColumnX - child.x;
      this.adjustPositionRecursive(child, deltaX, 0);
    }

    // Calculate the overall bounding box by finding the min/max coordinates
    // of the parent node and all children's bounding boxes
    let minX = node.x;
    let minY = node.y;
    let maxX = node.x + node.width;
    let maxY = node.y + node.height;

    // Include all left column children
    for (let i = 0; i < leftChildren.length; i++) {
      const child = leftChildren[i];
      const childBB = child.boundingBox;

      minX = Math.min(minX, childBB.x);
      minY = Math.min(minY, childBB.y);
      maxX = Math.max(maxX, childBB.x + childBB.width);
      maxY = Math.max(maxY, childBB.y + childBB.height);
    }

    // Include all right column children
    for (let i = 0; i < rightChildren.length; i++) {
      const child = rightChildren[i];
      const childBB = child.boundingBox;

      minX = Math.min(minX, childBB.x);
      minY = Math.min(minY, childBB.y);
      maxX = Math.max(maxX, childBB.x + childBB.width);
      maxY = Math.max(maxY, childBB.y + childBB.height);
    }

    // Set the bounding box to encompass everything
    node.boundingBox = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };

    return node.boundingBox;
  }

  /**
   * Get the connection point for a parent node in tap root layout
   * @param {Node} node - The parent node
   * @param {Object} levelStyle - The style for this node's level
   * @return {ConnectionPoint} The connection point
   */
  getParentConnectionPoint(node, levelStyle) {
    // In tap root layout, parent connects from its bottom
    const x = node.x + node.width / 2;
    const y = node.y + node.height;

    return new ConnectionPoint(x, y, 'bottom');
  }

  /**
   * Get the connection point for a child node in tap root layout
   * @param {Node} node - The child node
   * @param {Object} levelStyle - The style for this node's level
   * @return {ConnectionPoint} The connection point
   */
  getChildConnectionPoint(node, levelStyle) {
//     For child nodes, the connection point depends on which column they're in
    const parentX = node.parent.x + node.parent.width / 2;

    // If child is to the left of parent center, connect on right side
//    if (node.x < parentX) {
    if (false) {
      return new ConnectionPoint(node.x + node.width, node.y + node.height / 2, 'left');
    }
    // If child is to the right of parent center, connect on left side
    else {
      return new ConnectionPoint(node.x, node.y + node.height / 2, 'right');
    }
  }
}

// For backward compatibility
if (typeof window !== 'undefined') {
  window.TapRootLayout = TapRootLayout;
}

export default TapRootLayout;