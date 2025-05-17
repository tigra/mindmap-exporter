# Creating a Markdown to SVG Converter Using dom-to-svg

This guide explains how to build a standalone function that converts Markdown to SVG using the dom-to-svg library. The function takes Markdown content and a maximum width parameter, then returns both the SVG markup and its dimensions.

## Overview

The converter works by:
1. Converting Markdown to HTML
2. Calculating the optimal width based on content
3. Rendering the HTML in a hidden container
4. Converting the DOM to SVG using dom-to-svg
5. Returning both the SVG markup and its dimensions

## Prerequisites

- A JavaScript environment (browser or Node.js with DOM)
- Required dependencies:
  - `marked` (for Markdown parsing)
  - `DOMPurify` (for HTML sanitization)
  - `dom-to-svg` (for converting DOM to SVG)

## Installation

```bash
npm install marked dompurify dom-to-svg
```

## Implementation

Here's the complete implementation:

```javascript
/**
 * Converts Markdown to SVG using dom-to-svg library
 * @param {string} markdownContent - The markdown content to convert
 * @param {number} maxWidth - Maximum width allowed for the SVG (default: 400)
 * @returns {Object} - Object containing the SVG markup string and its dimensions
 */
export async function markdownToSvg(markdownContent, maxWidth = 400) {
  // --- Step 1: Setup dependencies ---
  // Note: In a real implementation, these would be imported at the top
  const { marked } = await import('marked');
  const DOMPurify = await import('dompurify');
  const { elementToSVG } = await import('dom-to-svg');

  // --- Step 2: Convert Markdown to sanitized HTML ---
  const rawHtml = marked.parse(markdownContent);
  const cleanHtml = DOMPurify.sanitize(rawHtml);

  // --- Step 3: Calculate optimal width ---
  const width = calculateNaturalWidth(cleanHtml, maxWidth);
  
  // --- Step 4: Create a styled container for conversion ---
  const container = createStyledContainer(cleanHtml, width);
  
  // --- Step 5: Convert to SVG ---
  try {
    // Add container to DOM (required for dom-to-svg to work)
    document.body.appendChild(container);
    
    // Get the container height
    const height = container.offsetHeight;
    
    // Convert DOM to SVG
    const svgDocument = elementToSVG(container);
    
    // Set fixed attributes on the SVG
    configureSvgDocument(svgDocument, width);
    
    // Convert to string
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgDocument);
    
    // Remove the temporary container
    document.body.removeChild(container);
    
    // Return both SVG and its dimensions
    return {
      svg: svgString,
      dimensions: { width, height }
    };
    
  } catch (error) {
    // Clean up if there's an error
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
    
    console.error('Error in Markdown to SVG conversion:', error);
    
    // Create a fallback error SVG
    const errorSvg = createErrorSvg(maxWidth, error.message);
    return {
      svg: errorSvg,
      dimensions: { width: maxWidth, height: 200 }
    };
  }
}

/**
 * Calculates the natural width of content without wrapping
 * @param {string} htmlContent - HTML content to measure
 * @param {number} maxWidth - Maximum width constraint
 * @returns {number} - The optimal width for the content
 */
function calculateNaturalWidth(htmlContent, maxWidth = 400) {
  // Create a temporary div to measure the natural content width
  const measureDiv = document.createElement('div');
  measureDiv.style.position = 'absolute';
  measureDiv.style.visibility = 'hidden';
  measureDiv.style.fontFamily = 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
  measureDiv.style.padding = '10px';
  measureDiv.style.display = 'inline-block';
  measureDiv.style.boxSizing = 'border-box';
  measureDiv.innerHTML = htmlContent;

  // Add to DOM to get accurate measurements
  document.body.appendChild(measureDiv);
  
  // Find the minimum width needed by measuring text without wrapping
  let maxLineWidth = 0;
  
  // Process all block-level elements to find their natural widths
  const blockElements = measureDiv.querySelectorAll('p, h1, h2, h3, h4, h5, h6, ul, ol, li, blockquote, pre, table');
  
  if (blockElements.length > 0) {
    // Measure each block element separately with nowrap to find max line width
    for (const element of blockElements) {
      const clone = element.cloneNode(true);
      const wrapper = document.createElement('div');
      
      wrapper.style.position = 'absolute';
      wrapper.style.visibility = 'hidden';
      wrapper.style.display = 'inline-block';
      wrapper.style.whiteSpace = 'nowrap'; // No wrapping for accurate width
      
      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);
      
      // Get width of unwrapped content
      const elementWidth = wrapper.getBoundingClientRect().width;
      maxLineWidth = Math.max(maxLineWidth, elementWidth);
      
      document.body.removeChild(wrapper);
    }
  } else {
    // If no block elements, measure the entire content with nowrap
    measureDiv.style.whiteSpace = 'nowrap';
    maxLineWidth = measureDiv.getBoundingClientRect().width;
  }
  
  // Add padding for better display
  maxLineWidth += 20;

  // Remove measure element
  document.body.removeChild(measureDiv);

  // Set a minimum width and cap at maximum
  return Math.max(Math.min(maxLineWidth, maxWidth), 100);
}

/**
 * Creates and styles a container for SVG conversion
 * @param {string} htmlContent - HTML content to put in the container
 * @param {number} width - Container width
 * @returns {HTMLElement} - Styled container element
 */
function createStyledContainer(htmlContent, width) {
  const container = document.createElement('div');
  container.innerHTML = htmlContent;
  
  // Apply styling to the container
  Object.assign(container.style, {
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    color: '#333',
    padding: '10px',
    width: `${width}px`,
    maxWidth: '100%',
    background: 'white',
    position: 'absolute',
    left: '-9999px',
    top: '-9999px'
  });
  
  return container;
}

/**
 * Configures SVG document attributes
 * @param {SVGDocument} svgDocument - The SVG document to configure
 * @param {number} width - The width to set
 */
function configureSvgDocument(svgDocument, width) {
  if (svgDocument && svgDocument.documentElement) {
    // Set width to our calculated width
    svgDocument.documentElement.setAttribute('width', width);
    
    // Remove any overflow restrictions
    svgDocument.documentElement.style.overflow = 'visible';
    
    // Note: We're not modifying the viewBox as it's correctly capturing the content
    // even with negative coordinates. This ensures all content is preserved.
  }
}

/**
 * Creates an error SVG when conversion fails
 * @param {number} width - The SVG width
 * @param {string} errorMessage - The error message to display
 * @returns {string} - SVG markup as a string
 */
function createErrorSvg(width, errorMessage) {
  const height = 200; // Fixed height for error message
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="#fff" />
    <text x="50" y="50" fill="red" font-family="sans-serif" font-size="14">Error: ${errorMessage}</text>
    <text x="50" y="80" fill="red" font-family="sans-serif" font-size="12">This method requires dom-to-svg to function properly.</text>
  </svg>`;
}
```

## Usage Example

```javascript
import { markdownToSvg } from './markdown-to-svg.js';

