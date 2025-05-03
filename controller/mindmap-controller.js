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
    // Apply layout to the model
    this.applyLayout();

    // Initial render
    this.renderer.render(this.container);
    this.initMindmapContainer();
  }

  /**
   * Apply layout to the model using the current style settings
   */
  applyLayout() {
    const rootNode = this.model.getRoot();
    if (!rootNode) return;

    // Get the root level style
    const rootLevelStyle = this.styleManager.getLevelStyle(1);

    // Get the layout from this style
    const layout = rootLevelStyle.getLayout();

    // Apply layout starting from root node
    layout.applyLayout(rootNode, 0, 0, this.styleManager);
  }

  // Initialize the mindmap container for scrolling and zooming
  initMindmapContainer() {
    const container = this.container;

    // Set up panning functionality
    let isPanning = false;
    let startX, startY, scrollLeft, scrollTop;

    // Mouse events for panning (middle-click or ctrl+click)
    container.addEventListener('mousedown', (e) => {
      // Only initiate panning with middle mouse button or ctrl+left click
      if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
        e.preventDefault();
        isPanning = true;
        startX = e.pageX - container.offsetLeft;
        startY = e.pageY - container.offsetTop;
        scrollLeft = container.scrollLeft;
        scrollTop = container.scrollTop;

        // Change cursor to indicate panning
        container.style.cursor = 'grabbing';
      }
    });

    container.addEventListener('mousemove', (e) => {
      if (!isPanning) return;
      e.preventDefault();

      const x = e.pageX - container.offsetLeft;
      const y = e.pageY - container.offsetTop;
      const walkX = (x - startX) * 1.5; // Adjust for faster/slower panning
      const walkY = (y - startY) * 1.5;

      container.scrollLeft = scrollLeft - walkX;
      container.scrollTop = scrollTop - walkY;
    });

    container.addEventListener('mouseup', () => {
      isPanning = false;
      container.style.cursor = 'auto';
    });

    container.addEventListener('mouseleave', () => {
      isPanning = false;
      container.style.cursor = 'auto';
    });

    // Zoom state tracking
    let currentZoom = 1.0;
    const minZoom = 0.3;
    const maxZoom = 3.0;

    // Handle wheel events for zooming
    container.addEventListener('wheel', (e) => {
      if (e.ctrlKey) {
        // Prevent the default zoom of the entire page
        e.preventDefault();

        // Determine zoom direction
        const delta = e.deltaY < 0 ? 0.1 : -0.1;
        const newZoom = Math.min(maxZoom, Math.max(minZoom, currentZoom + delta));

        // If zoom didn't change (at limits), don't proceed
        if (newZoom === currentZoom) return;

        // Get SVG element
        const svg = container.querySelector('svg');
        if (!svg) return;

        // Get mouse position relative to container
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Get scroll position before zoom
        const scrollXBeforeZoom = container.scrollLeft;
        const scrollYBeforeZoom = container.scrollTop;

        // Scale SVG
        svg.style.transformOrigin = '0 0';
        svg.style.transform = `scale(${newZoom})`;

        // Calculate new scroll position to keep mouse over the same point
        const scrollXAfterZoom = (scrollXBeforeZoom + mouseX) * (newZoom / currentZoom) - mouseX;
        const scrollYAfterZoom = (scrollYBeforeZoom + mouseY) * (newZoom / currentZoom) - mouseY;

        // Update scroll position
        container.scrollLeft = scrollXAfterZoom;
        container.scrollTop = scrollYAfterZoom;

        // Update current zoom
        currentZoom = newZoom;

        // Update status or display zoom level (optional)
        const zoomPercent = Math.round(newZoom * 100);
        const statusMessage = document.getElementById('status-message');
        if (statusMessage) {
          statusMessage.textContent = `Zoom: ${zoomPercent}%`;
          // Clear the status message after a delay
          clearTimeout(statusMessage.timeout);
          statusMessage.timeout = setTimeout(() => {
            statusMessage.textContent = '';
          }, 1500);
        }
      }
      // If not holding Ctrl, let the default scroll behavior happen
    });
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

    // Reapply layout
    this.applyLayout();

    // Re-render the mindmap
    this.renderer.render(this.container);
  }
  else if (eventType === 'debug') {
    // Output node and its properties to console for debugging
    this.debugNodeProperties(nodeId);
  }
}

