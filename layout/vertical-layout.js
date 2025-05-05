// src/layout/vertical-layout.js

import Layout from './layout.js';
import ConnectionPoint from './connection-point.js';
import LayoutFactory from './layout-factory.js';

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
   * Apply vertical layout to a node and its children
   * @param {Node} node - The node to layout
   * @param {number} x - The x coordinate
   * @param {number} y - The y coordinate
   * @param {Object} style - The style to apply (StyleManager)
   * @return {Object} The size of the laid out subtree
   */
  applyLayout(node, x, y, style) {
    console.groupCollapsed(`VerticalLayout.applyLayout(${node.text})`);
    console.log('node', node);
//    console.log('x', x, 'y', y);
    if (node.level == 1) {
        console.log('style', style);
    }
    
    // Log additional details for level 4+ nodes
    if (node.level >= 4) {
        console.log(`LEVEL ${node.level} NODE: "${node.text}"`);
        console.log(`  Original position: x=${x}, y=${y}`);
        if (node.overrides) {
            console.log(`  Overrides:`, node.overrides);
        }
        console.log(`  Parent: "${node.parent ? node.parent.text : 'none'}"`);
    }
    
    const levelStyle = style.getLevelStyle(node.level);
    const nodeSize = this.getNodeSize(node.text, levelStyle);

    // The entire branch left top corner is (x, y)
    // Initially place the parent at this position
    node.x = x;
    node.y = y;
    node.width = nodeSize.width;
    node.height = nodeSize.height;

    // Get direction from StyleManager with fallback to default
    const effectiveDirection = style.getEffectiveValue(node, 'direction') || this.direction;
    console.log('effectiveDirection', effectiveDirection);
    
    // For level 4+ nodes, log layout information
    if (node.level >= 4) {
        console.log(`  Layout info for "${node.text}":`);
        console.log(`    node.x=${node.x}, node.y=${node.y}, width=${node.width}, height=${node.height}`);
        console.log(`    Layout type: ${levelStyle.layoutType || 'not set'}`);
        console.log(`    Effective direction: ${effectiveDirection}`);
    }

    // Direction multiplier for positioning (1 for down, -1 for up)
    const directionMultiplier = effectiveDirection === 'down' ? 1 : -1;

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

    // Calculate child Y position based on direction
    const childY = y + (directionMultiplier * (nodeSize.height + this.parentPadding));

    let totalWidth = 0;
    let maxChildHeight = 0;

    // Position children
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];

      // Get layout type from StyleManager
      const childLayoutType = style.getEffectiveValue(child, 'layoutType');
      console.log('childLayoutType', childLayoutType);
      const childLevelStyle = style.getLevelStyle(child.level);

      // Create layout for child
      const childLayout = LayoutFactory.createLayout(
        childLayoutType,
        childLevelStyle.parentPadding,
        childLevelStyle.childPadding
      );

      // Apply layout to child
      const childSize = childLayout.applyLayout(child, x + totalWidth, childY, style);

      totalWidth += childSize.width + this.childPadding;
      maxChildHeight = Math.max(maxChildHeight, childSize.height);
    }

    // Remove extra padding from last child
    totalWidth -= this.childPadding;

    // Depending on total size of children and the size of parent, adjust them
    // Both the parent, and all bounding boxes of children should have aligned centers
    let parentShift = 0;
    let childShift = 0;

    if (totalWidth < nodeSize.width) {
      childShift = (nodeSize.width - totalWidth) / 2;
    } else {
      parentShift = (totalWidth - nodeSize.width) / 2;
    }

    // Center parent horizontally
    node.x = x + parentShift;

    // Adjust children positions
    if (childShift !== 0) {
      for (let i = 0; i < node.children.length; i++) {
        this.adjustPositionRecursive(node.children[i], childShift, 0);
      }
    }

    // We don't need additional adjustment for up-directed layouts anymore
    // The directionMultiplier in childY calculation already handles this correctly
    
    // Calculate bounding box dimensions
    const bbHeight = nodeSize.height + this.parentPadding + maxChildHeight;
    const bbY = effectiveDirection === 'down' ? y : y - nodeSize.height;

    node.boundingBox = {
      x: x,
      y: bbY,
      width: Math.max(nodeSize.width, totalWidth),
      height: bbHeight
    };
    console.groupEnd();
    return node.boundingBox;
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
}

// For backward compatibility
if (typeof window !== 'undefined') {
  window.VerticalLayout = VerticalLayout;
}

export default VerticalLayout;