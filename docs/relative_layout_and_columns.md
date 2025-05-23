# Relative Layout with Rows and Columns Pattern

This document describes the architectural transformation applied to layout classes using stateful Row and Column positioning components with relative positioning and final adjustment.

## Overview

Multiple layout classes have been transformed to use a consistent pattern based on:
- **Stateful Row and Column classes** with `addNode()` methods for incremental positioning
- **Relative positioning** starting at (0,0) followed by final adjustment
- **Separation of layout calculation from final positioning**
- **Reusable positioning components** across different layout types

## Transformed Layout Classes

### 1. HorizontalLayout
- **Components**: `RightColumn`, `LeftColumn` classes
- **Pattern**: Stateful column positioning with right-edge alignment for left columns
- **Exports**: Column classes for reuse by other layouts

### 2. VerticalLayout  
- **Components**: `DownRow`, `UpRow` classes
- **Pattern**: Stateful row positioning with bottom-edge alignment for up rows
- **Exports**: Row classes for reuse by other layouts

### 3. ColumnBasedLayout (and descendants)
- **Reuses**: `RightColumn`, `LeftColumn` from HorizontalLayout
- **Descendants**: ClassicMindmapLayout, TaprootLayout
- **Pattern**: Configurable column positioning via `getColumnPositioningConfig()` and `applyColumnPostProcessing()`

## Row and Column Component Architecture

All layout transformations now use stateful positioning components that follow a consistent interface:

```javascript
// Column Pattern (HorizontalLayout)
class RightColumn {
  constructor(parentPadding, childPadding, nodeSize, style) {
    this.currentY = 0;
    this.maxChildWidth = 0;
    this.childrenPositioned = [];
  }
  
  addNode(node) {
    // Apply layout at (0,0), then position incrementally
    // Update state: currentY, maxChildWidth, childrenPositioned
  }
}

// Row Pattern (VerticalLayout)  
class DownRow {
  constructor(parentPadding, childPadding, nodeSize, style) {
    this.currentX = 0;
    this.maxChildHeight = 0;
    this.childrenPositioned = [];
  }
  
  addNode(node) {
    // Apply layout at (0,0), then position incrementally
    // Update state: currentX, maxChildHeight, childrenPositioned
  }
}
```

## Original Approach vs New Approach

### Before: Direct Positioning

```javascript
// Old approach - everything positioned directly at target coordinates
applyLayout(node, x, y, style) {
  // Position node directly at (x, y)
  node.x = x;
  node.y = y - (nodeSize.height / 2);
  
  // Position children directly relative to parent at (x, y)
  for (child of children) {
    childLayout.applyLayout(child, x + offset, y + childY, style);
  }
  
  // Calculate bounding box based on final positions
  calculateBoundingBox(node, x, y, ...params);
}
```

### After: Relative Positioning with Row/Column Components and Final Adjustment

```javascript
// New approach - relative positioning with stateful components followed by final adjustment
applyLayoutRelative(node, x, y, style) {
  // 1. Position everything at relative coordinates (0, 0)
  node.x = 0;
  node.y = 0;
  
  // 2. Use stateful row/column components for directional positioning
  if (effectiveDirection === 'right') {
    const rightColumn = new RightColumn(this.parentPadding, this.childPadding, nodeSize, style);
    node.children.forEach(child => rightColumn.addNode(child));
  } else if (effectiveDirection === 'down') {
    const downRow = new DownRow(this.parentPadding, this.childPadding, nodeSize, style);
    node.children.forEach(child => downRow.addNode(child));
  }
  
  // 3. Center parent and children relative to each other
  this.centerParentAndChildren(node, totalDimensions);
  
  // 4. Calculate bounding box at relative positions
  node.calculateBoundingBox();
}

applyLayout(node, x, y, style) {
  // Calculate layout at relative positions
  const boundingBox = this.applyLayoutRelative(node, x, y, style);
  
  // Apply final adjustment to move to target position
  node.adjustNodeTreeToPosition(x, y);
  
  return boundingBox;
}
```

## Key Architectural Changes

### 1. Separation of Layout Calculation and Final Positioning

**Before**: Layout calculation and final positioning were mixed together.
**After**: Clear separation between:
- `applyLayoutRelative()`: Calculates layout at relative coordinates (0,0)
- `applyLayout()`: Applies layout calculation then moves to final position

### 2. Stateful Row and Column Positioning

**Before**: Direction-specific logic scattered throughout the main method.
**After**: Separate stateful classes for each direction with incremental `addNode()` methods:

