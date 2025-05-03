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
    
    // If no child provided or using single connection point mode, return center point
    if (!childNode || connectionPointsType === 'single') {
      return new ConnectionPoint(node.x + node.width / 2, y, side);
    }
    
    const parentWidth = node.width;
    
    // Handle distributedRelativeToParentSize connection points based on child position
    if (connectionPointsType === 'distributedRelativeToParentSize') {
      const childCenterX = childNode.x + (childNode.width / 2);
      
      // Calculate relative position with 10% margin from edges
      let relativePosition = (childCenterX - node.x) / parentWidth;
      relativePosition = Math.max(0.1, Math.min(0.9, relativePosition));
      
      return new ConnectionPoint(node.x + (parentWidth * relativePosition), y, side);
    }
    
    // Handle distributeEvenly connection points
    if (connectionPointsType === 'distributeEvenly') {
      // Find all children and this child's index among them
      const children = node.children;
      
      // Early return if no children (shouldn't happen, but just in case)
      if (!children || children.length === 0) {
        return new ConnectionPoint(node.x + node.width / 2, y, side);
      }
      
      // Find the index of this child among siblings
      const childIndex = children.findIndex(child => child === childNode);
      
      // If child not found (shouldn't happen), return center
      if (childIndex === -1) {
        return new ConnectionPoint(node.x + node.width / 2, y, side);
      }
      
      // Calculate evenly spaced positions within the 10%-90% range
      const usableWidth = parentWidth * 0.8;  // 80% of the width (10% margin on each side)
      const startX = node.x + (parentWidth * 0.1);  // 10% from left edge
      
      // Calculate connection point position
      // For one child, use center; otherwise space evenly
      let position;
      if (children.length === 1) {
        position = startX + (usableWidth / 2);
      } else {
        // Create n evenly spaced points
        const gap = usableWidth / (children.length - 1);
        position = startX + (gap * childIndex);
      }
      
      return new ConnectionPoint(position, y, side);
    }
    
    // Fallback to single connection point if type is not recognized
    return new ConnectionPoint(node.x + node.width / 2, y, side);
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

    if (effectiveDirection === 'down') {
      return new ConnectionPoint(x, node.y, 'top');
    } else {
      return new ConnectionPoint(x, node.y + node.height, 'bottom');
    }
  }
}

// For backward compatibility
if (typeof window !== 'undefined') {
  window.VerticalLayout = VerticalLayout;
}

export default VerticalLayout;