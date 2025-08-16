// src/layout/vertical-layout.js

import Layout from './layout.js';
import ConnectionPoint from './connection-point.js';
import LayoutFactory from './layout-factory.js';

/**
 * Down row positioning for vertical layout
 */
class DownRow {
  constructor(parentPadding, childPadding, nodeSize, style) {
    this.parentPadding = parentPadding;
    this.childPadding = childPadding;
    this.nodeSize = nodeSize;
    this.style = style;
    
    // State tracking
    this.currentX = 0;
    this.maxChildHeight = 0;
    this.childrenPositioned = [];
    
    // Calculate child Y position for down direction
    this.childY = nodeSize.height + this.parentPadding;
  }

  /**
   * Add a single node to the row
   * @param {Node} node - The node to add
   * @return {Object} The size of the positioned node
   */
  addNode(node) {
    console.log(`DownRow.addNode(${node.text}) - currentX: ${this.currentX}`);
    
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
    
    // Now position the child at the correct X position in the row
    node.adjustNodeTreeToPosition(this.currentX, this.childY);
    
    console.log(`  Child "${node.text}" positioned at x:${this.currentX}, y:${this.childY}, size: ${childSize.width}x${childSize.height}`);
    console.log(`  Node final position: x:${node.x}, y:${node.y}`);

    // Update state
    this.currentX += childSize.width + this.childPadding;
    this.maxChildHeight = Math.max(this.maxChildHeight, childSize.height);
    this.childrenPositioned.push(node);
    
    console.log(`  Updated currentX: ${this.currentX}`);

    return childSize;
  }

  /**
   * Position nodes in a down row
   * @param {Array} nodes - The nodes to position
   * @param {Object} nodeSize - The parent node size
   * @param {Object} style - The style to apply
   * @return {Object} Total width and max child height
   */
  positionNodes(nodes, nodeSize, style) {
    // Position children using addNode
    for (let i = 0; i < nodes.length; i++) {
      this.addNode(nodes[i]);
    }

    // Calculate final width (remove extra padding from last child)
    let totalWidth = this.currentX;
    if (nodes.length > 0) {
      totalWidth -= this.childPadding;
    }

    // Log positioned children bounding boxes
    console.log(`DownRow positioned ${this.childrenPositioned.length} children:`);
    for (let i = 0; i < this.childrenPositioned.length; i++) {
      const child = this.childrenPositioned[i];
      if (child.boundingBox) {
        console.log(`  Child ${i} (${child.text}): boundingBox = {x: ${child.boundingBox.x}, y: ${child.boundingBox.y}, width: ${child.boundingBox.width}, height: ${child.boundingBox.height}}`);
      }
    }

    return { totalWidth, maxChildHeight: this.maxChildHeight };
  }
}

/**
 * Up row positioning for vertical layout
 */
class UpRow {
  constructor(parentPadding, childPadding, adjustPositionRecursive, nodeSize, style) {
    this.parentPadding = parentPadding;
    this.childPadding = childPadding;
    this.adjustPositionRecursive = adjustPositionRecursive;
    this.nodeSize = nodeSize;
    this.style = style;
    
    // State tracking
    this.currentX = 0;
    this.maxChildHeight = 0;
    this.childrenPositioned = [];
    
    // Calculate child Y position for up direction (above parent)
    this.childY = -this.parentPadding;
  }

  /**
   * Add a single node to the row
   * @param {Node} node - The node to add
   * @return {Object} The size of the positioned node
   */
  addNode(node) {
    console.log(`UpRow.addNode(${node.text}) - currentX: ${this.currentX}`);
    
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

    // Position the child at the correct X position, but need to adjust Y for upward direction
    // For upward direction, we want the child's bottom edge to align with this.childY
    const targetY = this.childY - childSize.height;
    node.adjustNodeTreeToPosition(this.currentX, targetY);
    
    console.log(`  Child "${node.text}" positioned at x:${this.currentX}, y:${targetY}, size: ${childSize.width}x${childSize.height}`);
    console.log(`  Node final position: x:${node.x}, y:${node.y}`);

    // Update state
    this.currentX += childSize.width + this.childPadding;
    this.maxChildHeight = Math.max(this.maxChildHeight, childSize.height);
    this.childrenPositioned.push(node);
    
    console.log(`  Updated currentX: ${this.currentX}`);

    return childSize;
  }

