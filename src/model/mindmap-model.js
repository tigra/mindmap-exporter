// src/model/mindmap-model.js

import MindmapNode from './node.js';
// We'll use dynamic import for marked to avoid issues with SSR or initial load

/**
 * MindmapModel class for managing mindmap data structure
 */
class MindmapModel {
  /**
   * Create a new MindmapModel
   */
  constructor() {
    this.rootNode = new MindmapNode();
    this.nodeMap = new Map(); // Map of node ID to node instance
  }

  /**
   * Parse markdown text into a mindmap structure
   * @param {string} markdown - The markdown text to parse
   * @param {boolean} useMarked - Whether to use the marked library (default: true)
   * @param {boolean} debug - Whether to output debug information (default: false)
   * @return {Promise<MindmapNode|null>} The root node of the mindmap, or null if no valid nodes were found
   */
  async parseFromMarkdown(markdown, useMarked = true, debug = false) {
    try {
      if (useMarked) {
        return await this.parseWithMarked(markdown, debug);
      }
    } catch (error) {
      console.warn('Error parsing with marked, falling back to traditional parser:', error);
    }
    
    // Fall back to traditional parser if marked fails or is disabled
    return this.parseTraditional(markdown);
  }
  
  /**
   * Parse markdown using the marked library
   * @param {string} markdown - The markdown text to parse
   * @param {boolean} debug - Whether to output debug information
   * @return {MindmapNode|null} The root node of the mindmap
   */
  async parseWithMarked(markdown, debug = false) {
    try {
      if (!markdown || typeof markdown !== 'string') {
        console.warn('Invalid markdown input:', markdown);
        throw new Error('Invalid markdown input');
      }
      
      // Load marked library dynamically
      const { marked } = await import('marked');
      
      // Configure marked options for better list parsing
      marked.setOptions({
        gfm: true,       // GitHub Flavored Markdown
        breaks: true,    // Convert line breaks to <br>
        smartLists: true // Use smarter list behavior
      });
      
      // Create a lexer to tokenize the markdown
      const tokens = marked.lexer(markdown);
      
      if (!tokens || !Array.isArray(tokens)) {
        console.warn('Marked lexer returned invalid tokens:', tokens);
        throw new Error('Invalid tokens from marked lexer');
      }
      
      // Output debug information if requested
      if (debug) {
        this._debugTokens(tokens);
      }
      
      // Process the tokens into a node structure
      const root = new MindmapNode('', 0);
      this._processTokens(tokens, root);
      
      // Set the root node
      this.rootNode = root.hasChildren() ? root.children[0] : null;
      
      // Check if we actually created a valid tree
      if (!this.rootNode && root.text) {
        // Use the root text as a fallback if no children were created but text was found
        this.rootNode = root;
      } else if (!this.rootNode) {
        console.warn('Failed to create a valid node tree from markdown');
        throw new Error('Failed to create a valid node tree');
      }
      
      // Regenerate all IDs to ensure they're deterministic
      this.regenerateAllIds();
      
      // Print the tree structure if in debug mode
      if (debug) {
        this._debugTree(this.rootNode);
      }
      
      return this.rootNode;
    } catch (error) {
      console.error('Error parsing markdown with marked:', error);
      throw error; // Re-throw to trigger fallback
    }
  }
  
  /**
   * Helper method to debug token structure
   * @private
   * @param {Array} tokens - The tokens to debug
   * @param {string} indent - The indentation to use
   */
  _debugTokens(tokens, indent = '') {
    if (!tokens || !Array.isArray(tokens)) return;
    
    console.group('Tokens:');
    tokens.forEach((token, index) => {
      console.log(`${indent}[${index}] Type: ${token.type || 'unknown'}`);
      if (token.text) console.log(`${indent}  Text: "${token.text}"`);
      if (token.depth) console.log(`${indent}  Depth: ${token.depth}`);
      
      if (token.tokens && Array.isArray(token.tokens)) {
        console.group(`${indent}  Nested tokens:`);
        this._debugTokens(token.tokens, indent + '  ');
        console.groupEnd();
      }
      
      if (token.items && Array.isArray(token.items)) {
        console.group(`${indent}  List items:`);
        token.items.forEach((item, itemIndex) => {
          console.log(`${indent}    [${itemIndex}] ${item.text || '(no direct text)'}`);
          if (item.tokens && Array.isArray(item.tokens)) {
            console.group(`${indent}      Item tokens:`);
            this._debugTokens(item.tokens, indent + '      ');
            console.groupEnd();
          }
          if (item.items && Array.isArray(item.items)) {
            console.group(`${indent}      Nested items:`);
            this._debugItemsRecursive(item.items, indent + '      ');
            console.groupEnd();
          }
        });
        console.groupEnd();
      }
    });
    console.groupEnd();
  }
  
