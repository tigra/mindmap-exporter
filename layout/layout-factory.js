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
   * @param {string} type - The layout type ('horizontal', 'vertical', or 'taproot')
   * @param {number} parentPadding - Padding between parent and children
   * @param {number} childPadding - Padding between siblings
   * @param {string} direction - Direction of layout ('right', 'left', 'down', or 'up')
   * @param {Object} options - Additional layout options
   * @return {Layout} The created layout instance
   */
  static createLayout(type, parentPadding, childPadding, direction, options = {}) {
    // Normalize layout type to handle case variations
    const layoutType = type ? type.toLowerCase() : 'horizontal';

    // Handle layout-specific creation
    switch (layoutType) {
      case 'taproot':
        return new TaprootLayout(
          parentPadding,
          childPadding,
          options.columnGap || 80
        );

      case 'vertical':
        // Default direction for vertical layout is 'down'
        const verticalDirection =
          direction === 'up' ? 'up' : 'down';

        return new VerticalLayout(
          parentPadding,
          childPadding,
          verticalDirection,
          options
        );

      case 'horizontal':
      default:
        // Default direction for horizontal layout is 'right'
        return new HorizontalLayout(
          parentPadding,
          childPadding,
          direction || 'right',
          options
        );
    }
  }

  /**
   * Create a layout using the StyleManager for property resolution
   * @param {Node} node - The node to create layout for
   * @param {StyleManager} styleManager - The style manager
   * @return {Layout} The created layout instance
   */
  static createLayoutForNode(node, styleManager) {
    const levelStyle = styleManager.getLevelStyle(node.level);

    // Get effective values from style manager
    const layoutType = styleManager.getEffectiveValue(node, 'layoutType', true);
    const parentPadding = styleManager.getEffectiveValue(node, 'parentPadding', false);
    const childPadding = styleManager.getEffectiveValue(node, 'childPadding', false);
    const direction = styleManager.getEffectiveValue(node, 'direction', true);

    // Additional layout options that can be inherited
    const columnGap = styleManager.getEffectiveValue(node, 'columnGap', false);

    return this.createLayout(
      layoutType,
      parentPadding,
      childPadding,
      direction,
      { columnGap }
    );
  }
}

// For backward compatibility
if (typeof window !== 'undefined') {
  window.LayoutFactory = LayoutFactory;
}

export default LayoutFactory;