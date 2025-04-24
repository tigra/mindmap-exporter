// src/layout/layout-factory.js

//import HorizontalLayout from './horizontal-layout.js';
//import VerticalLayout from './vertical-layout.js';

/**
 * Factory for creating appropriate layouts
 */
class LayoutFactory {
  /**
   * Create a layout based on type and parameters
   * @param {string} type - The layout type ('horizontal' or 'vertical')
   * @param {number} parentPadding - Padding between parent and children
   * @param {number} childPadding - Padding between siblings
   * @return {Layout} The created layout instance
   */
  static createLayout(type, parentPadding, childPadding) {
    if (type === 'vertical') {
      return new VerticalLayout(parentPadding, childPadding);
    } else {
      return new HorizontalLayout(parentPadding, childPadding);
    }
  }
}

// For backward compatibility
if (typeof window !== 'undefined') {
  window.LayoutFactory = LayoutFactory;
}

//export default LayoutFactory;