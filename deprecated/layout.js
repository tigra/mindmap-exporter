//import Node from './model/node.js';


/**
 * Represents a connection point on a node with position and direction
 */
class ConnectionPoint {
  /**
   * Create a connection point
   * @param {number} x - X coordinate of the connection point
   * @param {number} y - Y coordinate of the connection point
   * @param {string} direction - Direction of the connection ('top', 'right', 'bottom', 'left')
   */
  constructor(x, y, direction) {
    this.x = x;
    this.y = y;
    this.direction = direction;
  }
}


/**
 * Base Layout class that handles common functionality
 */
class Layout {
  /**
   * Calculate dimensions of a node based on text and level style
   * @param {string} text - The text content of the node
   * @param {LevelStyle} levelStyle - The style for this node's level
   * @return {Object} The calculated width and height
   */
  getNodeSize(text, levelStyle) {
    // Create temporary element to measure text
    const temp = document.createElement('div');
    temp.style.position = 'absolute';
    temp.style.visibility = 'hidden';
    temp.style.fontFamily = levelStyle.fontFamily;
    temp.style.fontSize = levelStyle.fontSize + 'px';
    temp.style.fontWeight = levelStyle.fontWeight;
    temp.style.whiteSpace = 'nowrap';
    temp.textContent = text;

    document.body.appendChild(temp);
    const width = temp.offsetWidth + (levelStyle.horizontalPadding * 2);
    const height = temp.offsetHeight + (levelStyle.verticalPadding * 2);
    document.body.removeChild(temp);

    return {
      width: Math.max(width, 0),
      height: Math.max(height, 0)
    };
  }

  /**
   * Adjust position of node and all its children recursively
   * @param {Node} node - The node to adjust
   * @param {number} deltaX - Horizontal adjustment
   * @param {number} deltaY - Vertical adjustment
   */
  adjustPositionRecursive(node, deltaX, deltaY) {
    node.x += deltaX;
    node.y += deltaY;
    for (let i = 0; i < node.children.length; i++) {
      this.adjustPositionRecursive(node.children[i], deltaX, deltaY);
    }
  }

  /**
   * Apply layout to a node and its children
   * @param {Node} node - The node to layout
   * @param {number} x - The x coordinate
   * @param {number} y - The y coordinate
   * @param {Style} style - The style to apply
   * @return {Object} The size of the laid out subtree
   */
  applyLayout(node, x, y, style) {
    throw new Error('Method applyLayout must be implemented by subclasses');
  }

  /**
   * Get the connection point for a parent node connecting to its children
   * @param {Node} node - The parent node
   * @param {LevelStyle} levelStyle - The style for this node's level
   * @return {ConnectionPoint} The connection point
   */
  getParentConnectionPoint(node, levelStyle) {
    throw new Error('Method getParentConnectionPoint must be implemented by subclasses');
  }

  /**
   * Get the connection point for a child node connecting to its parent
   * @param {Node} node - The child node
   * @param {LevelStyle} levelStyle - The style for this node's level
   * @return {ConnectionPoint} The connection point
   */
  getChildConnectionPoint(node, levelStyle) {
    throw new Error('Method getChildConnectionPoint must be implemented by subclasses');
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
   */
  constructor(parentPadding = 80, childPadding = 20) {
    super();
    this.parentPadding = parentPadding;
    this.childPadding = childPadding;
  }

  /**
   * Apply horizontal layout to a node and its children
   * @param {Node} node - The node to layout
   * @param {number} x - The x coordinate
   * @param {number} y - The y coordinate
   * @param {Style} style - The style to apply
   * @return {Object} The size of the laid out subtree
   */
  applyLayout(node, x, y, style) {
    const levelStyle = style.getLevelStyle(node.level);
    const nodeSize = this.getNodeSize(node.text, levelStyle);

    node.x = x;
    node.y = y - (nodeSize.height / 2);
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
      return {
        width: nodeSize.width,
        height: nodeSize.height
      };
    }

    const childX = x + nodeSize.width + this.parentPadding;
    let totalHeight = 0;
    let maxChildWidth = 0;

    // Position children
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];

      // Get the appropriate layout for the child's level
      const childLevelStyle = style.getLevelStyle(child.level);
      const childLayout = childLevelStyle.getLayout();

      const childSize = childLayout.applyLayout(child, childX, y + totalHeight, style);

