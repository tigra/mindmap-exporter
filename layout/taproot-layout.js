// src/layout/tap-root-layout.js - Update for direction overrides

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
    
    // Debug properties for visualizing column alignment
    this.leftColumnX = null;  // Right edge of left column
    this.rightColumnX = null; // Left edge of right column
    this.columnMinY = null;   // Top of columns
    this.columnMaxY = null;   // Bottom of columns
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
    console.log('node', node);
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
      console.groupEnd();
      return node.boundingBox;
    }

    // Start positioning children below the parent
    const childStartY = y + nodeSize.height + this.parentPadding;

    // Initialize variables for tracking the column heights and widths
    let leftColumnHeight = 0;
    let rightColumnHeight = 0;
    this.leftColumnMaxWidth = 0;
    this.rightColumnMaxWidth = 0;

    // Arrays to store children for each column
    const leftChildren = [];
    const rightChildren = [];

    // Copy the original array to avoid modifications
    const children = [...node.children];

    // Calculate the center point for the parent node
    const parentCenterX = x + (nodeSize.width / 2);
    
    // Store column alignment coordinates for debugging
    this.leftColumnX = parentCenterX - this.columnGap / 2;
    this.rightColumnX = parentCenterX + this.columnGap / 2;
    this.columnMinY = childStartY;
    this.columnMaxY = childStartY; // Will be updated as we add children
    
    // Initialize current Y positions for both columns
    let currentLeftY = childStartY;
    let currentRightY = childStartY;
    
    // Get layouts for the columns
    const leftLayout = LayoutFactory.createLayout('horizontal', levelStyle.parentPadding, levelStyle.childPadding, 'left');
    const rightLayout = LayoutFactory.createLayout('horizontal', levelStyle.parentPadding, levelStyle.childPadding, 'right');
    
    // Distribute children one by one, applying layout and adding to shorter column
    while (children.length > 0) {
      // Get the next child based on which column is shorter
      let nextChild;
      let useLeftColumn;
      
      if (leftColumnHeight <= rightColumnHeight) {
        // Use left column (take from front of array)
        nextChild = children.shift();
        useLeftColumn = true;
      } else {
        // Use right column (take from end of array)
        nextChild = children.pop();
        useLeftColumn = false;
      }
      
      // Set appropriate overrides for the child
      if (useLeftColumn) {
        nextChild.setOverride('direction', 'left');
        nextChild.setOverride('layoutType', 'horizontal');
        
        // Apply layout and get actual size with its children
        const childSize = leftLayout.applyLayout(nextChild, 0, currentLeftY, style);
        
        // Update column height with actual bounding box height
        leftColumnHeight += childSize.height + this.childPadding;
        this.leftColumnMaxWidth = Math.max(this.leftColumnMaxWidth, childSize.width);
        
        // Position the child so its right side aligns with leftColumnX
//        const leftColumnX = parentCenterX - this.columnGap / 2;
        const targetX = this.leftColumnX - childSize.width; // Use bounding box width instead of node width
        const deltaX = targetX - childSize.x; // Use bounding box x instead of node x
        this.adjustPositionRecursive(nextChild, deltaX, 0);
        
        // Add to left column array
        leftChildren.push(nextChild);
        
        // Update Y position for next left child
        currentLeftY += childSize.height + this.childPadding;
        
        // Update max Y coordinate for debugging visualization
        this.columnMaxY = Math.max(this.columnMaxY, currentLeftY - this.childPadding);
      } else {
        nextChild.setOverride('direction', 'right');
        nextChild.setOverride('layoutType', 'horizontal');
        
        // Apply layout and get actual size with its children
        const childSize = rightLayout.applyLayout(nextChild, 0, currentRightY, style);
        
        // Update column height with actual bounding box height
        rightColumnHeight += childSize.height + this.childPadding;
        this.rightColumnMaxWidth = Math.max(this.rightColumnMaxWidth, childSize.width);
        
        // Position the child so its left side aligns with rightColumnX
        const rightColumnX = parentCenterX + this.columnGap / 2;
        const deltaX = rightColumnX - childSize.x; // Use bounding box x instead of node x
        this.adjustPositionRecursive(nextChild, deltaX, 0);
        
        // Add to right column array  
        rightChildren.push(nextChild);
        
        // Update Y position for next right child
        currentRightY += childSize.height + this.childPadding;
        
        // Update max Y coordinate for debugging visualization
        this.columnMaxY = Math.max(this.columnMaxY, currentRightY - this.childPadding);
      }
    }
    
    // Remove extra padding
    if (leftColumnHeight > 0) leftColumnHeight -= this.childPadding;
    if (rightColumnHeight > 0) rightColumnHeight -= this.childPadding;

    // All child layout calculation and positioning is now handled in the distribution loop above
    // The code here has been moved into the main distribution loop for better column balancing

    // Calculate the overall bounding box
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

    node.moveBoundingBoxTo(x, y);

    // Add debug elements to the node
