// src/layout/outline-layout.js

import Layout from './layout.js';
import ConnectionPoint from './connection-point.js';
import LayoutFactory from './layout-factory.js';

/**
 * Left outline column positioning for outline layout
 */
class LeftOutlineColumn {
  constructor(parentPadding, childPadding, horizontalShift, adjustPositionRecursive, nodeSize, style) {
    this.parentPadding = parentPadding;
    this.childPadding = childPadding;
    this.horizontalShift = horizontalShift;
    this.adjustPositionRecursive = adjustPositionRecursive;
    this.nodeSize = nodeSize;
    this.style = style;
    
    // State tracking
    this.currentY = 0;
    this.maxChildWidth = 0;
    this.childrenPositioned = [];
    
    // Calculate child Y position below parent
    this.childStartY = nodeSize.height + this.parentPadding;
    
    // Get edge alignment preference from style: 'start' or 'end'
    // For left direction: 'start' = near edge (parent's right), 'end' = far edge (parent's left)
    const edgeAlignment = this.style.getGlobalConfig('outlineEdgeAlignment', 'start');
    
    if (edgeAlignment === 'start') {
      // Position children's right edges relative to parent's right edge (near edge, to the left)
      this.alignmentX = nodeSize.width - this.horizontalShift; // Line at horizontalShift left of parent's right edge
      this.alignToRightEdge = true; // Align children's right edges to this line
      this.childX = nodeSize.width - this.horizontalShift;
    } else {
      // Position children's right edges relative to parent's left edge (far edge, to the left)  
      this.alignmentX = -this.horizontalShift; // Line at horizontalShift left of parent's left edge (which is at x=0)
      this.alignToRightEdge = true; // Align children's right edges to this line
      this.childX = -this.horizontalShift;
    }
  }

  /**
   * Add a single node to the column
   * @param {Node} node - The node to add
   * @return {Object} The size of the positioned node
   */
  addNode(node) {
    console.log(`LeftOutlineColumn.addNode(${node.text}) - currentY: ${this.currentY}`);
    
    // Get the appropriate layout for the child's level
    const childLevelStyle = this.style.getLevelStyle(node.level);
    const childLayoutType = this.style.getEffectiveValue(node, 'layoutType');

    // Create appropriate layout for child using LayoutFactory
    const childLayout = LayoutFactory.createLayout(
      childLayoutType,
      childLevelStyle.parentPadding,
      childLevelStyle.childPadding
    );

    // Apply layout to child at relative position (0,0)
    const childSize = childLayout.applyLayoutRelative(node, 0, 0, this.style);
    
    // Position the child at the correct vertical position initially
    const targetY = this.childStartY + this.currentY;
    node.adjustNodeTreeToPosition(this.childX, targetY);
    
    // Update state
    this.currentY += childSize.height + this.childPadding;
    this.maxChildWidth = Math.max(this.maxChildWidth, childSize.width);
    this.childrenPositioned.push(node);

    // Apply edge alignment immediately after positioning
    if (node.boundingBox) {
      let adjustment = 0;
      
      if (this.alignToRightEdge) {
        // Align right edges to the alignment line
        const currentRightEdge = node.boundingBox.x + node.boundingBox.width;
        const targetRightEdge = this.alignmentX;
        adjustment = targetRightEdge - currentRightEdge;
        console.log(`  Child "${node.text}" right-edge alignment: current=${currentRightEdge}, target=${targetRightEdge}, adjustment=${adjustment}`);
      } else {
        // Align left edges to the alignment line
        const currentLeftEdge = node.boundingBox.x;
        const targetLeftEdge = this.alignmentX;
        adjustment = targetLeftEdge - currentLeftEdge;
        console.log(`  Child "${node.text}" left-edge alignment: current=${currentLeftEdge}, target=${targetLeftEdge}, adjustment=${adjustment}`);
      }
      
      // Adjust the child's position
      this.adjustPositionRecursive(node, adjustment, 0);
    }
    
    console.log(`  Child "${node.text}" final position after alignment: x:${node.x}, y:${node.y}`);
    console.log(`  Updated currentY: ${this.currentY}`);

    return childSize;
  }

