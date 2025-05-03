## Layout principles
If a node has children, it first applies their layouts to them and finds out their own sizes and bounding boxes (including children's children).
Then it may apply adjustPositionRecursive() to children and also 
adjust own position, and finally calculate and return bounding box.

The x, y passed to applyLayout() initially should be interpreted as 
coordinates of left top corner of future bounding box of a node.

### Multiple Connection Points

The mindmap can now support multiple parent connection points, controlled by the `parentConnectionPoints` style parameter.

#### Supported Values
- `single`: (Default) Uses a single connection point at the center of the parent node's edge
- `distributedRelativeToParentSize`: Distributes connection points along the parent node's edge based on child position
- `distributeEvenly`: Evenly distributes connection points along the parent node's edge based on child index

#### Implementation Notes
- Implemented for VerticalLayout and TapRootLayout (via ColumnBasedLayout)
- Uses a common utility method in the base Layout class for consistent implementation
- Can be configured per-level or as a default in style configurations

#### Connection Point Distribution Configuration

Two key parameters control connection point positioning:

1. `parentConnectionPoints` - The distribution algorithm to use:
   - `single`: Center point only
   - `distributedRelativeToParentSize`: Position based on child's actual position
   - `distributeEvenly`: Position based on child index with equal spacing

2. `parentWidthPortionForConnectionPoints` - The portion of parent width to use for distribution:
   - Range: 0.0 to 1.0 (typically between 0.4 and 0.8)
   - Defaults to 0.8 (80% of parent width)
   - Vertical layouts use 0.75 (wider distribution)
   - TapRoot layouts use 0.4 (narrower, more centered distribution)
   - Remaining width is evenly distributed to both sides as margins

#### How it works in VerticalLayout

1. The `distributedRelativeToParentSize` option:
   - Creates connection points along the bottom/top edge of the parent node
   - Positions connection points horizontally based on child node position
   - Maps child horizontal center to a relative position on parent
   - Maintains configurable margins based on parentWidthPortionForConnectionPoints
   - Improves visual appearance when children are spread horizontally

2. The `distributeEvenly` option:
   - Creates evenly spaced connection points along the parent's edge
   - Distributes points based on child index among siblings
   - Uses configurable portion of parent width based on parentWidthPortionForConnectionPoints
   - Creates equal gaps between connection points
   - Ensures consistent spacing regardless of child positions
   - Good for organized, symmetrical layouts

#### Example configuration
```javascript
levelStyles: {
  1: {
    layoutType: 'vertical',
    parentConnectionPoints: 'distributeEvenly',
    parentWidthPortionForConnectionPoints: 0.75  // 75% of width used, 12.5% margins on each side
  },
  2: {
    layoutType: 'taproot',
    parentConnectionPoints: 'distributeEvenly',
    parentWidthPortionForConnectionPoints: 0.4   // 40% of width used, 30% margins on each side
  },
  3: {
    layoutType: 'vertical',
    parentConnectionPoints: 'distributedRelativeToParentSize',  // Position based on child location
    parentWidthPortionForConnectionPoints: 0.6   // 60% of width used, 20% margins on each side
  },
  4: {
    layoutType: 'vertical',
    parentConnectionPoints: 'single'  // Single centered connection point
  }
}
```

#### How it works in TapRootLayout
Similar to VerticalLayout, but with connection points always distributed along the bottom edge and using a narrower width portion:

1. The connection points are always created along the bottom edge of the parent node
2. Both `distributeEvenly` and `distributedRelativeToParentSize` options are supported
3. Uses a narrower width portion (0.4 or 40%) compared to VerticalLayout (0.75 or 75%)
4. This creates wider margins (30% on each side) for more centered connections
5. The narrower distribution helps create a more compact visual appearance
6. Distribution choices determine whether connection points are positioned based on:
   - Child index among siblings (evenly distributed)
   - Child's actual horizontal position (relative to parent size)

#### Future Enhancements for Other Layouts
1. HorizontalLayout could:
   - Distribute connection points along right/left edge based on child vertical position

2. Better integration with ClassicMindmapLayout:
   - Apply side-specific distribution that recognizes left/right columns
   - Consider adding specialized option for column-aware connection points

#### Future Potential Enhancements
1. Connection Distribution Algorithms: Implement smart algorithms to distribute connection points evenly or based on subtree size.
2. Dynamic Connection Points: Calculate connection points based on both parent and child positions after layout is determined.
3. Animation Support: When expanding/collapsing nodes, having precise connection points will enable smoother animations.
