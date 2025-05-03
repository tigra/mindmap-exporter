// src/style/style-manager.js - Pass styleManager to StyleConfiguration

import StyleConfiguration from './style-configuration.js';

/**
 * Manages styles for the entire mindmap
 */
class StyleManager {
  /**
   * Create a new StyleManager
   */
  constructor() {
    // Define default styles for different levels
    this.levelStyles = {
      // Root level
      1: new StyleConfiguration({
        fontSize: 18,
        fontWeight: 'bold',
        verticalPadding: 20,
        horizontalPadding: 20,
        parentPadding: 80,
        childPadding: 20,
//        layoutType: 'horizontal',
        backgroundColor: '#f5f5f5',
        borderColor: '#aaaaaa',
        borderWidth: 2,
        nodeType: 'box'
      }, this), // Pass this (StyleManager) to StyleConfiguration

      // Second level
      2: new StyleConfiguration({
        fontSize: 16,
        fontWeight: 'bold',
//        layoutType: 'horizontal',
        parentPadding: 60,
        childPadding: 20,
        nodeType: 'box'
      }, this),

      // Third level
      3: new StyleConfiguration({
        fontSize: 14,
        parentPadding: 40,
//        layoutType: 'horizontal',
        nodeType: 'box'
      }, this),

      // Fourth level and beyond
      4: new StyleConfiguration({
        fontSize: 12,
        horizontalPadding: 5,
        verticalPadding: 5,
        parentPadding: 30,
        childPadding: 15,
//        layoutType: 'horizontal',
        nodeType: 'text-only'
      }, this)
    };

    // Default style for any level not explicitly defined
    this.defaultLevelStyle = new StyleConfiguration({}, this);
  }

  /**
   * Get the effective value for a property, checking node overrides, parent inheritance, and level style
   * @param {Node} node - The node to get value for
   * @param {string} property - The property name to resolve
   * @param {boolean} inheritFromParent - Whether this property should inherit from parent (default: true)
   * @return {any} The effective value
   */
  getEffectiveValue(node, property, inheritFromParent = true) {
//  if (property = 'layoutType') {
//  console.group(`getEffectiveValue(${node}, ${property}`);
//  }
//    console.log('getEffectiveValue', node, property, inheritFromParent);

    // Get the appropriate level style
    const levelStyle = this.getLevelStyle(node.level);

//    console.log('levelStyle', levelStyle);

    // Start with level style default
    let value = levelStyle[property];
    console.log('levelstyle value', value);

    // Check node's own overrides
    if (node.configOverrides && property in node.configOverrides) {
      console.log('overridden:', property, node.configOverrides[property]);
      return node.configOverrides[property];
    }

    // Check parent inheritance if enabled
    if (inheritFromParent && node.parent) {
      // Recursively check parent's effective value
      const parentValue = this.getEffectiveValue(node.parent, property, true);
//      if (parentValue !== undefined && parentValue !== null) {
      if (parentValue !== undefined) {
        console.log('overridden in parent', property, parentValue);
        value = parentValue;
      }
    }
//      if (property = 'layoutType') {
//    console.groupEnd();
//    }
    return value;
  }

  /**
   * Get the appropriate style for a specific level
   * @param {number} level - The level to get style for
   * @return {StyleConfiguration} The level style
   */
  getLevelStyle(level) {
    // If we have a specific style for this level, return it
    if (this.levelStyles[level]) {
      return this.levelStyles[level];
    }

    // For levels >= 4, return the level 4 style
    if (level >= 4 && this.levelStyles[4]) {
      return this.levelStyles[4];
    }

    // Otherwise return the default style
    return this.defaultLevelStyle;
  }

  /**
   * Configure the style with custom settings
   * @param {Object} options - Style configuration options
   */
  configure(options = {}) {
    if (options.levelStyles) {
      // Merge provided level styles with existing ones
      for (const [level, styleOptions] of Object.entries(options.levelStyles)) {
        // Create new style with existing properties plus new ones
        const existingStyle = this.levelStyles[level] || this.defaultLevelStyle;
        const mergedOptions = {
          ...existingStyle, // Spread existing properties
          ...styleOptions   // Override with new properties
        };

        this.levelStyles[level] = new StyleConfiguration(mergedOptions, this);
      }
    }

    if (options.defaultStyle) {
      this.defaultLevelStyle = new StyleConfiguration(options.defaultStyle, this);
    }
  }

  /**
   * Change the layout type globally for all level styles
   * @param {string} layoutType - The layout type to set ('horizontal' or 'vertical')
   * @param {Object} options - Additional options
   * @param {Array<number>} options.excludeLevels - Array of level numbers to exclude from the change
   * @param {Object} options.customPadding - Custom padding values for different layout types
   */
  setGlobalLayoutType(layoutType, options = {}) {  // TODO use style change instead
    if (layoutType !== 'horizontal' && layoutType !== 'vertical' && layoutType !== 'taproot') {
      throw new Error('Layout type must be either "horizontal" or "vertical". Or "taproot"');
    }

    const excludeLevels = options.excludeLevels || [];
    const customPadding = options.customPadding || {};
    const direction = options.direction || null;

    // Update default level style
    if (!excludeLevels.includes(0)) {
      this.defaultLevelStyle.layoutType = layoutType;

      // Adjust padding values based on the layout type if needed
      if (customPadding.default) {
        if (customPadding.default.parentPadding) {
          this.defaultLevelStyle.parentPadding = customPadding.default.parentPadding;
        }
        if (customPadding.default.childPadding) {
          this.defaultLevelStyle.childPadding = customPadding.default.childPadding;
        }
      }
    }

    // Update all specific level styles
    for (const level in this.levelStyles) {
      if (excludeLevels.includes(parseInt(level))) {
        continue;
      }

      this.levelStyles[level].layoutType = layoutType;
      if (direction) {
        this.levelStyles[level].direction = direction;
      }

      // Adjust padding values based on the layout type if needed
      if (customPadding[level]) {
        if (customPadding[level].parentPadding) {
          this.levelStyles[level].parentPadding = customPadding[level].parentPadding;
        }
        if (customPadding[level].childPadding) {
          this.levelStyles[level].childPadding = customPadding[level].childPadding;
        }
      }
    }

    return this; // Allow method chaining
  }
}

// For backward compatibility
if (typeof window !== 'undefined') {
  window.StyleManager = StyleManager;
  window.styleManager = new StyleManager();
}

export default StyleManager;