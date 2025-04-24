/**
 * Represents styling for a specific level in the mindmap
 */
class LevelStyle {
  /**
   * Create a new LevelStyle
   * @param {Object} options - Configuration options for this level style
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
  }

  /**
   * Get the appropriate layout for this level style
   * @return {Layout} The layout instance
   */
  getLayout() {
    console.log(this.layoutType);
    if (this.layoutType === 'vertical') {
      return new VerticalLayout(this.parentPadding, this.childPadding);
    } else {
      return new HorizontalLayout(this.parentPadding, this.childPadding);
    }
  }

  setLayoutType(layoutType) {
    this.layoutType = layoutType;
    console.log('set to ... ' + this.layoutType);
  }
}