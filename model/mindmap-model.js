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

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      let level = 0;
      let text = '';

      // Check if it's a heading
      if (line.startsWith('#')) {
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
        // Get raw line to calculate actual indentation
        const rawLine = lines[i];
        const indentLength = rawLine.length - rawLine.trimLeft().length;
        const bulletDepth = Math.floor(indentLength / 2); // Assuming 2 spaces per level

        // Bullet points should be children of the current heading
        level = currentHeadingLevel + bulletDepth + 1;

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
    return this.rootNode;
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
}

if (window !== null) {
    window.MindmapModel = MindmapModel;
}

export default MindmapModel;