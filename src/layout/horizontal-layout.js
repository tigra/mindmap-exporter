// src/layout/horizontal-layout.js

import Layout from './layout.js';
import ConnectionPoint from './connection-point.js';
import LayoutFactory from './layout-factory.js';

/**
 * Right column positioning for horizontal layout
 */
class RightColumn {
  constructor(parentPadding, childPadding, nodeSize, style) {
    this.parentPadding = parentPadding;
    this.childPadding = childPadding;
    this.nodeSize = nodeSize;
    this.style = style;
    
    // State tracking
    this.currentY = 0;
    this.maxChildWidth = 0;
    this.childrenPositioned = [];
    
    // Calculate child X position for right direction
    this.childX = nodeSize.width + this.parentPadding;
  }

  /**
   * Add a single node to the column
   * @param {Node} node - The node to add
   * @return {Object} The size of the positioned node
   */
  addNode(node) {
    // Get the appropriate layout for the child's level
    const childLevelStyle = this.style.getLevelStyle(node.level);
    const childLayoutType = this.style.getEffectiveValue(node, 'layoutType');

    // Create appropriate layout for child using LayoutFactory
    const childLayout = LayoutFactory.createLayout(
      childLayoutType,
      childLevelStyle.parentPadding,
      childLevelStyle.childPadding
    );

    // Apply layout to child - call applyLayoutRelative recursively
    const childSize = childLayout.applyLayoutRelative(node, this.childX, this.currentY, this.style);

    // Update state
    this.currentY += childSize.height + this.childPadding;
    this.maxChildWidth = Math.max(this.maxChildWidth, childSize.width);
    this.childrenPositioned.push(node);

    return childSize;
  }

  /**
   * Position nodes in a right column
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

    // Log resulting bounding boxes
    console.log(`RightColumn.positionNodes() - positioned ${nodes.length} nodes:`);
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
 * Left column positioning for horizontal layout
 */
class LeftColumn {
  constructor(parentPadding, childPadding, adjustPositionRecursive, nodeSize, style) {
    this.parentPadding = parentPadding;
    this.childPadding = childPadding;
    this.adjustPositionRecursive = adjustPositionRecursive;
    this.nodeSize = nodeSize;
    this.style = style;
    
    // State tracking
    this.currentY = 0;
    this.maxChildWidth = 0;
    this.childrenPositioned = [];
    
    // Calculate child X position for left direction
    this.childX = -this.parentPadding;
    // Calculate the rightmost edge position (relative to parent at 0,0)
    this.alignmentX = -this.parentPadding;
  }

  /**
   * Add a single node to the column
   * @param {Node} node - The node to add
   * @return {Object} The size of the positioned node
   */
  addNode(node) {
    // Get the appropriate layout for the child's level
    const childLevelStyle = this.style.getLevelStyle(node.level);
    const childLayoutType = this.style.getEffectiveValue(node, 'layoutType');

    // Create appropriate layout for child using LayoutFactory
    const childLayout = LayoutFactory.createLayout(
      childLayoutType,
      childLevelStyle.parentPadding,
      childLevelStyle.childPadding
    );

    // Apply layout to child - call applyLayoutRelative recursively
    const childSize = childLayout.applyLayoutRelative(node, this.childX, this.currentY, this.style);

    // Update state
    this.currentY += childSize.height + this.childPadding;
    this.maxChildWidth = Math.max(this.maxChildWidth, childSize.width);
    this.childrenPositioned.push(node);

    // Align this child's right edge immediately
    if (node.boundingBox) {
      // Calculate how much to move the child so its right edge aligns
      const currentRightEdge = node.boundingBox.x + node.boundingBox.width;
      const targetRightEdge = this.alignmentX;
      const adjustment = targetRightEdge - currentRightEdge;
      
      // Adjust the child's position to align its right edge
      this.adjustPositionRecursive(node, adjustment, 0);
    }

    return childSize;
  }

