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
 * Represents styling for a specific level in the mindmap
 */
class LevelStyle {
  /**
   * Create a new LevelStyle
   * @param {Object} options - Configuration options for this level style
   */
  constructor(options = {}) {
    // Font settings
    this.fontSize = options.fontSize || 14;
    this.fontWeight = options.fontWeight || 'normal';
    this.fontFamily = options.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';

    // Padding and spacing
    this.verticalPadding = options.verticalPadding || 10;
    this.horizontalPadding = options.horizontalPadding || 10;
    this.parentPadding = options.parentPadding || 30;
    this.childPadding = options.childPadding || 20;

    // Layout type
    this.layoutType = options.layoutType || 'horizontal';

    // Colors and appearance
    this.backgroundColor = options.backgroundColor || '#ffffff';
    this.textColor = options.textColor || '#000000';
    this.borderColor = options.borderColor || '#cccccc';
    this.borderWidth = options.borderWidth || 1;
    this.borderRadius = options.borderRadius || 5;
    this.nodeType = options.nodeType || 'box';
  }

  /**
   * Get the appropriate layout for this level style
   * @return {Layout} The layout instance
   */
  getLayout() {
    console.log(this.layoutType);
    if (this.layoutType === 'vertical') {
      return new VerticalLayout(this.parentPadding, this.childPadding);
    } else {
      return new HorizontalLayout(this.parentPadding, this.childPadding);
    }
  }

  setLayoutType(layoutType) {
    this.layoutType = layoutType;
    console.log('set to ... ' + this.layoutType);
  }
}

/**
 * Manages styles for the entire mindmap
 */
class Style {
  /**
   * Create a new Style
   */
  constructor() {
    // Define default styles for different levels
    this.levelStyles = {
      // Root level
      1: new LevelStyle({
        fontSize: 18,
        fontWeight: 'bold',
        verticalPadding: 20,
        horizontalPadding: 20,
        parentPadding: 80,
        childPadding: 20,
        layoutType: 'horizontal',
        backgroundColor: '#f5f5f5',
        borderColor: '#aaaaaa',
        borderWidth: 2,
        nodeType: 'box'
      }),

      // Second level
      2: new LevelStyle({
        fontSize: 16,
        fontWeight: 'bold',
        layoutType: 'horizontal',
        parentPadding: 60,
        childPadding: 20,
        nodeType: 'box'
      }),

      // Third level
      3: new LevelStyle({
        fontSize: 14,
        parentPadding: 40,
        layoutType: 'horizontal',
        nodeType: 'box'
      }),

      // Fourth level and beyond
      4: new LevelStyle({
        fontSize: 12,
        horizontalPadding: 5,
        verticalPadding: 5,
        parentPadding: 30,
        childPadding: 15,
        layoutType: 'horizontal',
        nodeType: 'text-only'
      })
    };

    // Default style for any level not explicitly defined
    this.defaultLevelStyle = new LevelStyle();
  }

  /**
   * Get the appropriate style for a specific level
   * @param {number} level - The level to get style for
   * @return {LevelStyle} The level style
   */
  getLevelStyle(level) {
    // If we have a specific style for this level, return it
    if (this.levelStyles[level]) {
      return this.levelStyles[level];
    }

    // For levels >= 4, return the level 4 style
    if (level >= 4 && this.levelStyles[4]) {
      return this.levelStyles[4];
    }

    // Otherwise return the default style
    return this.defaultLevelStyle;
  }

  /**
   * Configure the style with custom settings
   * @param {Object} options - Style configuration options
   */
  configure(options = {}) {
    if (options.levelStyles) {
      // Merge provided level styles with existing ones
      for (const [level, styleOptions] of Object.entries(options.levelStyles)) {
        this.levelStyles[level] = new LevelStyle({
          ...(this.levelStyles[level] || this.defaultLevelStyle),
          ...styleOptions
        });
      }
    }

    if (options.defaultStyle) {
      this.defaultLevelStyle = new LevelStyle(options.defaultStyle);
    }
  }

