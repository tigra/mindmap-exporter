// src/model/integration.js

//import Node from './node.js';
//import MindmapModel from './mindmap-model.js';

// Initialize the model
const mindmapModel = new MindmapModel();

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

// Export for future module usage
//export { mindmapModel };