      totalHeight += childSize.height + this.childPadding;
      maxChildWidth = Math.max(maxChildWidth, childSize.width);
    }

    // Center parent vertically
    node.y = y - (nodeSize.height / 2) + ((totalHeight - this.childPadding - nodeSize.height) / 2);

    return {
      width: nodeSize.width + this.parentPadding + maxChildWidth,
      height: Math.max(nodeSize.height, totalHeight - this.childPadding)
    };
  }

    getParentConnectionPoint(node, levelStyle) {
      // For text-only nodes, use the exact text dimensions
      if (levelStyle.nodeType === 'text-only') {
        // Use the same measurement technique as in getNodeSize
        const textSize = this.getNodeSize(node.text, levelStyle);
        return new ConnectionPoint(node.x + textSize.width, node.y + textSize.height / 2, 'right');
      }

      // For box nodes, use the box dimensions
      return new ConnectionPoint(node.x + node.width, node.y + node.height / 2, 'right');
    }

  /**
   * Get the connection point for a child node in horizontal layout
   * @param {Node} node - The child node
   * @param {LevelStyle} levelStyle - The style for this node's level
   * @return {ConnectionPoint} The connection point
   */
  getChildConnectionPoint(node, levelStyle) {
    // In horizontal layout, child connects on its left side
    const x = node.x;
    const y = node.y + node.height / 2;

    return new ConnectionPoint(x, y, 'left');
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
   */
  constructor(parentPadding = 30, childPadding = 30) {
    super();
    this.parentPadding = parentPadding;
    this.childPadding = childPadding;
  }

  /**
   * Apply vertical layout to a node and its children
   * @param {Node} node - The node to layout
   * @param {number} x - The x coordinate
   * @param {number} y - The y coordinate
   * @param {Style} style - The style to apply
   * @return {Object} The size of the laid out subtree
   */
  applyLayout(node, x, y, style) {
    const levelStyle = style.getLevelStyle(node.level);
    const nodeSize = this.getNodeSize(node.text, levelStyle);

    // the entire branch left top corner is (x, y)
    // initially place the parent at this position
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

    if (node.children.length === 0 || node.collapsed) {
      return {
        width: nodeSize.width,
        height: nodeSize.height
      };
    }

    const childY = y + nodeSize.height + this.parentPadding;
    let totalWidth = 0;
    let maxChildHeight = 0;

    // Position children
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];

      // Get the appropriate layout for the child's level
      const childLevelStyle = style.getLevelStyle(child.level);
      console.log(i);
      const childLayout = childLevelStyle.getLayout();

      const childSize = childLayout.applyLayout(child, x + totalWidth, childY, style);

      totalWidth += childSize.width + this.childPadding;
      maxChildHeight = Math.max(maxChildHeight, childSize.height);
    }
    totalWidth -= this.childPadding;

    // Depending on total size of children and the size of parent, adjust them relatively to x
    let parentShift = 0;
    let childShift = 0;

    if (totalWidth < nodeSize.width) {
      childShift = (nodeSize.width - totalWidth) / 2;
    } else {
      parentShift = (totalWidth - nodeSize.width) / 2;
    }

    node.x = x + parentShift;

    for (let i = 0; i < node.children.length; i++) {
      this.adjustPositionRecursive(node.children[i], childShift, 0);
    }

    return {
      width: Math.max(nodeSize.width, totalWidth),
      height: nodeSize.height + this.parentPadding + maxChildHeight
    };
  }

  /**
   * Get the connection point for a parent node in vertical layout
   * @param {Node} node - The parent node
   * @param {LevelStyle} levelStyle - The style for this node's level
   * @return {ConnectionPoint} The connection point
   */
  getParentConnectionPoint(node, levelStyle) {
    // In vertical layout, parent connects from its bottom
    const x = node.x + node.width / 2;
    const y = node.y + node.height;

    return new ConnectionPoint(x, y, 'bottom');
  }

  /**
   * Get the connection point for a child node in vertical layout
   * @param {Node} node - The child node
   * @param {LevelStyle} levelStyle - The style for this node's level
   * @return {ConnectionPoint} The connection point
   */
  getChildConnectionPoint(node, levelStyle) {
    // In vertical layout, child connects on its top
    const x = node.x + node.width / 2;
    const y = node.y;

    return new ConnectionPoint(x, y, 'top');
  }
}

//export default Style;