// Example markdown content
const markdown = `
# Hello SVG
This is a **markdown** document converted to SVG.

- Item 1
- Item 2
`;

async function convertAndUse() {
  // Convert markdown to SVG with maximum width of 350px
  const { svg, dimensions } = await markdownToSvg(markdown, 350);
  
  console.log(`SVG dimensions: ${dimensions.width} x ${dimensions.height}`);
  
  // Display SVG
  document.getElementById('svg-container').innerHTML = svg;
  
  // Or save SVG to file (if in Node.js environment)
  // fs.writeFileSync('output.svg', svg);
}

convertAndUse();
```

## How It Works

### 1. Markdown to HTML Conversion

The function first converts Markdown to HTML using `marked` and sanitizes it with `DOMPurify` to prevent XSS attacks.

### 2. Natural Width Calculation

To determine the optimal width for the SVG:
- It measures each block element's unwrapped width (using `whiteSpace: nowrap`)
- The maximum width found becomes the content width
- A padding is added for better display
- The width is constrained by the provided maximum width

This approach ensures that the SVG isn't unnecessarily wide, yet accommodates the content properly without truncation.

### 3. DOM to SVG Conversion

- A temporary container is created with the HTML content and styled appropriately
- The container is temporarily added to the DOM (required for dom-to-svg to work)
- dom-to-svg's `elementToSVG` function converts the DOM to SVG
- Attributes like width and overflow are set on the SVG
- The SVG is serialized to a string

### 4. Error Handling

If the conversion fails, the function:
- Removes any temporary elements from the DOM
- Logs the error
- Returns a fallback SVG with an error message
- Provides dimensions for the error SVG

## Known Limitations

1. **Browser Environment Required**: This function needs a DOM environment to work.
2. **ES Modules**: dom-to-svg is an ES module, so it may require a module bundler or an environment that supports ES modules.
3. **Styling**: Some complex CSS might not be perfectly converted to SVG.
4. **Performance**: For very large or complex Markdown, the conversion might be slow.

## Customization

You can customize the output by:
- Modifying the container styling in `createStyledContainer`
- Adjusting the minimum width constraint in `calculateNaturalWidth`
- Changing the font family or other styling attributes

## Troubleshooting

If you encounter issues:
1. Make sure all dependencies are correctly installed
2. Check that dom-to-svg has access to the DOM
3. Verify that the Markdown content can be parsed correctly
4. For very complex content, try increasing the maximum width
5. Look for any nested DOM issues that might affect conversion

## Integrating with Larger SVGs

When incorporating SVG generated by markdownToSvg() into larger SVG structures (like in a mindmap), there are two main approaches:

### Method 1: Embedding the Complete SVG (Recommended)

The simplest and most reliable approach is to embed the entire SVG element with positioning attributes:

```javascript
// Get the SVG from markdownToSvg()
const markdownResult = await markdownToSvg(nodeText, maxWidth);

