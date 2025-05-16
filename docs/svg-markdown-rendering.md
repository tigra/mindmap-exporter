# Markdown and HTML Formatting in Mindmap Nodes

This document explains how the mindmap exporter renders rich formatted text (Markdown and HTML) in mindmap nodes.

## Overview

The mindmap exporter supports rich text formatting within nodes by converting Markdown to SVG elements. This allows nodes to display formatted content like:

- **Bold** and *italic* text
- Lists (ordered and unordered)
- Code blocks
- Links
- And other Markdown formatting

## Architecture

The rendering process involves multiple components working together:

1. **Style Configuration**: Controls whether Markdown is enabled for nodes
2. **MindmapRenderer**: Detects when to use Markdown rendering and creates placeholders
3. **Markdown-to-SVG Converter**: Transforms Markdown into SVG elements
4. **DOM Integration**: Inserts the generated SVG into the mindmap

## Enabling Markdown Support

Markdown support can be enabled at the style level through the `enableMarkdown` property in the `StyleConfiguration`. This property can be configured:

- Per level in the `levelStyles` object
- In the default style for all other levels
- Through style presets

## Rendering Process

The sequence diagram showing the markdown rendering process can be found in [svg-markdown-rendering.diagram.md](./svg-markdown-rendering.diagram.md).

## Implementation Details

### 1. StyleConfiguration

The `StyleConfiguration` class contains an `enableMarkdown` property that determines whether Markdown rendering is enabled for nodes at a specific level.

```javascript
// In StyleConfiguration constructor
this.enableMarkdown = options.enableMarkdown !== undefined 
    ? options.enableMarkdown 
    : false;
```

### 2. MindmapRenderer

The `MindmapRenderer` class performs the following steps:

1. Checks if Markdown is enabled for the current node level
2. For Markdown-enabled nodes:
   - Creates a placeholder with a unique ID
   - Includes the node's text content as a data attribute
   - After rendering the full SVG, processes all placeholders

```javascript
_drawNodeText(node, insideBox) {
  const levelStyle = this.styleManager.getLevelStyle(node.level);
  const useMarkdown = levelStyle.enableMarkdown || false;
  
  if (!useMarkdown) {
    return this._drawPlainNodeText(node, insideBox);
  }
  
  // Create placeholder for markdown content
  const placeholder = `<g id="markdown-placeholder-${node.id}" 
                         transform="translate(${x}, ${y})"
                         data-markdown="${this._escapeXml(node.text)}"
                         ...other attributes...>
                         <text>Placeholder</text>
                     </g>`;
  
  return placeholder;
}
```

### 3. Markdown Processing

After the initial SVG is created, the renderer processes all Markdown placeholders:

```javascript
async _processMarkdownElements(container) {
  // Find all placeholders
  const placeholders = container.querySelectorAll('.markdown-placeholder');
  
  // Process each placeholder
  for (const placeholder of placeholders) {
    // Extract data from placeholder
    const markdownContent = placeholder.getAttribute('data-markdown');
    
    // Convert markdown to SVG
    const result = await markdownToSvg(markdownContent, maxWidth, options);
    
    // Replace placeholder with actual SVG content
    if (result && result.svg) {
      // Create wrapper for proper positioning
      const contentGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      contentGroup.innerHTML = result.svg;
      
      // Replace the placeholder
      placeholder.innerHTML = '';
      placeholder.appendChild(contentGroup);
    }
  }
}
```

### 4. Markdown-to-SVG Converter

The `markdownToSvg` function in `utils/markdown-to-svg.js` performs the actual conversion:

1. Imports required dependencies (`marked`, `DOMPurify`, `dom-to-svg`)
2. Converts Markdown to sanitized HTML
3. Calculates the optimal width based on content
4. Creates a styled container with the HTML
5. Converts the DOM to SVG using `dom-to-svg`
6. Returns both the SVG markup and its dimensions

## Fallback Mechanism

If Markdown conversion fails or Markdown is not enabled, the renderer falls back to plain text rendering with basic text wrapping. A synchronous `markdownToText` function provides a simpler fallback that strips Markdown syntax from text.

## Style Customization

Markdown rendering can be customized through several styling options:

- **Font family, size, weight**
- **Color and text alignment**
- **Line height and padding**
- **Maximum width for text wrapping**

These options are passed from the node's style to the Markdown-to-SVG converter.

## Performance Considerations

- Markdown conversion requires DOM manipulation and is performed asynchronously
- The converter uses efficient width calculation to avoid excessive SVG sizes
- For complex mindmaps with many formatted nodes, rendering may take longer

## Future Enhancements

Potential improvements for the Markdown rendering system:

1. Caching of rendered SVGs for repeated node content
2. Improved handling of complex formatting like tables and images
3. Better integration with the mindmap's theme and styles
4. Pre-rendering of common Markdown patterns

## Example Usage

To enable Markdown support in a custom style preset:

```javascript
MindmapStylePresets.customStyle(style) {
  style.configure({
    levelStyles: {
      1: {
        // Root node with Markdown enabled
        fontSize: 24,
        enableMarkdown: true,
        // ... other style properties
      },
      2: {
        // Level 2 nodes with Markdown enabled
        fontSize: 18,
        enableMarkdown: true,
        // ... other style properties
      }
    },
    defaultStyle: {
      // Default style for all other levels
      enableMarkdown: false
    }
  });
  return style;
}
```