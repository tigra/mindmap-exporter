// src/layout/classic-mindmap-layout.js
// Classic mindmap layout with horizontal child arrangement

import ColumnBasedLayout from './column-based-layout.js';
import ConnectionPoint from './connection-point.js';
import LayoutFactory from './layout-factory.js';

/**
 * ClassicMindmapLayout arranges children horizontally in left and right columns,
 * with the children positioned at the same y-level as the parent (unlike TapRootLayout)
 */
class ClassicMindmapLayout extends ColumnBasedLayout {
  /**
   * Create a new ClassicMindmapLayout
   * @param {number} parentPadding - Not used in classic layout (use childPadding instead)
   * @param {number} childPadding - Padding between parent node edge and children
   * @param {number} columnGap - Gap between left and right columns
   * @param {number} verticalOffset - Optional vertical offset from parent center
   */
  constructor(parentPadding = 60, childPadding = 60, columnGap = 80, verticalOffset = 0) {
    super(parentPadding, childPadding, columnGap);
    this.verticalOffset = verticalOffset;
  }

  /**
   * Get column positioning configuration for ClassicMindmapLayout
   * @param {Node} node - The parent node
   * @param {Object} nodeSize - The parent node size
   * @param {number} childStartY - Starting Y coordinate for children
   * @return {Object} Configuration for column positioning
   */
  getColumnPositioningConfig(node, nodeSize, childStartY) {
    // Calculate positions based on parent edges and childPadding distance
    const parentLeftEdge = 0; // relative positioning
    const parentRightEdge = nodeSize.width; // relative positioning
    const parentCenterY = nodeSize.height / 2 + this.verticalOffset;
    
    return {
      rightColumnX: parentRightEdge + this.childPadding,
      leftColumnAlignmentX: parentLeftEdge - this.childPadding,
      rightColumnStartY: childStartY, // Will be updated after height calculation
      leftColumnStartY: childStartY, // Will be updated after height calculation
      paddingForColumns: this.childPadding, // Use childPadding instead of parentPadding
      parentCenterY: parentCenterY
    };
  }

  /**
   * Apply vertical centering for ClassicMindmapLayout columns
   * @param {Node} node - The parent node
   * @param {LeftColumn} leftColumn - The left column instance
   * @param {RightColumn} rightColumn - The right column instance
   * @param {Object} config - The positioning configuration
   */
  applyColumnPostProcessing(node, leftColumn, rightColumn, config) {
    console.log('ClassicMindmapLayout.applyColumnPostProcessing() - applying vertical centering');
    
    // Calculate total heights for each column
    const leftTotalHeight = leftColumn.currentY - config.leftColumnStartY;
    const rightTotalHeight = rightColumn.currentY - config.rightColumnStartY;
    
    console.log('Column heights - Left:', leftTotalHeight, 'Right:', rightTotalHeight);
    console.log('Parent center Y:', config.parentCenterY);
    
    // Calculate centering adjustments
    const leftCenteringAdjustment = config.parentCenterY - (leftTotalHeight / 2) - config.leftColumnStartY;
    const rightCenteringAdjustment = config.parentCenterY - (rightTotalHeight / 2) - config.rightColumnStartY;
    
    console.log('Centering adjustments - Left:', leftCenteringAdjustment, 'Right:', rightCenteringAdjustment);
    
    // Apply vertical centering to left column children
    if (leftColumn.childrenPositioned.length > 0) {
      leftColumn.childrenPositioned.forEach(child => {
        this.adjustPositionRecursive(child, 0, leftCenteringAdjustment);
      });
    }
    
    // Apply vertical centering to right column children
    if (rightColumn.childrenPositioned.length > 0) {
      rightColumn.childrenPositioned.forEach(child => {
        this.adjustPositionRecursive(child, 0, rightCenteringAdjustment);
      });
    }
    
    console.log('Vertical centering applied');
  }