 /**
   * Change the layout type globally for all level styles
   * @param {string} layoutType - The layout type to set ('horizontal' or 'vertical')
   * @param {Object} options - Additional options
   * @param {Array<number>} options.excludeLevels - Array of level numbers to exclude from the change
   * @param {Object} options.customPadding - Custom padding values for different layout types
   */
  setGlobalLayoutType(layoutType, options = {}) {
    if (layoutType !== 'horizontal' && layoutType !== 'vertical') {
      throw new Error('Layout type must be either "horizontal" or "vertical"');
    }

    const excludeLevels = options.excludeLevels || [];
    const customPadding = options.customPadding || {};

    // Update default level style
    if (!excludeLevels.includes(0)) {
      this.defaultLevelStyle.layoutType = layoutType;

      // Adjust padding values based on the layout type if needed
      if (customPadding.default) {
        if (customPadding.default.parentPadding) {
          this.defaultLevelStyle.parentPadding = customPadding.default.parentPadding;
        }
        if (customPadding.default.childPadding) {
          this.defaultLevelStyle.childPadding = customPadding.default.childPadding;
        }
      }
    }

    // Update all specific level styles
    for (const level in this.levelStyles) {
      if (excludeLevels.includes(parseInt(level))) {
        continue;
      }

      this.levelStyles[level].layoutType = layoutType;

      // Adjust padding values based on the layout type if needed
      if (customPadding[level]) {
        if (customPadding[level].parentPadding) {
          this.levelStyles[level].parentPadding = customPadding[level].parentPadding;
        }
        if (customPadding[level].childPadding) {
          this.levelStyles[level].childPadding = customPadding[level].childPadding;
        }
      }
    }

    return this; // Allow method chaining
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

    if (node.children.length === 0) {
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
      console.log(i);

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

  /**
   * Get the connection point for a parent node in horizontal layout
   * @param {Node} node - The parent node
   * @param {LevelStyle} levelStyle - The style for this node's level
   * @return {ConnectionPoint} The connection point
   */
//  getParentConnectionPoint(node, levelStyle) {
//    // In horizontal layout, parent connects from its right side
//    const x = node.x + node.width;
//    const y = node.y + node.height / 2;
//
//    // If this is a text-only node (typically for deeper levels)
//    if (levelStyle.nodeType === 'text-only') {
//      // Text width may be less than the allocated node width
//      const textWidth = this._estimateTextWidth(node.text, levelStyle);
//      return new ConnectionPoint(node.x + textWidth, y, 'right');
//    }
//
//    return new ConnectionPoint(x, y, 'right');
//  }

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

  /**
   * Helper method to estimate text width based on content and style
   * @private
   * @param {string} text - The text content
   * @param {LevelStyle} levelStyle - The style with font information
   * @return {number} Estimated text width
   */
  _estimateTextWidth(text, levelStyle) {
    // Rough estimate based on character count and font size
    const avgCharWidth = levelStyle.fontSize * 0.6;
    return text.length * avgCharWidth;
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

    if (node.children.length === 0) {
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

/**
 * Node class for the mindmap
 */
class Node {
  /**
   * Create a new Node
   * @param {string} text - The text content of the node
   * @param {number} level - The hierarchy level of the node
   */
  constructor(text = '', level = 0) {
    this.text = text;
    this.level = level;
    this.children = [];
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
    this.style = {};
  }

  /**
   * Add a child node to this node
   * @param {Node} childNode - The child node to add
   */
  addChild(childNode) {
    this.children.push(childNode);
  }

  /**
   * Check if this node has any children
   * @return {boolean} True if the node has children
   */
  hasChildren() {
    return this.children.length > 0;
  }
}

// Example usage:
/*
// Create a style instance with default settings
const mindmapStyle = new Style();

// Optionally customize the style
mindmapStyle.configure({
  levelStyles: {
    1: {
      backgroundColor: '#e9f7fe',
      borderColor: '#4a90e2'
    }
  }
});

// Create root node
const rootNode = new Node('Root Concept', 1);

// Add children
const child1 = new Node('Child 1', 2);
rootNode.addChild(child1);

// Apply layout with style
const layout = mindmapStyle.getLevelStyle(1).getLayout();
layout.applyLayout(rootNode, 50, 50, mindmapStyle);
*/