```javascript
// Column Classes (HorizontalLayout)
class RightColumn {
  constructor(parentPadding, childPadding, nodeSize, style) {
    this.currentY = 0;
    this.maxChildWidth = 0;
    this.childrenPositioned = [];
    this.childX = nodeSize.width + parentPadding;
  }
  
  addNode(node) {
    // Apply layout at (0,0), then position at (this.childX, this.currentY)
    const childSize = childLayout.applyLayoutRelative(node, 0, 0, this.style);
    node.adjustNodeTreeToPosition(this.childX, this.currentY);
    
    // Update state
    this.currentY += childSize.height + this.childPadding;
    this.maxChildWidth = Math.max(this.maxChildWidth, childSize.width);
  }
}

class LeftColumn {
  addNode(node) {
    // Apply layout at (0,0), then align right edge to this.alignmentX
    const childSize = childLayout.applyLayoutRelative(node, 0, 0, this.style);
    node.adjustNodeTreeToPosition(this.childX, this.currentY);
    
    // Right-edge alignment adjustment
    const adjustment = this.alignmentX - (node.boundingBox.x + node.boundingBox.width);
    this.adjustPositionRecursive(node, adjustment, 0);
  }
}

// Row Classes (VerticalLayout)
class DownRow {
  addNode(node) {
    // Apply layout at (0,0), then position at (this.currentX, this.childY)
    const childSize = childLayout.applyLayoutRelative(node, 0, 0, this.style);
    node.adjustNodeTreeToPosition(this.currentX, this.childY);
    
    // Update state
    this.currentX += childSize.width + this.childPadding;
    this.maxChildHeight = Math.max(this.maxChildHeight, childSize.height);
  }
}

class UpRow {
  addNode(node) {
    // Apply layout at (0,0), then position above parent (bottom-edge alignment)
    const childSize = childLayout.applyLayoutRelative(node, 0, 0, this.style);
    const targetY = this.childY - childSize.height;
    node.adjustNodeTreeToPosition(this.currentX, targetY);
  }
}
```

### 3. Movement of Responsibilities to MindmapNode

**Before**: Layout classes handled bounding box calculation and tree positioning.
**After**: MindmapNode handles its own positioning and bounding box:

```javascript
// Moved to MindmapNode
node.calculateBoundingBox();
node.adjustNodeTreeToPosition(targetX, targetY);
```

### 4. Elimination of Unused Parameters

**Before**: Methods carried forward parameters that weren't actually used.
**After**: Clean method signatures with only necessary parameters:

```javascript
// Before
centerParentAndChildren(node, x, y, nodeSize, totalHeight)
calculateBoundingBox(node, x, y, nodeSize, maxChildWidth, effectiveDirection)

// After  
centerParentAndChildren(node, nodeSize, totalHeight)
node.calculateBoundingBox()
```

## Component Reuse and Inheritance Patterns

### Column Component Reuse in ColumnBasedLayout

ColumnBasedLayout and its descendants (ClassicMindmapLayout, TaprootLayout) reuse the column components from HorizontalLayout:

```javascript
// ColumnBasedLayout imports and reuses column classes
import { RightColumn, LeftColumn } from './horizontal-layout.js';

class ColumnBasedLayout {
  positionChildrenInColumnsWithColumnClasses(node, leftChildren, rightChildren, childStartY, style) {
    // Create column instances
    const rightColumn = new RightColumn(config.paddingForColumns, this.childPadding, nodeSize, style);
    const leftColumn = new LeftColumn(config.paddingForColumns, this.childPadding, this.adjustPositionRecursive.bind(this), nodeSize, style);
    
    // Use column positioning
    rightChildren.forEach(child => rightColumn.addNode(child));
    leftChildren.forEach(child => leftColumn.addNode(child));
    
    // Apply layout-specific post-processing
    this.applyColumnPostProcessing(node, leftColumn, rightColumn, config);
  }
}
```

### Layout-Specific Customization

Each layout can customize column behavior through configuration and post-processing:

