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
    }
  }
}));