// src/model/mindmap-model.js

import Node from './node.js';

/**
 * MindmapModel class for managing mindmap data structure
 */
class MindmapModel {
  /**
   * Create a new MindmapModel
   */
  constructor() {
    this.rootNode = new Node();
    this.nodeMap = new Map(); // Map of node ID to node instance
  }

  /**
   * Parse markdown text into a mindmap structure
   * @param {string} markdown - The markdown text to parse
   * @return {Node|null} The root node of the mindmap, or null if no valid nodes were found
   */
  parseFromMarkdown(markdown) {
    const lines = markdown.split('\n');
    const root = new Node('', 0);
    const stack = [root];
    let currentHeadingLevel = 0;
    
    // Track bullet indentation levels - map from indent size to level
    const indentToLevelMap = new Map();
    // Store the previous line's indentation for bullet points
    let prevIndent = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      const line = rawLine.trim();
      if (!line) continue;

      let level = 0;
      let text = '';

      // Check if it's a heading
      if (line.startsWith('#')) {
        // Reset bullet indentation tracking when we hit a new heading
        indentToLevelMap.clear();
        prevIndent = 0;
        
        // Count # characters to determine level
        for (let j = 0; j < line.length; j++) {
          if (line[j] === '#') level++;
          else break;
        }

        // Extract text
        text = line.substring(level).trim();
        currentHeadingLevel = level;
      }
      // Check if it's a bullet point
      else if (line.startsWith('-') || line.startsWith('*')) {
        // Calculate actual indentation
        const indentLength = rawLine.length - rawLine.trimLeft().length;
        
        // First bullet after a heading starts at heading level + 1
        if (indentToLevelMap.size === 0) {
          // First bullet point after a heading
          level = currentHeadingLevel + 1;
          indentToLevelMap.set(indentLength, level);
        } else if (indentLength > prevIndent) {
          // This bullet is more indented than the previous one - it's a child
          level = indentToLevelMap.get(prevIndent) + 1;
          indentToLevelMap.set(indentLength, level);
        } else if (indentLength === prevIndent) {
          // Same indentation as previous - same level
          level = indentToLevelMap.get(indentLength);
        } else {
          // Less indented - need to find the matching indent level
          // or assign a new level if this is a new indentation amount
          if (indentToLevelMap.has(indentLength)) {
            level = indentToLevelMap.get(indentLength);
          } else {
            // If we don't have this exact indentation yet, find the closest smaller indent
            const smallerIndents = Array.from(indentToLevelMap.keys())
              .filter(indent => indent < indentLength)
              .sort((a, b) => b - a); // Sort descending
              
            if (smallerIndents.length > 0) {
              // Use one level deeper than the closest smaller indent
              level = indentToLevelMap.get(smallerIndents[0]) + 1;
            } else {
              // Fallback if no smaller indent found
              level = currentHeadingLevel + 1;
            }
            indentToLevelMap.set(indentLength, level);
          }
        }
        
        // Update prevIndent for next iteration
        prevIndent = indentLength;

        // Extract text
        text = line.substring(1).trim(); // Remove the '-' character
      } else {
        continue; // Skip lines that aren't headings or bullet points
      }

      // Create node and auto-collapse if level >= 4
      const collapsed = level >= 4;
      const node = new Node(text, level, collapsed);

      // Find the parent node
      while (stack.length > 1 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      // Add to parent
      stack[stack.length - 1].addChild(node);

      // Add to node map
      this.nodeMap.set(node.id, node);

      // Add to stack
      stack.push(node);
    }

    this.rootNode = root.hasChildren() ? root.children[0] : null;
    
    // Once the tree is built, regenerate all IDs to ensure they're deterministic
    // based on the final tree structure
    if (this.rootNode) {
      this.regenerateAllIds();
    }
    
    return this.rootNode;
  }
  
  /**
   * Regenerate deterministic IDs for all nodes in the tree
   * This ensures consistent IDs based on node content and position in the tree
   */
  regenerateAllIds() {
    if (!this.rootNode) return;
    
    // Clear the existing node map
    this.nodeMap.clear();
    
    // Regenerate IDs for the entire tree, starting from the root
    this.rootNode.regenerateAllIds();
    
    // Rebuild the node map with the new IDs
    this._rebuildNodeMap(this.rootNode);
  }
  
  /**
   * Recursively rebuild the node map with the current node IDs
   * @private
   * @param {Node} node - The node to start from
   */
  _rebuildNodeMap(node) {
    if (!node) return;
    
    // Add this node to the map
    this.nodeMap.set(node.id, node);
    
    // Process all children
    for (let i = 0; i < node.children.length; i++) {
      this._rebuildNodeMap(node.children[i]);
    }
  }

  /**
   * Get the root node of the mindmap
   * @return {Node|null} The root node
   */
  getRoot() {
    return this.rootNode;
  }

  /**
   * Find a node by its ID
   * @param {string} id - The ID of the node to find
   * @return {Node|null} The node, or null if not found
   */
  findNodeById(id) {
    return this.nodeMap.get(id) || null;
  }
  
  /**
   * Find a node by its text content (first match)
   * @param {string} text - The text content to search for
   * @return {Node|null} The node, or null if not found
   */
  findNodeByText(text) {
    for (const node of this.nodeMap.values()) {
      if (node.text === text) {
        return node;
      }
    }
    return null;
  }

  /**
   * Toggle the collapsed state of a node by its ID
   * @param {string} id - The ID of the node to toggle
   * @return {boolean} True if the node was found and toggled, false otherwise
   */
  toggleNodeCollapse(id) {
    const node = this.findNodeById(id);
    if (node) {
      node.toggleCollapse();
      return true;
    }
    return false;
  }

  /**
   * Expand all nodes in the mindmap
   */
  expandAll() {
    this.nodeMap.forEach(node => {
      node.collapsed = false;
    });
  }

  /**
   * Collapse all nodes in the mindmap except the root
   */
  collapseAll() {
    this.nodeMap.forEach(node => {
      if (node.level > 1) {
        node.collapsed = true;
      }
    });
  }
}

// For backward compatibility, keep the existing parsing function as a bridge
if (typeof window !== 'undefined') {
  // Create a singleton instance for global use
  window.mindmapModel = new MindmapModel();

  // Add backward-compatible parsing function
  window.parseMindmap = function(markdown) {
    return window.mindmapModel.parseFromMarkdown(markdown);
  };
  
  // Export the class to window
  window.MindmapModel = MindmapModel;
}

export default MindmapModel;