// src/controller/mindmap-controller.js

//import eventBridge from '../utils/event-bridge.js';

/**
 * Controller for the mindmap application
 * Coordinates interactions between the model, view, and user events
 */
class MindmapController {
  /**
   * Create a new MindmapController
   * @param {Object} model - The mindmap model
   * @param {Object} renderer - The mindmap renderer
   * @param {Object} styleManager - The style manager
   * @param {HTMLElement} container - The container element for the mindmap
   */
  constructor(model, renderer, styleManager, container) {
    this.model = model;
    this.renderer = renderer;
    this.styleManager = styleManager;
    this.container = container;

    // Register with the event bridge
    eventBridge.initialize(this);
  }

  /**
   * Initialize the controller
   */
  initialize() {
    // Initial render
    this.renderer.render(this.container);
  }

  /**
   * Handle node events
   * @param {string} nodeId - The ID of the node that triggered the event
   * @param {string} eventType - The type of event
   */
  handleNodeEvent(nodeId, eventType) {
    if (eventType === 'toggle') {
      // Toggle node collapse state
      this.model.toggleNodeCollapse(nodeId);

      // Re-render the mindmap
      this.renderer.render(this.container);
    }
  }

  /**
   * Handle layout type change
   * @param {string} layoutType - The new layout type
   */
  handleLayoutChange(layoutType) {
  console.log('handleLayoutChange(', layoutType);
    this.styleManager.setGlobalLayoutType(layoutType);
    this.renderer.render(this.container);
  }

  /**
   * Handle style preset change
   * @param {string} presetName - The name of the preset
   */
  handleStyleChange(presetName) {
    console.log('handleStyleChange(', presetName);
    MindmapStylePresets.applyPreset(presetName, this.styleManager);
    this.renderer.render(this.container);
  }

  /**
   * Export the mindmap to SVG
   * @param {string} filename - The filename for the export
   */
  exportToSVG(filename) {
    const svgContent = this.container.dataset.svgContent;
    if (!svgContent) {
      console.warn('No SVG content available for export');
      return;
    }

    // Create a download link
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'mindmap.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Export the mindmap to PNG
   * @param {string} filename - The filename for the export
   */
  exportToPNG(filename) {
    const svgContent = this.container.dataset.svgContent;
    if (!svgContent) {
      console.warn('No SVG content available for export');
      return;
    }

    // Convert SVG to PNG using Image and Canvas
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'mindmap.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    };

    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    img.src = url;
  }
}

// For backward compatibility
if (typeof window !== 'undefined') {
  window.MindmapController = MindmapController;
}

//export default MindmapController;