/**
 * Debug node properties - outputs node and its effective properties to console
 * @param {string} nodeId - The ID of the node to debug
 */
debugNodeProperties(nodeId) {
  const node = this.model.findNodeById(nodeId);
  if (!node) {
    console.warn(`Node not found with ID: ${nodeId}`);
    return;
  }

  // List of properties to check and display
  const properties = [
    'layoutType',
    'direction',
    'parentConnectionPoints',
    'fontSize',
    'fontWeight',
    'fontFamily',
    'backgroundColor',
    'textColor',
    'borderColor',
    'borderWidth',
    'borderRadius',
    'nodeType',
    'connectionColor',
    'connectionWidth',
    'parentPadding',
    'childPadding'
  ];

  // Create an object to hold the effective properties
  const effectiveProperties = {};

  // Get the effective value for each property
  properties.forEach(prop => {
    effectiveProperties[prop] = this.styleManager.getEffectiveValue(node, prop);
  });

  // Output the node and its properties to console
  console.group(`Node: ${node.text} (ID: ${node.id}, Level: ${node.level})`);
  console.log('Node object:', node);
  console.log('Node style overrides:', node.configOverrides);
  console.log('StyleManager:', this.styleManager);
  console.log('Effective properties:', effectiveProperties);

  // Show inheritance chain for direction property as an example
  this.logPropertyInheritanceChain(node, 'direction');

  console.groupEnd();
}

/**
 * Log the inheritance chain for a specific property
 * @param {Node} node - The node to check
 * @param {string} property - The property to trace
 */