  /**
   * Position nodes in a left outline column
   * @param {Array} nodes - The nodes to position
   * @param {Object} nodeSize - The parent node size
   * @param {Object} style - The style to apply
   * @return {Object} Total height and max child width
   */
  positionNodes(nodes, nodeSize, style) {
    // Position children using addNode
    for (let i = 0; i < nodes.length; i++) {
      this.addNode(nodes[i]);
    }

    // Calculate final height (remove extra padding from last child)
    let totalHeight = this.currentY;
    if (nodes.length > 0) {
      totalHeight -= this.childPadding;
    }

    // Log positioned children bounding boxes with right-edge alignment info
    console.log(`LeftOutlineColumn positioned ${this.childrenPositioned.length} children with right-edge alignment:`);
    for (let i = 0; i < this.childrenPositioned.length; i++) {
      const child = this.childrenPositioned[i];
      if (child.boundingBox) {
        const rightEdge = child.boundingBox.x + child.boundingBox.width;
        console.log(`  Child ${i} (${child.text}): boundingBox = {x: ${child.boundingBox.x}, y: ${child.boundingBox.y}, width: ${child.boundingBox.width}, height: ${child.boundingBox.height}}, rightEdge: ${rightEdge}`);
      }
    }

    return { totalHeight, maxChildWidth: this.maxChildWidth };
  }
}

/**
 * Right outline column positioning for outline layout
 */
class RightOutlineColumn {
  constructor(parentPadding, childPadding, horizontalShift, adjustPositionRecursive, nodeSize, style) {
    this.parentPadding = parentPadding;
    this.childPadding = childPadding;
    this.horizontalShift = horizontalShift;
    this.adjustPositionRecursive = adjustPositionRecursive;
    this.nodeSize = nodeSize;
    this.style = style;
    
    // State tracking
    this.currentY = 0;
    this.maxChildWidth = 0;
    this.childrenPositioned = [];
    
    // Calculate child Y position below parent
    this.childStartY = nodeSize.height + this.parentPadding;
    
    // Get edge alignment preference from style: 'start' or 'end'
    // For right direction: 'start' = relative to parent's left edge, 'end' = relative to parent's right edge
    const edgeAlignment = this.style.getGlobalConfig('outlineEdgeAlignment', 'start');
    
    if (edgeAlignment === 'start') {
      // Position children column's left edge relative to parent's left edge (to the right)
      this.alignmentX = this.horizontalShift; // Line at horizontalShift right of parent's left edge (which is at x=0)
      this.alignToRightEdge = false; // Align children's left edges to this line
      this.childX = this.horizontalShift;
    } else {
      // Position children column relative to parent's right edge (to the right)
      this.alignmentX = this.nodeSize.width + this.horizontalShift; // Line at horizontalShift right of parent's right edge
      this.alignToRightEdge = false; // Align children's left edges to this line
      this.childX = this.nodeSize.width + this.horizontalShift;
    }
  }

