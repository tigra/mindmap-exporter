// src/utils/markdown-to-svg.js
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { elementToSVG } from 'dom-to-svg';
import { traceDomToSvgProcess, diagnoseSvgOutput } from './dom-svg-diagnostics.js';

// Simple synchronous implementation - no caching

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


/**
 * Converts Markdown to SVG using dom-to-svg library
 * @param {string} markdownContent - The markdown content to convert
 * @param {number} maxWidth - Maximum width allowed for the SVG (default: 400)
 * @param {Object} options - Additional options for conversion
 * @param {boolean} options.debug - Whether to enable debug mode, showing containers
 * @param {boolean} options.verbose - Whether to enable verbose logging
 * @param {number} options.renderDelay - Delay in ms before conversion (for DOM updates)
 * @returns {Promise<Object>} - Promise that resolves to object containing the SVG markup string and its dimensions
 */
export async function markdownToSvg(
  markdownContent, 
  maxWidth = 400, 
  options = { debug: false, verbose: false, renderDelay: 0 }
) {
  const { debug, verbose, renderDelay } = options;
  
  // Helper for conditional logging
  const log = (...args) => {
    if (verbose) console.log(...args);
  };
  
  log('🔍 Starting markdown-to-svg conversion process');
  log('Options:', { maxWidth, debug, verbose, renderDelay });
  
  // --- Step 1: Convert Markdown to sanitized HTML ---
  log('1️⃣ Converting Markdown to HTML');
  const rawHtml = marked.parse(markdownContent);
  log('Raw HTML generated:', rawHtml.substring(0, 200) + (rawHtml.length > 200 ? '...' : ''));
  
  const cleanHtml = DOMPurify.sanitize(rawHtml);
  log('Sanitized HTML:', cleanHtml.substring(0, 200) + (cleanHtml.length > 200 ? '...' : ''));

  // --- Step 2: Calculate optimal width ---
  log('2️⃣ Calculating optimal width');
  const width = calculateNaturalWidth(cleanHtml, maxWidth);
  log(`Calculated width: ${width}px (max allowed: ${maxWidth}px)`);
  
  // --- Step 3: Create a styled container for conversion ---
  log('3️⃣ Creating styled container');
  const container = createStyledContainer(cleanHtml, width, debug);
  log('Container created with ID:', container.id);
  
  // --- Step 4: Convert to SVG ---
  try {
    log('4️⃣ Adding container to DOM');
    // Add container to DOM (required for dom-to-svg to work)
    document.body.appendChild(container);
    
    // Force layout calculation to ensure proper dimensions
    const forceLayoutHeight = container.offsetHeight;
    log(`Container dimensions: ${container.offsetWidth}px × ${forceLayoutHeight}px`);

    // Add a delay to ensure the DOM is fully updated before measuring
    if (renderDelay > 0) {
      log(`Waiting ${renderDelay}ms for DOM updates...`);
      await sleep(renderDelay);
    }

    // Run diagnostic trace before conversion if verbose mode is enabled
    if (verbose) {
      log('5️⃣ Running DOM diagnostic');
      traceDomToSvgProcess(container);
    }
    
    // Get the final container height
    const height = container.offsetHeight;
    log(`Final container height: ${height}px`);
    
    // Convert DOM to SVG
    log('6️⃣ Converting HTML to SVG with dom-to-svg');
    const svgDocument = elementToSVG(container);
    
    // Set fixed attributes on the SVG
    log('7️⃣ Configuring SVG document');
    configureSvgDocument(svgDocument, width);
    
    // Convert to string
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgDocument);
    log('SVG serialized, length:', svgString.length);
    
    // Run SVG diagnostic if verbose mode is enabled
    if (verbose) {
      log('8️⃣ Analyzing SVG output');
      diagnoseSvgOutput(svgDocument, container);
    }
    
    // Remove the temporary container unless in debug mode
    if (!debug) {
      log('9️⃣ Removing temporary container');
      document.body.removeChild(container);
    } else {
      log('9️⃣ Container left visible for debugging (debug mode enabled)');
    }
    
    log('✅ Conversion complete');
    
    // Return both SVG and its dimensions without caching
    return {
      svg: svgString,
      dimensions: { width, height }
    };
    
  } catch (error) {
    // Log error details
    console.error('❌ Error in Markdown to SVG conversion:', error);
    console.error('Error stack:', error.stack);
    
    // Clean up if there's an error, but keep container visible in debug mode
    if (document.body.contains(container) && !debug) {
      document.body.removeChild(container);
    } else if (debug) {
      // Add visual indication that there was an error
      container.style.border = '2px solid #ff0000';
      container.style.background = 'rgba(255, 235, 235, 0.9)';
      
      // Add error message to container
      const errorDiv = document.createElement('div');
      errorDiv.style.color = '#ff0000';
      errorDiv.style.padding = '10px';
      errorDiv.style.marginTop = '10px';
      errorDiv.style.border = '1px solid #ff0000';
      errorDiv.style.background = 'rgba(255, 255, 255, 0.8)';
      errorDiv.textContent = `Error: ${error.message}`;
      container.appendChild(errorDiv);
      
      console.warn('Container left visible for debugging despite error');
    }
    
    // Create a fallback error SVG
    const errorSvg = createErrorSvg(maxWidth, error.message);
    return {
      svg: errorSvg,
      dimensions: { width: maxWidth, height: 200 },
      error: error
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
 * @param {boolean} useDebugMode - Whether to show container for debugging
 * @returns {HTMLElement} - Styled container element
 */
function createStyledContainer(htmlContent, width, useDebugMode = false) {
  const container = document.createElement('div');
  container.id = 'markdown-container-' + Math.random().toString(36).substr(2, 9);
  container.setAttribute('data-dom-to-svg-container', 'true');
  container.innerHTML = htmlContent;
  
  // Apply styling to the container
  const styles = {
    width: `${width}px`,
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#333',
    padding: '10px',
    boxSizing: 'border-box',
    position: 'absolute', // Needed for measurement
  };
  
  // Debug mode shows the element on screen with visual indicators
  if (useDebugMode) {
    Object.assign(styles, {
//      background: 'rgba(240, 240, 250, 0.9)',
//      border: '2px solid #4285F4',
//      borderRadius: '4px',
      left: '10px',
      top: '10px',
      zIndex: 10000,
      visibility: 'visible',
      display: 'block',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
    });
  } else {
    // Standard offscreen positioning
    Object.assign(styles, {
      background: 'transparent',
      left: '-9999px',
      top: '-9999px' 
    });
  }
  
  Object.assign(container.style, styles);

  console.log('container.innerHTML', container.innerHTML);
  console.log('offsetHeight', container.offsetHeight); // Reading this property forces layout
  
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
    
    // Make sure height is defined
    if (!svgDocument.documentElement.hasAttribute('height')) {
      svgDocument.documentElement.setAttribute('height', 'auto');
    }
    
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
 * Extracts SVG inner content from an SVG string and prepares it for embedding in a larger SVG
 * @param {string} svgString - The SVG string to extract content from
 * @param {number} targetX - The target X position for the content
 * @param {number} targetY - The target Y position for the content
 * @returns {string} - SVG group element containing the extracted content with appropriate transforms
 */
export function extractSvgContent(svgString, targetX, targetY) {
  // Parse the SVG
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
  const svgElement = svgDoc.documentElement;
  
  // Get inner content (all child nodes)
  let innerContent = '';
  for (const child of svgElement.childNodes) {
    if (child.nodeType === 1) { // Element nodes only
      const serializer = new XMLSerializer();
      innerContent += serializer.serializeToString(child);
    }
  }
  
  // Extract original SVG dimensions and viewBox
  const width = parseFloat(svgElement.getAttribute('width') || 0);
  const height = parseFloat(svgElement.getAttribute('height') || 0);
  
  // Extract viewBox to understand the coordinate system
  const viewBox = svgElement.getAttribute('viewBox');
  let minX = 0, minY = 0, vbWidth = width, vbHeight = height;
  
  if (viewBox) {
    const viewBoxValues = viewBox.split(' ').map(parseFloat);
    if (viewBoxValues.length === 4) {
      [minX, minY, vbWidth, vbHeight] = viewBoxValues;
    }
  }
  
  // Create group with appropriate transforms to compensate for coordinate system
  return `
    <!-- Extracted SVG content with coordinate transformations -->
    <g transform="translate(${targetX - minX}, ${targetY - minY})">
      <!-- Apply original SVG's viewBox scale if needed -->
      <g transform="scale(${width / vbWidth}, ${height / vbHeight})">
        ${innerContent}
      </g>
    </g>
  `;
}

/**
 * Embeds an SVG string into a larger SVG by adding positioning attributes
 * @param {string} svgString - The SVG string to embed
 * @param {number} x - The target X position
 * @param {number} y - The target Y position
 * @returns {string} - The modified SVG with positioning attributes
 */
export function embedSvg(svgString, x, y) {
  // Simply add x/y positioning to the root SVG element
  return svgString.replace(/<svg/, `<svg x="${x}" y="${y}"`);
}

/**
 * Simple synchronous version of markdownToSvg that returns immediate dimensions
 * @param {string} markdownContent - The markdown content to convert
 * @param {number} maxWidth - Maximum width allowed for the SVG (default: 400)
 * @param {Object} options - Additional options for conversion
 * @returns {Object} - Object containing dimensions
 */
export function markdownToSvgSync(markdownContent, maxWidth = 400, options = { verbose: false }) {
  console.log('markdownToSvgSync(', markdownContent, maxWidth, options);
  const { verbose } = options;
  
  // Helper for conditional logging
  const log = (...args) => {
    if (verbose) console.log(...args);
  };
  
  try {
    // --- Step 1: Convert Markdown to sanitized HTML ---
    const rawHtml = marked.parse(markdownContent);
    const cleanHtml = DOMPurify.sanitize(rawHtml);
    
    // --- Step 2: Calculate optimal width ---
    const width = calculateNaturalWidth(cleanHtml, maxWidth);
    
    // --- Step 3: Create a styled container for measurement ---
    const container = createStyledContainer(cleanHtml, width, options['debug']);
    
    // Add container to DOM for measuring
    document.body.appendChild(container);
    
    // Force layout calculation to ensure proper dimensions
    container.getBoundingClientRect();
    
    // Get the dimensions
    const calculatedWidth = Math.min(container.offsetWidth, maxWidth);
    const calculatedHeight = container.offsetHeight;
    
    // Remove the temporary container
    document.body.removeChild(container);
    
    // Create result object with dimensions
    const result = {
      dimensions: {
        width: calculatedWidth,
        height: calculatedHeight
      }
    };
    
    // If there's a global reference, attach this for convenience
    if (typeof window !== 'undefined') {
      window.markdownToSvgSync = markdownToSvgSync;
    }
    console.log('markdownToSvgSync result:', result);
    return result;
  } catch (error) {
    console.error('Error in synchronous markdown measurement:', error);
    
    // Return fallback dimensions on error
    return {
      dimensions: {
        width: maxWidth * 0.8,
        height: 100
      },
      error: error.message
    };
  }
}

/**
 * Synchronous version that returns text for fallback TODO don't use
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