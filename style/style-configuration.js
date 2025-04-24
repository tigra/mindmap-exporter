// src/style/style-configuration.js

/**
 * Represents styling for a specific level in the mindmap
 */
class StyleConfiguration {
  /**
   * Create a new StyleConfiguration
   * @param {Object} options - Configuration options for this style
   */
  constructor(options = {}) {
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
    this.layoutType = options.layoutType || 'horizontal';

    // Colors and appearance
    this.backgroundColor = options.backgroundColor || '#ffffff';
    this.textColor = options.textColor || '#000000';
    this.borderColor = options.borderColor || '#cccccc';
    this.borderWidth = options.borderWidth || 1;
    this.borderRadius = options.borderRadius || 5;
    this.nodeType = options.nodeType || 'box';
    this.connectionColor = options.connectionColor || '#666666';
    this.connectionWidth = options.connectionWidth || 2;
  }

  /**
   * Get the appropriate layout for this level style
   * @return {Layout} The layout instance
   */
  getLayout() {
   if (this.layoutType === 'vertical') {
      return new VerticalLayout(this.parentPadding, this.childPadding);
    } else {
      return new HorizontalLayout(this.parentPadding, this.childPadding);
    }
  }

  /**
   * Get the appropriate layout type for this style
   * @return {string} The layout type
   */
  getLayoutType() {
    return this.layoutType;
  }



  /**
   * Set the layout type for this style
   * @param {string} layoutType - The layout type to set ('horizontal' or 'vertical')
   */
  setLayoutType(layoutType) {
    if (layoutType !== 'horizontal' && layoutType !== 'vertical') {
      throw new Error('Layout type must be either "horizontal" or "vertical"');
    }
    this.layoutType = layoutType;
  }
}

// For backward compatibility
if (typeof window !== 'undefined') {
  window.StyleConfiguration = StyleConfiguration;
}

//export default StyleConfiguration;