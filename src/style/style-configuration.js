// src/style/style-configuration.js - Add StyleManager reference
import LayoutFactory from '../layout/layout-factory.js';

/**
 * Represents styling for a specific level in the mindmap
 */
class StyleConfiguration {
  /**
   * Create a new StyleConfiguration
   * @param {Object} options - Configuration options for this style
   * @param {StyleManager} styleManager - Reference to the StyleManager
   */
  constructor(options = {}, styleManager = null) {
    // Store reference to StyleManager
    this.styleManager = styleManager;

    // Font settings
    this.fontSize = options.fontSize || 14;
    this.fontWeight = options.fontWeight || 'normal';
    this.fontFamily = options.fontFamily || '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial, sans-serif';

    // Padding and spacing
    this.verticalPadding = options.verticalPadding || 10;
    this.horizontalPadding = options.horizontalPadding || 10;
    this.parentPadding = options.parentPadding || 30;
    this.childPadding = options.childPadding || 20;

    // Layout type
    this.layoutType = options.layoutType || null;
    this.direction = options.direction || null;
    this.parentConnectionPoints = options.parentConnectionPoints || 'single';
    this.parentWidthPortionForConnectionPoints = options.parentWidthPortionForConnectionPoints || 0.8;

    // Colors and appearance
    this.backgroundColor = options.backgroundColor || '#090909';
//    this.backgroundColor = options.backgroundColor || '#ffffff';
    this.fillOpacity = options.fillOpacity || 0.9;
    this.textColor = options.textColor || '#000000';
    this.borderColor = options.borderColor || '#cccccc';
    this.borderWidth = options.borderWidth || 2;
    this.borderRadius = options.borderRadius || 5;
    this.nodeType = options.nodeType || 'text-only';
    this.connectionColor = options.connectionColor || '#666666';
    this.connectionWidth = options.connectionWidth || 2;
    
    // Tapered connection options
    this.connectionTapered = options.connectionTapered !== undefined ? options.connectionTapered : false;
    this.connectionStartWidth = options.connectionStartWidth || 8;
    this.connectionEndWidth = options.connectionEndWidth || 2;
    this.connectionGradient = options.connectionGradient !== undefined ? options.connectionGradient : false;
    
    this.boundingBox = options.boundingBox || false;
    
    // Text wrapping options
    this.textWrap = options.textWrap || 'word'; // 'none' or 'word'
    this.maxWidth = options.maxWidth || 200; // Target width for text wrapping in pixels
    this.maxWordLength = options.maxWordLength || 20; // Maximum length of a word before it's split
  }

  /**
   * Get the appropriate layout for this level style
   * @return {Layout} The layout instance
   */
  getLayout() {
    // Create appropriate layout based on layout type and direction
    return LayoutFactory.createLayout(
      this.layoutType,
      this.parentPadding,
      this.childPadding,
      this.direction
    );
  }

  /**
   * Get the appropriate layout type for this style
   * @return {string} The layout type
   */
  getLayoutType() {
    return this.layoutType;
  }
  
  /**
   * Get text wrapping parameters
   * @return {Object} Text wrapping configuration
   */
  getTextWrapConfig() {
    return {
      textWrap: this.textWrap,
      maxWidth: this.maxWidth,
      maxWordLength: this.maxWordLength
    };
  }
}

// For backward compatibility
if (typeof window !== 'undefined') {
  window.StyleConfiguration = StyleConfiguration;
}

export default StyleConfiguration;