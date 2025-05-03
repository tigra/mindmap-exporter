## Layout principles
If a node has children, it first applies their layouts to them and finds out their own sizes and bounding boxes (including children's children).
Then it may apply adjustPositionRecursive() to children and also 
adjust own position, and finally calculate and return bounding box.

The x, y passed to applyLayout() initially should be interpreted as 
coordinates of left top corner of future bounding box of a node.