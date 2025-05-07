# DOM Mocking for Jest Tests

This document explains the DOM mocking strategy used in the Mindmap Exporter test suite to simulate browser environments in Node.js.

## Overview

The Mindmap Exporter project is browser-based but uses Jest for testing in a Node.js environment. Since Node.js doesn't include DOM APIs, we need to mock them to test browser-specific code.

## Mocking Strategy

Our DOM mocking follows these principles:

1. **Minimal Implementation**: Mock only what's needed, not the entire DOM API
2. **Consistent Behavior**: Ensure mocks behave consistently across all tests
3. **Isolation**: Keep DOM mocking separate from test logic
4. **Performance**: Use lightweight mocks for faster test execution

## Implementation

### Setup File

All DOM mocking is centralized in `tests/setup.js`, which:

1. Runs before any tests execute
2. Creates mock DOM objects and attaches them to the global scope
3. Mocks browser-specific utilities like text metrics

```javascript
// From tests/setup.js
function setupTestEnvironment() {
  // Create mock elements
  const createElement = (tagName) => ({
    // Element properties and methods
    style: {},
    attributes: {},
    children: [],
    // ... more properties
    
    // Element methods
    appendChild: function(child) { /* ... */ },
    removeChild: function(child) { /* ... */ },
    // ... more methods
  });
  
  // Mock document and window objects
  global.document = {
    body: createElement('body'),
    getElementById: () => null,
    createElement,
    createElementNS: /* ... */
  };
  
  global.window = {
    innerWidth: 1024,
    innerHeight: 768
    // ... more properties
  };
}
```

### Utility Mocking

Browser-specific utilities are mocked to avoid DOM dependencies:

```javascript
// Mock text metrics utility
jest.mock('../utils/text-metrics.js', () => ({
  __esModule: true,
  default: {
    measureText: (text, fontFamily, fontSize) => ({
      width: text.length * (fontSize / 2),
      height: fontSize * 1.2
    })
  }
}));
```

## Key Mocked Components

### Document Object

The `document` object mocks:
- `document.body` for element appending/removal
- `document.createElement` for creating DOM elements
- `document.createElementNS` for SVG elements
- `document.getElementById` for element retrieval

### Window Object

The `window` object mocks:
- Dimensions (`innerWidth`, `innerHeight`) 
- Global visibility for browser detection

### DOM Elements

DOM elements are mocked with:
- Core properties (`innerHTML`, `style`, etc.)
- Event handling (`addEventListener`)
- Element manipulation (`appendChild`, `removeChild`)
- Measurement properties (`offsetWidth`, `offsetHeight`)
- SVG-specific methods (`getBBox`)

## Adapting Code for Testing

Some code in the project has been adapted to make testing easier:

```javascript
// Browser detection that works in both browser and test environments
if (typeof window !== 'undefined') {
  window.SomeComponent = SomeComponent;
}
```

## Limitations

The DOM mocking has some limitations:

1. **Limited Layout Calculation**: Layout calculations are approximated
2. **No Rendering Engine**: Visual rendering isn't simulated
3. **Simplified Event Model**: DOM events are simplified
4. **Limited CSS Support**: CSS parsing/calculation isn't implemented

## Troubleshooting

### Common Issues

1. **"Cannot read property 'X' of undefined"**: 
   - Usually means a DOM object isn't properly mocked
   - Check if the property is added to the mock object

2. **"Method X is not implemented"**:
   - A required DOM method isn't mocked
   - Add the method to the appropriate mock object

3. **Incorrect Layout Calculations**:
   - Text metrics mocking might need adjustment
   - Customize the text metrics mock for specific test cases

### Fixing DOM-Related Issues

1. Identify the missing DOM feature in test output
2. Add appropriate mock to `tests/setup.js`
3. Re-run tests to verify the fix

## Best Practices

1. **Keep DOM Mocking Minimal**: Only mock what you need
2. **Isolate Browser-Specific Code**: Make code easier to test
3. **Test DOM Interactions Separately**: Use integration tests for DOM manipulation
4. **Verify in Real Browser**: Always verify test results in a real browser

## References

- [Jest Documentation](https://jestjs.io/docs/en/manual-mocks)
- [Testing Browser-Based JavaScript with Jest](https://jestjs.io/docs/en/tutorial-jquery)