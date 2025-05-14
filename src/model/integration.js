// Update src/model/integration.js to provide full backward compatibility

//import MindmapApp from '../app.js';

// Initialize the application
const app = new MindmapApp();

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  // Try to initialize the application
  app.initialize();
  console.log('app initialized', app);

  // Define global compatibility functions
  window.parseMindmap = function(markdown) {
    if (window.mindmapModel) {
      return window.mindmapModel.parseFromMarkdown(markdown);
    }
    return null;
  };

  window.toggleNodeCollapse = function(nodeId) {
    if (window.mindmapController) {
      window.mindmapController.handleNodeEvent(nodeId, 'toggle');
    }
  };

  // If the old generateMindMap function exists, preserve it but have it use our new system
  if (typeof window.generateMindMap === 'function') {
    const originalGenerateMindMap = window.generateMindMap;
    window.generateMindMap = function() {
      if (window.mindmapApp) {
        window.mindmapApp.handleGenerate();
      } else {
        originalGenerateMindMap();
      }
    };
  }

  // Same for export function
  if (typeof window.exportMindMap === 'function') {
    const originalExportMindMap = window.exportMindMap;
    window.exportMindMap = function() {
      if (window.mindmapApp) {
        window.mindmapApp.handleExport();
      } else {
        originalExportMindMap();
      }
    };
  }
});

//export default app;