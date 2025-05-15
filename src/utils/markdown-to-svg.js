// src/utils/markdown-to-svg.js

/**
 * Converts Markdown to SVG using dom-to-svg library
 * @param {string} markdownContent - The markdown content to convert
 * @param {number} maxWidth - Maximum width allowed for the SVG (default: 400)
 * @returns {Object} - Object containing the SVG markup string and its dimensions
 */
export async function markdownToSvg(markdownContent, maxWidth = 400) {
  // --- Step 1: Setup dependencies ---
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
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#333',
    padding: '10px',
    width: `${width}px`,
    maxWidth: '100%',
    background: 'transparent',
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
  }
}

/**
 * Creates an error SVG when conversion fails
 * @param {number} width - The SVG width
 * @param {string} errorMessage - The error message to display
 * @returns {string} - SVG markup as a string
 */
function createErrorSvg(width, errorMessage) {
  const height = 100; // Fixed height for error message
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="transparent" />
    <text x="5" y="20" fill="red" font-family="sans-serif" font-size="14">Error: Failed to render markdown</text>
    <text x="5" y="40" fill="red" font-family="sans-serif" font-size="12">${errorMessage}</text>
  </svg>`;
}

/**
 * Synchronous version that returns text for fallback
 * @param {string} markdownContent - The markdown content to convert
 * @returns {string} - Plain text from markdown
 */
export function markdownToText(markdownContent) {
  // Simple fallback function to extract plain text
  return markdownContent
    .replace(/#+\s+/g, '') // Remove heading markers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold markers
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic markers
    .replace(/~~([^~]+)~~/g, '$1') // Remove strikethrough
    .replace(/`([^`]+)`/g, '$1') // Remove inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Replace links with their text
    .trim(); // Trim whitespace
}