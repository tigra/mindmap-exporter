// src/layout/layout-factory.js

import HorizontalLayout from './horizontal-layout.js';
import VerticalLayout from './vertical-layout.js';
import TaprootLayout from './taproot-layout.js';

/**
 * Factory for creating appropriate layouts
 */
class LayoutFactory {
  /**
   * Create a layout based on type and parameters
   * @param {string} type - The layout type ('horizontal' or 'vertical')
   * @param {number} parentPadding - Padding between parent and children
   * @param {number} childPadding - Padding between siblings
   * @param {string} direction - Direction of layout ('right', 'left', 'down', or 'up')
   * @return {Layout} The created layout instance
   */
  static createLayout(type, parentPadding, childPadding, direction) {
    if (type === 'taproot') {
      return new TapRootLayout(parentPadding, childPadding);  // TODO columnGap
    } else if (type === 'vertical') {
      // Default direction for vertical layout is 'down'
      const verticalDirection = direction === 'up' ? 'up' : 'down';
      return new VerticalLayout(parentPadding, childPadding, verticalDirection);
    } else {
      // Default direction for horizontal layout is 'right'
      const horizontalDirection = direction === 'left' ? 'left' : direction === 'right' ? 'right' : null;
      return new HorizontalLayout(parentPadding, childPadding, horizontalDirection);
    }
  }
}

// For backward compatibility
if (typeof window !== 'undefined') {
  window.LayoutFactory = LayoutFactory;
}

export default LayoutFactory;