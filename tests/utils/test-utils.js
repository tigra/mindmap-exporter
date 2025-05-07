/**
 * Test utilities for mindmap tests
 */

// Import required modules
import MindmapModel from '../../model/mindmap-model.js';
import StyleManager from '../../style/style-manager.js';
import MindmapStylePresets from '../../style/style-presets.js';
import MindmapRenderer from '../../renderer/mindmap-renderer.js';

// Note: DOM setup is now handled directly in test files before module imports

/**
 * Create a test container that simulates the DOM environment
 * @returns {Object} A mock container element
 */
function createTestContainer() {
  return {
    innerHTML: '',
    dataset: {},
    getBoundingClientRect: () => ({
      width: 1000,
      height: 800,
      top: 0,
      left: 0,
      right: 1000,
      bottom: 800
    }),
    querySelector: () => null
  };
}

/**
 * Helper to expand all nodes in a mindmap
 * @param {Object} model - The mindmap model containing nodes
 */
function expandAllNodes(model) {
  const root = model.getRoot();
  
  // If no root, nothing to expand
  if (!root) return;
  
  // Recursive function to expand nodes
  function expandNode(node) {
    // Ensure node is expanded
    node.collapsed = false;
    
    // Recursively expand all children
    for (const child of node.children) {
      expandNode(child);
    }
  }
  
  // Start from root
  expandNode(root);
}

/**
 * Set up a test mindmap with the given style preset
 * @param {string} markdown - The markdown content to parse
 * @param {string} presetName - The style preset to apply
 * @param {boolean} expandAll - Whether to expand all nodes
 * @returns {Object} Test environment with model, renderer, container
 */
function setupMindmap(markdown, presetName, expandAll = false) {
  // Create model, style manager, and renderer
  const model = new MindmapModel();
  const styleManager = new StyleManager();
  const renderer = new MindmapRenderer(model, styleManager);
  
  // Parse the markdown
  model.parseFromMarkdown(markdown);
  
  // Apply the style preset
  MindmapStylePresets.applyPreset(presetName, styleManager);
  
  // Expand all nodes if requested
  if (expandAll) {
    expandAllNodes(model);
  }
  
  // Create a mock container
  const container = createTestContainer();
  
  return {
    model,
    styleManager,
    renderer,
    container
  };
}

/**
 * Generate a snapshot of a mindmap with a specific style
 * @param {string} markdown - The markdown content to parse
 * @param {string} presetName - The style preset to apply
 * @param {boolean} expandAll - Whether to expand all nodes
 * @returns {string} The SVG content for snapshot testing
 */
function generateMindmapSnapshot(markdown, presetName, expandAll = false) {
  const { model, styleManager, renderer, container } = setupMindmap(markdown, presetName, expandAll);
  
  // Apply the layout
  const rootLevelStyle = styleManager.getLevelStyle(1);
  const layout = rootLevelStyle.getLayout();
  layout.applyLayout(model.getRoot(), 0, 0, styleManager);
  
  // Generate SVG
  const svg = renderer.generateSVG();
  
  // Store in container for completeness (like the actual app would do)
  container.dataset.svgContent = svg;
  
  return svg;
}

/**
 * Get all available style presets
 * @returns {string[]} Array of preset names
 */
function getAllStylePresets() {
  return Object.keys(MindmapStylePresets.getPresets());
}

/**
 * Mock DOM APIs for test environment
 */
function setupDomEnvironment() {
  // Mock document methods
  if (typeof document === 'undefined') {
    // Create mock elements to track what would be in the DOM
    const mockElements = new Map();
    
    // Mock createElement that returns element with all needed properties
    const createElement = (tagName) => {
      const element = {
        tagName,
        style: {},
        attributes: {},
        children: [],
        innerHTML: '',
        textContent: '',
        offsetWidth: 100,  // Default size
        offsetHeight: 20,
        setAttribute: function(name, value) { this.attributes[name] = value; },
        getAttribute: function(name) { return this.attributes[name]; },
        addEventListener: jest.fn(),
        appendChild: function(child) { this.children.push(child); return child; },
        removeChild: function(child) { 
          const index = this.children.indexOf(child);
          if (index !== -1) this.children.splice(index, 1);
          return child;
        }
      };
      
      // Save reference
      const id = Math.random().toString(36).substring(2);
      mockElements.set(id, element);
      
      return element;
    };
    
    // Mock createElementNS for SVG elements
    const createElementNS = (ns, tagName) => {
      const element = createElement(tagName);
      element.namespaceURI = ns;
      element.getBBox = () => ({ x: 0, y: 0, width: 100, height: 100 });
      return element;
    };
    
    // Create document with mock body
    global.document = {
      body: createElement('body'),
      getElementById: (id) => null,
      createElement,
      createElementNS
    };
  }
  
  // Additional DOM mocks can be added here as needed
}

export {
  createTestContainer,
  expandAllNodes,
  setupMindmap,
  generateMindmapSnapshot,
  getAllStylePresets,
  setupDomEnvironment
};