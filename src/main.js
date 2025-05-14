// src/main.js - Main entry point for Vite bundle

// Import core components
import MindmapApp from './app.js';
import MindmapModel from './model/mindmap-model.js';
import MindmapController from './controller/mindmap-controller.js';
import MindmapRenderer from './renderer/mindmap-renderer.js';
import StyleManager from './style/style-manager.js';
import MindmapStylePresets from './style/style-presets.js';

// Import styles (if we add CSS modules later)
// import './styles.css';

// Export all components for library usage
export {
  MindmapApp,
  MindmapModel,
  MindmapController,
  MindmapRenderer,
  StyleManager,
  MindmapStylePresets
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new MindmapApp();
  app.initialize();
});

// Default export for simple imports
export default MindmapApp;