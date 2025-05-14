// src/layout/layout-factory.js

import HorizontalLayout from './horizontal-layout.js';
import VerticalLayout from './vertical-layout.js';
import TaprootLayout from './taproot-layout.js';
import ClassicMindmapLayout from './classic-mindmap-layout.js';

/**
 * Factory for creating appropriate layouts
 */
class LayoutFactory {
  /**
   * Create a layout based on type and parameters
   * @param {string} type - The layout type ('horizontal', 'vertical', 'taproot', or 'classic')
   * @param {number} parentPadding - Padding between parent and children
   * @param {number} childPadding - Padding between siblings
   * @param {string} direction - Direction of layout ('right', 'left', 'down', or 'up')
   * @return {Layout} The created layout instance
   */
  static createLayout(type, parentPadding, childPadding, direction) {
    // Set default values
    parentPadding = parentPadding || 80;
    childPadding = childPadding || 20;

    console.log(`LayoutFactory.createLayout: type=${type}, parentPadding=${parentPadding}, childPadding=${childPadding}, direction=${direction}`);
    
    let layout;
    // Create appropriate layout based on type
    switch (type) {
      case 'taproot':
        layout = new TaprootLayout(parentPadding, childPadding);
        break;
        
      case 'classic':
        layout = new ClassicMindmapLayout(parentPadding, childPadding);
        break;

      case 'vertical':
        // Default direction for vertical layout is 'down'
        const verticalDirection = direction === 'up' ? 'up' : 'down';
        layout = new VerticalLayout(parentPadding, childPadding, verticalDirection);
        break;

      case 'horizontal':
      default:
        // Default direction for horizontal layout is 'right'
        const horizontalDirection = direction === 'left' ? 'left' : 'right';
        layout = new HorizontalLayout(parentPadding, childPadding, horizontalDirection);
        break;
    }
    
    console.log(`Created layout: ${layout.constructor.name}`);
    return layout;
  }
}

// For backward compatibility
if (typeof window !== 'undefined') {
  window.LayoutFactory = LayoutFactory;
}

export default LayoutFactory;