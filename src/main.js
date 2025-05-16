// src/main.js - Main entry point for Vite bundle

// Import core components
import MindmapApp from './app.js';
import MindmapModel from './model/mindmap-model.js';
import MindmapController from './controller/mindmap-controller.js';
import MindmapRenderer from './renderer/mindmap-renderer.js';
import StyleManager from './style/style-manager.js';
import MindmapStylePresets from './style/style-presets.js';

// Import utility modules
import splitterService from './utils/splitter.js';
import tabManager from './utils/tab-manager.js';

// Required libraries are already available via package.json

// Import styles
import '../style.css';

// Export all components for library usage
export {
  MindmapApp,
  MindmapModel,
  MindmapController,
  MindmapRenderer,
  StyleManager,
  MindmapStylePresets,
  splitterService,
  tabManager
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the app
  const app = new MindmapApp();
  app.initialize();
  
  // Initialize the splitter
  splitterService.init('splitter', '.sidebar', '.preview', {
    minLeftWidth: 300,
    minRightWidth: 300
  });
  
  // Initialize tab switching
  tabManager.init('.tab', '.tab-content');
  
  // Handle apply settings button
  const applySettingsBtn = document.getElementById('apply-settings-btn');
  const generateBtn = document.getElementById('generate-btn');
  
  if (applySettingsBtn) {
    applySettingsBtn.addEventListener('click', () => {
      // Call the same function as the generate button
      if (generateBtn && typeof generateBtn.click === 'function') {
        generateBtn.click();
      } else if (window.mindmapApp && typeof window.mindmapApp.handleGenerate === 'function') {
        window.mindmapApp.handleGenerate();
      }
    });
  }
});

// Default export for simple imports
export default MindmapApp;