  /**
   * Position children in left and right columns horizontally aligned with parent
   * @param {Node} node - The parent node
   * @param {Array} leftChildren - Children in left column 
   * @param {Array} rightChildren - Children in right column
   * @param {number} childStartY - Starting Y coordinate for children (not used directly in this layout)
   * @param {Object} style - The style to apply
   */
  positionChildrenInColumns(node, leftChildren, rightChildren, childStartY, style) {
    const levelStyle = style.getLevelStyle(node.level);
    
    // Calculate parent center points and edges
    const parentCenterX = node.x + (node.width / 2);
    const parentCenterY = node.y + (node.height / 2) + this.verticalOffset;
    const parentLeftEdge = node.x;
    const parentRightEdge = node.x + node.width;
    
    // Get layouts for the columns
    const leftLayout = LayoutFactory.createLayout('horizontal', levelStyle.parentPadding, levelStyle.childPadding, 'left');
    const rightLayout = LayoutFactory.createLayout('horizontal', levelStyle.parentPadding, levelStyle.childPadding, 'right');
    
    // Track total height of each column to center vertically later
    let leftTotalHeight = 0;
    let rightTotalHeight = 0;
    
    // First pass: Calculate layouts and get dimensions
    const leftSizes = [];
    for (let i = 0; i < leftChildren.length; i++) {
      const child = leftChildren[i];
      child.setOverride('layoutType', 'horizontal');
      
      // Apply layout and get actual size with its children
      const childSize = leftLayout.applyLayout(child, 0, 0, style);
      leftSizes.push(childSize);
      leftTotalHeight += childSize.height;
      
      // Add padding between siblings (except after the last child)
      if (i < leftChildren.length - 1) {
        leftTotalHeight += this.childPadding;
      }
      
      // Update max column width
      this.leftColumnMaxWidth = Math.max(this.leftColumnMaxWidth, childSize.width);
    }
    
    const rightSizes = [];
    for (let i = 0; i < rightChildren.length; i++) {
      const child = rightChildren[i];
      child.setOverride('layoutType', 'horizontal');
      
      // Apply layout and get actual size with its children
      const childSize = rightLayout.applyLayout(child, 0, 0, style);
      rightSizes.push(childSize);
      rightTotalHeight += childSize.height;
      
      // Add padding between siblings (except after the last child)
      if (i < rightChildren.length - 1) {
        rightTotalHeight += this.childPadding;
      }
      
      // Update max column width
      this.rightColumnMaxWidth = Math.max(this.rightColumnMaxWidth, childSize.width);
    }
    
    // Calculate starting Y positions to center each column vertically
    let leftStartY = parentCenterY - (leftTotalHeight / 2);
    let rightStartY = parentCenterY - (rightTotalHeight / 2);
    
    // Set column X positions using childPadding as distance from parent node edge
    this.leftColumnX = parentLeftEdge - this.childPadding;
    this.rightColumnX = parentRightEdge + this.childPadding;
    
    // Update column tracking for debug visualization
    this.columnMinY = Math.min(leftStartY, rightStartY);
    this.columnMaxY = Math.max(
      leftStartY + leftTotalHeight,
      rightStartY + rightTotalHeight
    );
    
    // Second pass: Position the children with calculated coordinates
    let currentLeftY = leftStartY;
    for (let i = 0; i < leftChildren.length; i++) {
      const child = leftChildren[i];
      const childSize = leftSizes[i];
      
      // Align child vertically with its center at the current Y position
      const childCenterY = currentLeftY + (childSize.height / 2);
      const targetY = childCenterY - (child.height / 2);
      
      // Position the child so its right side aligns with leftColumnX
      const targetX = this.leftColumnX - childSize.width;
      
      // Calculate delta and adjust the position
      const deltaX = targetX - childSize.x;
      const deltaY = targetY - child.y;
      this.adjustPositionRecursive(child, deltaX, deltaY);
      
      // Update Y position for next left child
      currentLeftY += childSize.height + this.childPadding;
    }
    
    let currentRightY = rightStartY;
    for (let i = 0; i < rightChildren.length; i++) {
      const child = rightChildren[i];
      const childSize = rightSizes[i];
      
      // Align child vertically with its center at the current Y position
      const childCenterY = currentRightY + (childSize.height / 2);
      const targetY = childCenterY - (child.height / 2);
      
      // Position the child so its left side aligns with rightColumnX
      const targetX = this.rightColumnX;
      
      // Calculate delta and adjust the position
      const deltaX = targetX - childSize.x;
      const deltaY = targetY - child.y;
      this.adjustPositionRecursive(child, deltaX, deltaY);
      
      // Update Y position for next right child
      currentRightY += childSize.height + this.childPadding;
    }
  }
  
