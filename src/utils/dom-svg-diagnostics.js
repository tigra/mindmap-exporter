/**
 * This file contains diagnostic utilities for understanding dom-to-svg behavior
 * and troubleshooting SVG rendering issues.
 */

/**
 * Diagnostic function to log information about a DOM node that the dom-to-svg library would process
 * @param {Node} node - The DOM node to diagnose
 * @param {number} depth - Current depth in the traversal (for indentation)
 */
export function diagnoseDomNode(node, depth = 0) {
  const indent = '  '.repeat(depth);
  
  // Check if it's an element node
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node;
    const tagName = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const classes = element.className ? `.${element.className.replace(/\s+/g, '.')}` : '';
    
    // Get computed style if available
    let styleInfo = '';
    if (window.getComputedStyle) {
      const style = window.getComputedStyle(element);
      const display = style.display;
      const visibility = style.visibility;
      const opacity = style.opacity;
      const color = style.color;
      const fontSize = style.fontSize;
      const fontFamily = style.fontFamily;
      
      styleInfo = ` [display=${display}, visibility=${visibility}, opacity=${opacity}, color=${color}, fontSize=${fontSize}, fontFamily=${fontFamily}]`;
    }
    
    // Get position and dimensions
    let rectInfo = '';
    try {
      const rect = element.getBoundingClientRect();
      rectInfo = ` (x=${rect.x.toFixed(1)}, y=${rect.y.toFixed(1)}, w=${rect.width.toFixed(1)}, h=${rect.height.toFixed(1)})`;
    } catch (e) {
      rectInfo = ' (unable to get bounding rect)';
    }
    
    // Log element info
    console.log(`${indent}ELEMENT: <${tagName}${id}${classes}>${styleInfo}${rectInfo}`);
    
    // Recursively process child nodes
    for (let i = 0; i < element.childNodes.length; i++) {
      diagnoseDomNode(element.childNodes[i], depth + 1);
    }
  } 
  // Check if it's a text node
  else if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || '';
    const trimmed = text.trim();
    const isEmpty = trimmed.length === 0;
    
    // Only log non-empty text nodes
    if (!isEmpty) {
      console.log(`${indent}TEXT: "${text.length > 50 ? text.substring(0, 47) + '...' : text}" (length=${text.length})`);
    } else if (text.length > 0) {
      console.log(`${indent}WHITESPACE: (length=${text.length})`);
    }
  }
  // Other node types
  else {
    console.log(`${indent}OTHER NODE: type=${node.nodeType}`);
  }
}

/**
 * Checks if a DOM element or any of its ancestors are hidden or invisible
 * @param {Element} element - Element to check
 * @returns {Object} Object with visibility status and reason if hidden
 */
export function getElementVisibility(element) {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) {
    return { visible: false, reason: 'Not an element node' };
  }
  
  // Check if element is connected to DOM
  if (!element.isConnected) {
    return { visible: false, reason: 'Element not connected to DOM' };
  }
  
  let currentElement = element;
  let depth = 0;
  const maxDepth = 20; // Prevent infinite loops
  
  while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE && depth < maxDepth) {
    const style = window.getComputedStyle(currentElement);
    
    // Check for properties that would make the element invisible
    if (style.display === 'none') {
      return { visible: false, reason: 'display: none', element: currentElement };
    }
    if (style.visibility === 'hidden' || style.visibility === 'collapse') {
      return { visible: false, reason: `visibility: ${style.visibility}`, element: currentElement };
    }
    if (parseFloat(style.opacity) === 0) {
      return { visible: false, reason: 'opacity: 0', element: currentElement };
    }
    
    // Zero dimensions check
    const rect = currentElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return { visible: false, reason: 'Zero width/height', dimensions: { width: rect.width, height: rect.height }, element: currentElement };
    }
    
    // Position off-screen check (this is tricky because dom-to-svg uses its own bounds)
    // We just check for extremely large negative values
    if (rect.x < -5000 || rect.y < -5000) {
      return { 
        visible: false, 
        reason: 'Possible off-screen positioning', 
        position: { x: rect.x, y: rect.y },
        element: currentElement
      };
    }
    
    currentElement = currentElement.parentElement;
    depth++;
  }
  
  return { visible: true };
}

/**
 * Gets detailed text node metrics for analyzing dom-to-svg text processing
 * @param {Text} textNode - The text node to analyze
 * @returns {Object} Object containing detailed metrics about the text node
 */
