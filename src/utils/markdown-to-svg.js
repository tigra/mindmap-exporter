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
 * @param {string} options.fontFamily - Font family to use
 * @param {number} options.fontSize - Font size in pixels
 * @param {string} options.fontWeight - Font weight (normal, bold, etc.)
 * @param {string} options.textColor - Text color (hex or named color)
 * @returns {Promise<Object>} - Promise that resolves to object containing the SVG markup string and its dimensions
 */
export async function markdownToSvg(
  markdownContent, 
  maxWidth = 400, 
  options = { debug: false, verbose: false, renderDelay: 0, fontFamily: null, fontSize: null, fontWeight: null, textColor: null }
) {
  const { debug, verbose, renderDelay, fontFamily, fontSize, fontWeight, textColor } = options;
  
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
  const width = calculateNaturalWidth(cleanHtml, maxWidth, { fontFamily, fontSize, fontWeight, textColor });
  log(`Calculated width: ${width}px (max allowed: ${maxWidth}px)`);
  
  // --- Step 3: Create a styled container for conversion ---
  log('3️⃣ Creating styled container');
  const container = createStyledContainer(cleanHtml, width, debug, { fontFamily, fontSize, fontWeight, textColor });
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
//    if (renderDelay > 0) {
//      log(`Waiting ${renderDelay}ms for DOM updates...`);
//      await sleep(renderDelay);
//    }

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
    configureSvgDocument(svgDocument, width, { 
      showDebugRect: typeof window !== 'undefined' ? window.showMarkdownDebugRect : true 
    });
    
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
      errorDiv.style.padding = '1px';
      errorDiv.style.marginTop = '1px';
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
 * @param {Object} styleOptions - Style options for measurement
 * @param {string} styleOptions.fontFamily - Font family to use
 * @param {number} styleOptions.fontSize - Font size in pixels
 * @param {string} styleOptions.fontWeight - Font weight (normal, bold, etc.)
 * @param {string} styleOptions.textColor - Text color (hex or named color)
 * @returns {number} - The optimal width for the content
 */
function calculateNaturalWidth(htmlContent, maxWidth = 400, styleOptions = {}) {
  // Create a temporary div to measure the natural content width
  const { fontFamily, fontSize, fontWeight, textColor } = styleOptions;
  
  const measureDiv = document.createElement('div');
  measureDiv.style.position = 'absolute';
  measureDiv.style.visibility = 'hidden';
  measureDiv.style.fontFamily = fontFamily || 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
  measureDiv.style.fontSize = fontSize ? `${fontSize}px` : '14px';
  measureDiv.style.fontWeight = fontWeight || 'normal';
  measureDiv.style.color = textColor || '#333';
  measureDiv.style.padding = '0'; // No padding to match rendering
  measureDiv.style.margin = '0';
  measureDiv.style.display = 'inline-block';
  measureDiv.style.boxSizing = 'border-box';
  measureDiv.style.overflow = 'hidden'; // Prevent content overflow
  measureDiv.style.textOverflow = 'ellipsis'; // Match rendering settings
  measureDiv.style.maxWidth = `${maxWidth}px`; // Set max width constraint
//  measureDiv.style.overflowWrap = 'break-word'; // Allow text to break at any point if needed
  measureDiv.innerHTML = htmlContent;

  // Add to DOM to get accurate measurements
  document.body.appendChild(measureDiv);

  // Apply the same tight styling to child elements as in createStyledContainer
  const childElements = measureDiv.querySelectorAll('*');
  for (const el of childElements) {
    el.style.margin = '0';
    el.style.padding = '0';
    el.style.width = 'fit-content'; // Make elements only as wide as their content
    el.style.maxWidth = '100%'; // But don't exceed container width
    el.style.boxSizing = 'border-box'; // Include padding in the width
  //  el.style.overflowWrap = 'break-word'; // Allow text to break at any point if needed
    
    // Specific handling for different elements
    if (el.tagName.toLowerCase() === 'p') {
      el.style.marginTop = '0';
      el.style.marginBottom = '0';
      el.style.paddingTop = '0';
      el.style.paddingBottom = '0';
      el.style.paddingRight = '0'; // Remove right padding
      el.style.textAlign = 'left'; // Align text left for consistent width
    }
    
    // Ensure inline elements don't have extra space
    if (el.tagName.toLowerCase() === 'span' || 
        el.tagName.toLowerCase() === 'a' || 
        el.tagName.toLowerCase() === 'strong' || 
        el.tagName.toLowerCase() === 'em') {
      el.style.display = 'inline';
      el.style.lineHeight = '1';
      el.style.whiteSpace = 'normal'; // Allow text to wrap normally
      el.style.paddingRight = '0'; // Remove right padding
    }
    
    // Ensure list items have proper wrapping
    if (el.tagName.toLowerCase() === 'ul' || el.tagName.toLowerCase() === 'ol' || el.tagName.toLowerCase() === 'li') {
      el.style.marginLeft = '0';
      el.style.paddingRight = '0';
      el.style.overflowWrap = 'break-word';
    }
  }
  
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
      wrapper.style.overflow = 'hidden'; // Prevent content overflow
      
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
  
  // Add minimal padding - reduced from 5px to 2px to minimize extra space
  maxLineWidth += 5;

  // Remove measure element
  document.body.removeChild(measureDiv);

  // Set a minimum width and cap at maximum
  return Math.max(Math.min(maxLineWidth, maxWidth), 20);
}

/**
 * Creates and styles a container for SVG conversion
 * @param {string} htmlContent - HTML content to put in the container
 * @param {number} width - Container width
 * @param {boolean} useDebugMode - Whether to show container for debugging
 * @param {Object} styleOptions - Style options for the container
 * @param {string} styleOptions.fontFamily - Font family to use
 * @param {number} styleOptions.fontSize - Font size in pixels
 * @param {string} styleOptions.fontWeight - Font weight (normal, bold, etc.)
 * @param {string} styleOptions.textColor - Text color (hex or named color)
 * @returns {HTMLElement} - Styled container element
 */
function createStyledContainer(htmlContent, width, useDebugMode = false, styleOptions = {}) {
  const container = document.createElement('div');
  container.id = 'markdown-container-' + Math.random().toString(36).substr(2, 9);
  container.setAttribute('data-dom-to-svg-container', 'true');
  container.innerHTML = htmlContent;
  
  // Apply styling to the container - optimized for tighter layout
  const { fontFamily, fontSize, fontWeight, textColor } = styleOptions;
  
  const styles = {
    width: `${width}px`,
    fontFamily: fontFamily || 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    fontSize: fontSize ? `${fontSize}px` : '14px',
    fontWeight: fontWeight || 'normal',
    lineHeight: '1', // Tight line height
    color: textColor || '#333',
    padding: '0', // Remove padding completely
    margin: '0', // Remove any margin
    boxSizing: 'border-box',
    position: 'absolute', // Needed for measurement
    overflow: 'hidden', // Prevent content from extending beyond container width
    textOverflow: 'ellipsis', // Show ellipsis for overflowing text
    whiteSpace: 'normal', // Allow text wrapping
    maxWidth: `${width}px`, // Ensure container doesn't exceed the specified width
  };
  
  // Debug mode shows the element on screen with visual indicators
  if (useDebugMode) {
    Object.assign(styles, {
      left: '2px',
      top: '2px',
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
  
  // Apply tight styling to child elements to minimize extra space
  const childElements = container.querySelectorAll('*');
  for (const el of childElements) {
    el.style.margin = '0';
    el.style.padding = '0';
    el.style.width = 'fit-content'; // Make elements only as wide as their content
    el.style.maxWidth = '100%'; // But don't exceed container width
    el.style.boxSizing = 'border-box'; // Include padding in the width
//    el.style.overflowWrap = 'break-word'; // Allow text to break at any point if needed
    
    // Specific handling for different elements
    if (el.tagName.toLowerCase() === 'p') {
      el.style.marginTop = '0';
      el.style.marginBottom = '0';
      el.style.paddingTop = '0';
      el.style.paddingBottom = '0';
      el.style.paddingRight = '0'; // Remove right padding
      el.style.textAlign = 'left'; // Align text left for consistent width
    }
    
    // Ensure inline elements don't have extra space
    if (el.tagName.toLowerCase() === 'span' || 
        el.tagName.toLowerCase() === 'a' || 
        el.tagName.toLowerCase() === 'strong' || 
        el.tagName.toLowerCase() === 'em') {
      el.style.display = 'inline';
      el.style.lineHeight = '1';
      el.style.whiteSpace = 'normal'; // Allow text to wrap normally
      el.style.paddingRight = '0'; // Remove right padding
    }
    
    // Ensure list items have proper wrapping
    if (el.tagName.toLowerCase() === 'ul' || el.tagName.toLowerCase() === 'ol' || el.tagName.toLowerCase() === 'li') {
      el.style.marginLeft = '1';  // ?
      el.style.paddingRight = '1'; // ?
      el.style.overflowWrap = 'break-word'; // ?
     }
  }

  // Force relayout to ensure proper dimensions
  const offset = container.offsetHeight;
  
  return container;
}

/**
 * Configures SVG document attributes
 * @param {SVGDocument} svgDocument - The SVG document to configure
 * @param {number} width - The width to set
 * @param {Object} options - Additional options
 * @param {boolean} options.showDebugRect - Whether to show debug rectangle (default: true)
 */
function configureSvgDocument(svgDocument, width, options = {}) {
  if (svgDocument && svgDocument.documentElement) {
    // Set width exactly to our calculated width - no extra buffer
    const contentWidth = width;
    svgDocument.documentElement.setAttribute('width', contentWidth);
    
    // Make sure height is defined
    if (!svgDocument.documentElement.hasAttribute('height')) {
      svgDocument.documentElement.setAttribute('height', 'auto');
    }
    
    // Set overflow to hidden to prevent content from extending beyond the SVG boundaries
    svgDocument.documentElement.style.overflow = 'hidden';
    
    // Get the current height
    const height = svgDocument.documentElement.getBoundingClientRect().height;
    
    // Check if debug rectangles should be displayed
    // First check options, then global setting, default to true if neither is set
    const showDebugRect = options.showDebugRect !== undefined ? 
      options.showDebugRect : 
      (typeof window !== 'undefined' && window.showMarkdownDebugRect !== undefined ? 
        window.showMarkdownDebugRect : true);
    
    if (showDebugRect) {
      // Add debug rectangle as the first child that perfectly matches text bounds
      const rect = svgDocument.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', '0');
      rect.setAttribute('y', '0');
      rect.setAttribute('width', width - 2); // Reduce width by 2px to ensure it's inside the SVG boundary
      rect.setAttribute('height', height);
      rect.setAttribute('fill', 'none');
      rect.setAttribute('stroke', 'red');
      rect.setAttribute('stroke-width', '1');
      rect.setAttribute('stroke-dasharray', '5,5');
      rect.setAttribute('class', 'markdown-debug-rect');
      
      // Add the rect as the first child
      if (svgDocument.documentElement.firstChild) {
        svgDocument.documentElement.insertBefore(rect, svgDocument.documentElement.firstChild);
      } else {
        svgDocument.documentElement.appendChild(rect);
      }
    }
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
    if (child.nodeType === 1) { // Element nodes only TODO check
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
  // Determine if debug rect should be shown
  const showDebugRect = typeof window !== 'undefined' ? window.showMarkdownDebugRect : true;
  
  // Add debug dashed rectangle around the content if enabled
  // Width reduced by 2px to ensure it doesn't cause extra space and stays within bounds
  const debugRect = showDebugRect ? 
    `<rect x="${minX}" y="${minY}" width="${vbWidth - 2}" height="${vbHeight}" 
          fill="none" stroke="red" stroke-width="1" stroke-dasharray="5,5" class="markdown-debug-rect" />` : 
    '';
  
  return `
<g transform="translate(${targetX - minX}, ${targetY - minY})">
 <g transform="scale(${width / vbWidth}, ${height / vbHeight})">
  ${debugRect}
  ${innerContent}
</g></g>
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
  // Parse the SVG to get its dimensions
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
  const svgElement = svgDoc.documentElement;
  
  // Get dimensions
  const width = parseFloat(svgElement.getAttribute('width') || 0);
  const height = parseFloat(svgElement.getAttribute('height') || 0);
  
  // Determine if debug rect should be shown
  const showDebugRect = typeof window !== 'undefined' ? window.showMarkdownDebugRect : true;
  
  // Add debug rectangle if enabled (width reduced by 2px)
  const debugRect = showDebugRect ? 
    `<rect x="0" y="0" width="${width - 2}" height="${height}" 
          fill="none" stroke="red" stroke-width="1" stroke-dasharray="5,5" class="markdown-debug-rect" />` : 
    '';
  
  // Add the debug rectangle at the beginning of the SVG content if enabled
  let modifiedSvg = svgString.replace(/<svg([^>]*)>/, 
                                      `<svg$1>${debugRect}`);
  
  // Add x/y positioning to the root SVG element
  return modifiedSvg.replace(/<svg/, `<svg x="${x}" y="${y}"`);
}

/**
 * Simple synchronous version of markdownToSvg that returns immediate dimensions
 * @param {string} markdownContent - The markdown content to convert
 * @param {number} maxWidth - Maximum width allowed for the SVG (default: 400)
 * @param {Object} options - Additional options for conversion
 * @param {boolean} options.verbose - Whether to enable verbose logging
 * @param {string} options.fontFamily - Font family to use
 * @param {number} options.fontSize - Font size in pixels
 * @param {string} options.fontWeight - Font weight (normal, bold, etc.)
 * @param {string} options.textColor - Text color (hex or named color)
 * @returns {Object} - Object containing dimensions
 */
export function markdownToSvgSync(markdownContent, maxWidth = 400, options = { verbose: false, fontFamily: null, fontSize: null, fontWeight: null, textColor: null }) {
  // Don't log every measurement call as it creates too much noise
  // console.log('markdownToSvgSync(', markdownContent, maxWidth, options);
  const { verbose, fontFamily, fontSize, fontWeight, textColor } = options;
  
  // Helper for conditional logging
  const log = (...args) => {
    if (verbose) console.log(...args);
  };
  
  try {
    // --- Step 1: Convert Markdown to sanitized HTML ---
    const rawHtml = marked.parse(markdownContent);
    const cleanHtml = DOMPurify.sanitize(rawHtml);
    
    // --- Step 2: Calculate optimal width ---
    const width = calculateNaturalWidth(cleanHtml, maxWidth, { fontFamily, fontSize, fontWeight, textColor });
    
    // --- Step 3: Create a styled container for measurement ---
    const container = createStyledContainer(cleanHtml, width, options['debug'], { fontFamily, fontSize, fontWeight, textColor });
    
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
    if (verbose) console.log('markdownToSvgSync result:', result);
    return result;
  } catch (error) {
    console.error('Error in synchronous markdown measurement:', error);
    
//    // Return fallback dimensions on error
//    return {
//      dimensions: {
//        width: maxWidth * 0.8,
//        height: 100
//      },
//      error: error.message
//    };
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