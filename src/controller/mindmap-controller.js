// src/controller/mindmap-controller.js

import eventBridge from '../utils/event-bridge.js';
import MindmapStylePresets from '../style/style-presets.js';
import DragDropManager from './drag-drop-manager.js';
import LayoutFactory from '../layout/layout-factory.js';
import NavigationOverrideManager from '../utils/navigation-override-manager.js';

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

    // Initialize drag and drop manager
    this.dragDropManager = null;

    // Initialize navigation override manager
    this.navigationOverrideManager = null;

    // Selected node state
    this.selectedNodeId = null;

    // Track if keyboard navigation is initialized
    this.keyboardNavigationInitialized = false;

    // Throttle navigation to prevent rapid-fire events
    this.lastNavigationTime = 0;
    this.navigationThrottleMs = 150; // Minimum time between navigation actions

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

    // Initialize drag and drop after rendering
    this.initDragDrop();

    // Initialize navigation override manager
    this.initNavigationOverrideManager();

    // Initialize keyboard navigation
    this.initKeyboardNavigation();
  }

  /**
   * Re-render the mindmap without re-parsing markdown
   * Used after drag and drop operations to preserve model changes
   */
  rerenderMindmap() {
    console.log('=== RERENDER MINDMAP DEBUG ===');
    console.log('About to apply layout to existing model...');
    
    // Apply layout to the existing model
    this.applyLayout();
    console.log('Layout applied. About to render...');

    // Re-render with the updated model
    this.renderer.render(this.container);
    console.log('Rendering complete. About to re-initialize drag and drop...');

    // Re-initialize drag and drop with new DOM elements
    this.initDragDrop();
    console.log('Drag and drop re-initialized.');

    // Re-initialize navigation override manager
    this.initNavigationOverrideManager();
    console.log('Navigation override manager re-initialized.');
    console.log('=== END RERENDER MINDMAP DEBUG ===');
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
    
    // Regenerate all node IDs to ensure they remain consistent between renders
    // This is important for keeping SVG element IDs stable across exports
    this.model.regenerateAllIds();
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
   * Initialize drag and drop functionality
   */
  initDragDrop() {
    // Clean up existing drag drop manager if it exists
    if (this.dragDropManager) {
      this.dragDropManager.destroy();
    }

    // Create new drag drop manager
    this.dragDropManager = new DragDropManager(
      this.model,
      this.renderer,
      this,
      this.container
    );

    console.log('Drag and drop functionality initialized');
  }

  /**
   * Initialize navigation override manager
   */
  initNavigationOverrideManager() {
    // Clean up existing navigation override manager if it exists
    if (this.navigationOverrideManager) {
      this.navigationOverrideManager.destroy();
    }

    // Create new navigation override manager
    this.navigationOverrideManager = new NavigationOverrideManager(
      this.model,
      this.renderer,
      this,
      this.container
    );

    console.log('Navigation override manager initialized');
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
  else if (eventType === 'select') {
    // Select the node
    this.selectNode(nodeId);
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
    console.log(`LAYOUT CHANGE: Switching to ${layoutType} layout`);
    
    // Reset the styleManager to its initial state before applying new layout
    this.styleManager.reset();
    
    // Apply current style preset to the reset styleManager
    const styleSelectElement = document.getElementById('style-preset');
    if (styleSelectElement) {
      const currentPreset = styleSelectElement.value;
      MindmapStylePresets.applyPreset(currentPreset, this.styleManager);
    }
    
    // Always start by clearing all node overrides to ensure consistent behavior
    const rootNode = this.model.getRoot();
    if (rootNode) {
      console.log(`LAYOUT CHANGE: Clearing all layout overrides`);
      rootNode.clearOverridesRecursive();
    }

    // Handle specialized layout configurations
    if (layoutType === 'vertical-over-taproot') {
      // Configure style system
      this.styleManager.configure({
        levelStyles: {
          1: { 
            layoutType: 'vertical', 
            direction: 'down', 
            parentConnectionPoints: 'distributeEvenly',
            parentWidthPortionForConnectionPoints: 0.75
          },
          2: { 
            layoutType: 'taproot',
            parentConnectionPoints: 'distributeEvenly',
            parentWidthPortionForConnectionPoints: 0.4
          },
          3: { layoutType: 'horizontal' },
          4: { layoutType: 'horizontal' },
          5: { layoutType: 'horizontal' },
          6: { layoutType: 'horizontal' }
        },
        defaultStyle: { 
          layoutType: 'horizontal' 
        }
      });
      
      // Set node overrides
      if (rootNode) {
        rootNode.setOverride('layoutType', 'vertical');
        rootNode.setOverride('direction', 'down');
        rootNode.setOverride('parentConnectionPoints', 'distributeEvenly');
        rootNode.setOverride('parentWidthPortionForConnectionPoints', 0.75);
      }
    } else if (layoutType === 'taproot') {
      // Configure style system
      this.styleManager.configure({
        levelStyles: {
          1: { 
            layoutType: 'taproot', 
            parentConnectionPoints: 'distributeEvenly',
            parentWidthPortionForConnectionPoints: 0.4 
          },
          2: { layoutType: 'horizontal', direction: null },
          3: { layoutType: 'horizontal', direction: null },
          4: { layoutType: 'horizontal', direction: null },
          5: { layoutType: 'horizontal', direction: null },
          6: { layoutType: 'horizontal', direction: null }
        },
        defaultStyle: { 
          layoutType: 'horizontal' 
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
          5: { layoutType: 'horizontal', direction: null },
          6: { layoutType: 'horizontal', direction: null }
        },
        defaultStyle: { 
          layoutType: 'horizontal' 
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
    } else if (layoutType === 'outline-left') {
      // Configure style system for outline left layout
      this.styleManager.configure({
        levelStyles: {
          1: { layoutType: 'outline', direction: 'left', horizontalShift: 50 },
          2: { layoutType: 'outline', direction: 'left', horizontalShift: 50 },
          3: { layoutType: 'outline', direction: 'left', horizontalShift: 50 },
          4: { layoutType: 'outline', direction: 'left', horizontalShift: 50 },
          5: { layoutType: 'outline', direction: 'left', horizontalShift: 50 },
          6: { layoutType: 'outline', direction: 'left', horizontalShift: 50 }
        },
        defaultStyle: { 
          layoutType: 'outline', 
          direction: 'left', 
          horizontalShift: 50 
        }
      });
      
      // Set node overrides
      if (rootNode) {
        rootNode.setOverride('layoutType', 'outline');
        rootNode.setOverride('direction', 'left');
        rootNode.setOverride('horizontalShift', 50);
      }
    } else if (layoutType === 'outline-right') {
      // Configure style system for outline right layout
      this.styleManager.configure({
        levelStyles: {
          1: { layoutType: 'outline', direction: 'right', horizontalShift: 50 },
          2: { layoutType: 'outline', direction: 'right', horizontalShift: 50 },
          3: { layoutType: 'outline', direction: 'right', horizontalShift: 50 },
          4: { layoutType: 'outline', direction: 'right', horizontalShift: 50 },
          5: { layoutType: 'outline', direction: 'right', horizontalShift: 50 },
          6: { layoutType: 'outline', direction: 'right', horizontalShift: 50 }
        },
        defaultStyle: { 
          layoutType: 'outline', 
          direction: 'right', 
          horizontalShift: 50 
        }
      });
      
      // Set node overrides
      if (rootNode) {
        rootNode.setOverride('layoutType', 'outline');
        rootNode.setOverride('direction', 'right');
        rootNode.setOverride('horizontalShift', 50);
      }
    } else if (layoutType === 'vertical-up') {
      // Configure style system
      this.styleManager.configure({
        levelStyles: {
          1: { layoutType: 'vertical', direction: 'up', parentConnectionPoints: 'distributeEvenly', parentWidthPortionForConnectionPoints: 0.75 },
          2: { layoutType: 'vertical', direction: 'up', parentConnectionPoints: 'distributeEvenly', parentWidthPortionForConnectionPoints: 0.75 },
          3: { layoutType: 'vertical', direction: 'up', parentConnectionPoints: 'distributeEvenly', parentWidthPortionForConnectionPoints: 0.75 },
          4: { layoutType: 'vertical', direction: 'up', parentConnectionPoints: 'distributeEvenly', parentWidthPortionForConnectionPoints: 0.75 },
          5: { layoutType: 'vertical', direction: 'up', parentConnectionPoints: 'distributeEvenly', parentWidthPortionForConnectionPoints: 0.75 },
          6: { layoutType: 'vertical', direction: 'up', parentConnectionPoints: 'distributeEvenly', parentWidthPortionForConnectionPoints: 0.75 }
        },
        defaultStyle: { 
          layoutType: 'vertical', 
          direction: 'up', 
          parentConnectionPoints: 'distributeEvenly', 
          parentWidthPortionForConnectionPoints: 0.75 
        }
      });
      
      // Set node overrides
      if (rootNode) {
        rootNode.setOverride('layoutType', 'vertical');
        rootNode.setOverride('direction', 'up');
        rootNode.setOverride('parentConnectionPoints', 'distributeEvenly');
        rootNode.setOverride('parentWidthPortionForConnectionPoints', 0.75);
      }
    } else if (layoutType === 'vertical' || layoutType === 'vertical-down') {
      // Configure style system
      this.styleManager.configure({
        levelStyles: {
          1: { layoutType: 'vertical', direction: 'down', parentConnectionPoints: 'distributeEvenly', parentWidthPortionForConnectionPoints: 0.75 },
          2: { layoutType: 'vertical', direction: 'down', parentConnectionPoints: 'distributeEvenly', parentWidthPortionForConnectionPoints: 0.75 },
          3: { layoutType: 'vertical', direction: 'down', parentConnectionPoints: 'distributeEvenly', parentWidthPortionForConnectionPoints: 0.75 },
          4: { layoutType: 'vertical', direction: 'down', parentConnectionPoints: 'distributeEvenly', parentWidthPortionForConnectionPoints: 0.75 },
          5: { layoutType: 'vertical', direction: 'down', parentConnectionPoints: 'distributeEvenly', parentWidthPortionForConnectionPoints: 0.75 },
          6: { layoutType: 'vertical', direction: 'down', parentConnectionPoints: 'distributeEvenly', parentWidthPortionForConnectionPoints: 0.75 }
        },
        defaultStyle: { 
          layoutType: 'vertical', 
          direction: 'down', 
          parentConnectionPoints: 'distributeEvenly', 
          parentWidthPortionForConnectionPoints: 0.75 
        }
      });
      
      // Set node overrides
      if (rootNode) {
        rootNode.setOverride('layoutType', 'vertical');
        rootNode.setOverride('direction', 'down');
        rootNode.setOverride('parentConnectionPoints', 'distributeEvenly');
        rootNode.setOverride('parentWidthPortionForConnectionPoints', 0.75);
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

    // Reset the styleManager to its initial state before applying new style
    this.styleManager.reset();
    
    // Apply the style preset to the reset styleManager
    MindmapStylePresets.applyPreset(presetName, this.styleManager);
    
    // Reapply the current layout type after style change
    const layoutSelectElement = document.getElementById('layout-type');
    if (layoutSelectElement) {
      // Get current layout type but don't trigger full handleLayoutChange
      const currentLayout = layoutSelectElement.value;
      console.log(`Reapplying layout type: ${currentLayout} after style change`);

      this.handleLayoutChange(currentLayout);
//      // Apply appropriate layout configuration
//      if (['vertical-over-taproot', 'taproot', 'classic', 'horizontal-left',
//           'horizontal-right', 'vertical-up', 'vertical', 'vertical-down'].includes(currentLayout)) {
//        // For specialized layouts, we need to reapply the configurations from handleLayoutChange
//        this.handleLayoutChange(currentLayout);
//        return; // handleLayoutChange already handles applyLayout and render
//      } else {
//        // For basic layouts, we can just set the global layout type
//        this.styleManager.setGlobalLayoutType(currentLayout);
//      }
    }

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
        // Log node IDs to verify consistency between exports - helpful for debugging
        console.log('Node IDs before export:');
        this._logNodeIds();
        
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
   * Log the IDs of all nodes in the mindmap
   * Useful for testing ID stability between renders
   * @private
   */
  _logNodeIds() {
    const rootNode = this.model.getRoot();
    if (!rootNode) {
      console.log('No root node found');
      return;
    }
    
    const nodeIds = {};
    this._collectNodeIds(rootNode, nodeIds);
    
    console.table(nodeIds);
  }
  
  /**
   * Recursively collect node IDs for testing stability
   * @private
   * @param {Node} node - The current node
   * @param {Object} result - The object to collect results in
   */
  _collectNodeIds(node, result) {
    if (!node) return;
    
    // Add this node's ID and text to the result
    result[node.text] = node.id;
    
    // Process all children
    for (let i = 0; i < node.children.length; i++) {
      this._collectNodeIds(node.children[i], result);
    }
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

  /**
   * Export the current mindmap as a Markdown file
   * @param {string} filename - The filename for the exported markdown file
   */
  exportToMarkdown(filename) {
    const markdownContent = this.model.toMarkdown();
    
    if (!markdownContent) {
      console.warn('No mindmap content available for markdown export');
      return;
    }

    // Create blob and trigger download
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'mindmap.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('Markdown exported successfully');
  }

  /**
   * Export navigation test data
   * @param {string} filename - The filename for the exported test data
   */
  exportNavigationTestData(filename) {
    if (!this.navigationOverrideManager) {
      console.warn('Navigation override manager not available');
      return;
    }

    const testData = this.navigationOverrideManager.exportNavigationData();
    const jsonContent = JSON.stringify(testData, null, 2);

    // Create blob and trigger download
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'navigation-test-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('Navigation test data exported successfully');
  }

  /**
   * Select a node
   * @param {string} nodeId - The ID of the node to select
   */
  selectNode(nodeId) {
    if (this.selectedNodeId === nodeId) return;
    
    this.selectedNodeId = nodeId;
    this.updateSelectionVisual();
  }

  /**
   * Select a node and ensure it's visible (used for navigation)
   * @param {string} nodeId - The ID of the node to select
   */
  selectNodeAndMakeVisible(nodeId) {
    if (this.selectedNodeId === nodeId) return;
    
    this.selectedNodeId = nodeId;
    this.updateSelectionVisual();
    
    // Find the node and make it visible
    const selectedNode = this.model.findNodeById(nodeId);
    if (selectedNode) {
      this.scrollToMakeNodeVisible(selectedNode);
    }
  }

  /**
   * Clear the current selection
   */
  clearSelection() {
    this.selectedNodeId = null;
    this.updateSelectionVisual();
  }

  /**
   * Get the currently selected node
   * @returns {Object|null} The selected node or null if none selected
   */
  getSelectedNode() {
    if (!this.selectedNodeId) return null;
    return this.model.findNodeById(this.selectedNodeId);
  }

  /**
   * Update the visual selection indicator
   */
  updateSelectionVisual() {
    this.renderer.updateSelectionIndicator(this.selectedNodeId);
  }

  /**
   * Force refresh the selection indicator to resync coordinates
   * Useful after renders that might cause coordinate drift
   */
  refreshSelectionIndicator() {
    console.log(`MindmapController.refreshSelectionIndicator: Forcing selection indicator refresh`);
    if (this.selectedNodeId) {
      // Small delay to ensure DOM is stable
      setTimeout(() => {
        this.updateSelectionVisual();
      }, 20);
    }
  }

  /**
   * Expand a collapsed node
   * @param {Object} node - The node to expand
   */
  async expandNode(node) {
    if (node && node.collapsed && node.children && node.children.length > 0) {
      console.log(`MindmapController.expandNode: Expanding node "${node.text}"`);
      node.collapsed = false;
      
      // Re-apply layout and re-render to show expanded children
      this.applyLayout();
      await this.renderer.render(this.container);
      
      // Update selection visual after render is complete and new SVG is positioned
      // Add small delay to ensure DOM is fully updated
      setTimeout(() => {
        this.updateSelectionVisual();
      }, 10);
      
      console.log(`MindmapController.expandNode: Node "${node.text}" expanded successfully`);
    } else {
      console.log(`MindmapController.expandNode: Node cannot be expanded (not collapsed, no children, or null)`);
    }
  }

  /**
   * Check if a node is fully visible in the viewport
   * @param {Object} node - The node to check
   * @returns {boolean} True if the node is fully visible
   */
  isNodeFullyVisible(node) {
    if (!node || !node.x || node.x === undefined || node.y === undefined) {
      console.log(`MindmapController.isNodeFullyVisible: Node has no position data`);
      return true; // Assume visible if no position data
    }

    const container = this.container;
    const containerRect = container.getBoundingClientRect();
    
    // Get the current scroll position
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;
    
    // Calculate node's position relative to the container viewport
    // Note: node coordinates are in SVG space, we need to account for padding
    const nodeLeft = node.x + 20; // Add container padding
    const nodeTop = node.y + 20;  // Add container padding
    const nodeRight = nodeLeft + (node.width || 0);
    const nodeBottom = nodeTop + (node.height || 0);
    
    // Define obstructing UI element areas that reduce usable viewport
    const helpButtonArea = {
      left: 0,
      top: 0, 
      right: 60,  // Help button (28px) + tooltip potential (wider, add safety margin)
      bottom: 50  // Help button + safety margin
    };
    
    const exportControlsHeight = 50; // Estimated height of export controls at bottom
    
    // Calculate effective viewport boundaries accounting for obstructions
    const viewportLeft = scrollLeft + helpButtonArea.left;
    const viewportTop = scrollTop + helpButtonArea.top;
    const viewportRight = scrollLeft + containerRect.width - 15; // Account for potential scrollbar
    const viewportBottom = scrollTop + containerRect.height - exportControlsHeight;
    
    // Exclude help button area from top-left corner
    const effectiveLeft = Math.max(viewportLeft, scrollLeft + helpButtonArea.right);
    const effectiveTop = Math.max(viewportTop, scrollTop + helpButtonArea.bottom);
    
    const isVisible = nodeLeft >= effectiveLeft && 
                      nodeTop >= effectiveTop && 
                      nodeRight <= viewportRight && 
                      nodeBottom <= viewportBottom;
    
    console.log(`MindmapController.isNodeFullyVisible: Node "${node.text}" bounds: [${nodeLeft}, ${nodeTop}, ${nodeRight}, ${nodeBottom}], effective viewport: [${effectiveLeft}, ${effectiveTop}, ${viewportRight}, ${viewportBottom}], visible: ${isVisible}`);
    
    return isVisible;
  }

  /**
   * Calculate minimal scroll to make a node fully visible
   * @param {Object} node - The node to make visible
   * @returns {Object} Object with {scrollLeft, scrollTop} for minimal scroll
   */
  calculateMinimalScroll(node) {
    if (!node || !node.x || node.x === undefined || node.y === undefined) {
      console.log(`MindmapController.calculateMinimalScroll: Node has no position data`);
      return { scrollLeft: this.container.scrollLeft, scrollTop: this.container.scrollTop };
    }

    const container = this.container;
    const containerRect = container.getBoundingClientRect();
    
    // Current scroll position
    let newScrollLeft = container.scrollLeft;
    let newScrollTop = container.scrollTop;
    
    // Calculate node's position relative to the container (including padding)
    const nodeLeft = node.x + 20; // Add container padding
    const nodeTop = node.y + 20;  // Add container padding
    const nodeRight = nodeLeft + (node.width || 0);
    const nodeBottom = nodeTop + (node.height || 0);
    
    // Define obstructing UI elements and safety margins
    const helpButtonArea = {
      left: 0,
      top: 0,
      right: 60,  // Help button + tooltip potential width + safety margin
      bottom: 50  // Help button height + safety margin
    };
    
    const exportControlsHeight = 50; // Height of export controls at bottom
    const scrollbarWidth = 15; // Potential scrollbar width
    
    // Calculate effective viewport with obstructions accounted for
    const effectiveViewportLeft = container.scrollLeft;
    const effectiveViewportTop = container.scrollTop;
    const effectiveViewportRight = container.scrollLeft + containerRect.width - scrollbarWidth;
    const effectiveViewportBottom = container.scrollTop + containerRect.height - exportControlsHeight;
    
    // Enhanced margins for better UX, accounting for UI obstructions
    const baseMarginX = Math.max(containerRect.width * 0.05, 20); // At least 20px margin
    const baseMarginY = Math.max(containerRect.height * 0.05, 20); // At least 20px margin
    
    // Additional margins for obstructed areas
    const leftMargin = Math.max(baseMarginX, helpButtonArea.right);
    const topMargin = Math.max(baseMarginY, helpButtonArea.bottom);
    const rightMargin = baseMarginX;
    const bottomMargin = baseMarginY;
    
    // Check if we need to scroll horizontally
    if (nodeLeft < effectiveViewportLeft + leftMargin) {
      // Node is too far left or behind help button, scroll left
      newScrollLeft = Math.max(0, nodeLeft - leftMargin);
    } else if (nodeRight > effectiveViewportRight - rightMargin) {
      // Node is too far right, scroll right
      newScrollLeft = nodeRight - containerRect.width + scrollbarWidth + rightMargin;
    }
    
    // Check if we need to scroll vertically
    if (nodeTop < effectiveViewportTop + topMargin) {
      // Node is too far up or behind help button, scroll up
      newScrollTop = Math.max(0, nodeTop - topMargin);
    } else if (nodeBottom > effectiveViewportBottom - bottomMargin) {
      // Node is too far down or behind export controls, scroll down
      newScrollTop = nodeBottom - containerRect.height + exportControlsHeight + bottomMargin;
    }
    
    console.log(`MindmapController.calculateMinimalScroll: Node "${node.text}" needs scroll from [${container.scrollLeft}, ${container.scrollTop}] to [${newScrollLeft}, ${newScrollTop}] (accounting for UI obstructions)`);
    
    return { scrollLeft: newScrollLeft, scrollTop: newScrollTop };
  }

  /**
   * Scroll the container to make a node fully visible with minimal movement
   * @param {Object} node - The node to make visible
   */
  scrollToMakeNodeVisible(node) {
    if (!node) {
      console.log(`MindmapController.scrollToMakeNodeVisible: No node provided`);
      return;
    }

    // Check if the node is already fully visible
    if (this.isNodeFullyVisible(node)) {
      console.log(`MindmapController.scrollToMakeNodeVisible: Node "${node.text}" is already fully visible`);
      return;
    }

    // Calculate minimal scroll needed
    const { scrollLeft, scrollTop } = this.calculateMinimalScroll(node);
    
    // Apply smooth scrolling
    this.container.scrollTo({
      left: scrollLeft,
      top: scrollTop,
      behavior: 'smooth'
    });
    
    console.log(`MindmapController.scrollToMakeNodeVisible: Smoothly scrolled to make node "${node.text}" visible`);
  }

  /**
   * Initialize keyboard navigation
   */
  initKeyboardNavigation() {
    // Prevent multiple event listeners
    if (this.keyboardNavigationInitialized) {
      console.log('Keyboard navigation already initialized, skipping');
      return;
    }

    console.log('Initializing keyboard navigation event listener');
    this.keyboardNavigationHandler = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        console.log(`Key event captured: ${e.key}`);
        e.preventDefault();
        e.stopPropagation();
        this.handleArrowKeyNavigation(e.key);
      }
    };

    document.addEventListener('keydown', this.keyboardNavigationHandler);
    this.keyboardNavigationInitialized = true;
  }

  /**
   * Handle arrow key navigation
   * @param {string} key - The arrow key pressed
   */
  async handleArrowKeyNavigation(key) {
    // Throttle navigation to prevent rapid-fire events
    const currentTime = Date.now();
    if (currentTime - this.lastNavigationTime < this.navigationThrottleMs) {
      console.log(`Navigation throttled (${currentTime - this.lastNavigationTime}ms since last navigation)`);
      return;
    }
    this.lastNavigationTime = currentTime;

    console.log(`=== NAVIGATION START: ${key} ===`);
    
    const currentNode = this.getSelectedNode();
    if (!currentNode) {
      console.log('MindmapController: No node selected, selecting root node');
      const rootNode = this.model.getRoot();
      if (rootNode) {
        console.log(`MindmapController: Selected root node: ${rootNode.text}`);
        this.selectNodeAndMakeVisible(rootNode.id);
      } else {
        console.log('MindmapController: No root node available');
      }
      return;
    }

    console.log(`MindmapController: Starting navigation from "${currentNode.text}" (${currentNode.id})`);

    // Check if we should expand the node instead of navigating
    if (this.shouldExpandOnKey(key, currentNode)) {
      console.log(`MindmapController: Expanding node instead of navigating`);
      await this.expandNode(currentNode);
      console.log(`=== EXPANSION SUCCESS ===`);
      return;
    }

    // Try layout-aware navigation first
    const layoutTargetNode = this.findNodeByLayoutLogic(currentNode, key);
    if (layoutTargetNode) {
      console.log(`MindmapController: Layout-aware navigation succeeded: ${key} -> "${layoutTargetNode.text}"`);
      this.selectNodeAndMakeVisible(layoutTargetNode.id);
      console.log(`=== NAVIGATION SUCCESS (layout-aware) ===`);
      return;
    }

    console.log('MindmapController: Layout-aware navigation returned null, falling back to spatial navigation');

    // Fall back to spatial navigation
    const targetNode = this.findNodeInDirection(currentNode, key);
    if (targetNode) {
      console.log(`MindmapController: Spatial navigation succeeded: ${key} -> "${targetNode.text}"`);
      this.selectNodeAndMakeVisible(targetNode.id);
      console.log(`=== NAVIGATION SUCCESS (spatial) ===`);
    } else {
      console.log('MindmapController: Spatial navigation also returned null');
      console.log(`=== NAVIGATION FAILED ===`);
    }
  }

  /**
   * Find node using layout-aware logic
   * @param {Object} currentNode - The current node
   * @param {string} key - The arrow key pressed
   * @returns {Object|null} The target node or null if none found
   */
  findNodeByLayoutLogic(currentNode, key) {
    // Get the layout type for the current node
    const layoutType = this.styleManager.getEffectiveValue(currentNode, 'layoutType');
    const levelStyle = this.styleManager.getLevelStyle(currentNode.level);
    
    console.log(`MindmapController.findNodeByLayoutLogic: layoutType="${layoutType}", level=${currentNode.level}`);
    
    // Create the appropriate layout instance
    const layout = LayoutFactory.createLayout(
      layoutType,
      levelStyle.parentPadding,
      levelStyle.childPadding
    );
    
    console.log(`MindmapController.findNodeByLayoutLogic: Created ${layout.constructor.name} instance`);
    console.log(`MindmapController.findNodeByLayoutLogic: Delegating to ${layout.constructor.name}.navigateByKey()`);
    
    // Delegate navigation to the layout
    const result = layout.navigateByKey(currentNode, key, this.styleManager);
    
    if (result) {
      console.log(`MindmapController.findNodeByLayoutLogic: ${layout.constructor.name}.navigateByKey() returned "${result.text}"`);
    } else {
      console.log(`MindmapController.findNodeByLayoutLogic: ${layout.constructor.name}.navigateByKey() returned null`);
    }
    
    return result;
  }

  /**
   * Check if the key press should expand a collapsed node instead of navigating
   * @param {string} key - The arrow key pressed
   * @param {Object} currentNode - The currently selected node
   * @returns {boolean} True if the node should be expanded, false otherwise
   */
  shouldExpandOnKey(key, currentNode) {
    // Get the layout type for the current node
    const layoutType = this.styleManager.getEffectiveValue(currentNode, 'layoutType');
    const levelStyle = this.styleManager.getLevelStyle(currentNode.level);
    
    console.log(`MindmapController.shouldExpandOnKey: layoutType="${layoutType}", level=${currentNode.level}`);
    
    // Create the appropriate layout instance
    const layout = LayoutFactory.createLayout(
      layoutType,
      levelStyle.parentPadding,
      levelStyle.childPadding
    );
    
    console.log(`MindmapController.shouldExpandOnKey: Created ${layout.constructor.name} instance`);
    console.log(`MindmapController.shouldExpandOnKey: Delegating to ${layout.constructor.name}.shouldExpandOnKey()`);
    
    // Delegate expansion check to the layout
    const result = layout.shouldExpandOnKey(key, currentNode, this.styleManager);
    
    console.log(`MindmapController.shouldExpandOnKey: ${layout.constructor.name}.shouldExpandOnKey() returned ${result}`);
    
    return result;
  }


  /**
   * Find the nearest node in the specified direction
   * @param {Object} currentNode - The current node
   * @param {string} direction - The direction key (ArrowUp, ArrowDown, etc.)
   * @returns {Object|null} The target node or null if none found
   */
  findNodeInDirection(currentNode, direction) {
    const allNodes = this.getAllNodes();
    const currentCenter = {
      x: currentNode.x + currentNode.width / 2,
      y: currentNode.y + currentNode.height / 2
    };

    let bestNode = null;
    let bestScore = Infinity;

    for (const node of allNodes) {
      if (node.id === currentNode.id) continue;

      const nodeCenter = {
        x: node.x + node.width / 2,
        y: node.y + node.height / 2
      };

      // Check if the node is in the correct direction
      const isInDirection = this.isNodeInDirection(currentCenter, nodeCenter, direction);
      if (!isInDirection) continue;

      // Calculate weighted distance that prioritizes alignment
      const score = this.calculateNavigationScore(currentCenter, nodeCenter, direction);
      if (score < bestScore) {
        bestScore = score;
        bestNode = node;
      }
    }

    return bestNode;
  }

  /**
   * Check if a node is in the specified direction from the current position
   * @param {Object} current - Current position {x, y}
   * @param {Object} target - Target position {x, y}
   * @param {string} direction - The direction key
   * @returns {boolean} True if the target is in the specified direction
   */
  isNodeInDirection(current, target, direction) {
    const threshold = 10; // Reduced tolerance for more precise navigation

    switch (direction) {
      case 'ArrowUp':
        return target.y < current.y - threshold;
      case 'ArrowDown':
        return target.y > current.y + threshold;
      case 'ArrowLeft':
        return target.x < current.x - threshold;
      case 'ArrowRight':
        return target.x > current.x + threshold;
      default:
        return false;
    }
  }

  /**
   * Calculate navigation score that prioritizes alignment with direction
   * @param {Object} current - Current position {x, y}
   * @param {Object} target - Target position {x, y}
   * @param {string} direction - The direction key
   * @returns {number} The navigation score (lower is better)
   */
  calculateNavigationScore(current, target, direction) {
    const dx = Math.abs(target.x - current.x);
    const dy = Math.abs(target.y - current.y);
    
    // Weight factors: primary axis has weight 1, secondary axis has weight 3
    // This makes nodes aligned with the direction much more attractive
    switch (direction) {
      case 'ArrowUp':
      case 'ArrowDown':
        // Vertical movement: prioritize nodes with similar X coordinate
        return Math.sqrt(dy*dy + (dx * dx * 4));
      case 'ArrowLeft':
      case 'ArrowRight':
        // Horizontal movement: prioritize nodes with similar Y coordinate
        return Math.sqrt(dx * dx + (dy * dy * 4));
      default:
        // Fallback to Euclidean distance
        return Math.sqrt(dx * dx + dy * dy);
    }
  }

  /**
   * Calculate distance between two points
   * @param {Object} point1 - First point {x, y}
   * @param {Object} point2 - Second point {x, y}
   * @returns {number} The distance
   */
  calculateDistance(point1, point2) {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get all visible nodes in the mindmap
   * @returns {Array} Array of all nodes
   */
  getAllNodes() {
    const nodes = [];
    this.collectNodesRecursive(this.model.getRoot(), nodes);
    return nodes;
  }

  /**
   * Recursively collect all visible nodes
   * @param {Object} node - The current node
   * @param {Array} nodes - Array to collect nodes into
   */
  collectNodesRecursive(node, nodes) {
    if (!node) return;
    
    nodes.push(node);
    
    // Only collect children if the node is not collapsed
    if (!node.collapsed) {
      for (const child of node.children) {
        this.collectNodesRecursive(child, nodes);
      }
    }
  }
}

// For backward compatibility
if (typeof window !== 'undefined') {
  window.MindmapController = MindmapController;
}

export default MindmapController;