  /**
   * Position nodes in a left column
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

    // Log resulting bounding boxes
    console.log(`LeftColumn.positionNodes() - positioned ${nodes.length} nodes with right-edge alignment:`);
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
    const boundingBox = this.applyLayoutRelative(node, x, y, style);
    return boundingBox;
  }

  /**
   * Apply horizontal layout to a node and its children (recursive implementation)
   * @param {Node} node - The node to layout
   * @param {number} x - The x coordinate
   * @param {number} y - The y coordinate
   * @param {Object} style - The style to apply (StyleManager)
   * @return {Object} The size of the laid out subtree
   */
  applyLayoutRelative(node, x, y, style) {
    console.groupCollapsed(`HorizontalLayout.applyLayoutRelative(${node.text})`);
    const levelStyle = style.getLevelStyle(node.level);
    const nodeSize = this.getNodeSize(node.text, levelStyle);

    // Start by positioning node at (0, 0) by top-left corner
    node.x = 0;
    node.y = 0;
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

    // Calculate child position and dimensions using appropriate column class
    let column;
    if (effectiveDirection === 'right') {
      column = new RightColumn(this.parentPadding, this.childPadding, nodeSize, style);
    } else {
      column = new LeftColumn(this.parentPadding, this.childPadding, this.adjustPositionRecursive.bind(this), nodeSize, style);
    }
    const { totalHeight, maxChildWidth } = column.positionNodes(node.children, nodeSize, style);

    // Center parent relative to children (while still at relative positions)
    this.centerParentAndChildren(node, nodeSize, totalHeight);

    // Calculate bounding box at relative positions
    node.calculateBoundingBox();

    // Final adjustment: move both node and all children to rectangle at (x, y)
    node.adjustNodeTreeToPosition(x, y);

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
   * Center parent node relative to children
   * @param {Node} node - The parent node
   * @param {Object} nodeSize - The parent node size
   * @param {number} totalHeight - Total height of children
   */
  centerParentAndChildren(node, nodeSize, totalHeight) {
    // If no children, keep the parent at its current position
    if (node.children.length === 0) {
      return;
    }

    // Find the actual vertical bounds of all children after positioning
    let minChildY = Number.MAX_VALUE;
    let maxChildY = Number.MIN_VALUE;

    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      minChildY = Math.min(minChildY, child.y);
      maxChildY = Math.max(maxChildY, child.y + child.height);
    }

    // Calculate the actual vertical center of all children
    const childrenVerticalCenter = (minChildY + maxChildY) / 2;
    
    // Calculate the parent's vertical center
    const parentVerticalCenter = node.y + (nodeSize.height / 2);
    
    // Determine which is taller: parent or combined children
    const childrenHeight = maxChildY - minChildY;
    const parentHeight = nodeSize.height;
    
    if (parentHeight > childrenHeight) {
      // Parent is taller - center children relative to parent
      const adjustment = parentVerticalCenter - childrenVerticalCenter;
      for (let i = 0; i < node.children.length; i++) {
        this.adjustPositionRecursive(node.children[i], 0, adjustment);
      }
    } else {
      // Children are taller or equal - center parent relative to children
      node.y = childrenVerticalCenter - (nodeSize.height / 2);
    }

    // Log parent and children bounding boxes after centering
    console.log(`centerParentAndChildren() - after centering for node (${node.text}):`);
    console.log(`  Parent: position = {x: ${node.x}, y: ${node.y}}, size = {width: ${node.width}, height: ${node.height}}`);
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      if (child.boundingBox) {
        console.log(`  Child ${i} (${child.text}): position = {x: ${child.x}, y: ${child.y}}, boundingBox = {x: ${child.boundingBox.x}, y: ${child.boundingBox.y}, width: ${child.boundingBox.width}, height: ${child.boundingBox.height}}`);
      } else {
        console.log(`  Child ${i} (${child.text}): position = {x: ${child.x}, y: ${child.y}}, no boundingBox`);
      }
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

  /**
   * Get child drop zone dimensions for horizontal layout
   * @param {MindmapNode} node - The node to get drop zone for
   * @param {number} parentPadding - Parent padding from style
   * @param {number} parentChildPadding - Padding between parent and child nodes
   * @return {Object} Rectangle for the child drop zone
   */
  getChildDropZone(node, parentPadding, parentChildPadding) {
    const additionalSpan = node.hasChildren() ? 0 : 300;
    const effectiveDirection = node.styleManager?.getEffectiveValue(node, 'direction') || this.direction;
    
    // For horizontal layouts, child drop zones extend vertically
    // and are positioned to the left or right of the node
    let dropZoneX, dropZoneWidth;
    
    if (effectiveDirection === 'left') {
      // For left layouts, drop zone goes to the left of the node
      dropZoneWidth = parentPadding + additionalSpan;
      dropZoneX = node.x - dropZoneWidth;
    } else {
      // For right layouts (default), drop zone goes to the right of the node
      dropZoneX = node.x + node.width;
      dropZoneWidth = parentPadding + additionalSpan;
    }
    
    return {
      x: dropZoneX,
      y: node.boundingBox.y - parentChildPadding / 2,
      width: dropZoneWidth,
      height: node.boundingBox.height + parentChildPadding
    };
  }
}

// For backward compatibility
if (typeof window !== 'undefined') {
  window.HorizontalLayout = HorizontalLayout;
  window.RightColumn = RightColumn;
  window.LeftColumn = LeftColumn;
}

export default HorizontalLayout;
export { RightColumn, LeftColumn };