// src/renderer/mindmap-renderer.js

import eventBridge from '../utils/event-bridge.js';

/**
 * MindmapRenderer class for SVG generation with interactive expand/collapse
 */
class MindmapRenderer {
  /**
   * Create a new MindmapRenderer
   * @param {Object} model - The mindmap model
   * @param {Object} styleManager - The style manager
   */
  constructor(model, styleManager) {
    this.model = model;
    this.styleManager = styleManager;
    this.minX = Infinity;
    this.minY = Infinity;
    this.maxX = -Infinity;
    this.maxY = -Infinity;
    this.padding = 100;
    this.nodeMap = new Map(); // Store references to nodes by id
  }

  /**
   * Find the bounds of the entire mindmap
   */
  findBounds() {
    this.minX = Infinity;
    this.minY = Infinity;
    this.maxX = -Infinity;
    this.maxY = -Infinity;

    this._findBoundsRecursive(this.model.getRoot());

    // Add padding
    this.minX -= this.padding;
    this.minY -= this.padding;
    this.maxX += this.padding;
    this.maxY += this.padding;

    this.width = this.maxX - this.minX;
    this.height = this.maxY - this.minY;
  }

  /**
   * Recursively find bounds for node and its children
   * @private
   * @param {Object} node - The node to process
   */
  _findBoundsRecursive(node) {
    this.minX = Math.min(this.minX, node.x);
    this.minY = Math.min(this.minY, node.y);
    this.maxX = Math.max(this.maxX, node.x + node.width);
    this.maxY = Math.max(this.maxY, node.y + node.height);

    // Store node reference in the map
    this.nodeMap.set(node.id, node);

    // Only process children if not collapsed
    if (!node.collapsed) {
      for (let i = 0; i < node.children.length; i++) {
        this._findBoundsRecursive(node.children[i]);
      }
    }
  }

  /**
   * Create SVG container with proper dimensions
   * @return {string} SVG container element
   */
  createSvgContainer() {
    return `<svg xmlns="http://www.w3.org/2000/svg"
                    width="${this.width}"
                    height="${this.height}"
                    viewBox="${this.minX} ${this.minY} ${this.width} ${this.height}">`;
  }

  /**
   * Create gradient and filter definitions
   * @return {string} SVG defs element with gradients and filters
   */
  createDefs() {
    let defs = '<defs>';

    // Create gradients for different levels
    const gradients = [];
    const levelCount = 6; // Maximum number of distinct level styles to create gradients for

    for (let i = 1; i <= levelCount; i++) {
      const levelStyle = this.styleManager.getLevelStyle(i);
      if (levelStyle && levelStyle.backgroundColor) {
        // If the background is already a gradient or uses special format, skip
        if (levelStyle.backgroundColor.startsWith('url') ||
            levelStyle.backgroundColor.startsWith('linear-gradient')) {
          continue;
        }

        // Create a gradient variant of the background color
        const baseColor = levelStyle.backgroundColor;
        const lightColor = this._lightenColor(baseColor, 30);
        const darkColor = this._darkenColor(baseColor, 10);

        defs += this._createGradient(`level${i}Gradient`, lightColor, darkColor);
        gradients.push(i);
      }
      
      // Create connection gradients if tapered connections are enabled
      if (levelStyle && levelStyle.connectionTapered && levelStyle.connectionGradient && levelStyle.connectionColor) {
        const baseColor = levelStyle.connectionColor;
        const lightColor = this._lightenColor(baseColor, 20);
        const darkColor = this._darkenColor(baseColor, 10);
        
        defs += this._createGradient(`level${i}ConnectionGradient`, lightColor, darkColor);
      }
    }

    // Store the gradients for use in node rendering
    this.gradients = gradients;
    
    // Add specific connection gradients if needed
    if (this.connectionGradients && this.connectionGradients.size > 0) {
      for (const gradientInfo of this.connectionGradients) {
        const baseColor = gradientInfo.color;
        const lightColor = this._lightenColor(baseColor, 20);
        const darkColor = this._darkenColor(baseColor, 10);
        
        defs += this._createGradient(gradientInfo.id, lightColor, darkColor);
      }
    }

    // Drop shadow filter
    defs += `<filter id="dropShadow">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                    <feOffset dx="2" dy="2" result="offsetblur"/>
                    <feComponentTransfer><feFuncA type="linear" slope="0.2"/></feComponentTransfer>
                    <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>`;

    defs += '</defs>';
    return defs;
  }