  /**
   * Add a single node to the column
   * @param {Node} node - The node to add
   * @return {Object} The size of the positioned node
   */
  addNode(node) {
    console.log(`RightOutlineColumn.addNode(${node.text}) - currentY: ${this.currentY}`);
    
    // Get the appropriate layout for the child's level
    const childLevelStyle = this.style.getLevelStyle(node.level);
    const childLayoutType = this.style.getEffectiveValue(node, 'layoutType');

    // Create appropriate layout for child using LayoutFactory
    const childLayout = LayoutFactory.createLayout(
      childLayoutType,
      childLevelStyle.parentPadding,
      childLevelStyle.childPadding
    );

    // Apply layout to child at relative position (0,0)
    const childSize = childLayout.applyLayoutRelative(node, 0, 0, this.style);
    
    // Position the child at the correct position initially
    const targetY = this.childStartY + this.currentY;
    node.adjustNodeTreeToPosition(this.childX, targetY);
    
    // Update state
    this.currentY += childSize.height + this.childPadding;
    this.maxChildWidth = Math.max(this.maxChildWidth, childSize.width);
    this.childrenPositioned.push(node);

    // Apply edge alignment immediately after positioning
    if (node.boundingBox) {
      let adjustment = 0;
      
      if (this.alignToRightEdge) {
        // Align right edges to the alignment line
        const currentRightEdge = node.boundingBox.x + node.boundingBox.width;
        const targetRightEdge = this.alignmentX;
        adjustment = targetRightEdge - currentRightEdge;
        console.log(`  Child "${node.text}" right-edge alignment: current=${currentRightEdge}, target=${targetRightEdge}, adjustment=${adjustment}`);
      } else {
        // Align left edges to the alignment line
        const currentLeftEdge = node.boundingBox.x;
        const targetLeftEdge = this.alignmentX;
        adjustment = targetLeftEdge - currentLeftEdge;
        console.log(`  Child "${node.text}" left-edge alignment: current=${currentLeftEdge}, target=${targetLeftEdge}, adjustment=${adjustment}`);
      }
      
      // Adjust the child's position
      this.adjustPositionRecursive(node, adjustment, 0);
    }
    
    console.log(`  Child "${node.text}" final position after alignment: x:${node.x}, y:${node.y}`);
    console.log(`  Updated currentY: ${this.currentY}`);

    return childSize;
  }

  /**
   * Position nodes in a right outline column
   * @param {Array} nodes - The nodes to position
   * @param {Object} nodeSize - The parent node size
   * @param {Object} style - The style to apply
   * @return {Object} Total height and max child width
   */
  positionNodes(nodes, nodeSize, style) {
    // Position children using addNode
    for (let i = 0; i < nodes.length; i++) {
      this.addNode(nodes[i]);
    }

    // Calculate final height (remove extra padding from last child)
    let totalHeight = this.currentY;
    if (nodes.length > 0) {
      totalHeight -= this.childPadding;
    }

    // Log positioned children bounding boxes
    console.log(`RightOutlineColumn positioned ${this.childrenPositioned.length} children:`);
    for (let i = 0; i < this.childrenPositioned.length; i++) {
      const child = this.childrenPositioned[i];
      if (child.boundingBox) {
        console.log(`  Child ${i} (${child.text}): boundingBox = {x: ${child.boundingBox.x}, y: ${child.boundingBox.y}, width: ${child.boundingBox.width}, height: ${child.boundingBox.height}}`);
      }
    }

    return { totalHeight, maxChildWidth: this.maxChildWidth };
  }
}

/**
 * OutlineLayout places all children in a column below the parent,
 * shifted horizontally by a configurable distance (left or right)
 */
class OutlineLayout extends Layout {
  /**
   * Create a new OutlineLayout
   * @param {number} parentPadding - Padding between parent and children
   * @param {number} childPadding - Padding between siblings
   * @param {number} horizontalShift - Distance to shift children horizontally from parent edge
   * @param {string} direction - Direction of layout ('left' or 'right')
   */
  constructor(parentPadding = 30, childPadding = 20, horizontalShift = 50, direction = 'right') {
    super();
    this.parentPadding = parentPadding;
    this.childPadding = childPadding;
    this.horizontalShift = horizontalShift;
    this.direction = direction;
  }