  /**
   * Position nodes in an up row
   * @param {Array} nodes - The nodes to position
   * @param {Object} nodeSize - The parent node size
   * @param {Object} style - The style to apply
   * @return {Object} Total width and max child height
   */
  positionNodes(nodes, nodeSize, style) {
    // Position children using addNode
    for (let i = 0; i < nodes.length; i++) {
      this.addNode(nodes[i]);
    }

    // Calculate final width (remove extra padding from last child)
    let totalWidth = this.currentX;
    if (nodes.length > 0) {
      totalWidth -= this.childPadding;
    }

    // Log positioned children bounding boxes
    console.log(`UpRow positioned ${this.childrenPositioned.length} children:`);
    for (let i = 0; i < this.childrenPositioned.length; i++) {
      const child = this.childrenPositioned[i];
      if (child.boundingBox) {
        console.log(`  Child ${i} (${child.text}): boundingBox = {x: ${child.boundingBox.x}, y: ${child.boundingBox.y}, width: ${child.boundingBox.width}, height: ${child.boundingBox.height}}`);
      }
    }

    return { totalWidth, maxChildHeight: this.maxChildHeight };
  }
}

/**
 * Vertical layout implementation
 */
class VerticalLayout extends Layout {
  /**
   * Create a new VerticalLayout
   * @param {number} parentPadding - Padding between parent and children
   * @param {number} childPadding - Padding between siblings
   * @param {string} direction - Direction of layout ('down' or 'up')
   */
  constructor(parentPadding = 30, childPadding = 30, direction = 'down') {
    super();
    this.parentPadding = parentPadding;
    this.childPadding = childPadding;
    this.direction = direction || 'down';
  }

  /**
   * Navigate from current node based on keyboard input
   * @param {Object} currentNode - The currently selected node
   * @param {string} key - The arrow key pressed
   * @param {Object} styleManager - The style manager for getting node styles
   * @returns {Object|null} The target node to navigate to
   */
  navigateByKey(currentNode, key, styleManager) {
    console.log(`VerticalLayout.navigateByKey: Processing key "${key}" for node "${currentNode.text}"`);
    
    const direction = styleManager.getEffectiveValue(currentNode, 'direction') || this.direction;
    const isDownLayout = direction === 'down' || direction === null;
    const parentKey = isDownLayout ? 'ArrowUp' : 'ArrowDown';
    const childKey = isDownLayout ? 'ArrowDown' : 'ArrowUp';
    
    console.log(`VerticalLayout.navigateByKey: direction="${direction}", isDownLayout=${isDownLayout}, parentKey="${parentKey}", childKey="${childKey}"`);
    
    // Navigate to parent
    if (key === parentKey && currentNode.parent) {
      console.log(`VerticalLayout.navigateByKey: Key matches parent direction, navigating to parent "${currentNode.parent.text}"`);
      return currentNode.parent;
    }
    
    // Navigate to first visible child (maintaining horizontal position)
    if (key === childKey && !currentNode.collapsed && currentNode.children.length > 0) {
      console.log(`VerticalLayout.navigateByKey: Key matches child direction, finding best positioned child`);
      const targetX = currentNode.x + currentNode.width / 2;
      console.log(`VerticalLayout.navigateByKey: Target X position: ${targetX}`);
      return this.findBestVerticalChild(currentNode, targetX);
    }
    
    // Navigate to siblings
    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      const siblingDirection = key === 'ArrowLeft' ? 'prev' : 'next';
      console.log(`VerticalLayout.navigateByKey: Horizontal key, looking for ${siblingDirection} sibling`);
      return this.findSibling(currentNode, siblingDirection);
    }
    