  /**
   * Apply classic mindmap layout to a node and its children
   * @param {Node} node - The node to layout
   * @param {number} x - The x coordinate
   * @param {number} y - The y coordinate
   * @param {Object} style - The style to apply
   * @return {Object} The size of the laid out subtree
   */
  applyLayout(node, x, y, style) {
    console.groupCollapsed(`ClassicMindmapLayout.applyLayout(${node.text})`);
    
    // Call the parent implementation for the main layout work
    const boundingBox = super.applyLayout(node, x, y, style);
    
    // Add debug elements to the node
    // Uncomment this line to enable debug visualization
    // this.createDebugElements(node);
    
    console.groupEnd();
    return boundingBox;
  }
  
  /**
   * Get the connection point for a parent node in classic mindmap layout
   * @param {Node} node - The parent node
   * @param {Object} levelStyle - The style for this node's level
   * @param {Node} childNode - The specific child node being connected to (optional)
   * @return {ConnectionPoint} The connection point
   */
  getParentConnectionPoint(node, levelStyle, childNode = null) {
    // In ClassicMindmapLayout, we want to determine connection point based on which side
    // the child is on (left or right column)
    
    let direction = 'right';  // Default
    
    // If a specific childNode was provided, use it to determine direction
    if (childNode && levelStyle.styleManager && levelStyle.styleManager.getEffectiveValue) {
      direction = levelStyle.styleManager.getEffectiveValue(childNode, 'direction');
    } 
    // Fallback to first child if no specific child provided
    else if (node.children.length > 0) {
      const firstChild = node.children[0];
      if (levelStyle.styleManager && levelStyle.styleManager.getEffectiveValue) {
        direction = levelStyle.styleManager.getEffectiveValue(firstChild, 'direction');
      }
    }
    
    // For classic layout, parent connects from its sides
    if (direction === 'left') {
      // Connect from left side
      return new ConnectionPoint(node.x, node.y + node.height / 2, 'left');
    } else {
      // Connect from right side
      return new ConnectionPoint(node.x + node.width, node.y + node.height / 2, 'right');
    }
  }
  
  /**
   * Estimate height contribution of a node and its subtree for column balancing
   * In ClassicMindmapLayout, we use a different estimation approach that focuses on
   * horizontal growth of branches
   * @param {Node} node - The node to estimate
   * @return {number} Estimated height
   */
  estimateNodeHeight(node) {
    // If node has a known height from previous layout, use that
    if (node.height) {
      // For classic layout, we put more weight on node's direct height
      // and less on child count (since children go horizontally)
      if (node.children.length > 0 && !node.collapsed) {
        // For nodes with children, add a smaller factor for child count
        return node.height * (1 + 0.2 * node.children.length);
      }
      return node.height;
    }
    
    // Base estimate considering children count but with less impact than TapRoot
    const baseHeight = 30;
    if (node.children.length > 0 && !node.collapsed) {
      return baseHeight * (1 + 0.15 * node.children.length);
    }
    
    return baseHeight;
  }
}

// For backward compatibility
if (typeof window !== 'undefined') {
  window.ClassicMindmapLayout = ClassicMindmapLayout;
}

export default ClassicMindmapLayout;