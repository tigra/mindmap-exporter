// src/utils/markdown-to-svg.js

// Import required libraries - these are properly installed in package.json
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { elementToSVG } from 'dom-to-svg';

// A simple cache for rendered markdown
const markdownCache = new Map();

/**
 * Converts Markdown to SVG using dom-to-svg library
 * @param {string} markdownContent - The markdown content to convert
 * @param {number} maxWidth - Maximum width allowed for the SVG (default: 400)
 * @param {Object} options - Additional options for styling
 * @returns {Object} - Object containing the SVG markup string and its dimensions
 */
export async function markdownToSvg(markdownContent, maxWidth = 400, options = {}) {
  // Check cache first
  const cacheKey = `${markdownContent}:${maxWidth}:${JSON.stringify(options)}`;
  if (markdownCache.has(cacheKey)) {
    return markdownCache.get(cacheKey);
  }

  try {
    // --- Step 1: Convert Markdown to sanitized HTML ---
    const rawHtml = marked.parse(markdownContent);
    const cleanHtml = rawHtml; // DOMPurify.sanitize(rawHtml);

    // --- Step 2: Calculate optimal width ---
    const width = calculateNaturalWidth(cleanHtml, maxWidth);
    
    // Check if we only need to calculate dimensions
    if (options.calculateSizeOnly) {
      const container = createStyledContainer(cleanHtml, width, options);
      document.body.appendChild(container);
      const height = container.offsetHeight;
      document.body.removeChild(container);
      
      const result = {
        dimensions: { width, height }
      };
      
      // Cache the result
      markdownCache.set(cacheKey, result);
      return result;
    }
    
    // --- Step 3: Create a styled container for conversion ---
    const container = createStyledContainer(cleanHtml, width, options);
    
    // --- Step 4: Convert to SVG ---
    // Add container to DOM (required for dom-to-svg to work)
    document.body.appendChild(container);
    
    // Get the container height
    const height = container.offsetHeight;
    
    // Convert DOM to SVG using dom-to-svg library
    const svgDocument = elementToSVG(container);
    
    // Set fixed attributes on the SVG
    configureSvgDocument(svgDocument, width, height, options);
    
    // Convert to string
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgDocument);
    
    // Remove the temporary container
    document.body.removeChild(container);
    
    // Create result
    const result = {
      svg: svgString,
      dimensions: { width, height }
    };
    
    // Cache the result
    markdownCache.set(cacheKey, result);
    
    // Return both SVG and its dimensions
    return result;
    
  } catch (error) {
    console.error('Error in Markdown to SVG conversion:', error);
    throw error;
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
  const blockElements = measureDiv.querySelectorAll('p, br, h1, h2, h3, h4, h5, h6, ul, ol, li, blockquote, pre, table');
  
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
 * @param {Object} options - Additional styling options
 * @returns {HTMLElement} - Styled container element
 */
function createStyledContainer(htmlContent, width, options = {}) {
  const container = document.createElement('div');
  container.innerHTML = htmlContent;
  
  // Get styling options with defaults
  const {
    fontFamily = 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    fontSize = 14,
    fontWeight = 'normal',
    color = '#333',
    textAlign = 'left',
    lineHeight = 1.5,
    padding = 10
  } = options;
  
  // Apply styling to the container
  Object.assign(container.style, {
    fontFamily: fontFamily,
    fontSize: `${fontSize}px`,
    fontWeight: fontWeight,
    lineHeight: String(lineHeight),
    color: color,
    textAlign: textAlign,
    padding: `${padding}px`,
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
 * @param {number} height - The height to set
 * @param {Object} options - Additional options
 */
function configureSvgDocument(svgDocument, width, height, options = {}) {
  if (svgDocument && svgDocument.documentElement) {
    // Set dimensions
    svgDocument.documentElement.setAttribute('width', width);
    svgDocument.documentElement.setAttribute('height', height);
    
    // Set viewBox for proper scaling
    svgDocument.documentElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
    
    // Remove any overflow restrictions
    svgDocument.documentElement.style.overflow = 'visible';
    
    // Add classes for styling
    const existingClass = svgDocument.documentElement.getAttribute('class') || '';
//    svgDocument.documentElement.setAttribute('class',
//      `${existingClass} markdown-svg`.trim());
    
    // Add additional attributes from options
    if (options.id) {
      svgDocument.documentElement.setAttribute('id', options.id);
    }
  }
}

