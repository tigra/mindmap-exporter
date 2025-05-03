// src/app.js

import MindmapModel from './model/mindmap-model.js';
import StyleManager from './style/style-manager.js';
import MindmapStylePresets from './style/style-presets.js';
//import StylePresetsAdapter from './style/style-presets-adapter.js';
import MindmapRenderer from './renderer/mindmap-renderer.js';
import MindmapController from './controller/mindmap-controller.js';

//StyleManager = window.StyleManager;

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
   * @param {string} options.loadingIndicator - The ID of the loading indicator
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
      loadingIndicator: "loading-indicator",
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
    this.loadingIndicator = document.getElementById(this.options.loadingIndicator);

    if (!this.container || !this.markdownInput) {
      console.error('Required DOM elements not found');
      return;
    }

   // Sample data
    this.markdownInput.value = `# Project Planning
## Research
- competitive landscape
    - existing mindmap apps on the market
        - open source
           - Xmind
              - pros
                - open source
                - more feature rich then FreeMind
              - cons
                - doesn't have a really future-proof file format
                - 5555555555
        - proprietary
    - subbullet 2
        - subsub, again
            - 1111111
            - 2222222222222 2222222222
               - 333333
                 - 3
### Market Analysis
### Technical Feasibility
## Design
### UI/UX Design
### System Architecture
#### Class Diagram
#### Deployment Diagram
- browser
- browser
- and only browser
## Development
### Frontend
- markdown parsing
  - support for
    - headings
    - bullet-point lists
- layout algorithms
- styling
- interactivity
### Backend
* not needed
## Testing
- Regression
- Functional
- Performance
`;

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
    if (this.layoutType) {
      this.layoutType.addEventListener('change', () => {
//              this.controller.handleStyleChange(this.stylePreset.value);
        this.controller.handleLayoutChange(this.layoutType.value);
        this.handleGenerate();
      });
    }

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
    if (!this.markdownInput || !this.container) {
        this.loadingIndicator.style.display = 'none';
        return;
    }

    const markdown = this.markdownInput.value.trim();
    if (!markdown) {
      console.warn('No markdown content to generate mindmap');
      this.loadingIndicator.style.display = 'none';
      return;
    }

    // Parse markdown
    this.model.parseFromMarkdown(markdown);
    if (!this.model.getRoot()) {
        this.loadingIndicator.style.display = 'none';
        return;
    }

    this.loadingIndicator.textContent = 'Generating mindmap...';
    this.loadingIndicator.style.display = 'block';

    var style = window.styleManager;
    const presetName = this.stylePreset.value;
    MindmapStylePresets.applyPreset(presetName, style);

//    style.setGlobalLayoutType(this.layoutType.value);
    // TODO factor out this behavoir, find the proper class responsible for it
    const layoutType = this.layoutType.value;
    this.model.getRoot().clearOverridesRecursive();
    if (layoutType === 'horizontal-left') {
      style.setGlobalLayoutType('horizontal', {direction: 'left'});
    } else if (layoutType === 'horizontal-right') {
      style.setGlobalLayoutType('horizontal', {direction: 'right'});
    } else if (layoutType === 'taproot') {
      console.log('applying taprooty...');
      style.configure({
        1: {
           layoutType: 'taproot'
        },
        2: {
           layoutType: 'horizontal'
        },
        3: {
           layoutType: 'horizontal'
        },
        4: {
           layoutType: 'horizontal'
        },
        default: {
           layoutType: 'horizontal'
        },
      });
    } else if (layoutType === 'vertical-over-taproot') {
      console.log('applying vertical over taproot...');
      style.configure({
        1: {
           layoutType: 'vertical',
           direction: 'down'
        },
        2: {
           layoutType: 'taproot'
        },
        3: {
           layoutType: 'horizontal'
        },
        4: {
           layoutType: 'horizontal'
        },
        default: {
           layoutType: 'horizontal'
        },
      });
    } else if (layoutType === 'vertical-down' || layoutType === 'vertical') {
             style.configure({
        1: {
           layoutType: 'vertical',
           direction: 'down'
        },
        2: {
           layoutType: 'vertical',
           direction: 'down'
        },
        3: {
           layoutType: 'vertical',
           direction: 'down'
        },
        4: {
           layoutType: 'vertical',
           direction: 'down'
        },
        default: {
           layoutType: 'vertical',
           direction: 'down'
        },
      });
    }else if(layoutType === 'vertical-up') {
                    style.configure({
        1: {
           layoutType: 'vertical',
           direction: 'up'
        },
        2: {
           layoutType: 'vertical',
           direction: 'up'
        },
        3: {
           layoutType: 'vertical',
           direction: 'up'
        },
        4: {
           layoutType: 'vertical',
           direction: 'up'
        },
        default: {
           layoutType: 'vertical',
           direction: 'up'
        },
      });
    } else {
      style.setGlobalLayoutType(layoutType);
    }
//    console.log(style.getLevelStyle(1));
    const layout = style.getLevelStyle(1).getLayout();

    // Always clear overrides before setting new ones to avoid inconsistent behavior
    this.model.getRoot().clearOverridesRecursive();
    
    // Now set specific overrides based on layout type
    if (layoutType === 'horizontal-left') {
        this.model.getRoot().setOverride('direction', 'left');
    } else if (layoutType === 'horizontal-right') {
        this.model.getRoot().setOverride('direction', 'right');
    } else if (layoutType === 'vertical-up') {
        this.model.getRoot().setOverride('direction', 'up');
        this.model.getRoot().setOverride('layoutType', 'vertical');
    } else if (layoutType === 'vertical-down' || layoutType === 'vertical') {
        this.model.getRoot().setOverride('direction', 'down');
        this.model.getRoot().setOverride('layoutType', 'vertical');
    } else if (layoutType === 'vertical-over-taproot') {
        this.model.getRoot().setOverride('layoutType', 'vertical');
        this.model.getRoot().setOverride('direction', 'down');
    } else {
        this.model.getRoot().clearOverridesRecursive();
    }
    layout.applyLayout(this.model.getRoot(), 0, 0, style);

    // Apply style preset
    if (this.stylePreset) {
      this.controller.handleStyleChange(this.stylePreset.value);
      // TODO make it steerable through the UI
//      style.configure({
//        levelStyles: {
//            1: {boundingBox: true},
//            2: {boundingBox: true},
////            3: {boundingBox: true},
////            4: {boundingBox: true}
//        },
//        default: {boundingBox: true},
//      });
    }

    // Apply layout type
    if (this.layoutType) {
      this.controller.handleLayoutChange(this.layoutType.value);
    }

    // Render the mindmap
    this.controller.initialize();
    this.loadingIndicator.style.display = 'none';

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

if (window !== null) {
    window.MindmapApp = MindmapApp;
}

export default MindmapApp;