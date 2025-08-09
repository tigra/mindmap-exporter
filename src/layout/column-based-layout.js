// src/layout/column-based-layout.js
// Base class for column-based layouts (TapRoot, ClassicMindmap)

import Layout from './layout.js';
import ConnectionPoint from './connection-point.js';
import { RightColumn, LeftColumn } from './horizontal-layout.js';

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
   * Apply column based layout to a node and its children
   * @param {Node} node - The node to layout
   * @param {number} x - The x coordinate
   * @param {number} y - The y coordinate
   * @param {Object} style - The style to apply
   * @return {Object} The size of the laid out subtree
   */
  applyLayout(node, x, y, style) {
    const boundingBox = this.applyLayoutRelative(node, x, y, style);
    node.adjustNodeTreeToPosition(x, y);
    return boundingBox;
  }

  /**
   * Apply column based layout to a node and its children (recursive implementation)
   * @param {Node} node - The node to layout
   * @param {number} x - The x coordinate
   * @param {number} y - The y coordinate
   * @param {Object} style - The style to apply
   * @return {Object} The size of the laid out subtree
   */
  applyLayoutRelative(node, x, y, style) {
    console.groupCollapsed(`ColumnBasedLayout.applyLayoutRelative(${node.text})`);
    console.log('node', node);
    const levelStyle = style.getLevelStyle(node.level);
    const nodeSize = this.getNodeSize(node.text, levelStyle);

    // Start by positioning node at (0, 0) by top-left corner
    node.x = 0;
    node.y = 0;
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

    // If the node has no children or is collapsed, adjust to final position and return
    if (node.children.length === 0 || node.collapsed) {
      // Adjust node position to (x, y) by top-left corner
      node.x = x;
      node.y = y;
      
      node.boundingBox = {
        x: x,
        y: y,
        width: nodeSize.width,
        height: nodeSize.height
      };
      console.groupEnd();
      return node.boundingBox;
    }

    // Start positioning children below the parent (relative positioning)
    const childStartY = nodeSize.height + this.parentPadding;

    // Calculate the center point for the parent node (relative)
    const parentCenterX = nodeSize.width / 2;
    
    // Store column alignment coordinates for debugging (relative)
    this.leftColumnX = parentCenterX - this.columnGap / 2;
    this.rightColumnX = parentCenterX + this.columnGap / 2;
    this.columnMinY = childStartY;
    this.columnMaxY = childStartY; // Will be updated as we add children
    
    // Arrays to store children for each column
    const leftChildren = [];
    const rightChildren = [];
    
    // Distribute children into columns using the child distribution algorithm
    this.distributeChildrenIntoColumns(node, leftChildren, rightChildren);
    
    // Position the children in their respective columns using column classes
    this.positionChildrenInColumnsWithColumnClasses(node, leftChildren, rightChildren, childStartY, style);
    
    // Calculate bounding box at relative positions
    node.calculateBoundingBox();
    
    console.groupEnd();
    return node.boundingBox;
  }
  
  /**
   * Get column positioning configuration - can be overridden by subclasses
   * @param {Node} node - The parent node
   * @param {Object} nodeSize - The parent node size
   * @param {number} childStartY - Starting Y coordinate for children
   * @return {Object} Configuration for column positioning
   */
  getColumnPositioningConfig(node, nodeSize, childStartY) {
    // Default TaprootLayout behavior
    const parentCenterX = nodeSize.width / 2;
    
    return {
      rightColumnX: parentCenterX + this.columnGap / 2,
      leftColumnAlignmentX: parentCenterX - this.columnGap / 2,
      rightColumnStartY: childStartY,
      leftColumnStartY: childStartY,
      paddingForColumns: this.parentPadding
    };
  }

  /**
   * Position children in columns using the stateful RightColumn and LeftColumn classes
   * @param {Node} node - The parent node
   * @param {Array} leftChildren - Children in left column 
   * @param {Array} rightChildren - Children in right column
   * @param {number} childStartY - Starting Y coordinate for children
   * @param {Object} style - The style to apply
   */
  positionChildrenInColumnsWithColumnClasses(node, leftChildren, rightChildren, childStartY, style) {
    console.log('ColumnBasedLayout.positionChildrenInColumnsWithColumnClasses()');
    console.log('leftChildren:', leftChildren.map(c => c.text));
    console.log('rightChildren:', rightChildren.map(c => c.text));
    
    const levelStyle = style.getLevelStyle(node.level);
    const nodeSize = this.getNodeSize(node.text, levelStyle);
    
    // Get positioning configuration (can be customized by subclasses)
    const config = this.getColumnPositioningConfig(node, nodeSize, childStartY);
    
    // Create column instances with appropriate positioning
    const rightColumn = new RightColumn(config.paddingForColumns, this.childPadding, nodeSize, style);
    const leftColumn = new LeftColumn(config.paddingForColumns, this.childPadding, this.adjustPositionRecursive.bind(this), nodeSize, style);
    
    // Position right column children using the column's addNode method
    if (rightChildren.length > 0) {
      console.log('Positioning right column children...');
      rightColumn.currentY = config.rightColumnStartY;
      rightColumn.childX = config.rightColumnX;
      
      rightChildren.forEach(child => {
        rightColumn.addNode(child);
      });
      
      // Update column tracking
      this.rightColumnMaxWidth = rightColumn.maxChildWidth;
      this.columnMaxY = Math.max(this.columnMaxY, rightColumn.currentY);
    }
    
    // Position left column children using the column's addNode method
    if (leftChildren.length > 0) {
      console.log('Positioning left column children...');
      leftColumn.currentY = config.leftColumnStartY;
      leftColumn.childX = config.leftColumnAlignmentX;
      // Set the alignment point for left column (right edge alignment)
      leftColumn.alignmentX = config.leftColumnAlignmentX;
      
      leftChildren.forEach(child => {
        leftColumn.addNode(child);
      });
      
      // Update column tracking
      this.leftColumnMaxWidth = leftColumn.maxChildWidth;
      this.columnMaxY = Math.max(this.columnMaxY, leftColumn.currentY);
    }
    
    // Apply post-processing for layouts that need vertical centering (like ClassicMindmapLayout)
    this.applyColumnPostProcessing(node, leftColumn, rightColumn, config);
    
    console.log('Column positioning complete. Left max width:', this.leftColumnMaxWidth, 'Right max width:', this.rightColumnMaxWidth);
  }

  /**
   * Apply post-processing to columns - can be overridden by subclasses
   * @param {Node} node - The parent node
   * @param {LeftColumn} leftColumn - The left column instance
   * @param {RightColumn} rightColumn - The right column instance
   * @param {Object} config - The positioning configuration
   */
  applyColumnPostProcessing(node, leftColumn, rightColumn, config) {
    // Default implementation does nothing
    // Subclasses like ClassicMindmapLayout can override this for vertical centering
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
    // Get connection points type from style with fallback to 'single'
    const connectionPointsType = levelStyle.styleManager ? 
      levelStyle.styleManager.getEffectiveValue(node, 'parentConnectionPoints') || 'single' : 
      'single';
    
    // Default Y position and side
    const y = node.y + node.height;
    const side = 'bottom';
    
    // Get the configurable width portion or use default (0.8)
    const widthPortion = levelStyle && levelStyle.styleManager ? 
      levelStyle.styleManager.getEffectiveValue(node, 'parentWidthPortionForConnectionPoints') || 0.8 : 
      0.8;
    
    // Calculate X position based on distribution type
    const x = this.calculateConnectionPointX(node, childNode, connectionPointsType, widthPortion);
    
    // Return connection point
    return new ConnectionPoint(x, y, side);
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
  /**
   * Override drop zone dimensions for column-based layouts
   * In column layouts, nodes can be positioned to left or right of parent
   * Drop zones should always extend towards the parent (inward)
   * @param {Object} node - The node to get drop zone dimensions for
   * @param {Object} parentNode - The parent node
   * @param {number} parentPadding - The padding between parent and children
   * @return {Object} Object with {x, width} for the drop zone dimensions
   */
  getParentDropZoneDimensions(node, parentNode, parentPadding) {
    if (!parentNode) {
      // No parent, use default behavior
      return super.getParentDropZoneDimensions(node, parentNode, parentPadding);
    }
    
    // Check if node has a direction override (used by TaprootLayout and ClassicMindmap)
    let isLeftColumn = false;
    if (node.configOverrides && node.configOverrides.direction) {
      isLeftColumn = node.configOverrides.direction === 'left';
    } else {
      // Fallback: determine by position relative to parent
      isLeftColumn = node.x < parentNode.x;
    }
    
    let dropZoneX, dropZoneWidth;
    
    if (isLeftColumn) {
      // Node is in LEFT column - extend RIGHT towards parent
      dropZoneX = node.x;
      dropZoneWidth = node.width + parentPadding;
    } else {
      // Node is in RIGHT column - extend LEFT towards parent  
      dropZoneWidth = node.width + parentPadding;
      dropZoneX = node.x - parentPadding;
    }
    
    return { x: dropZoneX, width: dropZoneWidth };
  }
}

export default ColumnBasedLayout;