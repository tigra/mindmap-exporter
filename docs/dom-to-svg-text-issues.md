# dom-to-svg Text Rendering Issues Analysis

This document analyzes potential issues with the [dom-to-svg](https://github.com/felixfbecker/dom-to-svg/) library that could cause text elements to be missing in SVG output. This analysis is relevant for understanding potential rendering issues in the markdown-to-svg integration in our mindmap application.

## Overview of dom-to-svg Text Processing

The dom-to-svg library converts HTML DOM nodes into SVG elements without using `<foreignObject>` tags. Instead, it directly translates DOM text nodes into SVG `<text>` elements. This approach enables compatibility with design tools like Illustrator and Figma, but introduces several complexities with text rendering.

## Common Causes for Missing Text Elements

### 1. Visibility and Element State Issues

- **Element Visibility Timing**: 
  - DOM elements must be fully rendered and visible in the browser before conversion
  - Elements with `display: none` or `visibility: hidden` might not be properly converted
  - Elements positioned offscreen (via negative coordinates) might be handled inconsistently

- **Hidden Parent Containers**:
  - Text within containers that are hidden during conversion may be missed
  - CSS states like `:hover` or JavaScript-toggled visibility won't be captured

### 2. CSS and Styling Problems

- **Computed Style Dependency**:
  - The library relies on `getComputedStyle()` to extract styling information
  - Styles applied through complex CSS selectors may not be correctly computed
  - Dynamically applied styles via JavaScript might not be captured

- **Text Styling Limitations**:
  - Complex text styling (shadows, gradients) may not convert accurately
  - Text-specific CSS properties might be ignored during conversion
  - Custom fonts might not be properly embedded in the SVG

### 3. DOM Structure and Traversal Issues

- **Text Node Processing**:
  - The library processes DOM nodes recursively with special handling for text nodes
  - Empty text nodes might be skipped or ignored
  - Nested text structures (spans within paragraphs) can cause issues with proper nesting in SVG

- **Dynamic Content**:
  - Content loaded asynchronously might not be present during conversion
  - Content rendered after a delay or animation might be missed
  - React or other framework rendering cycles might not complete before conversion

### 4. Layout and Positioning Challenges

- **Coordinate System Transformation**:
  - The library uses complex coordinate transformations to position elements in SVG
  - Text positioned with CSS transforms might not be correctly placed
  - Relative positioning within complex layouts can result in incorrect coordinates

- **Container Dimensions**:
  - Text elements might be created but positioned outside the visible SVG viewport 
  - Container dimensions might not be properly calculated, especially for dynamically sized elements
  - Content exceeding parent container boundaries might be clipped incorrectly

### 5. Browser-Related Inconsistencies

- **Browser Rendering Engines**:
  - Different browser engines (Chromium, Gecko, WebKit) handle DOM-to-SVG conversion differently
  - The library might have workarounds for specific browsers that don't apply universally
  - Browser zoom level or device pixel ratio might affect text rendering

- **DOM API Inconsistencies**:
  - Browsers implement `getBoundingClientRect()` with subtle differences
  - Text measurement APIs can return different values across browsers
  - Font rendering variations can affect text positioning

## Specific GitHub Issues Related to Text Problems

Several specific issues have been reported on the dom-to-svg GitHub repository:

1. **SVG generated from SVG in DOM does not display text element** ([Issue #200](https://github.com/felixfbecker/dom-to-svg/issues/200))
   - Text elements within nested SVGs are not properly converted
   - This is particularly relevant for our markdown-to-svg conversion

2. **Dominant-baseline Attribute of Converted SVG Files** ([Issue #180](https://github.com/felixfbecker/dom-to-svg/issues/180))
   - Text baseline positioning might be inconsistent in the resulting SVG
   - This affects vertical text alignment and can make text appear in unexpected positions

3. **Text size does not scale correctly** ([Issue #167](https://github.com/felixfbecker/dom-to-svg/issues/167))
   - Text scaling issues can cause rendering problems
   - The size might be correct in the DOM but incorrect in the resulting SVG

## Technical Details of Text Element Conversion

While the exact implementation details aren't publicly documented, based on common SVG conversion patterns and reported issues, the library likely:

1. Traverses the DOM tree and identifies text nodes
2. Creates SVG `<text>` elements for these nodes
3. Applies computed CSS styles as SVG attributes
4. Positions the text elements based on the node's position in the document
5. Handles additional attributes like text-anchor, dominant-baseline, etc.

The conversion process may fail at any of these steps, resulting in missing text elements.

## Troubleshooting Recommendations

When experiencing missing text in SVG output, consider the following:

1. **Ensure Complete DOM Rendering**:
   - Add delay before conversion to ensure all elements are fully rendered
   - Directly append elements to the document body rather than to hidden containers
   - Position elements on-screen during conversion, then move them if needed

2. **Simplify CSS Styling**:
   - Use basic, direct CSS properties instead of complex selectors or inheritance
   - Avoid CSS transitions or animations during conversion
   - Apply critical styles directly to elements instead of through CSS classes

3. **Verify Element Visibility**:
   - Ensure all parent containers are visible (`display != none`, `visibility != hidden`)
   - Check that text containers have appropriate dimensions
   - Verify that text is within the visible viewport when conversion happens

4. **Handle Custom Fonts**:
   - Ensure fonts are fully loaded before conversion
   - Consider using web-safe fonts for more consistent results
   - Test with simplified font settings to isolate font-related issues

5. **Debug SVG Output**:
   - Inspect the SVG output for text elements that might be present but positioned incorrectly
   - Check for elements with zero dimensions or positioned outside viewBox
   - Look for malformed SVG text elements or attributes

## Application to Our Markdown-to-SVG Conversion

In our specific implementation:

1. Make sure the HTML container for markdown content is:
   - Fully visible in the DOM
   - Has proper dimensions
   - Is attached to the document before conversion

2. Ensure that markdown rendering completes before SVG conversion:
   - Consider adding a delay between markdown rendering and SVG conversion
   - Verify that any asynchronous content (like images) has loaded

3. When using the extraction method:
   - Ensure coordinate transformations properly account for the dom-to-svg coordinate system
   - Maintain proper namespace attributes when extracting content
   - Verify that extracted text paths maintain their relative positioning

4. When using the embedding method:
   - Verify that the embedded SVG has proper dimensions
   - Check that the coordinate system of the embedded SVG is compatible with the parent SVG
   - Ensure x/y positioning correctly places the embedded SVG within the parent