  /**
   * Helper method to debug nested list items
   * @private
   * @param {Array} items - The items to debug
   * @param {string} indent - The indentation to use
   */
  _debugItemsRecursive(items, indent = '') {
    if (!items || !Array.isArray(items)) return;
    
    items.forEach((item, index) => {
      console.log(`${indent}[${index}] ${item.text || '(no direct text)'}`);
      if (item.tokens && Array.isArray(item.tokens)) {
        console.group(`${indent}  Item tokens:`);
        this._debugTokens(item.tokens, indent + '  ');
        console.groupEnd();
      }
      if (item.items && Array.isArray(item.items)) {
        console.group(`${indent}  Nested items:`);
        this._debugItemsRecursive(item.items, indent + '  ');
        console.groupEnd();
      }
    });
  }
  
  /**
   * Helper method to debug the node tree
   * @private
   * @param {MindmapNode} node - The node to debug
   * @param {string} indent - The indentation to use
   */
  _debugTree(node, indent = '') {
    if (!node) return;
    
    console.log(`${indent}[Level ${node.level}] ${node.text}`);
    if (node.children && node.children.length > 0) {
      console.group(`${indent}  Children:`);
      node.children.forEach(child => {
        this._debugTree(child, indent + '  ');
      });
      console.groupEnd();
    }
  }
  
  /**
   * Process marked tokens and build the node tree
   * @private
   * @param {Array} tokens - The tokens from marked lexer
   * @param {MindmapNode} parentNode - The parent node to attach to
   * @param {number} baseLevel - The base level for hierarchy
   */
  _processTokens(tokens, parentNode, baseLevel = 0) {
    let currentNode = parentNode;
    let currentLevel = baseLevel;
    
    if (!tokens || !Array.isArray(tokens)) {
      console.warn('Invalid tokens received in _processTokens:', tokens);
      return;
    }
    
    for (const token of tokens) {
      if (!token) continue;
      
      if (token.type === 'heading') {
        // Process headings
        const level = token.depth;
        const text = token.text;
        
        // Find the appropriate parent node based on the heading level
        while (currentNode !== parentNode && currentNode.level >= level) {
          currentNode = currentNode.parent;
        }
        
        // Create a new node for this heading
        const node = new MindmapNode(text, level, level >= 4);
        currentNode.addChild(node);
        
        // Add to node map
        this.nodeMap.set(node.id, node);
        
        // Update current node
        currentNode = node;
        currentLevel = level;
      } else if (token.type === 'list') {
        // Process list items
        if (token.items && Array.isArray(token.items)) {
          this._processListItems(token.items, currentNode, currentLevel + 1);
        } else {
          console.warn('List token without valid items:', token);
        }
      } else if (token.type === 'paragraph' && parentNode === currentNode) {
        // If we have a paragraph at the top level, treat it as the root node text
        if (parentNode === currentNode && parentNode.text === '') {
          parentNode.text = token.text || '';
        }
      } else if (token.type === 'text' && parentNode === currentNode && parentNode.text === '') {
        // Handle top-level text tokens too
        parentNode.text = token.text || token.raw || '';
      } else if (token.tokens && Array.isArray(token.tokens)) {
        // If the token has nested tokens, process them recursively
        this._processTokens(token.tokens, currentNode, currentLevel);
      }
      
      // Process any raw tokens if available (some marked versions provide these)
      if (token.items && !token.type && Array.isArray(token.items)) {
        // This might be an unmarked list in some marked versions
        this._processListItems(token.items, currentNode, currentLevel + 1);
      }
    }
  }
  
