// src/model/node.js - Enhancement for configuration overrides

/**
 * MindmapNode class for the mindmap
 */
class MindmapNode {
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
    
    // Start with a temporary ID, will be updated properly at the right time
    this.id = 'node_temp_' + (Date.now() + Math.random()).toString(36);
    
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
    // Log overrides for level 4+ nodes to help debug the connection point issue
    if (this.level >= 4 && ['layoutType', 'direction'].includes(property)) {
      console.log(`Node "${this.text}" (level ${this.level}) setting override: ${property}=${value}`);
      
      // Show the call stack to understand where the override is coming from
      console.log('Override set from:', new Error().stack);
    }
    
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

  /**
   * Sanitize text for use in ID generation
   * Removes problematic characters and trims the text
   * @private
   * @param {string} text - The text to sanitize
   * @returns {string} Sanitized text
   */
  _sanitizeTextForId(text) {
    if (!text) return '';
    
    // Replace spaces, special characters, and trim to keep IDs clean
    return text
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_') // Replace non-alphanumeric with underscores
      .replace(/_+/g, '_')        // Replace multiple underscores with a single one
      .replace(/^_|_$/g, '')      // Remove leading/trailing underscores
      .substring(0, 20);          // Limit length to avoid very long IDs
  }

  /**
   * Generate a deterministic ID based on node content and position in tree
   * This ensures IDs remain consistent between renderings
   * @private
   * @returns {string} A deterministic hash for this node
   */
  _generateDeterministicId() {
    // Start with the sanitized text content
    let idBase = this._sanitizeTextForId(this.text);
    
    // Add level information for hierarchy
    idBase += `_lvl${this.level}`;
    
    // Add position in parent's children array if available
    if (this.parent && this.parent.children) {
      const indexInParent = this.parent.children.indexOf(this);
      if (indexInParent !== -1) {
        idBase += `_idx${indexInParent}`;
      }
    }
    
    // Add parent's sanitized text if available (for more uniqueness)
    if (this.parent && this.parent.text) {
      idBase += `_p${this._sanitizeTextForId(this.parent.text).substring(0, 10)}`;
    }
    
    // Create a simple hash from the string
    const hash = this._simpleHash(idBase);
    return 'node_' + hash;
  }
  
  /**
   * Create a simple hash from a string
   * @private
   * @param {string} str - String to hash
   * @returns {string} Hash value as a hex string
   */
  _simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash &= hash; // Convert to 32bit integer
    }
    // Ensure positive number and convert to hex string
    return Math.abs(hash).toString(16);
  }
  
  /**
   * Regenerate IDs for this node and all its children
   * Useful to ensure consistent IDs after the tree structure changes
   */
  regenerateAllIds() {
    this.id = this._generateDeterministicId();
    
    // Recursively update all children
    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];
      
      // First ensure the child's parent pointer is correct
      child.parent = this;
      
      // Then regenerate IDs for the child and its subtree
      child.regenerateAllIds();
    }
  }
  
  /**
   * For backward compatibility
   * @deprecated Use _generateDeterministicId() instead
   */
  static generateUniqueId() {
    if (!MindmapNode.lastId) {
      MindmapNode.lastId = 0;
    }
    return ++MindmapNode.lastId;
  }

  addChild(childNode) {
    this.children.push(childNode);
    childNode.setParent(this);
  }
  
  /**
   * Remove a child node from this node's children
   * @param {MindmapNode} childNode - The child node to remove
   * @returns {boolean} True if the child was found and removed, false otherwise
   */
  removeChild(childNode) {
    const index = this.children.indexOf(childNode);
    if (index !== -1) {
      this.children.splice(index, 1);
      childNode.parent = null; // Clear parent reference
      return true;
    }
    return false;
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
    // Regenerate ID now that parent relationship is established
    this.id = this._generateDeterministicId();
  }
  
  /**
   * Move the node and all its descendants so that the bounding box is positioned at the specified coordinates
   * @param {number} x - The target x coordinate for the bounding box
   * @param {number} y - The target y coordinate for the bounding box
   */
  moveBoundingBoxTo(x, y) {
    if (!this.boundingBox) {
      console.warn('Cannot move node without a bounding box');
      return;
    }
    
    // Calculate the delta for movement
    const deltaX = x - this.boundingBox.x;
    const deltaY = y - this.boundingBox.y;
    
    // Move this node and all its children
    this._moveNodeAndDescendantsBy(deltaX, deltaY);
  }
  
  /**
   * Move node and all descendants by the specified delta
   * @param {number} deltaX - The horizontal adjustment
   * @param {number} deltaY - The vertical adjustment
   * @private
   */
  _moveNodeAndDescendantsBy(deltaX, deltaY) {
    // Adjust the node's own position
    this.x += deltaX;
    this.y += deltaY;
    
    // Adjust the node's bounding box
    if (this.boundingBox) {
      this.boundingBox.x += deltaX;
      this.boundingBox.y += deltaY;
    }
    
    // Adjust debug elements if present
    if (this.debugElements) {
      this.debugElements.forEach(element => {
        if (element.type === 'line') {
          element.x1 += deltaX;
          element.y1 += deltaY;
          element.x2 += deltaX;
          element.y2 += deltaY;
        } else if (element.type === 'text') {
          element.x += deltaX;
          element.y += deltaY;
        }
        // Add cases for other element types as needed
      });
    }
    
    // Recursively adjust all children
    for (let i = 0; i < this.children.length; i++) {
      this.children[i]._moveNodeAndDescendantsBy(deltaX, deltaY);
    }
  }
}

// For backward compatibility, export to window object if in browser
if (typeof window !== 'undefined') {
  window.MindmapNode = MindmapNode;
}

// Also export as module for modern usage
export default MindmapNode;