// src/app.js

//import MindmapModel from './model/mindmap-model.js';
//import StyleManager from './style/style-manager.js';
//import StylePresetsAdapter from './style/style-presets-adapter.js';
//import MindmapRenderer from './renderer/mindmap-renderer.js';
//import MindmapController from './controller/mindmap-controller.js';

/**
 * Main application class for the mindmap
 */
class MindmapApp {
  /**
   * Create a new MindmapApp
   * @param {Object} options - Configuration options
   * @param {string} options.containerId - The ID of the container element
   * @param {string} options.markdownInputId - The ID of the markdown input element
   * @param {string} options.stylePresetId - The ID of the style preset select element
   * @param {string} options.layoutTypeId - The ID of the layout type select element
   * @param {string} options.exportFormatId - The ID of the export format select element
   * @param {string} options.generateBtnId - The ID of the generate button
   * @param {string} options.exportBtnId - The ID of the export button
   */
  constructor(options = {}) {
    this.options = {
      containerId: 'mindmap-container',
      markdownInputId: 'markdown-input',
      stylePresetId: 'style-preset',
      layoutTypeId: 'layout-type',
      exportFormatId: 'export-format',
      generateBtnId: 'generate-btn',
      exportBtnId: 'export-btn',
      ...options
    };

    // Initialize core components
    this.model = new MindmapModel();
    this.styleManager = new StyleManager();
    this.renderer = new MindmapRenderer(this.model, this.styleManager);

    // Controller will be initialized when DOM is ready
    this.controller = null;

    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.handleGenerate = this.handleGenerate.bind(this);
    this.handleExport = this.handleExport.bind(this);
    console.log('app', this);
  }

  /**
   * Initialize the application
   */
  initialize() {
    // Get DOM elements
    this.container = document.getElementById(this.options.containerId);
    this.markdownInput = document.getElementById(this.options.markdownInputId);
    this.stylePreset = document.getElementById(this.options.stylePresetId);
    this.layoutType = document.getElementById(this.options.layoutTypeId);
    this.exportFormat = document.getElementById(this.options.exportFormatId);
    this.generateBtn = document.getElementById(this.options.generateBtnId);
    this.exportBtn = document.getElementById(this.options.exportBtnId);

    if (!this.container || !this.markdownInput) {
      console.error('Required DOM elements not found');
      return;
    }

    // Initialize controller
    this.controller = new MindmapController(
      this.model,
      this.renderer,
      this.styleManager,
      this.container
    );

    // Attach event listeners
    if (this.generateBtn) {
      this.generateBtn.addEventListener('click', this.handleGenerate);
    }

    if (this.exportBtn) {
      this.exportBtn.addEventListener('click', this.handleExport);
    }

    // TODO switched off temporarily
//    if (this.layoutType) {
//      this.layoutType.addEventListener('change', () => {
//        this.controller.handleLayoutChange(this.layoutType.value);
//      });
//    }

    if (this.stylePreset) {
      this.stylePreset.addEventListener('change', () => {
        this.controller.handleStyleChange(this.stylePreset.value);
      });
    }

    // Generate initial mindmap
    this.handleGenerate();

    // Make components globally available for backward compatibility
    if (typeof window !== 'undefined') {
      window.mindmapApp = this;
      window.mindmapModel = this.model;
      window.styleManager = this.styleManager;
      window.mindmapRenderer = this.renderer;
      window.mindmapController = this.controller;
    }
  }

  /**
   * Handle generate button click
   */
  handleGenerate() {
  console.log("generate");
    if (!this.markdownInput || !this.container) return;

    const markdown = this.markdownInput.value.trim();
    if (!markdown) {
      console.warn('No markdown content to generate mindmap');
      return;
    }

    // Parse markdown
    this.model.parseFromMarkdown(markdown);

            var style = window.styleManager || new Style();
            const presetName = this.stylePreset.value;
            MindmapStylePresets.applyPreset(presetName, style);

            style.setGlobalLayoutType(this. layoutType.value);
            const layout = style.getLevelStyle(1).getLayout();
            layout.applyLayout(this.model.getRoot(), 0, 0, style);

    // Apply style preset
    if (this.stylePreset) {
      this.controller.handleStyleChange(this.stylePreset.value);
    }

    // Apply layout type
    if (this.layoutType) {
      this.controller.handleLayoutChange(this.layoutType.value);
    }

    // Render the mindmap
    this.controller.initialize();

    // Enable export button
    if (this.exportBtn) {
      this.exportBtn.disabled = false;
    }
  }

  /**
   * Handle export button click
   */
  handleExport() {
    if (!this.exportFormat || !this.container) return;

    const format = this.exportFormat.value;
    const svgContent = this.container.dataset.svgContent;

    if (!svgContent) {
      console.warn('No mindmap to export. Generate one first.');
      return;
    }

    // Extract filename from root node text
    const rootTextMatch = svgContent.match(/<text[^>]*>([^<]+)<\/text>/);
    const fileName = rootTextMatch ?
      rootTextMatch[1].replace(/[^\w\s]/g, '').replace(/\s+/g, '_').toLowerCase() :
      'mindmap';

    if (format === 'svg') {
      this.controller.exportToSVG(fileName + '.svg');
    } else if (format === 'png') {
      this.controller.exportToPNG(fileName + '.png');
    }
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new MindmapApp();
  app.initialize();
});

//export default MindmapApp;