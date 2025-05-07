/**
 * Integration tests for layout and style combinations in mindmap-exporter
 */

// DOM environment and text metrics mocking are set up in tests/setup.js

// Now import the actual modules
import MindmapModel from '../../model/mindmap-model.js';
import StyleManager from '../../style/style-manager.js';
import MindmapStylePresets from '../../style/style-presets.js';
import MindmapRenderer from '../../renderer/mindmap-renderer.js';
import MindmapController from '../../controller/mindmap-controller.js';
import { createTestContainer } from '../utils/test-utils';

// Test markdown for comprehensive layout testing
const testMarkdown = `# Layout Testing
## Branch 1
- Item A
  - Sub-item A1
    - Deep item A1a
## Branch 2
- Item B
  - Sub-item B1
### Sub-branch 2
- Item C`;

/**
 * Helper to configure a controller with specific layout and style
 */
function setupControllerWithLayoutAndStyle(layoutType, stylePreset) {
  // Create basic components
  const model = new MindmapModel();
  const styleManager = new StyleManager();
  const renderer = new MindmapRenderer(model, styleManager);
  const container = createTestContainer();
  
  // Create controller
  const controller = new MindmapController(model, renderer, styleManager, container);
  
  // Parse the markdown
  model.parseFromMarkdown(testMarkdown);
  
  // Force mock DOM elements to be available for style change
  global.document.getElementById = jest.fn().mockImplementation(id => {
    if (id === 'style-preset') {
      return { value: stylePreset };
    }
    if (id === 'layout-type') {
      return { value: layoutType };
    }
    return null;
  });
  
  // Apply style and layout
  controller.handleStyleChange(stylePreset);
  controller.handleLayoutChange(layoutType);
  
  return {
    model,
    styleManager,
    renderer,
    controller,
    container
  };
}

describe('Layout and Style Integration Tests', () => {
  // Define layouts to test
  const layouts = [
    'horizontal-right',
    'horizontal-left',
    'vertical-down',
    'vertical-up',
    'taproot',
    'classic',
    'vertical-over-taproot'
  ];
  
  // Define styles to test (one per layout for simplicity)
  const styles = ['default', 'corporate', 'vibrant', 'pastel', 'tech', 'minimal', 'nature'];
  
  // Test each layout with a different style
  layouts.forEach((layout, index) => {
    const style = styles[index % styles.length];
    
    test(`Layout "${layout}" with "${style}" style renders correctly`, () => {
      const { renderer, container } = setupControllerWithLayoutAndStyle(layout, style);
      
      // Generate SVG
      const svg = renderer.generateSVG();
      container.dataset.svgContent = svg;
      
      // Take snapshot of the SVG content
      expect(svg).toMatchSnapshot();
    });
  });
  
  // Test deep node levels (7+) with different layout types
  describe('Deep Node Levels', () => {
    // Special markdown with many levels for testing deep node appearance
    const deepMarkdown = `# Root
## Level 2
- Level 3
  - Level 4
    - Level 5
      - Level 6
        - Level 7
          - Level 8
            - Level 9
              - Level 10`;
    
    // Test deep levels with 3 important layout types
    const deepLayouts = ['vertical-down', 'horizontal-right', 'taproot'];
    
    deepLayouts.forEach(layout => {
      test(`Deep nodes (7+) render correctly with "${layout}" layout`, () => {
        // Create components
        const model = new MindmapModel();
        const styleManager = new StyleManager();
        const renderer = new MindmapRenderer(model, styleManager);
        const container = createTestContainer();
        const controller = new MindmapController(model, renderer, styleManager, container);
        
        // Parse the deep markdown
        model.parseFromMarkdown(deepMarkdown);
        
        // Expand all nodes
        model.expandAll();
        
        // Mock DOM elements
        global.document.getElementById = jest.fn().mockImplementation(id => {
          if (id === 'style-preset') {
            return { value: 'default' };
          }
          if (id === 'layout-type') {
            return { value: layout };
          }
          return null;
        });
        
        // Apply layout
        controller.handleLayoutChange(layout);
        
        // Generate SVG
        const svg = renderer.generateSVG();
        
        // Take snapshot of the SVG content
        expect(svg).toMatchSnapshot();
        
        // Verify defaultLevelStyle has proper properties for deep nodes
        const defaultStyle = styleManager.defaultLevelStyle;
        expect(defaultStyle.layoutType).toBeDefined();
        
        // Check that all expected node levels are present
        const nodesByLevel = {};
        const rootNode = model.getRoot();
        
        // Use our standalone traverseNodes helper function instead of a prototype method
        traverseNodes(rootNode, node => {
          nodesByLevel[node.level] = (nodesByLevel[node.level] || 0) + 1;
        });
        
        // We should have nodes from level 1 to 10
        for (let level = 1; level <= 10; level++) {
          expect(nodesByLevel[level]).toBeGreaterThan(0);
        }
        // TODO some more deep checks than count of nodes
      });
    });
  });
});

/**
 * Helper function to traverse a node and its children
 * @param {Object} node - The starting node to traverse
 * @param {Function} callback - Callback to execute on each node
 */
function traverseNodes(node, callback) {
  if (!node) return;
  
  // Call the callback with this node
  callback(node);
  
  // Recursively traverse children
  if (node.children && node.children.length) {
    for (const child of node.children) {
      traverseNodes(child, callback);
    }
  }
}