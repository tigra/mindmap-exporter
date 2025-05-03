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
- `distributed`: Distributes connection points along the parent node's edge based on child position

#### Implementation Notes
- Currently implemented only for VerticalLayout
- Other layouts still default to single connection point behavior
- Can be configured per-level or as a default in style configurations

#### How it works in VerticalLayout
The `distributed` option in VerticalLayout:
- Creates connection points along the bottom/top edge of the parent node
- Positions connection points horizontally based on child node position
- Maps child horizontal center to a relative position on parent
- Maintains safety margins (10-90% of parent width) to avoid edge connections
- Improves visual appearance when children are spread horizontally

#### Example configuration
```javascript
levelStyles: {
  1: {
    layoutType: 'vertical',
    parentConnectionPoints: 'distributed'  // Enable distributed connection points
  }
}
```

#### Future Enhancements for Other Layouts
1. TapRootLayout could:
   - Create bottom-based connection points distributed along parent's bottom edge
   - Weight connection points based on child subtree size

2. HorizontalLayout could:
   - Distribute connection points along right/left edge based on child vertical position

3. ClassicMindmapLayout could:
   - Apply similar distribution but with more weighting toward true child center

#### Future Potential Enhancements
1. Connection Distribution Algorithms: Implement smart algorithms to distribute connection points evenly or based on subtree size.
2. Dynamic Connection Points: Calculate connection points based on both parent and child positions after layout is determined.
3. Animation Support: When expanding/collapsing nodes, having precise connection points will enable smoother animations.
