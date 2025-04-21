/**
 * Base Layout class that handles common functionality
 */
class Layout {
  /**
   * Calculate dimensions of a node based on text
   * @param {string} text - The text content of the node
   * @param {boolean} isRoot - Whether this node is a root node
   * @param {number} depth - The depth of the node in the tree
   * @return {Object} The calculated width and height
   */
  getNodeSize(text, isRoot, depth) {
    const fontSize = isRoot ? 18 : 14;
    const fontWeight = isRoot ? 'bold' : 'normal';
    const verticalPadding = isRoot ? 20 : 10;
    let horizontalPadding = isRoot ? 20 : 10;

    if (depth >= 4) {
      horizontalPadding = 0;
      // TODO padding is not taken into account properly when rendering, have to unite layout and rendering
    }

    // Create temporary element to measure text
    const temp = document.createElement('div');
    temp.style.position = 'absolute';
    temp.style.visibility = 'hidden';
    temp.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    temp.style.fontSize = fontSize + 'px';
    temp.style.fontWeight = fontWeight;
    temp.style.whiteSpace = 'nowrap';
    temp.textContent = text;

    document.body.appendChild(temp);
    const width = temp.offsetWidth + (horizontalPadding * 2);
    const height = temp.offsetHeight + (verticalPadding * 2);
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
   * @return {Object} The size of the laid out subtree
   */
  applyLayout(node, x, y) {
    throw new Error('Method applyLayout must be implemented by subclasses');
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
   * @return {Object} The size of the laid out subtree
   */
  applyLayout(node, x, y) {
    const nodeSize = this.getNodeSize(node.text, node.level === 1, node.level);
    node.x = x;
    node.y = y - (nodeSize.height / 2);
    node.width = nodeSize.width;
    node.height = nodeSize.height;

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
      const childSize = this.applyLayout(child, childX, y + totalHeight);

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
   * @return {Object} The size of the laid out subtree
   */
  applyLayout(node, x, y) {
    const nodeSize = this.getNodeSize(node.text, node.level === 1, node.level);
    // the entire branch left top corner is (x, y)
    // initially place the parent at this position
    node.x = x;
    node.y = y;
    node.width = nodeSize.width;
    node.height = nodeSize.height;

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
      const childSize = this.applyLayout(child, x + totalWidth, childY);

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
}

/**
 * Represents a node in the mindmap structure
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
