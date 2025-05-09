/**
 * Jest setup file
 * This file runs before all tests and sets up the testing environment
 */

// Set up the DOM environment for Jest tests
function setupTestEnvironment() {
  // Create mock elements to track what would be in the DOM
  const mockElements = new Map();
  
  // Mock createElement that returns element with all needed properties
  const createElement = (tagName) => {
    const element = {
      tagName,
      style: {},
      attributes: {},
      children: [],
      innerHTML: '',
      textContent: '',
      offsetWidth: 100,  // Default size
      offsetHeight: 20,
      setAttribute: function(name, value) { this.attributes[name] = value; },
      getAttribute: function(name) { return this.attributes[name]; },
      addEventListener: jest.fn(),
      appendChild: function(child) { this.children.push(child); return child; },
      removeChild: function(child) { 
        const index = this.children.indexOf(child);
        if (index !== -1) this.children.splice(index, 1);
        return child;
      }
    };
    
    return element;
  };
  
  // Mock createElementNS for SVG elements
  const createElementNS = (ns, tagName) => {
    const element = createElement(tagName);
    element.namespaceURI = ns;
    element.getBBox = () => ({ x: 0, y: 0, width: 100, height: 100 });
    return element;
  };
  
  // Set up global objects
  if (typeof window === 'undefined') {
    global.window = {
      innerWidth: 1024,
      innerHeight: 768
    };
  }
  
  if (typeof document === 'undefined') {
    global.document = {
      body: createElement('body'),
      getElementById: (id) => null,
      createElement,
      createElementNS
    };
  }
}

// Set up environment
setupTestEnvironment();

// Mock text metrics utility to avoid DOM dependencies
jest.mock('../utils/text-metrics.js', () => ({
  __esModule: true,
  default: {
    measureText: (text, fontFamily, fontSize, fontWeight) => {
      // Simple mock that returns size based on text length
      return {
        width: text.length * (fontSize / 2),
        height: fontSize * 1.2
      };
    },
    wrapText: (text, maxWidth, fontFamily, fontSize, fontWeight, wrapType = 'word', maxWordLength = 15) => {
      if (wrapType === 'none' || !maxWidth) {
        return {
          lines: [text],
          lineWidths: [text.length * (fontSize / 2)],
          width: text.length * (fontSize / 2),
          height: fontSize * 1.2,
          lineHeight: fontSize * 1.2
        };
      }
      
      // For testing, create a simple wrapping algorithm that breaks at maxWidth
      const charWidthEstimate = fontSize / 2;
      const charsPerLine = Math.max(Math.floor(maxWidth / charWidthEstimate), 10);
      
      // Split text into words
      const words = text.split(' ');
      const lines = [];
      let currentLine = '';
      
      for (const word of words) {
        // If adding this word exceeds our line length and it's not the first word in line
        if ((currentLine.length + word.length + 1) > charsPerLine && currentLine.length > 0) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Add word to current line with a space if needed
          if (currentLine.length > 0) {
            currentLine += ' ' + word;
          } else {
            currentLine = word;
          }
        }
      }
      
      // Add the last line if not empty
      if (currentLine.length > 0) {
        lines.push(currentLine);
      }
      
      // Calculate width of each line
      const lineWidths = lines.map(line => line.length * charWidthEstimate);
      let maxLineWidth = Math.max(...lineWidths);
      
      // Apply the same logic as in the real implementation
      if (lines.length > 1) {
        maxLineWidth = Math.min(
          Math.max(maxLineWidth, maxWidth * 0.8), 
          maxWidth
        );
      }
      
      const lineHeight = fontSize * 1.2;
      return {
        lines: lines,
        lineWidths: lineWidths,
        width: maxLineWidth,
        height: lines.length * lineHeight,
        lineHeight: lineHeight
      };
    }
  }
}));

// Make the mock available on the global window object
const mockTextMetrics = require('../utils/text-metrics').default;
if (typeof global.window !== 'undefined') {
  global.window.textMetrics = mockTextMetrics;
} else {
  global.window = global.window || {};
  global.window.textMetrics = mockTextMetrics;
}