export function diagnoseTextNode(textNode) {
  if (textNode.nodeType !== Node.TEXT_NODE) {
    return { error: 'Not a text node' };
  }
  
  const text = textNode.textContent || '';
  const parent = textNode.parentElement;
  const parentTagName = parent?.tagName?.toLowerCase() || 'none';
  
  // Check if text is empty or just whitespace
  const trimmed = text.trim();
  const isEmpty = trimmed.length === 0;
  const isOnlyWhitespace = isEmpty && text.length > 0;
  
  // Check if parent is visible
  const parentVisibility = parent ? getElementVisibility(parent) : { visible: false, reason: 'No parent element' };
  
  // Get parent styles relevant to text rendering
  let styles = {};
  if (parent && window.getComputedStyle) {
    const style = window.getComputedStyle(parent);
    styles = {
      color: style.color,
      fontSize: style.fontSize,
      fontFamily: style.fontFamily,
      fontWeight: style.fontWeight,
      lineHeight: style.lineHeight,
      textAlign: style.textAlign,
      textDecoration: style.textDecoration,
      whiteSpace: style.whiteSpace,
      overflow: style.overflow,
      textOverflow: style.textOverflow
    };
  }
  
  // Get parent position and dimensions
  let parentRect = {};
  if (parent) {
    try {
      const rect = parent.getBoundingClientRect();
      parentRect = {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height
      };
    } catch (e) {
      parentRect = { error: e.message };
    }
  }
  
  // Check for text selection API
  let selectionSupport = 'unknown';
  try {
    selectionSupport = window.getSelection && typeof window.getSelection === 'function' ? 'supported' : 'unsupported';
  } catch (e) {
    selectionSupport = `error: ${e.message}`;
  }
  
  return {
    text: text.length > 100 ? text.substring(0, 97) + '...' : text,
    length: text.length,
    isEmpty,
    isOnlyWhitespace,
    hasSpecialChars: /[\t\n\r]/.test(text),
    parentElement: {
      tagName: parentTagName,
      visible: parentVisibility,
      rect: parentRect
    },
    styles,
    selectionAPI: selectionSupport
  };
}

/**
 * Enhanced diagnostic function to trace what dom-to-svg might be processing
 * @param {Element} element - The DOM element to trace
 */
export function traceDomToSvgProcess(element) {
  console.group('DOM-to-SVG Diagnostic Trace');
  
  // 1. Log element info - similar to what elementToSVG and handleElement would see
  console.log('TARGET ELEMENT:', element);
  console.log('NAMESPACE:', element.namespaceURI);
  console.log('TAG NAME:', element.tagName);
  console.log('ELEMENT VISIBILITY:', getElementVisibility(element));
  
  // 2. Get bounding rect - critical for SVG viewBox and positioning
  try {
    const bounds = element.getBoundingClientRect();
    console.log('BOUNDS:', {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      top: bounds.top,
      right: bounds.right,
      bottom: bounds.bottom,
      left: bounds.left
    });
  } catch (e) {
    console.error('Error getting element bounds:', e);
  }
  
  // 3. Check if element has text content - direct or nested
  const textContent = element.textContent?.trim() || '';
  console.log('TEXT CONTENT:', textContent ? (textContent.length > 100 ? textContent.substring(0, 97) + '...' : textContent) : '(empty)');
  
  // 4. Style and visibility - key factors for dom-to-svg traversal decisions
  if (window.getComputedStyle) {
    const style = window.getComputedStyle(element);
    console.log('KEY STYLES:', {
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
      position: style.position,
      overflow: style.overflow,
      zIndex: style.zIndex,
      transform: style.transform
    });
    
    console.log('TEXT STYLES:', {
      color: style.color,
      fontSize: style.fontSize,
      fontFamily: style.fontFamily,
      lineHeight: style.lineHeight,
      textAlign: style.textAlign,
      whiteSpace: style.whiteSpace
    });
  }
  
  // 5. Find and diagnose all text nodes - critical for text rendering analysis
  console.group('TEXT NODE DIAGNOSTICS:');
  const textNodes = [];
  const findTextNodes = (node) => {
    console.log('findTextNodes(', node, ')');
//    if (node.nodeType === Node.TEXT_NODE) {
    if (node.nodeType === 3) {
      textNodes.push(node);
//    } else if (node.nodeType === Node.ELEMENT_NODE) {
    } else if (node.nodeType === 1) {
      console.log('element node', node, ' with children: ', node.childNodes.length);
      for (let i = 0; i < node.childNodes.length; i++) {
        findTextNodes(node.childNodes[i]);
      }
    } else {
      console.log('unknown node ', node, ' of type ', node.nodeType);
    }
  };
  
  findTextNodes(element);
  console.log(`Found ${textNodes.length} text nodes`);
  
  // Analyze each text node
  for (let i = 0; i < textNodes.length; i++) {
    if (textNodes[i].textContent.trim().length > 0) { // Only log non-empty text nodes
      console.group(`Text Node #${i+1}`);
      console.log(diagnoseTextNode(textNodes[i]));
      console.groupEnd();
    }
  }
  console.groupEnd();
  
  // 6. Check for potential stacking contexts - affects SVG layer ordering
  console.group('POTENTIAL STACKING CONTEXTS:');
  const stackingElements = element.querySelectorAll('*');
  let stackingContextCount = 0;
  
  for (const el of stackingElements) {
    if (!el) continue;
    
    const style = window.getComputedStyle(el);
    const isStackingContext = 
      style.position === 'fixed' || 
      style.position === 'sticky' ||
      (style.position === 'absolute' && style.zIndex !== 'auto') ||
      style.opacity !== '1' ||
      style.transform !== 'none' ||
      style.filter !== 'none' ||
      style.isolation === 'isolate';
    
    if (isStackingContext) {
      stackingContextCount++;
      console.log(`Stacking context: <${el.tagName.toLowerCase()}>`, {
        position: style.position,
        zIndex: style.zIndex,
        opacity: style.opacity,
        transform: style.transform
      });
      
      // Only log first 5 to avoid excessive logging
      if (stackingContextCount >= 5) {
        console.log(`... and more (${stackingElements.length - 5} potential stacking contexts)`);
        break;
      }
    }
  }
  
  if (stackingContextCount === 0) {
    console.log('No obvious stacking contexts detected');
  }
  console.groupEnd();
  
  // 7. Traverse full DOM structure - similar to walkNode traversal
  console.log('DOM STRUCTURE:');
  diagnoseDomNode(element);
  
  console.groupEnd();
  return true; // Return true to indicate trace was completed
}