// Calculate position within the parent SVG
const svgX = parentX + (parentWidth - markdownResult.dimensions.width) / 2;
const svgY = parentY + (parentHeight - markdownResult.dimensions.height) / 2;

// Embed the whole SVG with positioning
const embeddedSvg = markdownResult.svg.replace(/<svg/, `<svg x="${svgX}" y="${svgY}"`);

// Add to the larger SVG
largerSvg += embeddedSvg;
```

This approach preserves all the internal structure, viewBox transformations, and style context created by dom-to-svg, ensuring correct rendering.

### Method 2: Extracting Content with Coordinate Transformation

If you need to extract just the inner content from the SVG (without the nested SVG element), you must apply coordinate transformations to account for dom-to-svg's coordinate system:

```javascript
// Extract the inner content
const parser = new DOMParser();
const svgDoc = parser.parseFromString(markdownResult.svg, 'image/svg+xml');
const svgElement = svgDoc.documentElement;

// Get inner content
let innerContent = '';
for (const child of svgElement.childNodes) {
    if (child.nodeType === 1) { // Element nodes only
        const serializer = new XMLSerializer();
        innerContent += serializer.serializeToString(child);
    }
}

// Extract the viewBox to understand the coordinate system
const viewBox = svgElement.getAttribute('viewBox');
let [minX, minY, vbWidth, vbHeight] = [0, 0, width, height];
if (viewBox) {
    const viewBoxValues = viewBox.split(' ').map(parseFloat);
    if (viewBoxValues.length === 4) {
        [minX, minY, vbWidth, vbHeight] = viewBoxValues;
    }
}

// Create a new group with compensating transforms
const groupWithContent = `
<g transform="translate(${parentX - minX}, ${parentY - minY})">
    <!-- Apply original SVG's viewBox scale if needed -->
    <g transform="scale(${width / vbWidth}, ${height / vbHeight})">
        ${innerContent}
    </g>
</g>`;

// Add to the larger SVG
largerSvg += groupWithContent;
```

Key points for successful extraction:

1. **ViewBox Transformation**: dom-to-svg typically uses a large negative coordinate system (around -9998). You must apply a transform that compensates for these coordinates.

2. **Two-Level Transformation**:
   - First transform: `translate(x - minX, y - minY)` moves the content from negative coordinates to your target position
   - Second transform: `scale(width / vbWidth, height / vbHeight)` preserves the aspect ratio and scaling from the original SVG

3. **Namespace Issues**: When extracting content, you may lose important namespace declarations. If necessary, manually preserve `xmlns` and `xmlns:xlink` attributes.

4. **Testing**: Always test with various markdown inputs to ensure your transformation approach works consistently.

### Why Content Extraction Can Fail

Without proper coordinate transformation, extracted content from dom-to-svg will:
- Position text at large negative coordinates, making it invisible
- Lose the coordinate relationships established in the original SVG
- Break positioning of complex elements like links and formatted text

The nested SVG structure created by dom-to-svg is essential for proper rendering, as it provides the coordinate system and namespace context for the content.