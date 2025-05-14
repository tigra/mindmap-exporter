// src/layout/tap-root-layout.js - Update for direction overrides

import ColumnBasedLayout from './column-based-layout.js';
import ConnectionPoint from './connection-point.js';
import LayoutFactory from './layout-factory.js';

/**
 * TapRootLayout implementation that arranges children in balanced left and right columns
 */
class TapRootLayout extends ColumnBasedLayout {
  /**
   * Create a new TapRootLayout
   * @param {number} parentPadding - Padding between parent and children
   * @param {number} childPadding - Padding between siblings
   * @param {number} columnGap - Gap between left and right columns
   */
  constructor(parentPadding = 50, childPadding = 20, columnGap = 80) {
    super(parentPadding, childPadding, columnGap);
  }

  /**
   * Position children in left and right columns
   * @param {Node} node - The parent node
   * @param {Array} leftChildren - Children in left column 
   * @param {Array} rightChildren - Children in right column
   * @param {number} childStartY - Starting Y coordinate for children
   * @param {Object} style - The style to apply
   */
  positionChildrenInColumns(node, leftChildren, rightChildren, childStartY, style) {
    // Calculate the center point for the parent node
    const parentCenterX = node.x + (node.width / 2);
    const levelStyle = style.getLevelStyle(node.level);
    
    // Initialize current Y positions for both columns
    let currentLeftY = childStartY;
    let currentRightY = childStartY;
    
    // Get layouts for the columns
    const leftLayout = LayoutFactory.createLayout('horizontal', levelStyle.parentPadding, levelStyle.childPadding, 'left');
    const rightLayout = LayoutFactory.createLayout('horizontal', levelStyle.parentPadding, levelStyle.childPadding, 'right');
    
    // Process left column
    for (let i = 0; i < leftChildren.length; i++) {
      const child = leftChildren[i];
      child.setOverride('layoutType', 'horizontal');
      
      // Apply layout and get actual size with its children
      const childSize = leftLayout.applyLayout(child, 0, currentLeftY, style);
      
      // Position the child so its right side aligns with leftColumnX
      const targetX = this.leftColumnX - childSize.width;
      const deltaX = targetX - childSize.x;
      this.adjustPositionRecursive(child, deltaX, 0);
      
      // Update Y position for next left child
      currentLeftY += childSize.height + this.childPadding;
      
      // Update max column width
      this.leftColumnMaxWidth = Math.max(this.leftColumnMaxWidth, childSize.width);
      
      // Update max Y coordinate for debugging visualization
      this.columnMaxY = Math.max(this.columnMaxY, currentLeftY - this.childPadding);
    }
    
    // Process right column
    for (let i = 0; i < rightChildren.length; i++) {
      const child = rightChildren[i];
      child.setOverride('layoutType', 'horizontal');
      
      // Apply layout and get actual size with its children
      const childSize = rightLayout.applyLayout(child, 0, currentRightY, style);
      
      // Position the child so its left side aligns with rightColumnX
      const deltaX = this.rightColumnX - childSize.x;
      this.adjustPositionRecursive(child, deltaX, 0);
      
      // Update Y position for next right child
      currentRightY += childSize.height + this.childPadding;
      
      // Update max column width
      this.rightColumnMaxWidth = Math.max(this.rightColumnMaxWidth, childSize.width);
      
      // Update max Y coordinate for debugging visualization
      this.columnMaxY = Math.max(this.columnMaxY, currentRightY - this.childPadding);
    }
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
    console.groupCollapsed(`TaprootLayout.applyLayout(${node.text})`);
    
    // Call the parent implementation for the main layout work
    const boundingBox = super.applyLayout(node, x, y, style);
    
    // Fix the bounding box to the desired position
    node.moveBoundingBoxTo(x, y);
    
    // Add debug elements to the node
    // Uncomment this line to enable debug visualization
    // this.createDebugElements(node);
    
    console.groupEnd();
    return boundingBox;
  }

  /**
   * Estimate height contribution of a node and its subtree for column balancing
   * In TapRootLayout, we consider the child branch height when balancing columns
   * @param {Node} node - The node to estimate
   * @return {number} Estimated height
   */
  estimateNodeHeight(node) {
    // If node has a known height from previous layout, use that
    if (node.height) {
      if (node.children.length > 0 && !node.collapsed) {
        // For nodes with children, consider their contribution to height
        return node.height * (1 + 0.5 * node.children.length);
      }
      return node.height;
    }
    
    // Base estimate considering children count
    const baseHeight = 30;
    if (node.children.length > 0 && !node.collapsed) {
      return baseHeight * (1 + 0.3 * node.children.length);
    }
    
    return baseHeight;
  }
}

// For backward compatibility
if (typeof window !== 'undefined') {
  window.TapRootLayout = TapRootLayout;
}

export default TapRootLayout;