//    this.createDebugElements(node);
    
    console.groupEnd();
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
      // Get effective direction either from styleManager or node overrides
      let direction = 'left'; // Default

      // Try to get direction from StyleManager if available
      if (levelStyle.styleManager && levelStyle.styleManager.getEffectiveValue) {
        direction = levelStyle.styleManager.getEffectiveValue(node, 'direction');
      }

      if (direction === 'left') {
        // If direction is left, connect on right side of node
        return new ConnectionPoint(node.x + node.width, node.y + node.height / 2, 'right');
      } else {
        // If direction is right, connect on left side of node
        return new ConnectionPoint(node.x, node.y + node.height / 2, 'left');
      }
    }
    
  /**
   * Create debug elements for the node to visualize column alignment
   * @param {Node} node - The node to add debug elements to
   */
  createDebugElements(node) {
    if (!this.leftColumnX || !this.rightColumnX || !this.columnMinY || !this.columnMaxY) {
      return; // No debug information available
    }
    
    // Initialize debug elements array if not exists
    if (!node.debugElements) {
      node.debugElements = [];
    }
    
    // Create SVG elements for column alignment lines
    
    // Left column alignment line (right edge) - red vertical line
    node.debugElements.push({
      type: 'line',
      x1: this.leftColumnX,
      y1: this.columnMinY,
      x2: this.leftColumnX,
      y2: this.columnMaxY,
      stroke: 'red',
      strokeWidth: 2,
      strokeDasharray: '5,5'
    });

    node.debugElements.push({
      type: 'line',
      x1: this.leftColumnX - this.leftColumnMaxWidth,
      y1: this.columnMinY,
      x2: this.leftColumnX - this.leftColumnMaxWidth,
      y2: this.columnMaxY,
      stroke: 'red',
      strokeWidth: 2,
      strokeDasharray: '5,5'
    });

    // Right column alignment line (left edge) - red vertical line
    node.debugElements.push({
      type: 'line',
      x1: this.rightColumnX,
      y1: this.columnMinY,
      x2: this.rightColumnX,
      y2: this.columnMaxY,
      stroke: 'red',
      strokeWidth: 2,
      strokeDasharray: '5,5'
    });

    node.debugElements.push({
      type: 'line',
      x1: this.rightColumnX + this.rightColumnMaxWidth,
      y1: this.columnMinY,
      x2: this.rightColumnX + this.rightColumnMaxWidth,
      y2: this.columnMaxY,
      stroke: 'red',
      strokeWidth: 2,
      strokeDasharray: '5,5'
    });

    // Add horizontal lines at top and bottom
    node.debugElements.push({
      type: 'line',
      x1: this.leftColumnX - 20,
      y1: this.columnMinY,
      x2: this.rightColumnX + 20,
      y2: this.columnMinY,
      stroke: 'red',
      strokeWidth: 1,
      strokeDasharray: '5,5'
    });
    
    node.debugElements.push({
      type: 'line',
      x1: this.leftColumnX - 20,
      y1: this.columnMaxY,
      x2: this.rightColumnX + 20,
      y2: this.columnMaxY,
      stroke: 'red',
      strokeWidth: 1,
      strokeDasharray: '5,5'
    });
    
    // Add text label for visual explanation
    node.debugElements.push({
      type: 'text',
      x: (this.leftColumnX + this.rightColumnX) / 2,
      y: this.columnMinY - 10,
      textAnchor: 'middle',
      fill: 'red',
      fontSize: '12px',
      content: node.text
    });
  }
}

// For backward compatibility
if (typeof window !== 'undefined') {
  window.TapRootLayout = TapRootLayout;
}

export default TapRootLayout;