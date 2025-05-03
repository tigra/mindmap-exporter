## Layout principles
If a node has children, it first applies their layouts to them and finds out their own sizes and bounding boxes (including children's children).
Then it may apply adjustPositionRecursive() to children and also 
adjust own position, and finally calculate and return bounding box.

The x, y passed to applyLayout() initially should be interpreted as 
coordinates of left top corner of future bounding box of a node.

### Multiple Connection points further ideas

  While not being implemented initially, document how specific layouts could use this in the future:

  1. TapRootLayout:
    - Create bottom-based connection points distributed along parent's bottom edge
    - Connection points could be evenly spaced or weighted based on child subtree size

  2. Gradual Enhancement: Layouts can be enhanced individually to make use of the new parameter when needed, without requiring immediate changes to all layouts.
  3. Improved Visual Design: In the future, this will allow for more visually appealing connections that appear to radiate from different parts of a parent node.
  4. Better Large Node Support: Especially beneficial for large parent nodes where having all connections originating from a single point would create visual clutter.

#### Future Potential Enhancements (Post-implementation)
  1. Connection Distribution Algorithms: Implement smart algorithms to distribute connection points evenly or based on subtree size.
  2. Dynamic Connection Points: Calculate connection points based on both parent and child positions after layout is determined.
  3. User-Configurable Connection Points: Allow users to customize connection point strategy through style settings.
  4. Animation Support: When expanding/collapsing nodes, having precise connection points will enable smoother animations.