```javascript
// ClassicMindmapLayout customization
class ClassicMindmapLayout extends ColumnBasedLayout {
  getColumnPositioningConfig(node, nodeSize, childStartY) {
    return {
      rightColumnX: parentRightEdge + this.childPadding,
      leftColumnAlignmentX: parentLeftEdge - this.childPadding,
      paddingForColumns: this.childPadding, // Use childPadding instead of parentPadding
      parentCenterY: nodeSize.height / 2 + this.verticalOffset
    };
  }
  
  applyColumnPostProcessing(node, leftColumn, rightColumn, config) {
    // Apply vertical centering for ClassicMindmapLayout
    const leftCenteringAdjustment = config.parentCenterY - (leftTotalHeight / 2);
    const rightCenteringAdjustment = config.parentCenterY - (rightTotalHeight / 2);
    
    leftColumn.childrenPositioned.forEach(child => {
      this.adjustPositionRecursive(child, 0, leftCenteringAdjustment);
    });
  }
}
```

## Step-by-Step Transformation Process

### Phase 1: Create Row/Column Components

1. **Identify positioning patterns**: Look for direction-based positioning logic
2. **Create stateful components**: Extract into Row/Column classes with state tracking
3. **Implement addNode() methods**: Handle incremental positioning with state updates
4. **Add direction-specific features**: Implement alignment (right-edge, bottom-edge, etc.)
5. **Export for reuse**: Make components available to other layouts

### Phase 2: Implement Relative Positioning Pattern

1. **Create applyLayoutRelative()**: Extract layout calculation to work at (0,0)
2. **Update applyLayout()**: Make it call applyLayoutRelative then adjustNodeTreeToPosition
3. **Use component positioning**: Replace manual loops with component.addNode() calls
4. **Handle leaf nodes**: Ensure collapsed/childless nodes work with relative positioning

### Phase 3: Enable Component Reuse

1. **Export components**: Make Row/Column classes available for import
2. **Create configuration methods**: Allow customization via getColumnPositioningConfig()
3. **Add post-processing hooks**: Enable layout-specific adjustments via applyColumnPostProcessing()
4. **Update descendants**: Make inherited layouts use the new component-based approach

### Phase 4: Maintain Consistency

1. **Use consistent interfaces**: Ensure all Row/Column components follow same pattern
2. **Standardize state tracking**: Use currentX/Y, maxDimensions, childrenPositioned consistently
3. **Apply same positioning logic**: Use applyLayoutRelative(0,0) then adjustNodeTreeToPosition pattern
4. **Document patterns**: Update documentation to reflect Row/Column architecture

## Benefits of This Pattern

### 1. Better Separation of Concerns
- Layout calculation separate from final positioning
- Direction-specific logic isolated in column classes
- Node responsibilities moved to MindmapNode class

### 2. Improved Maintainability
- Easier to understand each component's role
- Changes to one aspect don't affect others
- Cleaner, more focused method signatures

### 3. Enhanced Reusability and Component Sharing
- Row and Column classes can be reused across layout types
- ColumnBasedLayout descendants automatically benefit from HorizontalLayout improvements
- Stateful components enable incremental positioning and better state management
- Node positioning methods available to all code
- Layout calculation can be tested independently

### 4. Easier Debugging and State Tracking
- Can inspect relative layout before final positioning
- Clear logging at each stage of the process
- Component-specific logging for directional issues
- State tracking in components (currentX/Y, maxDimensions, childrenPositioned)
- Incremental positioning makes it easier to identify where issues occur

## Current Layout Status and Available Components

### Fully Transformed Layouts
- **HorizontalLayout**: Uses RightColumn, LeftColumn components
- **VerticalLayout**: Uses DownRow, UpRow components  
- **ColumnBasedLayout**: Reuses RightColumn, LeftColumn with configuration
- **ClassicMindmapLayout**: Inherits column reuse with vertical centering
- **TaprootLayout**: Inherits column reuse with standard positioning

### Available Reusable Components

```javascript
// From HorizontalLayout - for left/right column positioning
import { RightColumn, LeftColumn } from './horizontal-layout.js';

// From VerticalLayout - for up/down row positioning  
import { DownRow, UpRow } from './vertical-layout.js';
```

### Component Selection Guide

**For left/right column positioning (children beside parent)**:
- Use `RightColumn` for children to the right of parent
- Use `LeftColumn` for children to the left of parent (with right-edge alignment)
- Both handle vertical progression (currentY tracking)

**For up/down row positioning (children above/below parent)**:
- Use `DownRow` for children below parent
- Use `UpRow` for children above parent (with bottom-edge alignment)
- Both handle horizontal progression (currentX tracking)

## Future Layout Transformations

When creating new layouts or transforming remaining ones, follow this decision tree:

### 1. Evaluate Existing Components
- **Can you reuse RightColumn/LeftColumn?** → Import and configure them
- **Can you reuse DownRow/UpRow?** → Import and configure them
- **Need new positioning patterns?** → Create new Row/Column components

