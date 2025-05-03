// src/layout/column-based-layout.js
// Base class for column-based layouts (TapRoot, ClassicMindmap)

import Layout from './layout.js';
import ConnectionPoint from './connection-point.js';

/**
 * Abstract ColumnBasedLayout implements common functionality for layouts that organize
 * children into columns (left and right sides of parent)
 */
class ColumnBasedLayout extends Layout {
  /**
   * Create a new ColumnBasedLayout
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
    
    // Track column sizes
    this.leftColumnMaxWidth = 0;
    this.rightColumnMaxWidth = 0;
  }

  /**
   * Abstract method that must be implemented by subclasses to handle specific positioning
   * of children in columns
   * @param {Node} node - The parent node
   * @param {Array} leftChildren - Children in left column 
   * @param {Array} rightChildren - Children in right column
   * @param {number} childStartY - Starting Y coordinate for children
   * @param {Object} style - The style to apply
   */
  positionChildrenInColumns(node, leftChildren, rightChildren, childStartY, style) {
    throw new Error('Method positionChildrenInColumns must be implemented by subclasses');
  }
  
  /**
   * Apply column based layout to a node and its children
   * @param {Node} node - The node to layout
   * @param {number} x - The x coordinate
   * @param {number} y - The y coordinate
   * @param {Object} style - The style to apply
   * @return {Object} The size of the laid out subtree
   */
  applyLayout(node, x, y, style) {
    console.groupCollapsed(`ColumnBasedLayout.applyLayout(${node.text})`);
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

    // Calculate the center point for the parent node
    const parentCenterX = x + (nodeSize.width / 2);
    
    // Store column alignment coordinates for debugging
    this.leftColumnX = parentCenterX - this.columnGap / 2;
    this.rightColumnX = parentCenterX + this.columnGap / 2;
    this.columnMinY = childStartY;
    this.columnMaxY = childStartY; // Will be updated as we add children
    
    // Arrays to store children for each column
    const leftChildren = [];
    const rightChildren = [];
    
    // Distribute children into columns using the child distribution algorithm
    this.distributeChildrenIntoColumns(node, leftChildren, rightChildren);
    
    // Position the children in their respective columns
    this.positionChildrenInColumns(node, leftChildren, rightChildren, childStartY, style);
    
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
    
    console.groupEnd();
    return node.boundingBox;
  }
  
  /**
   * Distribute children into left and right columns for balanced layout
   * @param {Node} node - The parent node
   * @param {Array} leftChildren - Array to store left column children
   * @param {Array} rightChildren - Array to store right column children
   */
  distributeChildrenIntoColumns(node, leftChildren, rightChildren) {
    // Copy the original array to avoid modifications
    const children = [...node.children];
    
    // Initialize variables for tracking the column heights
    let leftColumnHeight = 0;
    let rightColumnHeight = 0;
    
    // Distribute children one by one, adding to shorter column
    while (children.length > 0) {
      // Get the next child based on which column is shorter
      if (leftColumnHeight <= rightColumnHeight) {
        // Use left column (take from front of array)
        const nextChild = children.shift();
        nextChild.setOverride('direction', 'left');
        leftChildren.push(nextChild);
        
        // Estimate height contribution (will be refined during actual layout)
        // This is just for distribution balancing purposes
        const estimatedHeight = this.estimateNodeHeight(nextChild);
        leftColumnHeight += estimatedHeight + this.childPadding;
      } else {
        // Use right column (take from end of array)
        const nextChild = children.pop();
        nextChild.setOverride('direction', 'right');
        rightChildren.push(nextChild);
        
        // Estimate height contribution
        const estimatedHeight = this.estimateNodeHeight(nextChild);
        rightColumnHeight += estimatedHeight + this.childPadding;
      }
    }
  }
  
  /**
   * Estimate height contribution of a node and its subtree for column balancing
   * @param {Node} node - The node to estimate
   * @return {number} Estimated height
   */
  estimateNodeHeight(node) {
    // If node has a known height from previous layout, use that
    if (node.height) {
      return node.height;
    }
    
    // Otherwise, make a basic estimate based on text
    // This is a simplified estimate and can be enhanced in subclasses
    return 30; // Default estimate
  }
  
  /**
   * Get the connection point for a parent node
   * @param {Node} node - The parent node
   * @param {Object} levelStyle - The style for this node's level
   * @param {Node} childNode - The specific child node being connected to (optional)
   * @return {ConnectionPoint} The connection point
   */
  getParentConnectionPoint(node, levelStyle, childNode = null) {
    // In column based layouts, parent typically connects from its bottom
    // This is the default implementation, but subclasses can override to provide
    // specialized behavior based on the childNode parameter
    
    // In the future, this could utilize childNode to distribute connection points
    // along the bottom edge of the parent based on which column the child is in
    
    const x = node.x + node.width / 2;
    const y = node.y + node.height;

    return new ConnectionPoint(x, y, 'bottom');
  }

  /**
   * Get the connection point for a child node
   * @param {Node} node - The child node
   * @param {Object} levelStyle - The style for this node's level
   * @return {ConnectionPoint} The connection point
   */
  getChildConnectionPoint(node, levelStyle) {
    // Get effective direction from node overrides or style
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

export default ColumnBasedLayout;