# Navigation Testing & Ground Truth System

This document describes the automated navigation testing system and ground truth data collection process implemented for validating keyboard navigation behavior across different mindmap layouts.

## Overview

The navigation testing system consists of three main components:

1. **Ground Truth Data Collection**: Manual capture of expected navigation behavior
2. **Automated Testing**: Systematic validation of navigation logic against ground truth
3. **Result Analysis**: Statistical analysis and failure pattern identification

## Ground Truth Data Collection

### Navigation Override Manager

The `NavigationOverrideManager` class (`src/utils/navigation-override-manager.js`) provides a visual interface for capturing navigation expectations:

- **Visual Interface**: Draggable connection points (N/S/E/W) on each node
- **Interactive Editing**: Drag connections between nodes to define expected navigation
- **Export Functionality**: Save navigation overrides as JSON ground truth data
- **Visual Feedback**: Curved arrows show current navigation connections

### Usage

1. Enable "Navigation Override Mode" in the Appearance tab
2. Use draggable points to connect nodes in expected navigation directions
3. Export the configuration as JSON ground truth data
4. Store in `test-data/` directory with layout-specific naming

### Ground Truth File Format

```json
{
  "timestamp": "2025-08-16T10:30:00.000Z",
  "mindmapTitle": "Project Planning",
  "navigationOverrides": {
    "node_id": {
      "nodeText": "Node display text",
      "level": 2,
      "connections": {
        "up": { "id": "target_node_id", "text": "Target text" },
        "down": null,
        "left": { "id": "another_id", "text": "Another target" },
        "right": null
      }
    }
  }
}
```

## Automated Testing System

### Navigation Tester

The `NavigationTester` class (`src/utils/navigation-tester.js`) provides comprehensive navigation validation:

- **Layout Testing**: Tests all supported layout types (taproot, classic, horizontal-left, horizontal-right, vertical-up)
- **Direction Coverage**: Validates all four arrow key directions for each node
- **Ground Truth Comparison**: Compares actual navigation results against expected behavior
- **Detailed Reporting**: Generates CSV reports with pass/fail status and failure analysis

### Test Execution

1. Load ground truth JSON files from `test-data/` directory
2. For each layout type:
   - Apply layout to default mindmap
   - Test navigation from every node in all directions
   - Compare results against ground truth expectations
3. Generate comprehensive CSV report with results

### Test Report Format

CSV output includes:
- Layout type
- Node ID and text
- Navigation direction
- Expected target (or null)
- Actual target (or null)  
- Pass/Fail status

## Result Analysis

### Analysis Tools

The `analyze-results.py` script provides statistical analysis of test results:

- **Overall Statistics**: Total tests, pass rate, failure breakdown
- **Per-Layout Analysis**: Success rates by layout type and direction
- **Failure Categorization**: 
  - Unexpected Navigation (expected null, got navigation)
  - Missing Navigation (expected navigation, got null)
  - Wrong Target (navigated to incorrect node)
- **Comparison Tables**: Side-by-side layout performance comparison

### Key Metrics

- **Overall Success Rate**: Percentage of navigation tests that pass
- **Direction-Specific Rates**: Success rates for up/down/left/right navigation
- **Layout Performance**: Comparative analysis across layout types
- **Failure Patterns**: Common navigation issues and their frequency

## Testing Workflow

### 1. Ground Truth Generation

```bash
# 1. Open mindmap application
# 2. Enable Navigation Override Mode in Appearance tab
# 3. Manually define expected navigation using visual interface
# 4. Export ground truth data to test-data/layout-name.json
```

### 2. Automated Testing

```javascript
// Run tests via browser console or test button
const tester = new NavigationTester();
const results = await tester.runAllTests();
// Download results as CSV
```

### 3. Analysis

```bash
# Analyze test results
python3 analyze-results.py

# View detailed statistics by layout
python3 analyze-results.py | grep -A 15 "LAYOUT-NAME"
```

## File Structure

```
test-data/
├── taproot.json           # Ground truth for taproot layout
├── classic.json           # Ground truth for classic layout  
├── horizontal-left.json   # Ground truth for horizontal-left layout
├── horizontal-right.json  # Ground truth for horizontal-right layout
└── vertical-up.json       # Ground truth for vertical-up layout

src/utils/
├── navigation-tester.js         # Automated testing system
└── navigation-override-manager.js # Ground truth collection interface

docs/
└── navigation-testing.md   # This documentation
```

## Navigation Improvements Validated

The testing system validated improvements to horizontal layout navigation:

1. **Spatial Navigation**: Nodes can navigate to spatially adjacent nodes, not just hierarchical children
2. **Leaf Node Navigation**: Nodes without children can navigate in layout-appropriate directions
3. **Closest Node Selection**: Navigation finds the vertically closest node in the target direction
4. **Event Handling**: Fixed multiple navigation jumps from duplicate event listeners

## Performance Results

Initial testing showed significant improvements:
- **Horizontal-right layout**: Right navigation improved from 37.5% to 45.8% success rate
- **Overall horizontal-right**: Improved from 79.2% to 81.2% overall success rate
- **Wrong target failures**: Reduced from 3 to 1 case

## Future Enhancements

1. **Automated Ground Truth**: Generate expected navigation automatically based on layout algorithms
2. **Visual Test Reports**: HTML reports with mindmap visualizations showing failed navigation paths
3. **Regression Testing**: Continuous integration testing to prevent navigation regressions
4. **Performance Benchmarks**: Measure navigation response times and optimization opportunities