/**
 * Analyzes the SVG output from dom-to-svg to identify potential issues
 * @param {XMLDocument} svgDocument - The SVG document created by dom-to-svg
 * @param {Element} originalContainer - The original DOM container that was converted
 */
export function diagnoseSvgOutput(svgDocument, originalContainer) {
  console.group('SVG Output Diagnostic');
  
  const svgRoot = svgDocument.documentElement;
  
  // 1. Basic SVG properties
  console.log('SVG ELEMENT:', svgRoot);
  console.log('SVG ATTRIBUTES:', {
    width: svgRoot.getAttribute('width'),
    height: svgRoot.getAttribute('height'),
    viewBox: svgRoot.getAttribute('viewBox')
  });
  
  // 2. Count elements by type
  const elementsCount = {};
  Array.from(svgRoot.querySelectorAll('*')).forEach(element => {
    const tagName = element.tagName.toLowerCase();
    elementsCount[tagName] = (elementsCount[tagName] || 0) + 1;
  });
  console.log('ELEMENTS COUNT BY TYPE:', elementsCount);
  
  // 3. Specifically check for text elements
  const textElements = svgRoot.querySelectorAll('text');
  console.log(`TEXT ELEMENTS: ${textElements.length} found`);
  
  if (textElements.length === 0) {
    console.warn('⚠️ NO TEXT ELEMENTS FOUND IN SVG OUTPUT');
  } else {
    // Analyze first 5 text elements
    for (let i = 0; i < Math.min(textElements.length, 5); i++) {
      const textEl = textElements[i];
      console.group(`Text Element #${i+1}:`);
      console.log('Content:', textEl.textContent);
      console.log('Position:', {
        x: textEl.getAttribute('x'),
        y: textEl.getAttribute('y')
      });
      console.log('Style:', {
        fill: textEl.getAttribute('fill'),
        fontSize: textEl.getAttribute('font-size'),
        fontFamily: textEl.getAttribute('font-family')
      });
      console.log('Has tspans:', textEl.querySelectorAll('tspan').length > 0);
      console.groupEnd();
    }
    
    if (textElements.length > 5) {
      console.log(`... and ${textElements.length - 5} more text elements`);
    }
  }
  
  // 4. Check for text content discrepancies
  const originalText = (originalContainer.textContent || '').trim();
  const svgText = (svgRoot.textContent || '').trim();
  
  if (originalText && !svgText) {
    console.warn('⚠️ ORIGINAL DOM HAD TEXT BUT SVG HAS NONE');
    console.log('Original text:', originalText.length > 100 ? originalText.substring(0, 97) + '...' : originalText);
  } else if (originalText && svgText) {
    // Simple text content length comparison
    const originalTextLength = originalText.length;
    const svgTextLength = svgText.length;
    const lengthDiff = originalTextLength - svgTextLength;
    
    if (lengthDiff > 5) { // More than 5 characters different
      console.warn(`⚠️ TEXT LENGTH DISCREPANCY: SVG has ${lengthDiff} fewer characters than original`);
      console.log('Original text length:', originalTextLength);
      console.log('SVG text length:', svgTextLength);
    } else {
      console.log('Text content length appears consistent');
    }
  }
  
  // 5. Check for positioning in viewBox
  const viewBox = svgRoot.getAttribute('viewBox');
  if (viewBox) {
    const [minX, minY, width, height] = viewBox.split(' ').map(parseFloat);
    console.log('VIEWBOX VALUES:', { minX, minY, width, height });
    
    let textOutOfBounds = 0;
    textElements.forEach(textEl => {
      const x = parseFloat(textEl.getAttribute('x') || 0);
      const y = parseFloat(textEl.getAttribute('y') || 0);
      
      // Simple check if text might be outside viewBox
      if (x < minX || x > minX + width || y < minY || y > minY + height) {
        textOutOfBounds++;
      }
    });
    
    if (textOutOfBounds > 0) {
      console.warn(`⚠️ ${textOutOfBounds} TEXT ELEMENTS MIGHT BE OUTSIDE VIEWBOX`);
    }
  }
  
  console.groupEnd();
  return true;
}