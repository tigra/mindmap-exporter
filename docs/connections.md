# Mindmap Connections

This document provides an overview of the connection system in the mindmap-exporter project, with a focus on tapered connections.

## Connection System Overview

The connection system visualizes relationships between nodes in the mindmap. Connections are drawn as Bezier curves between parent and child nodes, with each node having connection points determined by its layout.

### Key Components

- **ConnectionPoint**: Defines a point where connections attach to nodes, with a position (x,y) and direction ('top', 'right', 'bottom', 'left').
- **Layouts**: Each layout (vertical, horizontal, taproot) determines where connection points are placed on nodes.
- **MindmapRenderer**: Handles the actual drawing of connections as SVG paths.

## Tapered Connections

Tapered connections provide a more visually appealing way to represent hierarchy, with connections that vary in width from parent to child nodes.

### Implementation Details

Tapered connections are implemented using filled SVG paths rather than stroked paths. This allows the connection to have different widths at the start and end points.

Key functions in `mindmap-renderer.js`:

1. `_calculatePerpendicularOffsets(point, width)`: Calculates offset points perpendicular to the connection direction.
2. `_calculateBezierControlPoints(startPoint, endPoint)`: Determines the control points for the Bezier curve.
3. `_drawTaperedConnection(parent, child, parentStyle, childStyle, startPoint, endPoint)`: Creates the filled path for the tapered connection.

### Style Configuration

Tapered connections are controlled via style properties:

- `connectionTapered`: Boolean to enable/disable tapered connections.
- `connectionStartWidth`: Width at the parent node end (typically wider).
- `connectionEndWidth`: Width at the child node end (typically narrower).
- `connectionGradient`: Boolean to enable/disable color gradients for connections.

Example in style preset:
```javascript
levelStyles: {
  1: {
    // Other properties...
    connectionTapered: true,
    connectionStartWidth: 16,
    connectionEndWidth: 6,
    connectionGradient: true
  }
}
```

The system is designed to use tapered connections for levels 1-3 and standard connections for levels 4 and deeper, creating a visual hierarchy that emphasizes important top-level relationships.

## How Curve Points Are Calculated

The connection path generation involves several precise calculations to create smooth, visually appealing curves between nodes.

### 1. Connection Points Determination

Every node has connection points defined by the layout manager:

- **Parent Connection Points**: Determined by `getParentConnectionPoint(node, levelStyle, childNode)` in the layout class.
- **Child Connection Points**: Determined by `getChildConnectionPoint(node, levelStyle)` in the layout class.

For example, in the vertical layout:
- Parent nodes connect from their bottom (down direction) or top (up direction)
- Child nodes connect at their top (down direction) or bottom (up direction)

The connection point includes both a position (x,y) and a direction ('top', 'right', 'bottom', 'left').

### 2. Bezier Control Points

The `_calculateBezierControlPoints` function creates natural-looking curves by:

```javascript
_calculateBezierControlPoints(startPoint, endPoint) {
  // Check if it's a vertical or horizontal connection
  const isVerticalLayout = startPoint.direction === 'bottom' || startPoint.direction === 'top';

  if (isVerticalLayout) {
    // For vertical layout, create a curve that bends vertically
    const dy = endPoint.y - startPoint.y;
    return [
      startPoint.x, startPoint.y + dy * 0.4,  // First control point
      endPoint.x, startPoint.y + dy * 0.6     // Second control point
    ];
  } else {
    // For horizontal layout, create a curve that bends horizontally
    const dx = endPoint.x - startPoint.x;
    return [
      startPoint.x + dx * 0.4, startPoint.y,  // First control point
      startPoint.x + dx * 0.6, endPoint.y     // Second control point
    ];
  }
}
```

Key points:
- Control points are placed at 40% and 60% of the distance between nodes
- Placement varies based on whether the connection is vertical or horizontal
- This creates a characteristic "S" curve that's visually pleasing

### 3. Path Boundaries for Tapered Connections

For tapered connections, we need to calculate the boundaries of the path:

1. **Perpendicular Offsets**: The `_calculatePerpendicularOffsets` function creates points perpendicular to the connection direction:

```javascript
_calculatePerpendicularOffsets(point, width) {
  // Calculate offset based on the connection point direction
  // Always return points in a consistent order: first point is always the "top/left" offset
  // and second point is always the "bottom/right" offset, regardless of direction
  
  switch (point.direction) {
    case 'top':
      // Offset horizontally for top-pointing connection
      return [
        point.x - width/2, point.y,  // left point
        point.x + width/2, point.y   // right point
      ];
    case 'bottom':
      // Offset horizontally for bottom-pointing connection (same as top)
      return [
        point.x - width/2, point.y,  // left point
        point.x + width/2, point.y   // right point
      ];
    case 'left':
      // Offset vertically for left-pointing connection
      return [
        point.x, point.y - width/2,  // top point
        point.x, point.y + width/2   // bottom point
      ];
    case 'right':
      // Offset vertically for right-pointing connection (same as left)
      return [
        point.x, point.y - width/2,  // top point
        point.x, point.y + width/2   // bottom point
      ];
    // Default case...
  }
}
```

2. **Full Path Construction**: The tapered path is constructed with 4 key components:
   - A Bezier curve from start-left to end-left
   - A straight line from end-left to end-right
   - A Bezier curve from end-right back to start-right
   - A closing line from start-right to start-left

```javascript
// Create the filled path - always going clockwise
const path = `M ${startLeftX} ${startLeftY}
               C ${cp1x + (startLeftX - startPoint.x)} ${cp1y + (startLeftY - startPoint.y)},
                 ${cp2x + (endLeftX - endPoint.x)} ${cp2y + (endLeftY - endPoint.y)},
                 ${endLeftX} ${endLeftY}
               L ${endRightX} ${endRightY}
               C ${cp2x + (endRightX - endPoint.x)} ${cp2y + (endRightY - endPoint.y)},
                 ${cp1x + (startRightX - startPoint.x)} ${cp1y + (startRightY - startPoint.y)},
                 ${startRightX} ${startRightY}
               Z`;
```

The control points for the boundary curves are calculated by offsetting the centerline control points based on the perpendicular offset of each endpoint.

### Important Implementation Notes

1. **Consistent Ordering**: Points must be returned in a consistent order (left/top first, right/bottom second) to prevent self-intersection.

2. **Control Point Calculation**: The control points for the boundary curves are adjusted by adding the difference between the offset point and the center point to the original control point:
   ```javascript
   cp1x + (startLeftX - startPoint.x)
   ```

3. **SVG Path Commands**:
   - `M`: Move to the starting point
   - `C`: Cubic Bezier curve
   - `L`: Line to a point
   - `Z`: Close the path

## Extending Connections

When working with connections:

1. Modify connection parameters in style presets (`style-presets.js`) to adjust visual appearance.
2. For new connection types, extend `_drawConnection` in `mindmap-renderer.js`.
3. Ensure connection point calculation respects node layout and direction.

## Important Considerations

- The bezier curve generation is direction-aware and adjusts control points accordingly.
- The `_calculatePerpendicularOffsets` function must maintain consistent point ordering to prevent path self-intersection.
- Connection gradients require definitions in the SVG's `<defs>` section.

For questions or support, refer to existing implementation examples in the codebase.