logPropertyInheritanceChain(node, property) {
  console.group(`Inheritance chain for "${property}"`);

  let currentNode = node;
  let value;
  let level = 0;

  while (currentNode) {
    // Check for direct override on this node
    if (currentNode.configOverrides && property in currentNode.configOverrides) {
      value = currentNode.configOverrides[property];
      console.log(`Level ${level}: Node "${currentNode.text}" - Override: ${value}`);
    } else {
      // Get from level style
      const levelStyle = this.styleManager.getLevelStyle(currentNode.level);
      value = levelStyle[property];
      console.log(`Level ${level}: Node "${currentNode.text}" - From level style: ${value}`);
    }

    // Move up to parent
    currentNode = currentNode.parent;
    level++;
  }

  console.groupEnd();
}

  /**
   * Handle layout type change
   * @param {string} layoutType - The new layout type
   */
  handleLayoutChange(layoutType) {
    console.log('handleLayoutChange(', layoutType, ')');
    
    // Always start by clearing all node overrides to ensure consistent behavior
    const rootNode = this.model.getRoot();
    if (rootNode) {
      rootNode.clearOverridesRecursive();
    }

    // Handle specialized layout configurations
    if (layoutType === 'vertical-over-taproot') {
      // Configure style system
      this.styleManager.configure({
        levelStyles: {
          1: { layoutType: 'vertical', direction: 'down', parentConnectionPoints: 'distributeEvenly' },
          2: { layoutType: 'taproot' },
          3: { layoutType: 'horizontal' },
          4: { layoutType: 'horizontal' },
          default: { layoutType: 'horizontal' }
        }
      });
      
      // Set node overrides
      if (rootNode) {
        rootNode.setOverride('layoutType', 'vertical');
        rootNode.setOverride('direction', 'down');
        rootNode.setOverride('parentConnectionPoints', 'distributeEvenly');
      }
    } else if (layoutType === 'taproot') {
      // Configure style system
      this.styleManager.configure({
        levelStyles: {
          1: { layoutType: 'taproot' },
          2: { layoutType: 'horizontal', direction: null },
          3: { layoutType: 'horizontal', direction: null },
          4: { layoutType: 'horizontal', direction: null },
          default: { layoutType: 'horizontal' }
        }
      });
    } else if (layoutType === 'classic') {
      // Configure style system for classic mindmap layout
      this.styleManager.configure({
        levelStyles: {
          1: { layoutType: 'classic', childPadding: 60 },
          2: { layoutType: 'horizontal', direction: null },
          3: { layoutType: 'horizontal', direction: null },
          4: { layoutType: 'horizontal', direction: null },
          default: { layoutType: 'horizontal' }
        }
      });
    } else if (layoutType === 'horizontal-left') {
      // Configure style system
      this.styleManager.setGlobalLayoutType('horizontal', { direction: 'left' });
      
      // Set node overrides
      if (rootNode) {
        rootNode.setOverride('direction', 'left');
      }
    } else if (layoutType === 'horizontal-right') {
      // Configure style system
      this.styleManager.setGlobalLayoutType('horizontal', { direction: 'right' });
      
      // Set node overrides
      if (rootNode) {
        rootNode.setOverride('direction', 'right');
      }
    } else if (layoutType === 'vertical-up') {
      // Configure style system
      this.styleManager.configure({
        levelStyles: {
          1: { layoutType: 'vertical', direction: 'up', parentConnectionPoints: 'distributeEvenly' },
          2: { layoutType: 'vertical', direction: 'up', parentConnectionPoints: 'distributeEvenly' },
          3: { layoutType: 'vertical', direction: 'up', parentConnectionPoints: 'distributeEvenly' },
          4: { layoutType: 'vertical', direction: 'up', parentConnectionPoints: 'distributeEvenly' },
          default: { layoutType: 'vertical', direction: 'up', parentConnectionPoints: 'distributeEvenly' }
        }
      });
      
      // Set node overrides
      if (rootNode) {
        rootNode.setOverride('layoutType', 'vertical');
        rootNode.setOverride('direction', 'up');
        rootNode.setOverride('parentConnectionPoints', 'distributeEvenly');
      }
    } else if (layoutType === 'vertical' || layoutType === 'vertical-down') {
      // Configure style system
      this.styleManager.configure({
        levelStyles: {
          1: { layoutType: 'vertical', direction: 'down', parentConnectionPoints: 'distributeEvenly' },
          2: { layoutType: 'vertical', direction: 'down', parentConnectionPoints: 'distributeEvenly' },
          3: { layoutType: 'vertical', direction: 'down', parentConnectionPoints: 'distributeEvenly' },
          4: { layoutType: 'vertical', direction: 'down', parentConnectionPoints: 'distributeEvenly' },
          default: { layoutType: 'vertical', direction: 'down', parentConnectionPoints: 'distributeEvenly' }
        }
      });
      
      // Set node overrides
      if (rootNode) {
        rootNode.setOverride('layoutType', 'vertical');
        rootNode.setOverride('direction', 'down');
        rootNode.setOverride('parentConnectionPoints', 'distributeEvenly');
      }
    } else {
      // Default case - use whatever layout type was provided
      this.styleManager.setGlobalLayoutType(layoutType);
    }

    // Apply the new layout
    this.applyLayout();

    // Re-render the mindmap
    this.renderer.render(this.container);
  }

  /**
   * Handle style preset change
   * @param {string} presetName - The name of the preset
   */
  handleStyleChange(presetName) {
    console.log('handleStyleChange(', presetName, ')');

    // Apply the style preset
    MindmapStylePresets.applyPreset(presetName, this.styleManager);

    // Reapply layout since style properties might affect positioning
    this.applyLayout();

    // Re-render the mindmap
    this.renderer.render(this.container);
  }

  /**
   * Export the mindmap to SVG
   * @param {string} filename - The filename for the export
   * @returns {Promise<void>} A promise that resolves when export is complete
   */
  exportToSVG(filename) {
    return new Promise((resolve, reject) => {
      try {
        // Get SVG content with a small delay to ensure it's ready
        setTimeout(() => {
          const svgContent = this.container.dataset.svgContent;

          if (!svgContent) {
            console.warn('No SVG content available for export');
            reject(new Error('No SVG content available'));
            return;
          }

          // Create a Blob with the SVG content
          const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(svgBlob);

          // Create a download link and trigger it
          const a = document.createElement('a');
          a.href = url;
          a.download = filename || 'mindmap.svg';

          // Set specific attributes to help with download
          a.rel = 'noopener';
          a.style.display = 'none';

          // Add to body, click, and handle cleanup
          document.body.appendChild(a);

          // Use a small timeout to ensure the browser processes the attachment
          setTimeout(() => {
            a.click();

            // Clean up after a short delay
            setTimeout(() => {
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              resolve();
            }, 100);
          }, 50);
        }, 100);
      } catch (error) {
        console.error('SVG export failed:', error);
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