### 2. Implement Component-Based Pattern
- Create stateful components with `addNode()` methods
- Use `applyLayoutRelative(0,0)` then `adjustNodeTreeToPosition()`
- Track state: currentX/Y, maxDimensions, childrenPositioned
- Export components for reuse

### 3. Enable Configuration and Customization
- Add configuration methods for layout-specific needs
- Implement post-processing hooks for adjustments
- Support component reuse while maintaining layout identity

## Example Template for Row/Column Component-Based Layouts

```javascript
// Import existing components when possible
import { RightColumn, LeftColumn } from './horizontal-layout.js';
import { DownRow, UpRow } from './vertical-layout.js';

class NewLayout extends Layout {
  applyLayout(node, x, y, style) {
    const boundingBox = this.applyLayoutRelative(node, x, y, style);
    node.adjustNodeTreeToPosition(x, y);
    return boundingBox;
  }

  applyLayoutRelative(node, x, y, style) {
    // 1. Position node at (0, 0)
    node.x = 0;
    node.y = 0;
    node.width = nodeSize.width;
    node.height = nodeSize.height;

    // 2. Handle leaf nodes
    if (node.children.length === 0 || node.collapsed) {
      node.boundingBox = { x: 0, y: 0, width: nodeSize.width, height: nodeSize.height };
      return node.boundingBox;
    }

    // 3. Use Row/Column components for positioning
    const effectiveDirection = style.getEffectiveValue(node, 'direction') || this.direction;
    
    if (effectiveDirection === 'right') {
      const rightColumn = new RightColumn(this.parentPadding, this.childPadding, nodeSize, style);
      node.children.forEach(child => rightColumn.addNode(child));
      totalDimensions = { height: rightColumn.currentY, maxWidth: rightColumn.maxChildWidth };
    } else if (effectiveDirection === 'down') {
      const downRow = new DownRow(this.parentPadding, this.childPadding, nodeSize, style);  
      node.children.forEach(child => downRow.addNode(child));
      totalDimensions = { width: downRow.currentX, maxHeight: downRow.maxChildHeight };
    }

    // 4. Center/align parent and children
    this.centerParentAndChildren(node, nodeSize, totalDimensions);

    // 5. Calculate bounding box
    node.calculateBoundingBox();

    return node.boundingBox;
  }
}

// For custom positioning needs, create new components
class CustomRow {
  constructor(parentPadding, childPadding, nodeSize, style) {
    this.currentX = 0;
    this.maxChildHeight = 0;
    this.childrenPositioned = [];
    // Custom initialization...
  }
  
  addNode(node) {
    // Apply layout at (0,0), then position incrementally
    const childSize = childLayout.applyLayoutRelative(node, 0, 0, this.style);
    node.adjustNodeTreeToPosition(this.currentX, this.customY);
    
    // Update state and apply custom logic
    this.currentX += childSize.width + this.childPadding;
    this.maxChildHeight = Math.max(this.maxChildHeight, childSize.height);
    this.childrenPositioned.push(node);
  }
}
```

## Conclusion

This Row and Column component-based pattern provides a comprehensive architecture for layout classes that:

### Technical Benefits
- **Separates concerns clearly**: Layout calculation vs. final positioning vs. directional positioning
- **Enables component reuse**: Row/Column classes shared across multiple layout types
- **Provides consistent interfaces**: All components follow the same addNode() pattern
- **Supports incremental positioning**: Stateful components track progress and enable step-by-step debugging
- **Makes code more maintainable and testable**: Isolated components can be tested independently

### Architectural Benefits  
- **Modular design**: Each layout can compose different Row/Column components as needed
- **Configuration flexibility**: Layouts can customize component behavior without changing component code
- **Inheritance efficiency**: ColumnBasedLayout descendants automatically benefit from HorizontalLayout improvements
- **Extensibility**: New Row/Column types can be added without affecting existing layouts

### Development Benefits
- **Better debugging**: State tracking in components, relative positioning allows inspection before final placement
- **Consistent patterns**: Same relative positioning and component usage across all transformed layouts
- **Easier maintenance**: Changes to positioning logic isolated in reusable components
- **Clear documentation**: Component interfaces and usage patterns well-defined

The transformation has successfully created a unified architecture where all major layout types (HorizontalLayout, VerticalLayout, ColumnBasedLayout and descendants) share common positioning components while maintaining their individual characteristics and behaviors. This provides both code reuse and architectural consistency across the entire layout system.