// src/controller/mindmap-controller.js

import eventBridge from '../utils/event-bridge.js';
import MindmapStylePresets from '../style/style-presets.js';

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

      // reapply layout. TODO think where to take it from rather then window
      const style = window.styleManager;
      const layout = style.getLevelStyle(1).getLayout();
      layout.applyLayout(this.model.getRoot(), 0, 0, style);

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
    if (layoutType === 'horizontal-left') {
      this.styleManager.setGlobalLayoutType('horizontal', {direction: 'left'});
    } else if (layoutType === 'horizontal-right') {
      this.styleManager.setGlobalLayoutType('horizontal', {direction: 'right'});
    } else {
      this.styleManager.setGlobalLayoutType(layoutType);
    }
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
 * @returns {Promise<void>} A promise that resolves when export is complete
 */
exportToSVG(filename) {
  console.log(`[exportToSVG] Starting export process with filename: ${filename || 'mindmap.svg'}`);

  return new Promise((resolve, reject) => {
    console.log('[exportToSVG] Promise created');

    try {
      console.log('[exportToSVG] Entering try block. Setting timeout for 100ms to ensure SVG is ready');

      // Get SVG content with a small delay to ensure it's ready
      setTimeout(() => {
        console.log('[exportToSVG] Timeout callback executed. Attempting to retrieve SVG content from container dataset');

        const svgContent = this.container.dataset.svgContent;
        console.log(`[exportToSVG] SVG content retrieved: ${svgContent ? 'Yes, length: ' + svgContent.length : 'No'}`);

        if (!svgContent) {
          console.warn('[exportToSVG] No SVG content available for export');
          reject(new Error('No SVG content available'));
          return;
        }

        console.log('[exportToSVG] Creating Blob with SVG content');
        // Create a Blob with the SVG content
        const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
        console.log(`[exportToSVG] Blob created, size: ${svgBlob.size} bytes`);

        console.log('[exportToSVG] Creating object URL');
        const url = URL.createObjectURL(svgBlob);
        console.log(`[exportToSVG] Object URL created: ${url}`);

        console.log('[exportToSVG] Creating download link element');
        // Create a download link and trigger it
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'mindmap.svg';
        console.log(`[exportToSVG] Download link configured with filename: ${a.download}`);

        // Set specific attributes to help with download
        a.rel = 'noopener';
        a.style.display = 'none';
        console.log('[exportToSVG] Download link attributes set. Appending download link to document body');
        // Add to body, click, and handle cleanup
        document.body.appendChild(a);
        console.log('[exportToSVG] Download link appended to document body. Setting timeout for 50ms before clicking download link');
        // Use a small timeout to ensure the browser processes the attachment
        setTimeout(() => {
          console.log('[exportToSVG] Clicking download link');
          a.click();
          console.log('[exportToSVG] Download link clicked. Setting cleanup timeout for 100ms');
          // Clean up after a short delay
          setTimeout(() => {
            console.log('[exportToSVG] Performing cleanup. Removing download link from document body');
            document.body.removeChild(a);
            console.log('[exportToSVG] Download link removed. Revoking object URL');
            URL.revokeObjectURL(url);
            console.log('[exportToSVG] Object URL revoked. Resolving promise - export complete');
            resolve();
          }, 100);
        }, 50);
      }, 100);
    } catch (error) {
      console.error('[exportToSVG] SVG export failed:', error);
      console.log('[exportToSVG] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      console.log('[exportToSVG] Rejecting promise due to caught error');
      reject(error);
    }
  });
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

export default MindmapController;