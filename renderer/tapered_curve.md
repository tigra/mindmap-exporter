# Creating a Tapered Curve in SVG Using Filled Path

To create a curve that varies in thickness from one end to the other, use the filled path method:

## The Technique

1. Start at one edge of the curve (thick end)
2. Draw the top curve using Bézier control points 
3. Line to the other end (thin end)
4. Draw back along the bottom edge
5. Close the path with Z

## Anatomy of the Example

```svg
<path d="M50,150        <!-- Start at thick end -->
         C125,50        <!-- First control point -->
           225,50       <!-- Second control point -->
           300,150      <!-- End of top curve -->
         L300,153       <!-- Line to thin end bottom -->
         C225,56        <!-- Bottom curve back -->
           125,56       <!-- with adjusted control points -->
           50,153       <!-- to thick end bottom -->
         Z"             <!-- Close path -->
      fill="#3498db"/>
```

## Key Principles

- The initial curve (M to first C) defines the centerline
- The gap between 150 and 153 at x=300 creates the thin end (3px thick)
- The gap between 150 and 153 at x=50 creates the thick end (3px thick)
- For dramatic tapering, increase the bottom y-values at the thick end
- Control points for the bottom curve can be offset vertically for smooth appearance

## Making it Dramatically Tapered

For a dramatic taper (100px thick to 40px thin):
```svg
<path d="M50,150 
         C125,50 225,50 300,150
         L300,190      <!-- 40px thick on right -->
         C225,90       <!-- Adjusted control points -->
           125,90
           50,250      <!-- 100px thick on left -->
         Z" 
      fill="#e74c3c"/>
```

The filled path method provides precise control over thickness variation by treating the curve as a shaped object rather than a stroke.