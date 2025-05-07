# Mindmap Exporter Test Documentation

This document provides an overview of the testing approach and test suite organization for the Mindmap Exporter project.

## Table of Contents

1. [Testing Architecture](#testing-architecture)
2. [Test Setup](#test-setup)
3. [Test Categories](#test-categories)
4. [Running Tests](#running-tests)
5. [Adding New Tests](#adding-new-tests)
6. [Snapshot Testing](#snapshot-testing)

## Testing Architecture

The test suite is built using Jest and follows the following architectural principles:

- **Snapshot tests**: Visual regression testing to ensure style and layout changes don't break existing functionality
- **Integration tests**: Tests that verify the interaction between multiple components
- **Unit tests**: Tests for individual components and functionality

The tests simulate a DOM environment to test browser-specific code without requiring a real browser.

## Test Setup

### Directory Structure

```
tests/
├── integration/        # Integration tests
├── setup.js            # Jest setup file for all tests
├── snapshot/           # Snapshot tests for visual regression
└── utils/              # Test utilities and helpers
```

### Setup File

All tests use a common setup file (`tests/setup.js`) which:

1. Creates a simulated DOM environment for browser-specific code
2. Mocks the `document` and `window` objects
3. Provides a mock implementation for text metrics to avoid DOM dependencies

This setup runs before all tests through the Jest configuration in `package.json`.

## Test Categories

### Snapshot Tests

Located in `/tests/snapshot/`, these tests generate SVG representations of mindmaps with different style configurations and compare them against known-good references. If any changes are detected, the tests will fail, alerting you to potential visual regressions.

- `style-presets.snapshot.test.js`: Tests all style presets in both collapsed and expanded states

### Integration Tests

Located in `/tests/integration/`, these tests verify the interaction between multiple components:

- `layout-styles.test.js`: Tests the interaction between different layout types and style presets

### Unit Tests

Located in the project root alongside the source files:

- `model/markdown-parser.test.js`: Tests the markdown parsing functionality

## Test Utilities

The test suite includes several utilities to make testing easier:

- `createTestContainer()`: Creates a mock container for rendering
- `expandAllNodes()`: Expands all nodes in a mindmap for testing
- `setupMindmap()`: Sets up a test mindmap with specific styles
- `generateMindmapSnapshot()`: Generates an SVG snapshot for testing
- `getAllStylePresets()`: Retrieves all available style presets
- `traverseNodes()`: Helper function to traverse all nodes in a mindmap

## Running Tests

To run all tests, use:

```bash
npm test
```

To run a specific test file, use:

```bash
npm test -- tests/snapshot/style-presets.snapshot.test.js
```

To update snapshots after intentional visual changes:

```bash
npm test -- -u
```

## Snapshot Testing

Snapshot tests are particularly useful for this project because they:

1. Capture the visual output (SVG) of the mindmap renderer
2. Detect unintended changes to layouts, styles, or rendering
3. Provide a visual reference for expected behavior

### How Snapshot Tests Work

1. A mindmap is generated with specific styles and layouts
2. The resulting SVG is captured and stored as a reference
3. Future test runs compare new SVG output against the reference
4. If differences are detected, the test fails

### Key Snapshot Scenarios

The tests cover the following key scenarios:

1. **All Style Presets**: Every style preset is tested to ensure visual consistency
2. **Default vs. Expanded**: Tests both collapsed (default) and expanded states
3. **Deep Nesting**: Tests deeply nested structures to ensure proper rendering
4. **Layout Types**: Tests all layout configurations with different styles

### When to Update Snapshots

Snapshots should be updated when:

1. You've made **intentional** changes to styles or layouts
2. You've added new style presets or layout types
3. You've fixed rendering issues that change the visual output

To update snapshots, run:

```bash
npm test -- -u
```

## Adding New Tests

### Adding a New Snapshot Test

1. Create a new test file in `tests/snapshot/`
2. Import the necessary utilities from `tests/utils/test-utils.js`
3. Create test markdown content that demonstrates the aspect you want to test
4. Use `generateMindmapSnapshot()` to generate the SVG
5. Use `expect(svg).toMatchSnapshot()` to create and verify the snapshot

### Adding an Integration Test

1. Create a new test file in `tests/integration/`
2. Set up the necessary components (model, styleManager, etc.)
3. Test the interaction between components
4. Assert the expected behavior

## Best Practices

1. **Keep test markdown small**: Use only what's needed to test the feature
2. **Test edge cases**: Ensure deep nesting, empty nodes, etc. work correctly
3. **Isolate concerns**: Each test should focus on a specific aspect
4. **Use consistent naming**: Follow the established naming pattern
5. **Document test purpose**: Include comments explaining what each test verifies