  /**
   * Create a linear gradient definition
   * @private
   * @param {string} id - The gradient ID
   * @param {string} color1 - The start color
   * @param {string} color2 - The end color
   * @return {string} SVG linearGradient element
   */
  _createGradient(id, color1, color2) {
    return `<linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
                </linearGradient>`;
  }

  /**
   * Get fill color based on node level and style
   * @param {Object} node - The node to get fill color for
   * @return {string} Fill color or gradient
   */
  getFillColor(node) {
    const levelStyle = this.styleManager.getLevelStyle(node.level);

    // If this level has a gradient created, use it
    if (this.gradients && this.gradients.includes(node.level)) {
      return `url(#level${node.level}Gradient)`;
    }

    // Otherwise use the background color from the style
    return levelStyle.backgroundColor || '#f5f5f5';
  }

  /**
   * Draw all nodes starting from root
   * @return {string} SVG elements for all nodes
   */
  drawNodes() {
    return this._drawNodeRecursive(this.model.getRoot());
  }

  _drawParentDropZone(node, parentChildPadding) {
    return `<rect x="${node.boundingBox.x}" y="${node.boundingBox.y - parentChildPadding/2}"
     width="${node.width}" height="${node.boundingBox.height / 2 + parentChildPadding / 2}" fill="#500000"
     stroke="#450000"
     fill-opacity="0.1" class="node-shape" /> `  +
     `<rect x="${node.boundingBox.x}" y="${node.boundingBox.y + node.boundingBox.height / 2}"
     width="${node.width}" height="${node.boundingBox.height / 2  + parentChildPadding / 2}" fill="#000060"
     stroke="#000045"
     fill-opacity="0.1" class="node-shape" />`
  }

  _drawChildDropZone(node, layout, parentChildPadding) {
    var additionalSpan = 0;
    if (!node.hasChildren()) {
        additionalSpan = 300;
    }
    return `<rect x="${node.boundingBox.x+node.width}" y="${node.boundingBox.y - parentChildPadding / 2}"
     width="${layout.parentPadding + additionalSpan}" height="${node.boundingBox.height + parentChildPadding}" fill="#005000"
     fill-opacity="0.1" stroke="#004000" class="node-shape"
     />`
  }

  /**
   * Recursively draw a node and its children
   * @private
   * @param {Object} node - The node to draw
   * @return {string} SVG elements for the node and its children
   */
  _drawNodeRecursive(node) {
    let svg = '';
    const levelStyle = this.styleManager.getLevelStyle(node.level);
    const parentChildPadding = node.level > 1 ? this.styleManager.getLevelStyle(node.level - 1).childPadding : 0;
    const layout = levelStyle.getLayout();
    // TODO configure / style these thingies:
//    svg += `<circle r="5" cx="${node.x}" cy="${node.y}" fill="red" />`
//    svg += this._drawParentDropZone(node, parentChildPadding ? parentChildPadding : 0);
//    svg += this._drawChildDropZone(node, layout, parentChildPadding);
    if (levelStyle.boundingBox) {
       svg += this._drawBoundingBox(node);
    }
    // Only draw connections to children if not collapsed
    if (!node.collapsed) {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        svg += this._drawConnection(node, child);
        // Recursively draw child nodes
        svg += this._drawNodeRecursive(child);
      }
    }

    // Draw the node based on its nodeType
    if (levelStyle.nodeType === 'text-only') {
      // For text-only nodes, draw just the text
      svg += this._drawNodeText(node, false);
    } else {
      // For box nodes, draw both shape and text
      svg += this._drawNodeShape(node);
      svg += this._drawNodeText(node, true);
    }