  /**
   * Process list items into nodes
   * @private
   * @param {Array} items - The list items from marked
   * @param {MindmapNode} parentNode - The parent node to attach to
   * @param {number} level - The level for the list items
   */
  _processListItems(items, parentNode, level) {
    for (const item of items) {
      // Extract text from the item, being careful to not include sublist content
      let text = '';
      let hasFoundText = false;
      
      // First, check if the item has direct text (but be careful as this might include nested content)
      if (item.text) {
        // Check if this is plain text or might contain nested content
        if (!item.tokens || !item.tokens.some(t => t.type === 'list')) {
          text = item.text;
          hasFoundText = true;
        }
      }
      
      // If we didn't find text directly or it might contain nested content,
      // check the tokens more carefully
      if (!hasFoundText && item.tokens && item.tokens.length > 0) {
        // We will collect text only from direct text or paragraph tokens
        const textFragments = [];
        
        for (const token of item.tokens) {
          // Skip list tokens - we'll handle them separately
          if (token.type === 'list') continue;
          
          if (token.type === 'text') {
            textFragments.push(token.text || token.raw || '');
            hasFoundText = true;
          } else if (token.type === 'paragraph') {
            // For paragraphs, we need to be careful as they might contain other tokens
            // If it has tokens, check those instead of using the paragraph text directly
            if (token.tokens) {
              const paragraphTextTokens = token.tokens.filter(t => t.type === 'text');
              if (paragraphTextTokens.length > 0) {
                paragraphTextTokens.forEach(t => {
                  textFragments.push(t.text || t.raw || '');
                });
                hasFoundText = true;
              } else {
                textFragments.push(token.text || token.raw || '');
                hasFoundText = true;
              }
            } else {
              textFragments.push(token.text || token.raw || '');
              hasFoundText = true;
            }
          }
        }
        
        // Join all text fragments we found
        if (textFragments.length > 0) {
          text = textFragments.join(' ').trim();
        }
      }
      
      // If no text was found, use a default
      if (!hasFoundText || text.trim() === '') {
        text = '(empty)';
      }
      
      // Create a new node for this list item
      const node = new MindmapNode(text, level, level >= 4);
      parentNode.addChild(node);
      
      // Add to node map
      this.nodeMap.set(node.id, node);
      
      // Process nested lists from two possible sources:
      
      // 1. Direct nested items (common in marked)
      if (item.items && item.items.length > 0) {
        this._processListItems(item.items, node, level + 1);
      }
      
      // 2. Lists nested in tokens
      if (item.tokens) {
        for (const token of item.tokens) {
          if (token.type === 'list') {
            this._processListItems(token.items, node, level + 1);
          }
        }
      }
    }
  }
  
  /**
   * Parse markdown using the traditional parser (for backward compatibility)
   * @param {string} markdown - The markdown text to parse
   * @return {MindmapNode|null} The root node of the mindmap
   */
  parseTraditional(markdown) {
    const lines = markdown.split('\n');
    const root = new MindmapNode('', 0);
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
      const node = new MindmapNode(text, level, collapsed);

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
   * @param {MindmapNode} node - The node to start from
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
   * @return {MindmapNode|null} The root node
   */
  getRoot() {
    return this.rootNode;
  }

  /**
   * Find a node by its ID
   * @param {string} id - The ID of the node to find
   * @return {MindmapNode|null} The node, or null if not found
   */
  findNodeById(id) {
    return this.nodeMap.get(id) || null;
  }
  
  /**
   * Find a node by its text content (first match)
   * @param {string} text - The text content to search for
   * @return {MindmapNode|null} The node, or null if not found
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
  window.parseMindmap = async function(markdown) {
    return await window.mindmapModel.parseFromMarkdown(markdown);
  };
  
  // Export the class to window
  window.MindmapModel = MindmapModel;
}

export default MindmapModel;