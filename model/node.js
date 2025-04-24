// model/node.js

/**
 * Node class for the mindmap
 */
class Node {
  /**
   * Create a new Node
   * @param {string} text - The text content of the node
   * @param {number} level - The hierarchy level of the node
   * @param {boolean} collapsed - Whether the node is collapsed by default
   */
  constructor(text = '', level = 0, collapsed = false) {
    this.text = text;
    this.level = level;
    this.children = [];
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
    this.style = {};
    this.collapsed = collapsed;
    this.id = 'node_' + Node.generateUniqueId();
  }

  /**
   * Generate a unique ID for the node
   * @private
   * @return {string} A unique ID
   */
  static generateUniqueId() {
    if (!Node.lastId) {
      Node.lastId = 0;
    }
    return ++Node.lastId;
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

  /**
   * Toggle the collapsed state of this node
   */
  toggleCollapse() {
    this.collapsed = !this.collapsed;
  }

  /**
   * Expand this node (set collapsed to false)
   */
  expand() {
    this.collapsed = false;
  }

  /**
   * Collapse this node (set collapsed to true)
   */
  collapse() {
    this.collapsed = true;
  }
}

// For backward compatibility, export to window object if in browser
if (typeof window !== 'undefined') {
  window.Node = Node;
}

// Also export as module for modern usage
//export default Node;