    // Add collapsible indicator if node has children
    if (node.hasChildren()) {
      svg += this._drawCollapseIndicator(node);
    }
    
    // Draw any debug elements attached to the node
    if (node.debugElements && node.debugElements.length > 0) {
      svg += this._drawDebugElements(node);
    }

    return svg;
  }
  
  /**
   * Draw debug elements attached to a node
   * @private
   * @param {Object} node - The node with debug elements
   * @return {string} SVG elements for debugging
   */
  _drawDebugElements(node) {
    if (!node.debugElements || node.debugElements.length === 0) {
      return '';
    }
    
    const debugElements = [];
    
    // Generate SVG for each debug element
    for (const element of node.debugElements) {
      switch (element.type) {
        case 'line':
          debugElements.push(`<line 
            x1="${element.x1}" 
            y1="${element.y1}" 
            x2="${element.x2}" 
            y2="${element.y2}" 
            stroke="${element.stroke}" 
            stroke-width="${element.strokeWidth}" 
            stroke-dasharray="${element.strokeDasharray}" />`);
          break;
          
        case 'text':
          debugElements.push(`<text 
            x="${element.x}" 
            y="${element.y}" 
            text-anchor="${element.textAnchor}" 
            fill="${element.fill}" 
            font-size="${element.fontSize}">${element.content}</text>`);
          break;
          
        // Add more cases for other element types as needed
      }
    }
    
    return `<g class="debug-elements" id="${node.id}_debug">${debugElements.join('\n')}</g>`;
  }

  /**
   * Calculate Bezier control points for a connection
   * @private
   * @param {ConnectionPoint} startPoint - The starting connection point
   * @param {ConnectionPoint} endPoint - The ending connection point
   * @return {Array} Array of [cp1x, cp1y, cp2x, cp2y] control points
   */
  _calculateBezierControlPoints(startPoint, endPoint) {
    // Check if it's a vertical or horizontal connection
    const isVerticalLayout = startPoint.direction === 'bottom' || startPoint.direction === 'top';

    if (isVerticalLayout) {
      // For vertical layout, create a curve that bends vertically
      const dy = endPoint.y - startPoint.y;
      return [
        startPoint.x, startPoint.y + dy * 0.4,
        endPoint.x, startPoint.y + dy * 0.6
      ];
    } else {
      // For horizontal layout, create a curve that bends horizontally
      const dx = endPoint.x - startPoint.x;
      return [
        startPoint.x + dx * 0.4, startPoint.y,
        startPoint.x + dx * 0.6, endPoint.y
      ];
    }
  }

  /**
   * Calculate perpendicular offset points based on connection point direction
   * @private
   * @param {ConnectionPoint} point - The connection point
   * @param {number} width - The width to offset (half on each side)
   * @return {Array} Array of [topX, topY, bottomX, bottomY] for the offset points
   */
  _calculatePerpendicularOffsets(point, width) {
    // Calculate offset based on the connection point direction
    // Always return points in a consistent order: first point is always the "top/left" offset
    // and second point is always the "bottom/right" offset, regardless of direction
    
    switch (point.direction) {
      case 'top':
        // Offset horizontally for top-pointing connection
        return [
          point.x - width/2, point.y,  // left point
          point.x + width/2, point.y   // right point
        ];
      case 'bottom':
        // Offset horizontally for bottom-pointing connection (same as top)
        return [
          point.x - width/2, point.y,  // left point
          point.x + width/2, point.y   // right point
        ];
      case 'left':
        // Offset vertically for left-pointing connection
        return [
          point.x, point.y - width/2,  // top point
          point.x, point.y + width/2   // bottom point
        ];
      case 'right':
        // Offset vertically for right-pointing connection (same as left)
        return [
          point.x, point.y - width/2,  // top point
          point.x, point.y + width/2   // bottom point
        ];
      default:
        // Default to horizontal offset if direction is unknown
        return [
          point.x - width/2, point.y,
          point.x + width/2, point.y
        ];
    }
  }

  /**
   * Draw a tapered connection between parent and child nodes
   * @private
   * @param {Object} parent - The parent node
   * @param {Object} child - The child node
   * @param {Object} parentStyle - The parent node's style
   * @param {Object} childStyle - The child node's style
   * @param {ConnectionPoint} startPoint - The starting connection point
   * @param {ConnectionPoint} endPoint - The ending connection point
   * @return {string} SVG path element for the tapered connection
   */
  _drawTaperedConnection(parent, child, parentStyle, childStyle, startPoint, endPoint) {
    // Get connection widths from style
    const startWidth = parentStyle.connectionStartWidth || 8;
    const endWidth = parentStyle.connectionEndWidth || 2;
    
    // Calculate control points for the centerline curve
    const [cp1x, cp1y, cp2x, cp2y] = this._calculateBezierControlPoints(startPoint, endPoint);
    
    // Calculate perpendicular offsets at start and end points
    // Now these are consistently ordered: [leftX, leftY, rightX, rightY] or [topX, topY, bottomX, bottomY]
    const [startLeftX, startLeftY, startRightX, startRightY] = 
      this._calculatePerpendicularOffsets(startPoint, startWidth);
    
    const [endLeftX, endLeftY, endRightX, endRightY] = 
      this._calculatePerpendicularOffsets(endPoint, endWidth);
    
    // Create the filled path - always going clockwise
    const path = `M ${startLeftX} ${startLeftY}
                   C ${cp1x + (startLeftX - startPoint.x)} ${cp1y + (startLeftY - startPoint.y)},
                     ${cp2x + (endLeftX - endPoint.x)} ${cp2y + (endLeftY - endPoint.y)},
                     ${endLeftX} ${endLeftY}
                   L ${endRightX} ${endRightY}
                   C ${cp2x + (endRightX - endPoint.x)} ${cp2y + (endRightY - endPoint.y)},
                     ${cp1x + (startRightX - startPoint.x)} ${cp1y + (startRightY - startPoint.y)},
                     ${startRightX} ${startRightY}
                   Z`;
    
    // Get connection color from style
    const connectionColor = parentStyle.connectionColor || '#666';
    
    // Check if gradient should be used
    let fill = connectionColor;
    if (parentStyle.connectionGradient) {
      const gradientId = `gradient_${parent.id}_${child.id}`;
      // Create a gradient in the defs section if it doesn't exist
      if (!this.connectionGradients) {
        this.connectionGradients = new Set();
      }
      
      // Add this gradient to the set to be created in createDefs
      this.connectionGradients.add({
        id: gradientId,
        color: connectionColor,
        parent: parent,
        child: child
      });
      
      fill = `url(#${gradientId})`;
    }
    
    return `<path d="${path}" fill="${fill}" />`;
  }

  /**
   * Draw a connection between parent and child nodes
   * @private
   * @param {Object} parent - The parent node
   * @param {Object} child - The child node
   * @return {string} SVG path element for the connection
   */
  _drawConnection(parent, child) {
    console.groupCollapsed(`_drawConnection: parent "${parent.text}" (level ${parent.level}) -> child "${child.text}" (level ${child.level})`);
    
    const parentStyle = this.styleManager.getLevelStyle(parent.level);
    const childStyle = this.styleManager.getLevelStyle(child.level);

    const parentLayout = parentStyle.getLayout();
    const childLayout = childStyle.getLayout();
    
    console.log(`Parent layout type: ${parentLayout.constructor.name}`);
    console.log(`Child layout type: ${childLayout.constructor.name}`);
    console.log(`Parent style layout type: ${parentStyle.layoutType}`);
    console.log(`Child style layout type: ${childStyle.layoutType}`);
    
    // Extra logging to investigate layout type issue
    if (child.level >= 4) {
      console.log(`CHECKING LEVEL ${child.level} NODE "${child.text}" LAYOUT INFO:`);
      
      // Check for overrides
      if (child.configOverrides) {
        console.log(`  Node has overrides:`, child.configOverrides);
        
        if (child.configOverrides.layoutType) {
          console.log(`  IMPORTANT: Node has layoutType override: ${child.configOverrides.layoutType}`);
        }
      } else {
        console.log(`  Node has no overrides`);
      }
      
      // Check effective value directly
      if (childStyle.styleManager && childStyle.styleManager.getEffectiveValue) {
        const effectiveLayoutType = childStyle.styleManager.getEffectiveValue(child, 'layoutType');
        console.log(`  Effective layoutType: ${effectiveLayoutType}`);
      }
    }

    // Pass the child node to getParentConnectionPoint to enable multiple connection points
    const startPoint = parentLayout.getParentConnectionPoint(parent, parentStyle, child);
    const endPoint = childLayout.getChildConnectionPoint(child, childStyle);
    
    console.log(`Connection points:`);
    console.log(`  Start: {x: ${startPoint.x}, y: ${startPoint.y}, direction: ${startPoint.direction}}`);
    console.log(`  End: {x: ${endPoint.x}, y: ${endPoint.y}, direction: ${endPoint.direction}}`);

    // Check if tapered connections are enabled
    const useTapered = parentStyle.connectionTapered || false;
    console.log(`Using tapered connection: ${useTapered}`);
    
    let result;
    if (useTapered) {
      result = this._drawTaperedConnection(parent, child, parentStyle, childStyle, startPoint, endPoint);
    } else {
      // If not using tapered, proceed with the original stroke-based connection
      // Calculate the Bezier curve control points
      const [cp1x, cp1y, cp2x, cp2y] = this._calculateBezierControlPoints(startPoint, endPoint);
      
      // Create the path with the calculated control points
      const path = `M ${startPoint.x} ${startPoint.y}
                     C ${cp1x} ${cp1y},
                       ${cp2x} ${cp2y},
                       ${endPoint.x} ${endPoint.y}`;

      // Get connection color from style
      const connectionColor = parentStyle.connectionColor || '#666';
      const connectionWidth = parentStyle.connectionWidth || 2;

      result = `<path d="${path}" stroke="${connectionColor}" stroke-width="${connectionWidth}" fill="none" />`;
    }
    
    console.groupEnd();
    return result;
  }

    _drawBoundingBox(node) {
        if (node.boundingBox) {
//            console.log(node.boundingBox);
            return `<rect x="${node.boundingBox.x}" y="${node.boundingBox.y}"
                          width="${node.boundingBox.width}" height="${node.boundingBox.height}"
                          rx="2" ry="2" fill="#101010" fill-opacity="0.05"
                          stroke="#001000" stroke-width="1" filter="url(#dropShadow)"
                          id="${node.id}_bbox" class="node-shape" />`;
        } else {
//            console.log('no bounding box!');
            return '';
        }
    }

  /**
   * Draw the shape for a node
   * @private
   * @param {Object} node - The node to draw shape for
   * @return {string} SVG rect element for the node shape
   */
  _drawNodeShape(node) {
    const levelStyle = this.styleManager.getLevelStyle(node.level);
    const fillColor = this.getFillColor(node);
    const borderRadius = levelStyle.borderRadius || 5;
    const borderColor = levelStyle.borderColor || '#fff';
    const borderWidth = levelStyle.borderWidth || 1.5;
    const fillOpacity = levelStyle.fillOpacity || 0.5;

//    return `<rect x="${node.x}" y="${node.y}"
//                      width="${node.width}" height="${node.height}"
//                      rx="${borderRadius}" ry="${borderRadius}" fill="${fillColor}"
//                      stroke="${borderColor}" stroke-width="${borderWidth}" filter="url(#dropShadow)"
//                      id="${node.id}_rect" class="node-shape" />`;
    return `<rect x="${node.x}" y="${node.y}"
                      width="${node.width}" height="${node.height}"
                      rx="${borderRadius}" ry="${borderRadius}" fill="${fillColor}" fill-opacity="${fillOpacity}"
                      stroke="${borderColor}" stroke-width="${borderWidth}" filter="url(#dropShadow)"
                      id="${node.id}_rect" class="node-shape" />`;  }

  /**
   * Draw text for a node
   * @private
   * @param {Object} node - The node to draw text for
   * @param {boolean} insideBox - Whether the text is inside a box
   * @return {string} SVG text element
   */
  _drawNodeText(node, insideBox) {
    const levelStyle = this.styleManager.getLevelStyle(node.level);
    const fontSize = levelStyle.fontSize || 14;
    const fontWeight = levelStyle.fontWeight || 'normal';
    const fontFamily = levelStyle.fontFamily || 'Arial, sans-serif';

    let x, y, fill, textAnchor;

    if (insideBox) {
      // Text inside a box (centered)
      x = node.x + node.width / 2;
      y = node.y + node.height / 2;
      fill = levelStyle.textColor || "white";
      textAnchor = "middle";
    } else {
      // Standalone text (no box)
      x = node.x;
      y = node.y + node.height / 2;
      fill = levelStyle.textColor || "#333";
      textAnchor = "start";
    }

    return `<text x="${x}" y="${y}"
                      id="${node.id}_text"
                      font-family="${fontFamily}" font-size="${fontSize}px" font-weight="${fontWeight}"
                      fill="${fill}" text-anchor="${textAnchor}" dominant-baseline="middle"
                      class="node-text" pointer-events="none">
                      ${this._escapeXml(node.text)}
                </text>`;
  }

  /**
   * Draw the collapse/expand indicator for a node
   * @private
   * @param {Object} node - The node to draw indicator for
   * @return {string} SVG elements for the indicator
   */
  _drawCollapseIndicator(node) {
    const levelStyle = this.styleManager.getLevelStyle(node.level);
    const parentLayout = levelStyle.getLayout();

    // Get the connection point where the indicator should be placed
    // For collapse indicator, we pass null as childNode to get the default position
    const connectionPoint = parentLayout.getParentConnectionPoint(node, levelStyle, null);
    const radius = 6;

    // Determine position based on layout direction
    let indicatorX, indicatorY;

    // Check if it's a vertical or horizontal layout
    const isVerticalLayout = connectionPoint.direction === 'bottom' || connectionPoint.direction === 'top';
    const directionMultiplier = (connectionPoint.direction === 'bottom' || connectionPoint.direction === 'right') ? 1 : -1;

    if (isVerticalLayout) {
      indicatorX = connectionPoint.x;
      indicatorY = connectionPoint.y + directionMultiplier * radius;
    } else {
      indicatorX = connectionPoint.x + directionMultiplier * radius;
      indicatorY = connectionPoint.y;
    }

    // Draw different icons based on collapsed state
    // Use the connection color for the indicator but darker
    const connectionColor = levelStyle.connectionColor || '#666';
    const fillColor = this._darkenColor(connectionColor, 20);  // Darken the connection color
    const borderColor = this._darkenColor(connectionColor, 40);  // Even darker for the border
    let icon;

    if (node.collapsed) {
      // Plus icon for collapsed nodes
      icon = `<circle cx="${indicatorX}" cy="${indicatorY}" r="${radius}" fill="${fillColor}" stroke="${borderColor}" stroke-width="1" />
              <line x1="${indicatorX - 3}" y1="${indicatorY}" x2="${indicatorX + 3}" y2="${indicatorY}" stroke="#fff" stroke-width="1.5" />
              <line x1="${indicatorX}" y1="${indicatorY - 3}" x2="${indicatorX}" y2="${indicatorY + 3}" stroke="#fff" stroke-width="1.5" />`;
    } else {
      // Minus icon for expanded nodes
      icon = `<circle cx="${indicatorX}" cy="${indicatorY}" r="${radius}" fill="${fillColor}" stroke="${borderColor}" stroke-width="1" />
              <line x1="${indicatorX - 3}" y1="${indicatorY}" x2="${indicatorX + 3}" y2="${indicatorY}" stroke="#fff" stroke-width="1.5" />`;
    }

    return `<g class="collapse-indicator" id="${node.id}_indicator">${icon}</g>`;
  }

  /**
   * Escape XML special characters
   * @private
   * @param {string} text - The text to escape
   * @return {string} Escaped text
   */
  _escapeXml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Lighten a color
   * @private
   * @param {string} color - The base color in hex format
   * @param {number} percent - The percentage to lighten
   * @return {string} Lightened color in hex format
   */
  _lightenColor(color, percent) {
    // Remove # if present
    color = color.replace('#', '');

    // Parse the hex values
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);

    // Lighten the colors
    const newR = Math.min(255, r + (255 - r) * (percent / 100));
    const newG = Math.min(255, g + (255 - g) * (percent / 100));
    const newB = Math.min(255, b + (255 - b) * (percent / 100));

    // Convert back to hex
    return '#' +
      Math.round(newR).toString(16).padStart(2, '0') +
      Math.round(newG).toString(16).padStart(2, '0') +
      Math.round(newB).toString(16).padStart(2, '0');
  }

  /**
   * Darken a color
   * @private
   * @param {string} color - The base color in hex format
   * @param {number} percent - The percentage to darken
   * @return {string} Darkened color in hex format
   */
  _darkenColor(color, percent) {
    // Remove # if present
    color = color.replace('#', '');

    // Parse the hex values
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);

    // Darken the colors
    const newR = Math.max(0, r - (r * (percent / 100)));
    const newG = Math.max(0, g - (g * (percent / 100)));
    const newB = Math.max(0, b - (b * (percent / 100)));

    // Convert back to hex
    return '#' +
      Math.round(newR).toString(16).padStart(2, '0') +
      Math.round(newG).toString(16).padStart(2, '0') +
      Math.round(newB).toString(16).padStart(2, '0');
  }

  /**
   * Generate the complete SVG
   * @return {string} Complete SVG document
   */
  generateSVG() {
    this.findBounds();

    let svg = this.createSvgContainer();
//    svg += `<circle r="5" cx="0" cy="0" fill="blue" />`
    svg += this.createDefs();
    svg += this.drawNodes();
    svg += '</svg>';

    return svg;
  }

  /**
   * Render the mindmap to a container element
   * @param {HTMLElement} container - The container to render into
   */
  render(container) {
    const svg = this.generateSVG();
    container.innerHTML = svg;

    // Store SVG content for export functionality
    container.dataset.svgContent = svg;

    // Attach event handlers
    this.attachEventHandlers();
  }

  /**
   * Attach event handlers to nodes
   */
