// src/model/integration.js

//import Node from './node.js';
//import MindmapModel from './mindmap-model.js';

// Initialize the model
const mindmapModel = new MindmapModel();

// Initialize style manager
const styleManager = new StyleManager();

const renderer = new MindmapRenderer(mindmapModel, styleManager);

// For backward compatibility with the global nodeMap currently used
window.updateNodeMap = function() {
  window.nodeMap = {};
  mindmapModel.nodeMap.forEach((node, id) => {
    window.nodeMap[id] = node;
  });
};

// Function to be used in place of the original parseMindmap
window.enhancedParseMindmap = function(markdown) {
  const rootNode = mindmapModel.parseFromMarkdown(markdown);
  window.updateNodeMap();
  return rootNode;
};

document.addEventListener('DOMContentLoaded', function() {
  const container = document.getElementById('mindmap-container');
  if (container) {
    controller = new MindmapController(mindmapModel, renderer, styleManager, container);

    // Make it available globally for backward compatibility
    window.mindmapController = controller;

    // Initialize the controller
    controller.initialize();
    console.log('initialized controller', controller);
  }
});

// Export for future module usage
//export { mindmapModel };