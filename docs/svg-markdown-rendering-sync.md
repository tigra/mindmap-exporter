# Synchronous Markdown Rendering in Mindmap Nodes

This document outlines an alternative approach for rendering Markdown in mindmap nodes using a synchronous process rather than the current placeholder-based approach.

## Current vs Proposed Approach

### Current Implementation
1. During initial rendering, placeholders are created for nodes with Markdown
2. After the full SVG is generated, placeholders are processed asynchronously
3. The generated SVG content replaces the placeholders

### Proposed Synchronous Implementation
1. Calculate node dimensions using `markdownToSvg` during layout phase
2. Render Markdown content directly during node rendering
3. No placeholders or post-processing needed

## Benefits of Synchronous Rendering

1. **Improved Performance**: Eliminates the need for DOM manipulation after SVG generation
2. **Accurate Size Calculations**: Node sizes are determined with actual rendered content
3. **Simplified Code Flow**: No need to track and process placeholders
4. **Immediate Visual Results**: Complete rendering in one pass

## Implementation Details

### 1. Update Node Size Calculation

Modify the layout system to use `markdownToSvg` for node dimension calculations:

```javascript
// In Layout class
getNodeSize(text, levelStyle) {
  // Check if markdown is enabled for this level
  if (levelStyle.enableMarkdown) {
    // Use markdownToSvg for size calculation
    const result = markdownToSvg(text, levelStyle.maxWidth, {
      fontFamily: levelStyle.fontFamily,
      fontSize: levelStyle.fontSize,
      fontWeight: levelStyle.fontWeight,
      // Only perform calculation, don't create full rendered output
      calculateSizeOnly: true 
    });
    
    // Add padding to dimensions
    return {
      width: result.dimensions.width + (levelStyle.horizontalPadding * 2),
      height: result.dimensions.height + (levelStyle.verticalPadding * 2)
    };
  } else {
    // Use existing text wrapping logic for plain text
    // [existing code]
  }
}
```

### 2. Modify markdownToSvg for Calculation Mode

Add a "calculation only" mode to `markdownToSvg`:

```javascript
export function markdownToSvg(markdownContent, maxWidth = 400, options = {}) {
  // Extract the calculation mode option
  const calculateSizeOnly = options.calculateSizeOnly || false;
  
  // [existing code for conversion]
  
  // If we only need dimensions, return early with just size information
  if (calculateSizeOnly) {
    // Calculate dimensions without full SVG generation
    const container = createStyledContainer(cleanHtml, width, options);
    document.body.appendChild(container);
    const height = container.offsetHeight;
    document.body.removeChild(container);
    
    return {
      dimensions: { width, height }
    };
  }
  
  // [existing code for full rendering]
}
```

### 3. Direct Rendering in _drawNodeText

Replace the placeholder generation with direct rendering:

```javascript
_drawNodeText(node, insideBox) {
  const levelStyle = this.styleManager.getLevelStyle(node.level);
  const useMarkdown = levelStyle.enableMarkdown || false;
  
  if (!useMarkdown) {
    // Use existing plain text rendering
    return this._drawPlainNodeText(node, insideBox);
  }
  
  // Calculate position
  let x, y, width;
  if (insideBox) {
    x = node.x + (node.width / 2);
    y = node.y + (node.height / 2);
    width = node.width * 0.9;
  } else {
    x = node.x;
    y = node.y + (node.height / 2);
    width = node.width;
  }
  
  // Extract the text color to ensure visibility
  const textColor = insideBox 
    ? (levelStyle.textColor || this.DEFAULT_TEXT_COLOR_BOXED)
    : (levelStyle.textColor || this.DEFAULT_TEXT_COLOR_PLAIN);
  
  // Create options for markdown rendering
  const options = {
    fontFamily: levelStyle.fontFamily || this.DEFAULT_FONT_FAMILY,
    fontSize: levelStyle.fontSize || this.DEFAULT_FONT_SIZE,
    fontWeight: levelStyle.fontWeight || this.DEFAULT_FONT_WEIGHT,
    color: textColor,
    textAlign: insideBox ? 'center' : 'left',
    lineHeight: 1.5,
    padding: 2
  };
  
  // Generate SVG content directly
  const result = markdownToSvg(node.text, width, options);
  
  if (!result || !result.svg) {
    // Fallback to plain text if conversion fails
    return this._drawPlainNodeText(node, insideBox);
  }
  
  // Create a wrapper group for the content with proper positioning
  const xOffset = insideBox ? -result.dimensions.width / 2 : 0;
  const yOffset = -result.dimensions.height / 2;
  
  // Extract SVG content (everything inside the root <svg> tag)
  const svgContent = extractSvgContent(result.svg);
  
  // Create SVG group with proper transformation
  return `<g id="markdown-content-${node.id}" 
             transform="translate(${x + xOffset}, ${y + yOffset})"
             class="markdown-content">
           ${svgContent}
         </g>`;
}

// Helper function to extract content from SVG
function extractSvgContent(svgString) {
  // Extract everything between <svg> and </svg>
  const match = svgString.match(/<svg[^>]*>(.*)<\/svg>/s);
  return match ? match[1] : '';
}
```

### 4. Eliminate Post-Processing

Remove the `_processMarkdownElements` method and related post-processing code since all nodes are rendered directly during SVG generation.

## Challenges and Considerations

1. **Synchronous Processing**: The synchronous approach may block rendering for large documents with many markdown nodes.

2. **Consistent Dimensions**: Ensure the dimension calculations match actual rendered content.

3. **DOM Manipulation**: Still requires DOM manipulation for size calculations, but reduces overall DOM operations.

4. **Error Handling**: Need robust fallback mechanism for markdown conversion failures.

## Performance Optimization

1. **Caching**: Cache rendered SVG for identical content to avoid redundant processing.

```javascript
// Simple cache mechanism
const markdownCache = new Map();

function getCachedMarkdownSvg(markdownContent, width, options) {
  // Create a cache key based on content and options
  const cacheKey = `${markdownContent}:${width}:${JSON.stringify(options)}`;
  
  // Check if we have a cached result
  if (markdownCache.has(cacheKey)) {
    return markdownCache.get(cacheKey);
  }
  
  // Generate new result
  const result = markdownToSvg(markdownContent, width, options);
  
  // Cache the result
  markdownCache.set(cacheKey, result);
  
  return result;
}
```

2. **Render Offscreen**: For complex markdown, consider using Web Workers for rendering in a separate thread.

## Implementation Sequence

1. Update `markdownToSvg` to support calculation-only mode
2. Modify node size calculation to use markdown rendering
3. Update `_drawNodeText` for direct rendering
4. Add caching mechanism for repeated content
5. Remove placeholder processing logic
6. Test and optimize performance

## Example Usage Workflow

The workflow diagrams showing the synchronous rendering process can be found in [svg-markdown-rendering-sync.diagram.md](./svg-markdown-rendering-sync.diagram.md).