attachEventHandlers() {
  this.nodeMap.forEach((node, nodeId) => {
    // Add event listener to node shape
    const nodeRect = document.getElementById(`${nodeId}_rect`);
    if (nodeRect) {
      // Double-click event for toggling collapse state
      nodeRect.addEventListener('dblclick', () => {
        eventBridge.handleNodeEvent(nodeId, 'toggle');
      });

      // Single-click event for debugging node properties
      nodeRect.addEventListener('click', (event) => {
        // Prevent event from triggering unwanted behaviors
        if (!event.ctrlKey) {
          event.stopPropagation();
          eventBridge.handleNodeEvent(nodeId, 'debug');
        }
      });
    }

    // Add event listener to text as well for better UX
    const nodeText = document.getElementById(`${nodeId}_text`);
    if (nodeText) {
      nodeText.addEventListener('click', (event) => {
        // Prevent event from triggering unwanted behaviors
        if (!event.ctrlKey) {
          event.stopPropagation();
          eventBridge.handleNodeEvent(nodeId, 'debug');
        }
      });
    }

    // Add event listener to collapse/expand indicator
    const nodeIndicator = document.getElementById(`${nodeId}_indicator`);
    if (nodeIndicator) {
      nodeIndicator.addEventListener('click', () => {
        eventBridge.handleNodeEvent(nodeId, 'toggle');
      });
    }
  });
}

  /**
   * Get the node map
   * @return {Map} The node map
   */
  getNodeMap() {
    return this.nodeMap;
  }
}

// For backward compatibility
if (typeof window !== 'undefined') {
  window.MindmapRenderer = MindmapRenderer;
}

export default MindmapRenderer;