    console.log(`VerticalLayout.navigateByKey: No navigation rule matched, returning null`);
    return null;
  }

  /**
   * Find the best child node based on horizontal position
   * @param {Object} parentNode - The parent node
   * @param {number} targetX - The target X coordinate
   * @returns {Object|null} The best child node or null
   */
  findBestVerticalChild(parentNode, targetX) {
    console.log(`VerticalLayout.findBestVerticalChild: Finding best child for targetX=${targetX}`);
    
    if (!parentNode.children || parentNode.children.length === 0) {
      console.log(`VerticalLayout.findBestVerticalChild: No children available`);
      return null;
    }
    
    console.log(`VerticalLayout.findBestVerticalChild: Evaluating ${parentNode.children.length} children`);
    
    // Find child closest to the target X position
    let bestChild = parentNode.children[0];
    let bestDistance = Math.abs((bestChild.x + bestChild.width / 2) - targetX);
    console.log(`VerticalLayout.findBestVerticalChild: Initial best: "${bestChild.text}" (centerX=${bestChild.x + bestChild.width / 2}, distance=${bestDistance})`);
    
    for (let i = 1; i < parentNode.children.length; i++) {
      const child = parentNode.children[i];
      const childCenterX = child.x + child.width / 2;
      const distance = Math.abs(childCenterX - targetX);
      console.log(`VerticalLayout.findBestVerticalChild: Checking "${child.text}" (centerX=${childCenterX}, distance=${distance})`);
      
      if (distance < bestDistance) {
        console.log(`VerticalLayout.findBestVerticalChild: New best child: "${child.text}"`);
        bestDistance = distance;
        bestChild = child;
      }
    }
    
    console.log(`VerticalLayout.findBestVerticalChild: Final selection: "${bestChild.text}" with distance ${bestDistance}`);
    return bestChild;
  }

  /**
   * Apply vertical layout to a node and its children
   * @param {Node} node - The node to layout
   * @param {number} x - The x coordinate
   * @param {number} y - The y coordinate
   * @param {Object} style - The style to apply (StyleManager)
   * @return {Object} The size of the laid out subtree
   */
  applyLayout(node, x, y, style) {
    const boundingBox = this.applyLayoutRelative(node, x, y, style);
    node.adjustNodeTreeToPosition(x, y);
    return boundingBox;
  }

  /**
   * Apply vertical layout to a node and its children (recursive implementation)
   * @param {Node} node - The node to layout
   * @param {number} x - The x coordinate
   * @param {number} y - The y coordinate
   * @param {Object} style - The style to apply (StyleManager)
   * @return {Object} The size of the laid out subtree
   */
  applyLayoutRelative(node, x, y, style) {
    console.groupCollapsed(`VerticalLayout.applyLayoutRelative(${node.text})`);
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
      node.boundingBox = {
        x: 0,
        y: 0,
        width: nodeSize.width,
        height: nodeSize.height
      };
      console.groupEnd();
      return node.boundingBox;
    }

    // Position children using the appropriate row class
    let totalWidth, maxChildHeight;
    
    if (effectiveDirection === 'down') {
      const downRow = new DownRow(this.parentPadding, this.childPadding, nodeSize, style);
      
      // Position children using the row's addNode method
      node.children.forEach(child => {
        downRow.addNode(child);
      });
      
      // Calculate final width (remove extra padding from last child)
      totalWidth = node.children.length > 0 ? downRow.currentX - this.childPadding : 0;
      maxChildHeight = downRow.maxChildHeight;
    } else {
      const upRow = new UpRow(this.parentPadding, this.childPadding, this.adjustPositionRecursive.bind(this), nodeSize, style);
      
      // Position children using the row's addNode method
      node.children.forEach(child => {
        upRow.addNode(child);
      });
      
      // Calculate final width (remove extra padding from last child)
      totalWidth = node.children.length > 0 ? upRow.currentX - this.childPadding : 0;
      maxChildHeight = upRow.maxChildHeight;
    }

    // Center parent and children horizontally
    this.centerParentAndChildren(node, totalWidth, nodeSize);

    // Calculate bounding box at relative positions
    node.calculateBoundingBox();
    
    console.groupEnd();
    return node.boundingBox;
  }

  /**
   * Center parent and children horizontally
   * @param {Node} node - The parent node
   * @param {number} totalWidth - Total width of children
   * @param {Object} nodeSize - Parent node size
   */
  centerParentAndChildren(node, totalWidth, nodeSize) {
    console.log(`centerParentAndChildren() for node (${node.text}):`);
    console.log(`  totalWidth: ${totalWidth}, nodeSize.width: ${nodeSize.width}`);
    
    // Depending on total size of children and the size of parent, adjust them
    // Both the parent, and all bounding boxes of children should have aligned centers
    let parentShift = 0;
    let childShift = 0;

    if (totalWidth < nodeSize.width) {
      childShift = (nodeSize.width - totalWidth) / 2;
      console.log(`  Children are narrower than parent. Child shift: ${childShift}`);
    } else {
      parentShift = (totalWidth - nodeSize.width) / 2;
      console.log(`  Parent is narrower than children. Parent shift: ${parentShift}`);
    }

    // Adjust parent position
    node.x = parentShift;

    // Adjust children positions
    if (childShift !== 0) {
      for (let i = 0; i < node.children.length; i++) {
        this.adjustPositionRecursive(node.children[i], childShift, 0);
      }
    }

    console.log(`  Final parent position: x=${node.x}, y=${node.y}`);
  }

  /**
   * Get the connection point for a parent node in vertical layout
   * @param {Node} node - The parent node
   * @param {Object} levelStyle - The style for this node's level
   * @param {Node} childNode - The specific child node being connected to (optional)
   * @return {ConnectionPoint} The connection point
   */
  getParentConnectionPoint(node, levelStyle, childNode = null) {
    // Get direction from StyleManager with fallback to default
    const effectiveDirection = levelStyle.styleManager.getEffectiveValue(node, 'direction') || this.direction;
    
    // Determine Y position based on direction
    const y = effectiveDirection === 'down' ? node.y + node.height : node.y;
    const side = effectiveDirection === 'down' ? 'bottom' : 'top';
    
    // Get connection points type from style with fallback to 'single'
    const connectionPointsType = levelStyle.styleManager.getEffectiveValue(node, 'parentConnectionPoints') || 'single';
    
    // Get the configurable width portion or use default (0.8)
    const widthPortion = levelStyle.styleManager ? 
      levelStyle.styleManager.getEffectiveValue(node, 'parentWidthPortionForConnectionPoints') || 0.8 : 
      0.8;
    
    // Calculate X position based on distribution type
    const x = this.calculateConnectionPointX(node, childNode, connectionPointsType, widthPortion);
    
    // Return connection point
    return new ConnectionPoint(x, y, side);
  }

  /**
   * Get the connection point for a child node in vertical layout
   * @param {Node} node - The child node
   * @param {Object} levelStyle - The style for this node's level
   * @return {ConnectionPoint} The connection point
   */
  getChildConnectionPoint(node, levelStyle) {
    // Get direction from StyleManager with fallback to default
    const effectiveDirection = levelStyle.styleManager.getEffectiveValue(node, 'direction') || this.direction;

    // In vertical layout, child connects on its top or bottom depending on direction
    const x = node.x + node.width / 2;
    
    // Add detailed logging for connection point calculation
    console.log(`VerticalLayout.getChildConnectionPoint for node "${node.text}" (level ${node.level}):`);
    console.log(`  node.x: ${node.x}, node.width: ${node.width}, calculated x (center): ${x}`);
    console.log(`  node.y: ${node.y}, node.height: ${node.height}`);
    console.log(`  effectiveDirection: ${effectiveDirection}`);
    
    // Calculate node center for comparison
    const nodeCenter = {
      x: node.x + node.width / 2,
      y: node.y + node.height / 2
    };
    
    let connectionPoint;
    if (effectiveDirection === 'down') {
      connectionPoint = new ConnectionPoint(x, node.y, 'top');
    } else {
      connectionPoint = new ConnectionPoint(x, node.y + node.height, 'bottom');
    }
    
    // Calculate signum (sign) of differences between connection point and node center
    const signX = Math.sign(connectionPoint.x - nodeCenter.x);
    const signY = Math.sign(connectionPoint.y - nodeCenter.y);
    
    console.log(`  Node center coordinates: {x: ${nodeCenter.x}, y: ${nodeCenter.y}}`);
    console.log(`  Created ConnectionPoint: {x: ${connectionPoint.x}, y: ${connectionPoint.y}, direction: ${connectionPoint.direction}}`);
    console.log(`  CONNECTION_SIGNUM: Level ${node.level}, signX=${signX}, signY=${signY}, layoutType=${levelStyle.layoutType || 'not set'}`);
    
    // Log if this is likely a case where layout is wrong (level 4+ with no vertical position)
    if (node.level >= 4 && signX !== 0 && signY === 0) {
      console.warn(`  WARNING: Level ${node.level} node might have incorrect layout type. Connection point is horizontally offset from center.`);
    }
    
    return connectionPoint;
  }

  /**
   * Override top parent drop zone for vertical layouts (left drop zone)
   * @param {Object} node - The node to get drop zone dimensions for
   * @param {Object} parentNode - The parent node
   * @param {number} parentPadding - The padding between parent and children
   * @param {Object} levelStyle - The level style for accessing style manager (optional)
   * @return {Object} Object with {x, y, width, height} for the complete drop zone rectangle
   */
  getParentDropZoneTop(node, parentNode, parentPadding, levelStyle = null) {
    if (!parentNode) {
      // No parent, use default behavior
      return super.getParentDropZoneTop(node, parentNode, parentPadding, levelStyle);
    }
    
    // For vertical layouts, "top" means left drop zone
    // Get the vertical connection area between parent and child
    const verticalDimensions = this._getVerticalConnectionArea(node, parentNode, parentPadding);
    
    // Left drop zone extends from left of bounding box to middle of node
    return {
      x: node.boundingBox.x - parentPadding/2,
      y: verticalDimensions.dropZoneY,
      width: (node.x + node.width / 2) - node.boundingBox.x + parentPadding / 2,
      height: verticalDimensions.dropZoneHeight
    };
  }

  /**
   * Override bottom parent drop zone for vertical layouts (right drop zone)
   * @param {Object} node - The node to get drop zone dimensions for
   * @param {Object} parentNode - The parent node
   * @param {number} parentPadding - The padding between parent and children
   * @param {Object} levelStyle - The level style for accessing style manager (optional)
   * @return {Object} Object with {x, y, width, height} for the complete drop zone rectangle
   */
  getParentDropZoneBottom(node, parentNode, parentPadding, levelStyle = null) {
    if (!parentNode) {
      // No parent, use default behavior
      return super.getParentDropZoneBottom(node, parentNode, parentPadding, levelStyle);
    }
    
    // For vertical layouts, "bottom" means right drop zone
    // Get the vertical connection area between parent and child
    const verticalDimensions = this._getVerticalConnectionArea(node, parentNode, parentPadding);
    
    // Right drop zone extends from middle of node to right of bounding box
    return {
      x: node.x + node.width / 2,
      y: verticalDimensions.dropZoneY,
      width: (node.boundingBox.x + node.boundingBox.width) - (node.x + node.width / 2) + parentPadding / 2,
      height: verticalDimensions.dropZoneHeight
    };
  }

  /**
   * Helper method to get vertical connection area between parent and child
   * @param {Object} node - The child node
   * @param {Object} parentNode - The parent node
   * @param {number} parentPadding - The padding between parent and children
   * @return {Object} Object with dropZoneY and dropZoneHeight
   * @private
   */
  _getVerticalConnectionArea(node, parentNode, parentPadding) {
    // Simply use spatial relationship to determine connection area
    // If parent is above child, extend upward; if parent is below child, extend downward
    const isParentAbove = parentNode.y + parentNode.height <= node.y;
    const isParentBelow = parentNode.y >= node.y + node.height;
    
    let dropZoneY, dropZoneHeight;
    
    if (isParentAbove) {
      // Parent is above child - extend from parent bottom to child bottom
      dropZoneY = parentNode.y + parentNode.height;
      dropZoneHeight = (node.y + node.height) - dropZoneY;
    } else if (isParentBelow) {
      // Parent is below child - extend from child top to parent top  
      dropZoneY = node.y;
      dropZoneHeight = parentNode.y - node.y;
    } else {
      // Parent and child overlap - use minimal extension around node
      dropZoneY = node.y - parentPadding / 2;
      dropZoneHeight = node.height + parentPadding;
    }
    
    // Ensure non-negative dimensions
    dropZoneHeight = Math.max(dropZoneHeight, node.height);
    
    return { dropZoneY, dropZoneHeight };
  }
}

// For backward compatibility
if (typeof window !== 'undefined') {
  window.VerticalLayout = VerticalLayout;
}

// Export row classes for reuse by other layouts
export { DownRow, UpRow };

export default VerticalLayout;