// src/utils/text-metrics.js

/**
 * Service for measuring text dimensions
 */
class TextMetricsService {
  /**
   * Create a new TextMetricsService
   */
  constructor() {
    this.tempElement = null;
  }

  /**
   * Measure the dimensions of text with given style
   * @param {string} text - The text to measure
   * @param {string} fontFamily - Font family
   * @param {number} fontSize - Font size in pixels
   * @param {string} fontWeight - Font weight
   * @return {Object} The width and height of the text
   */
  measureText(text, fontFamily, fontSize, fontWeight) {
    // Create temporary element for measurement
    const temp = document.createElement('div');
    temp.style.position = 'absolute';
    temp.style.visibility = 'hidden';
    temp.style.fontFamily = fontFamily;
    temp.style.fontSize = fontSize + 'px';
    temp.style.fontWeight = fontWeight;
    temp.style.whiteSpace = 'nowrap';
    temp.textContent = text;

    document.body.appendChild(temp);
    const width = temp.offsetWidth;
    const height = temp.offsetHeight;
    document.body.removeChild(temp);

    return {
      width: Math.max(width, 0),
      height: Math.max(height, 0)
    };
  }
}

// Create a singleton instance
const textMetrics = new TextMetricsService();

// For backward compatibility
if (typeof window !== 'undefined') {
  window.textMetrics = textMetrics;
}

export default textMetrics;