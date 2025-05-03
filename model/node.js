// src/model/node.js - Enhancement for configuration overrides

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
  constructor(text = '', level = 0, collapsed = false, parent = null) {
    this.text = text;
    this.level = level;
    this.children = [];
    this.parent = parent;

    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;

    this.style = {};
    this.collapsed = collapsed;
    this.id = 'node_' + Node.generateUniqueId();
    this.boundingBox = {
        x: 0, y: 0, width: 0, height: 0
    };

    // Configuration overrides dictionary
    this.configOverrides = {};
  }

  /**
   * Set a configuration override
   * @param {string} property - The property name to override
   * @param {any} value - The value to set
   */
  setOverride(property, value) {
    this.configOverrides[property] = value;
  }

  /**
   * Clear a configuration override
   * @param {string} property - The property name to clear
   */
  clearOverride(property) {
    delete this.configOverrides[property];
  }

  /**
   * Clear all configuration overrides
   */
  clearAllOverrides() {
    this.configOverrides = {};
  }

  clearOverridesRecursive() {
    this.clearAllOverrides();
    for (var i = 0; i < this.children.length; i++) {
      const child = this.children[i];
      child.clearOverridesRecursive();
    }
  }

  // Existing methods remain unchanged
  static generateUniqueId() {
    if (!Node.lastId) {
      Node.lastId = 0;
    }
    return ++Node.lastId;
  }

  addChild(childNode) {
    this.children.push(childNode);
    childNode.setParent(this);
  }

  hasChildren() {
    return this.children.length > 0;
  }

  toggleCollapse() {
    this.collapsed = !this.collapsed;
  }

  expand() {
    this.collapsed = false;
  }

  collapse() {
    this.collapsed = true;
  }

  setParent(node) {
    this.parent = node;
  }
}

// For backward compatibility, export to window object if in browser
if (typeof window !== 'undefined') {
  window.Node = Node;
}

// Also export as module for modern usage
export default Node;