  /**
   * Apply outline layout to a node and its children
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
   * Apply outline layout to a node and its children (recursive implementation)
   * @param {Node} node - The node to layout
   * @param {number} x - The x coordinate
   * @param {number} y - The y coordinate
   * @param {Object} style - The style to apply
   * @return {Object} The size of the laid out subtree
   */
  applyLayoutRelative(node, x, y, style) {
    console.groupCollapsed(`OutlineLayout.applyLayoutRelative(${node.text})`);
    console.log('node', node);
    
    const levelStyle = style.getLevelStyle(node.level);
    const nodeSize = this.getNodeSize(node.text, levelStyle);

    // Start by positioning node at (0, 0) by top-left corner
    node.x = 0;
    node.y = 0;
    node.width = nodeSize.width;
    node.height = nodeSize.height;

    // Get direction from StyleManager with fallback to default
    const effectiveDirection = style.getEffectiveValue(node, 'direction') || this.direction;
    console.log('effectiveDirection', effectiveDirection);

    // Get horizontal shift from StyleManager with fallback to default
    const effectiveHorizontalShift = style.getEffectiveValue(node, 'horizontalShift') || this.horizontalShift;
    console.log('effectiveHorizontalShift', effectiveHorizontalShift);

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
        x: 0,
        y: 0,
        width: nodeSize.width,
        height: nodeSize.height
      };
      console.groupEnd();
      return node.boundingBox;
    }

    // Position children using the appropriate outline column class
    let totalHeight, maxChildWidth;
    
    if (effectiveDirection === 'left') {
      const leftOutlineColumn = new LeftOutlineColumn(
        this.parentPadding, 
        this.childPadding, 
        effectiveHorizontalShift, 
        this.adjustPositionRecursive.bind(this),
        nodeSize, 
        style
      );
      
      // Position all children using the column's addNode method
      node.children.forEach(child => {
        leftOutlineColumn.addNode(child);
      });
      
      totalHeight = node.children.length > 0 ? leftOutlineColumn.currentY - this.childPadding : 0;
      maxChildWidth = leftOutlineColumn.maxChildWidth;
    } else {
      const rightOutlineColumn = new RightOutlineColumn(
        this.parentPadding, 
        this.childPadding, 
        effectiveHorizontalShift, 
        this.adjustPositionRecursive.bind(this),
        nodeSize, 
        style
      );
      
      // Position all children using the column's addNode method
      node.children.forEach(child => {
        rightOutlineColumn.addNode(child);
      });
      
      totalHeight = node.children.length > 0 ? rightOutlineColumn.currentY - this.childPadding : 0;
      maxChildWidth = rightOutlineColumn.maxChildWidth;
    }

    // Calculate bounding box at relative positions
    node.calculateBoundingBox();
    
    console.groupEnd();
    return node.boundingBox;
  }

  /**
   * Get the connection point for a parent node in outline layout
   * @param {Node} node - The parent node
   * @param {Object} levelStyle - The style for this node's level
   * @param {Node} childNode - The specific child node being connected to (optional)
   * @return {ConnectionPoint} The connection point
   */
  getParentConnectionPoint(node, levelStyle, childNode = null) {
    // Get direction from StyleManager with fallback to default
    const effectiveDirection = levelStyle.styleManager.getEffectiveValue(node, 'direction') || this.direction;
    
    // For outline layout, parent connects from the side closest to children
    if (effectiveDirection === 'left') {
      // Children are to the left, connect from left side
      return new ConnectionPoint(node.x, node.y + node.height / 2, 'left');
    } else {
      // Children are to the right, connect from right side
      return new ConnectionPoint(node.x + node.width, node.y + node.height / 2, 'right');
    }
  }

  /**
   * Get the connection point for a child node in outline layout
   * @param {Node} node - The child node
   * @param {Object} levelStyle - The style for this node's level
   * @return {ConnectionPoint} The connection point
   */
  getChildConnectionPoint(node, levelStyle) {
    // Get direction from StyleManager with fallback to default
    const effectiveDirection = levelStyle.styleManager.getEffectiveValue(node, 'direction') || this.direction;

    // Child connects on the side facing the parent
    if (effectiveDirection === 'left') {
      // Parent is to the right of child, connect from right side
      return new ConnectionPoint(node.x + node.width, node.y + node.height / 2, 'right');
    } else {
      // Parent is to the left of child, connect from left side
      return new ConnectionPoint(node.x, node.y + node.height / 2, 'left');
    }
  }
}

// For backward compatibility
if (typeof window !== 'undefined') {
  window.OutlineLayout = OutlineLayout;
}

// Export outline column classes for potential reuse
export { LeftOutlineColumn, RightOutlineColumn };

export default OutlineLayout;