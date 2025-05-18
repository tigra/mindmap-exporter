// src/renderer/mindmap-renderer.js

import eventBridge from '../utils/event-bridge.js';
import { markdownToSvg, markdownToSvgSync, markdownToText, extractSvgContent, embedSvg } from '../utils/markdown-to-svg.js';

/**
 * MindmapRenderer class for SVG generation with interactive expand/collapse
 */
class MindmapRenderer {
  // Class constants
  static DEFAULT_PADDING = 100;
  static DEFAULT_BORDER_RADIUS = 5;
  static DEFAULT_BORDER_WIDTH = 1.5;
  static DEFAULT_FILL_OPACITY = 0.5;
  static DEFAULT_CONNECTION_COLOR = '#666';
  static DEFAULT_CONNECTION_WIDTH = 2;
  static DEFAULT_FONT_SIZE = 14;
  static DEFAULT_FONT_WEIGHT = 'normal';
  static DEFAULT_FONT_FAMILY = 'Arial, sans-serif';
  static DEFAULT_TEXT_COLOR_BOXED = 'white';
  static DEFAULT_TEXT_COLOR_PLAIN = '#333';
  static LIGHTEN_PERCENT = 30;
  static DARKEN_PERCENT = 10;
  static INDICATOR_RADIUS = 6;
  static SVG_EMBEDDING_METHOD = 'extract'; // Options: 'embed' or 'extract'
  
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
    this.padding = MindmapRenderer.DEFAULT_PADDING;
    this.nodeMap = new Map(); // Store references to nodes by id
  }

  /**
   * Reset bounds to initial values
   * @private
   */
  _resetBounds() {
    this.minX = Infinity;
    this.minY = Infinity;
    this.maxX = -Infinity;
    this.maxY = -Infinity;
  }

  /**
   * Find the bounds of the entire mindmap
   */
  findBounds() {
    this._resetBounds();
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
   * Create a color gradient from a base color
   * @private
   * @param {string} id - The gradient ID
   * @param {string} baseColor - The base color to create gradient from
   * @param {number} lightenAmount - Amount to lighten (percent)
   * @param {number} darkenAmount - Amount to darken (percent)
   * @return {string} SVG gradient definition
   */
  _createColorGradientFromBase(id, baseColor, lightenAmount, darkenAmount) {
    // Skip if the color is already a gradient or special format
    if (baseColor.startsWith('url') || baseColor.startsWith('linear-gradient')) {
      return '';
    }
    
    const lightColor = this._lightenColor(baseColor, lightenAmount);
    const darkColor = this._darkenColor(baseColor, darkenAmount);
    
    return this._createGradient(id, lightColor, darkColor);
  }

  /**
   * Create color gradients for node backgrounds and connections
   * @private
   * @return {object} Object containing gradients definition string and list of created level gradients
   */
  _createColorGradients() {
    let gradientsString = '';
    const gradients = [];
    const levelCount = 6; // Maximum number of distinct level styles to create gradients for

    for (let i = 1; i <= levelCount; i++) {
      const levelStyle = this.styleManager.getLevelStyle(i);
      
      // Create node background gradient if possible
      if (levelStyle && levelStyle.backgroundColor) {
        const nodeGradient = this._createColorGradientFromBase(
          `level${i}Gradient`, 
          levelStyle.backgroundColor, 
          MindmapRenderer.LIGHTEN_PERCENT, 
          MindmapRenderer.DARKEN_PERCENT
        );
        
        if (nodeGradient) {
          gradientsString += nodeGradient;
          gradients.push(i);
        }
      }
      
      // Create connection gradient if tapered connections are enabled
      if (levelStyle && levelStyle.connectionTapered && 
          levelStyle.connectionGradient && levelStyle.connectionColor) {
        
        gradientsString += this._createColorGradientFromBase(
          `level${i}ConnectionGradient`, 
          levelStyle.connectionColor, 
          MindmapRenderer.LIGHTEN_PERCENT - 10, // Slightly less lightening for connections
          MindmapRenderer.DARKEN_PERCENT
        );
      }
    }

    return { gradientsString, gradients };
  }

  /**
   * Create a drop shadow filter definition
   * @private
   * @return {string} SVG filter definition for drop shadow
   */
  _createDropShadowFilter() {
    return '\n<filter id="dropShadow">' +
           '<feGaussianBlur in="SourceAlpha" stdDeviation="2"/>' +
           '<feOffset dx="2" dy="2" result="offsetblur"/>' +
           '<feComponentTransfer><feFuncA type="linear" slope="0.2"/></feComponentTransfer>' +
           '<feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>' +
           '</filter>';
  }

  /**
   * Create all symbol definitions for reuse
   * @private
   * @return {string} SVG symbol definitions
   */
  _createSymbolDefinitions() {
    let symbols = '';
    
    // Base components for reuse
    symbols += '\n<symbol id="circle-base" viewBox="0 0 12 12">' +
               '<circle cx="6" cy="6" r="5.5" stroke-width="1"/>' +
               '</symbol>';
    
    symbols += '\n<symbol id="plus-shape" viewBox="0 0 12 12">' +
               '<line x1="3" y1="6" x2="9" y2="6" stroke="#ffffff" stroke-width="1.5"/>' +
               '<line x1="6" y1="3" x2="6" y2="9" stroke="#ffffff" stroke-width="1.5"/>' +
               '</symbol>';
    
    symbols += '\n<symbol id="minus-shape" viewBox="0 0 12 12">' +
               '<line x1="3" y1="6" x2="9" y2="6" stroke="#ffffff" stroke-width="1.5"/>' +
               '</symbol>';
    
    // Generic wrappers for indicators
    symbols += '\n<symbol id="indicator-collapsed" viewBox="0 0 12 12" width="12" height="12">' +
               '<use href="#circle-base" width="12" height="12"/>' +
               '<use href="#plus-shape" width="12" height="12"/>' +
               '</symbol>';
            
    symbols += '\n<symbol id="indicator-expanded" viewBox="0 0 12 12" width="12" height="12">' +
               '<use href="#circle-base" width="12" height="12"/>' +
               '<use href="#minus-shape" width="12" height="12"/>' +
               '</symbol>';
               
    return symbols;
  }

  /**
   * Create gradient and filter definitions
   * @return {string} SVG defs element with gradients and filters
   */
  createDefs() {
    let defs = '<defs>\n';

    // Create color gradients
    const { gradientsString, gradients } = this._createColorGradients();
    defs += gradientsString;

    // Store the gradients for use in node rendering
    this.gradients = gradients;

    // Add drop shadow filter
    defs += this._createDropShadowFilter();
    
    // Add symbol definitions
    defs += this._createSymbolDefinitions();

    defs += '\n</defs>';
    return defs;
  }

  /**
   * Create a generic SVG element with arbitrary attributes
   * @private
   * @param {string} elementType - The SVG element type (rect, path, text, etc.)
   * @param {Object} attributes - Key-value pairs of element attributes
   * @param {string} content - Optional content for elements that can have content
   * @return {string} SVG element string
   */
  _createSvgElement(elementType, attributes, content = '') {
    // Start the opening tag
    let element = `<${elementType}`;
    
    // Add all attributes
    for (const [key, value] of Object.entries(attributes)) {
      if (value !== undefined && value !== null) {
        // Convert camelCase to kebab-case for attribute names
        const attributeName = key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
        element += ` ${attributeName}="${value}"`;
      }
    }
    
    // Close the element appropriately based on whether it has content
    if (content || elementType === 'text') {
      element += `>${content}</${elementType}>\n`;
    } else {
      element += ' />\n';
    }
    
    return element;
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
    const stop1 = this._createSvgElement('stop', {
      offset: '0%', 
      style: `stop-color:${color1};stop-opacity:1`
    });
    
    const stop2 = this._createSvgElement('stop', {
      offset: '100%', 
      style: `stop-color:${color2};stop-opacity:1`
    });
    
    return this._createSvgElement('linearGradient', {
      id: id,
      x1: '0%',
      y1: '0%',
      x2: '100%',
      y2: '100%'
    }, stop1 + stop2);
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
   * @return {Promise<string>} Promise that resolves to SVG elements for all nodes
   */
  async drawNodes() {
    return await this._drawNodeRecursive(this.model.getRoot());
  }

  /**
   * Draw parent drop zone (split into two parts)
   * @private
   * @param {Object} node - The node to draw drop zone for
   * @param {number} parentChildPadding - Padding between parent and child nodes
   * @return {string} SVG rect elements for the parent drop zones
   */
  _drawParentDropZone(node, parentChildPadding) {
    // Top drop zone (red)
    const topZone = this._createRectElement({
      x: node.boundingBox.x,
      y: node.boundingBox.y - parentChildPadding/2,
      width: node.width,
      height: node.boundingBox.height / 2 + parentChildPadding / 2,
      fill: "#500000",
      stroke: "#450000",
      fillOpacity: 0.1,
      className: "drop-zone parent-drop-zone-top"
    });
    
    // Bottom drop zone (blue)
    const bottomZone = this._createRectElement({
      x: node.boundingBox.x,
      y: node.boundingBox.y + node.boundingBox.height / 2,
      width: node.width,
      height: node.boundingBox.height / 2 + parentChildPadding / 2,
      fill: "#000060",
      stroke: "#000045",
      fillOpacity: 0.1,
      className: "drop-zone parent-drop-zone-bottom"
    });
    
    return topZone + bottomZone;
  }

  /**
   * Draw child drop zone
   * @private
   * @param {Object} node - The node to draw drop zone for
   * @param {Object} layout - The layout object
   * @param {number} parentChildPadding - Padding between parent and child nodes
   * @return {string} SVG rect element for the child drop zone
   */
  _drawChildDropZone(node, layout, parentChildPadding) {
    const additionalSpan = node.hasChildren() ? 0 : 300;
    
    return this._createRectElement({
      x: node.boundingBox.x + node.width,
      y: node.boundingBox.y - parentChildPadding / 2,
      width: layout.parentPadding + additionalSpan,
      height: node.boundingBox.height + parentChildPadding,
      fill: "#005000",
      stroke: "#004000",
      fillOpacity: 0.1,
      className: "drop-zone child-drop-zone"
    });
  }

  /**
   * Recursively draw a node and its children
   * @private
   * @param {Object} node - The node to draw
   * @return {Promise<string>} Promise that resolves to SVG elements for the node and its children
   */
  async _drawNodeRecursive(node) {
    let svg = '';
    const levelStyle = this.styleManager.getLevelStyle(node.level);
    const parentChildPadding = node.level > 1 ? this.styleManager.getLevelStyle(node.level - 1).childPadding : 0;
    const layout = levelStyle.getLayout();
    // TODO configure / style these thingies:
//    svg += `<circle r="5" cx="${node.x}" cy="${node.y}" fill="red" />`
//    svg += this._drawParentDropZone(node, parentChildPadding ? parentChildPadding : 0);
//    svg += this._drawChildDropZone(node, layout, parentChildPadding);
    // Check if bounding box should be displayed based on level style
    const showBoundingBox = this.styleManager.getEffectiveValue(node, 'boundingBox');
    console.log(`Node ${node.id} (${node.text}): show bounding box = ${showBoundingBox}`);
    if (showBoundingBox) {
       svg += this._drawBoundingBox(node);
    }
    // Only draw connections to children if not collapsed
    if (!node.collapsed) {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        svg += this._drawConnection(node, child);
        // Recursively draw child nodes
        svg += await this._drawNodeRecursive(child);
      }
    }

    // Draw the node based on its nodeType
    if (levelStyle.nodeType === 'text-only') {
      // For text-only nodes, draw just the text
      svg += await this._drawNodeText(node, false);
    } else {
      // For box nodes, draw both shape and text
      svg += this._drawNodeShape(node);
      svg += await this._drawNodeText(node, true);
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
          // Create a path for the line
          const linePath = `M ${element.x1} ${element.y1} L ${element.x2} ${element.y2}`;
          debugElements.push(
            this._createPathElement({
              d: linePath,
              stroke: element.stroke,
              strokeWidth: element.strokeWidth,
              strokeDasharray: element.strokeDasharray,
              className: 'debug-line'
            })
          );
          break;
          
        case 'text':
          debugElements.push(
            this._createTextElement({
              x: element.x,
              y: element.y,
              text: element.content,
              fill: element.fill,
              fontSize: element.fontSize,
              textAnchor: element.textAnchor,
              className: 'debug-text'
            })
          );
          break;
          
        // Add more cases for other element types as needed
      }
    }
    
    return `<g class="debug-elements" id="${node.id}_debug">${debugElements.join('')}</g>`;
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
   * Create a bezier curve path string
   * @private
   * @param {ConnectionPoint} startPoint - The starting connection point
   * @param {ConnectionPoint} endPoint - The ending connection point
   * @return {string} SVG path data for the curve
   */
  _createBezierCurvePath(startPoint, endPoint) {
    const [cp1x, cp1y, cp2x, cp2y] = this._calculateBezierControlPoints(startPoint, endPoint);
    return `M ${startPoint.x} ${startPoint.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endPoint.x} ${endPoint.y}`;
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
    
    const halfWidth = width / 2;
    const isVertical = point.direction === 'left' || point.direction === 'right';
    
    if (isVertical) {
      // For left/right directions, offset vertically
      return [
        point.x, point.y - halfWidth,  // top point
        point.x, point.y + halfWidth   // bottom point
      ];
    } else {
      // For top/bottom/default directions, offset horizontally
      return [
        point.x - halfWidth, point.y,  // left point
        point.x + halfWidth, point.y   // right point
      ];
    }
  }

  /**
   * Create a path SVG element
   * @private
   * @param {object} props - Path properties
   * @return {string} SVG path element
   */
  _createPathElement(props) {
    const {
      d,
      id = '',
      className = '',
      fill = 'none',
      stroke = 'none',
      strokeWidth = MindmapRenderer.DEFAULT_CONNECTION_WIDTH,
      strokeDasharray = ''
    } = props;
    
    // Prepare attributes for the generic function
    const attributes = { d };
    
    // Only add optional attributes if they have values
    if (id) attributes.id = id;
    if (className) attributes.class = className;
    
    // Always set fill explicitly
    attributes.fill = fill;
    
    // Only add stroke attributes if stroke is specified
    if (stroke !== 'none') {
      attributes.stroke = stroke;
      attributes.strokeWidth = strokeWidth;
    }
    
    // Add dash array if specified
    if (strokeDasharray) {
      attributes.strokeDasharray = strokeDasharray;
    }
    
    return this._createSvgElement('path', attributes);
  }

  /**
   * Create a tapered connection path
   * @private
   * @param {ConnectionPoint} startPoint - The starting connection point
   * @param {ConnectionPoint} endPoint - The ending connection point
   * @param {number} startWidth - Width at the start point
   * @param {number} endWidth - Width at the end point
   * @return {string} SVG path data for the tapered connection
   */
  _createTaperedConnectionPath(startPoint, endPoint, startWidth, endWidth) {
    // Calculate control points for the centerline curve
    const [cp1x, cp1y, cp2x, cp2y] = this._calculateBezierControlPoints(startPoint, endPoint);
    
    // Calculate perpendicular offsets at start and end points
    const [startLeftX, startLeftY, startRightX, startRightY] = 
      this._calculatePerpendicularOffsets(startPoint, startWidth);
    
    const [endLeftX, endLeftY, endRightX, endRightY] = 
      this._calculatePerpendicularOffsets(endPoint, endWidth);
    
    // Create the filled path - always going clockwise
    return 'M ' + startLeftX + ' ' + startLeftY + 
           ' C ' + (cp1x + (startLeftX - startPoint.x)) + ' ' + (cp1y + (startLeftY - startPoint.y)) + 
           ', ' + (cp2x + (endLeftX - endPoint.x)) + ' ' + (cp2y + (endLeftY - endPoint.y)) + 
           ', ' + endLeftX + ' ' + endLeftY + 
           ' L ' + endRightX + ' ' + endRightY + 
           ' C ' + (cp2x + (endRightX - endPoint.x)) + ' ' + (cp2y + (endRightY - endPoint.y)) + 
           ', ' + (cp1x + (startRightX - startPoint.x)) + ' ' + (cp1y + (startRightY - startPoint.y)) + 
           ', ' + startRightX + ' ' + startRightY + 
           ' Z';
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
    
    // Create the tapered connection path
    const path = this._createTaperedConnectionPath(startPoint, endPoint, startWidth, endWidth);
    
    // Get connection color from style
    const connectionColor = parentStyle.connectionColor || MindmapRenderer.DEFAULT_CONNECTION_COLOR;
    
    // Check if gradient should be used
    let fill = connectionColor;
    if (parentStyle.connectionGradient) {
      // Use level-based connection gradient instead of per-connection gradient
      const gradientId = `level${parent.level}ConnectionGradient`;
      fill = `url(#${gradientId})`;
    }
    
    return this._createPathElement({
      d: path,
      fill: fill,
      id: `connection_${parent.id}_${child.id}`,
      className: 'tapered-connection'
    });
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
      // Create the path with our bezier curve helper
      const path = this._createBezierCurvePath(startPoint, endPoint);

      // Get connection color from style
      const connectionColor = parentStyle.connectionColor || MindmapRenderer.DEFAULT_CONNECTION_COLOR;
      const connectionWidth = parentStyle.connectionWidth || MindmapRenderer.DEFAULT_CONNECTION_WIDTH;

      result = this._createPathElement({
        d: path,
        stroke: connectionColor,
        strokeWidth: connectionWidth,
        id: `connection_${parent.id}_${child.id}`,
        className: 'connection'
      });
    }
    
    console.groupEnd();
    return result;
  }

  /**
   * Create a rectangle SVG element
   * @private
   * @param {object} props - Rectangle properties
   * @return {string} SVG rect element
   */
  _createRectElement(props) {
    const {
      x, y, width, height,
      id = '',
      className = 'node-shape',
      rx = MindmapRenderer.DEFAULT_BORDER_RADIUS, 
      ry = MindmapRenderer.DEFAULT_BORDER_RADIUS,
      fill = '#f5f5f5', 
      fillOpacity = MindmapRenderer.DEFAULT_FILL_OPACITY,
      stroke = '#fff', 
      strokeWidth = MindmapRenderer.DEFAULT_BORDER_WIDTH,
      filter = 'url(#dropShadow)'
    } = props;
    
    // Prepare attributes for the generic function
    const attributes = {
      x, y, width, height, rx, ry,
      fill, fillOpacity, stroke, strokeWidth,
      class: className
    };
    
    // Only add optional attributes if they have values
    if (id) attributes.id = id;
    if (filter) attributes.filter = filter;
    
    return this._createSvgElement('rect', attributes);
  }

  _drawBoundingBox(node) {
      // Check if node has a boundingBox property (with dimensions) to render
      if (node.boundingBox && node.boundingBox.width && node.boundingBox.height) {
          console.log(`Drawing bounding box for node ${node.id} (${node.text}): ${JSON.stringify(node.boundingBox)}`);
          return this._createRectElement({
              x: node.boundingBox.x,
              y: node.boundingBox.y,
              width: node.boundingBox.width,
              height: node.boundingBox.height,
              id: node.id + '_bbox',
              rx: 2,
              ry: 2,
              fill: '#101010',
              fillOpacity: 0.05,
              stroke: '#001000',
              strokeWidth: 1
          });
      } else {
          console.log(`No bounding box data for node ${node.id} (${node.text})`);
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
    
    return this._createRectElement({
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        id: node.id + '_rect',
        rx: levelStyle.borderRadius || MindmapRenderer.DEFAULT_BORDER_RADIUS,
        ry: levelStyle.borderRadius || MindmapRenderer.DEFAULT_BORDER_RADIUS,
        fill: this.getFillColor(node),
        fillOpacity: levelStyle.fillOpacity || MindmapRenderer.DEFAULT_FILL_OPACITY,
        stroke: levelStyle.borderColor || '#fff',
        strokeWidth: levelStyle.borderWidth || MindmapRenderer.DEFAULT_BORDER_WIDTH
    });
  }

  /**
   * Create a basic SVG text element
   * @private
   * @param {object} props - Text properties
   * @return {string} SVG text element
   */
  _createTextElement(props) {
    const {
      x, y, text,
      id = '',
      fontFamily = MindmapRenderer.DEFAULT_FONT_FAMILY,
      fontSize = MindmapRenderer.DEFAULT_FONT_SIZE,
      fontWeight = MindmapRenderer.DEFAULT_FONT_WEIGHT,
      fill = '#333',
      textAnchor = 'start',
      dominantBaseline = 'middle',
      className = 'node-text',
      pointerEvents = 'none'
    } = props;
    
    // Prepare attributes for the generic function
    const attributes = {
      x, y,
      id,
      fontFamily,
      fontSize: `${fontSize}px`,
      fontWeight,
      fill,
      textAnchor,
      class: className,
      pointerEvents
    };
    
    // Only add optional attributes if they have values
    if (dominantBaseline) {
      attributes.dominantBaseline = dominantBaseline;
    }
    
    return this._createSvgElement('text', attributes, this._escapeXml(text));
  }
  
  /**
   * Create a tspan element for multiline text
   * @private
   * @param {object} props - Tspan properties
   * @param {string} content - Text content
   * @return {string} SVG tspan element
   */
  _createTspanElement(props, content) {
    const { x, y, dy } = props;
    
    const attributes = {};
    if (x !== undefined) attributes.x = x;
    if (y !== undefined) attributes.y = y;
    if (dy !== undefined) attributes.dy = dy;
    
    return this._createSvgElement('tspan', attributes, this._escapeXml(content));
  }
  
  /**
   * Create an SVG text element with multiple lines (tspans)
   * @private
   * @param {object} props - Text properties
   * @param {array} lines - Array of text lines
   * @param {number} lineHeight - Height between lines
   * @param {number} startY - Starting Y position
   * @return {string} SVG text element with tspans
   */
  _createMultilineTextElement(props, lines, lineHeight, startY) {
    const {
      x, y, 
      id = '',
      fontFamily = MindmapRenderer.DEFAULT_FONT_FAMILY,
      fontSize = MindmapRenderer.DEFAULT_FONT_SIZE,
      fontWeight = MindmapRenderer.DEFAULT_FONT_WEIGHT,
      fill = '#333',
      textAnchor = 'start',
      className = 'node-text',
      pointerEvents = 'none'
    } = props;
    
    // Create tspan elements for each line
    let tspanContent = '';
    for (let i = 0; i < lines.length; i++) {
      const tspanProps = { x };
      
      if (i === 0) {
        // First line - set the initial position
        tspanProps.y = startY;
      } else {
        // Subsequent lines - use dy for consistent line spacing
        tspanProps.dy = lineHeight;
      }
      
      tspanContent += this._createTspanElement(tspanProps, lines[i]);
    }
    
    // Create the parent text element with all tspans
    const attributes = {
      id,
      fontFamily,
      fontSize: `${fontSize}px`,
      fontWeight,
      fill,
      textAnchor,
      class: className,
      pointerEvents
    };
    
    return this._createSvgElement('text', attributes, tspanContent);
  }

  /**
   * Draw text for a node - supports markdown if enabled
   * @private
   * @param {Object} node - The node to draw text for
   * @param {boolean} insideBox - Whether the text is inside a box
   * @return {Promise<string>} Promise that resolves to SVG text element or SVG with markdown content
   */
  async _drawNodeText(node, insideBox) {
    const levelStyle = this.styleManager.getLevelStyle(node.level);
    const useMarkdown = levelStyle.enableMarkdown || false;
    
    // If markdown is not enabled, use the traditional text rendering
//    if (!useMarkdown) {
//      return this._drawPlainNodeText(node, insideBox);
//    }
    
    // For markdown rendering, we'll use the markdownToSvg utility directly
    
    // Calculate position 
    let x, y, width;
    if (insideBox) {
      // Inside a box - center position
      x = node.x + (node.width / 2);
      y = node.y + (node.height / 2);
      width = node.width * 0.9; // Leave some margin
    } else {
      // Standalone text - left aligned
      x = node.x;
      y = node.y + (node.height / 2);
      width = node.width;
    }
    
    // Create a unique identifier for this node's markdown content
//    const markdownId = `markdown-${node.id}`;
    // Extract the text color to ensure visibility
    const textColor = insideBox 
      ? (levelStyle.textColor || MindmapRenderer.DEFAULT_TEXT_COLOR_BOXED)
      : (levelStyle.textColor || MindmapRenderer.DEFAULT_TEXT_COLOR_PLAIN);
    
    // Determine the maximum width for markdown rendering
    const maxWidth = width - (levelStyle.horizontalPadding || 10) * 2;
    
    try {
      // Minimal debugging info
      console.log(`Rendering markdown for node: ${node.id}`);
      
      // Get font style properties from the style
      const fontFamily = levelStyle.fontFamily || MindmapRenderer.DEFAULT_FONT_FAMILY;
      const fontSize = levelStyle.fontSize || MindmapRenderer.DEFAULT_FONT_SIZE;
      const fontWeight = levelStyle.fontWeight || MindmapRenderer.DEFAULT_FONT_WEIGHT;
      
      // Convert markdown to SVG with style properties
      const markdownResult = await markdownToSvg(node.text, maxWidth, {
        fontFamily: fontFamily,
        fontSize: fontSize,
        fontWeight: fontWeight,
        textColor: textColor
      });
//      console.log('markdownResult', markdownResult);
//      console.log('markdownResult.svg', markdownResult.svg);
      // Position the SVG within the node (centered)
      const svgX = x + (width - markdownResult.dimensions.width) / 2;
      const svgY = y + (height - markdownResult.dimensions.height) / 2;
      
      // Extract the inner SVG content using DOM parsing for proper handling
      let svgContent;
      
//      // Create a DOM parser to properly handle the SVG
//      const parser = new DOMParser();
//      const svgDoc = parser.parseFromString(markdownResult.svg, 'image/svg+xml');
//      const svgElement = svgDoc.documentElement;
//
//      // Simply parse the SVG to verify it's valid (no need to extract anything)
//      console.log('SVG parsed successfully');

      // Choose between embedding methods based on configuration
      if (MindmapRenderer.SVG_EMBEDDING_METHOD === 'extract') {
        // Use extraction method with coordinate transformations
        const extractedContent = extractSvgContent(markdownResult.svg, svgX, svgY);
//        console.log("extractedContent", extractedContent);
        
        // Return the extracted content (which will be a g element with transformed coordinates)
        return extractedContent;
      } else {
        // Default: use the embedding method (entire SVG with x/y positioning)
        const embeddedSvg = embedSvg(markdownResult.svg, svgX, svgY);
        
        return embeddedSvg;
      }
    } catch (error) {
//      console.error(`Error rendering markdown for node ${node.id}:`, error);
//
//      // Fallback to plain text if markdown conversion fails
//      return this._drawPlainNodeText(node, insideBox);
    }
  }
  
  /**
   * Draw plain text for a node (traditional method)
   * @private
   * @param {Object} node - The node to draw text for
   * @param {boolean} insideBox - Whether the text is inside a box
   * @return {string} SVG text element
   */
  _drawPlainNodeText(node, insideBox) {
    const levelStyle = this.styleManager.getLevelStyle(node.level);
    
    // Calculate text position based on node type
    let x, y, fill, textAnchor;
    if (insideBox) {
      // Text inside a box (centered)
      x = node.x + node.width / 2;
      y = node.y + node.height / 2;
      fill = levelStyle.textColor || MindmapRenderer.DEFAULT_TEXT_COLOR_BOXED;
      textAnchor = "middle";
    } else {
      // Standalone text (no box)
      x = node.x;
      y = node.y + node.height / 2;
      fill = levelStyle.textColor || MindmapRenderer.DEFAULT_TEXT_COLOR_PLAIN;
      textAnchor = "start";
    }
    
    // Common text properties
    const textProps = {
      x: x,
      y: y,
      id: node.id + '_text',
      fontFamily: levelStyle.fontFamily || MindmapRenderer.DEFAULT_FONT_FAMILY,
      fontSize: levelStyle.fontSize || MindmapRenderer.DEFAULT_FONT_SIZE,
      fontWeight: levelStyle.fontWeight || MindmapRenderer.DEFAULT_FONT_WEIGHT,
      fill: fill,
      textAnchor: textAnchor
    };
    
    // Get text wrapping configuration
    const wrapConfig = levelStyle.getTextWrapConfig();
    const textWrap = wrapConfig.textWrap;
    const maxWidth = wrapConfig.maxWidth;
    const maxWordLength = wrapConfig.maxWordLength;
    
    // Get text wrapping calculation from textMetrics
    const textMetrics = typeof window !== 'undefined' ? window.textMetrics : require('../utils/text-metrics').default;
    
    const wrappedText = textMetrics.wrapText(
      '[' + node.text + ']',
      maxWidth,
      textProps.fontFamily,
      textProps.fontSize,
      textProps.fontWeight,
      textWrap,
      maxWordLength
    );
    
    // Render based on whether text needs to be wrapped
    if (wrappedText.lines.length === 1 || textWrap === 'none') {
      // Simple case - just one line
      return this._createTextElement({
        ...textProps,
        text: node.text,
        dominantBaseline: 'middle'
      });
    } else {
      // Multi-line text with tspans
      const lineHeight = wrappedText.lineHeight;
      const totalHeight = wrappedText.height;
      
      // Calculate starting y position to center text block
      const startY = y - (totalHeight / 2) + (lineHeight / 2);
      
      return this._createMultilineTextElement(
        textProps, 
        wrappedText.lines, 
        lineHeight, 
        startY
      );
    }
  }

  /**
   * Create a use element for SVG symbols
   * @private
   * @param {object} props - Use element properties
   * @return {string} SVG use element
   */
  _createUseElement(props) {
    const {
      href, x, y, id = '',
      width, height,
      fill, stroke
    } = props;
    
    // Convert props to attributes object for the generic function
    const attributes = {
      href, x, y, 
      width, height, 
      fill, stroke
    };
    
    // Add id if provided
    if (id) {
      attributes.id = id;
    }
    
    return this._createSvgElement('use', attributes);
  }

  /**
   * Calculate the position for a collapse indicator
   * @private
   * @param {Object} node - The node
   * @param {Object} levelStyle - The level style
   * @return {Object} - Position for the indicator {x, y}
   */
  _calculateIndicatorPosition(node, levelStyle) {
    const parentLayout = levelStyle.getLayout();
    const connectionPoint = parentLayout.getParentConnectionPoint(node, levelStyle, null);
    const radius = MindmapRenderer.INDICATOR_RADIUS;
    
    // Check if it's a vertical or horizontal layout
    const isVerticalLayout = connectionPoint.direction === 'bottom' || connectionPoint.direction === 'top';
    const directionMultiplier = (connectionPoint.direction === 'bottom' || connectionPoint.direction === 'right') ? 1 : -1;

    if (isVerticalLayout) {
      return {
        x: connectionPoint.x,
        y: connectionPoint.y + directionMultiplier * radius
      };
    } else {
      return {
        x: connectionPoint.x + directionMultiplier * radius,
        y: connectionPoint.y
      };
    }
  }

  /**
   * Draw the collapse/expand indicator for a node
   * @private
   * @param {Object} node - The node to draw indicator for
   * @return {string} SVG elements for the indicator
   */
  _drawCollapseIndicator(node) {
    const levelStyle = this.styleManager.getLevelStyle(node.level);
    
    // Calculate indicator position
    const position = this._calculateIndicatorPosition(node, levelStyle);
    
    // Use the connection color for the indicator but darker
    const connectionColor = levelStyle.connectionColor || MindmapRenderer.DEFAULT_CONNECTION_COLOR;
    const fillColor = this._darkenColor(connectionColor, 20);  // Darken the connection color
    const borderColor = this._darkenColor(connectionColor, 40);  // Even darker for the border

    // Center the indicator at the calculated position (indicators are 12x12)
    const indicatorOffset = 6; // Half of the 12x12 indicator size
    
    // Use the appropriate symbol based on collapsed state
    const symbolName = node.collapsed ? 'indicator-collapsed' : 'indicator-expanded';
    
    return this._createUseElement({
      href: '#' + symbolName,
      x: position.x - indicatorOffset,
      y: position.y - indicatorOffset,
      id: node.id + '_indicator',
      fill: fillColor,
      stroke: borderColor
    });
  }

  /**
   * Escape XML special characters
   * @private
   * @param {string} text - The text to escape
   * @return {string} Escaped text
   */
  _escapeXml(text) {
    // Use a single regex replacement with a lookup table for better performance
    const xmlEntities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;'
    };
    
    return text.replace(/[&<>"']/g, char => xmlEntities[char]);
  }

  /**
   * Adjust a color by lightening or darkening
   * @private
   * @param {string} color - The base color in hex format
   * @param {number} percent - The percentage to adjust (positive = lighten, negative = darken)
   * @return {string} Adjusted color in hex format
   */
  _adjustColor(color, percent) {
    // Remove # if present
    color = color.replace('#', '');

    // Parse the hex values
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);

    // Adjust the colors based on whether percent is positive (lighten) or negative (darken)
    const adjustFactor = percent / 100;
    let newR, newG, newB;

    if (adjustFactor >= 0) {
      // Lighten
      newR = Math.min(255, r + (255 - r) * adjustFactor);
      newG = Math.min(255, g + (255 - g) * adjustFactor);
      newB = Math.min(255, b + (255 - b) * adjustFactor);
    } else {
      // Darken
      newR = Math.max(0, r + (r * adjustFactor));
      newG = Math.max(0, g + (g * adjustFactor));
      newB = Math.max(0, b + (b * adjustFactor));
    }

    // Convert back to hex
    return '#' +
      Math.round(newR).toString(16).padStart(2, '0') +
      Math.round(newG).toString(16).padStart(2, '0') +
      Math.round(newB).toString(16).padStart(2, '0');
  }
  
  /**
   * Convenience method to lighten a color
   * @private
   * @param {string} color - The base color in hex format
   * @param {number} percent - The percentage to lighten (positive value)
   * @return {string} Lightened color in hex format
   */
  _lightenColor(color, percent) {
    return this._adjustColor(color, Math.abs(percent));
  }

  /**
   * Convenience method to darken a color
   * @private
   * @param {string} color - The base color in hex format
   * @param {number} percent - The percentage to darken (positive value)
   * @return {string} Darkened color in hex format
   */
  _darkenColor(color, percent) {
    return this._adjustColor(color, -Math.abs(percent));
  }

  /**
   * Generate the complete SVG
   * @return {Promise<string>} Promise that resolves to the complete SVG document
   */
  async generateSVG() {
    this.findBounds();

    let svg = this.createSvgContainer();
//    svg += `<circle r="5" cx="0" cy="0" fill="blue" />`
    svg += this.createDefs();
    
    // Draw nodes
    const nodesContent = await this.drawNodes();
    svg += nodesContent;
    
    svg += '</svg>';

    return svg;
  }

  /**
   * Render the mindmap to a container element
   * @param {HTMLElement} container - The container to render into
   */
  async render(container) {
    try {
      // Show loading indicator in the container
      container.innerHTML = '<div style="padding: 20px; text-align: center;">Rendering mindmap...</div>';
      
      // Generate SVG asynchronously
      const svg = await this.generateSVG();
      container.innerHTML = svg;

      // Store SVG content for export functionality
      container.dataset.svgContent = svg;

      // Attach event handlers
      this.attachEventHandlers();
      
      // No need to process markdown elements separately since we're directly using markdownToSvg
    } catch (error) {
      console.error('Error rendering mindmap:', error);
      container.innerHTML = `<div style="padding: 20px; color: red;">
        Error rendering mindmap: ${error.message}
      </div>`;
    }
  }
  
  // The _processMarkdownElements method is no longer needed since we're directly 
  // rendering markdown to SVG using the markdownToSvg utility

  /**
   * Attach a click event handler to an element
   * @private
   * @param {string} elementId - The ID of the element
   * @param {string} eventType - The event type
   * @param {function} handler - The event handler function
   */
  _attachEventHandler(elementId, eventType, handler) {
    const element = document.getElementById(elementId);
    if (element) {
      element.addEventListener(eventType, handler);
    }
  }

  /**
   * Attach a common click handler to a node element
   * @private
   * @param {string} nodeId - The node ID
   * @param {string} elementType - The element type (rect, text, indicator)
   * @param {string} eventAction - The action to trigger (toggle, debug)
   * @param {boolean} useDoubleClick - Whether to use dblclick instead of click
   */
  _attachNodeEventHandler(nodeId, elementType, eventAction, useDoubleClick = false) {
    const eventType = useDoubleClick ? 'dblclick' : 'click';
    const elementId = `${nodeId}_${elementType}`;
    
    this._attachEventHandler(elementId, eventType, (event) => {
      // For debug action, prevent propagation only if not ctrl-click
      if (eventAction === 'debug' && !event.ctrlKey) {
        event.stopPropagation();
      }
      eventBridge.handleNodeEvent(nodeId, eventAction);
    });
  }

  /**
   * Attach event handlers to nodes
   */
  attachEventHandlers() {
    this.nodeMap.forEach((node, nodeId) => {
      // Rect element: double-click for toggle, single-click for debug
      this._attachNodeEventHandler(nodeId, 'rect', 'toggle', true);
      this._attachNodeEventHandler(nodeId, 'rect', 'debug');
      
      // Text element: single-click for debug
      this._attachNodeEventHandler(nodeId, 'text', 'debug');
      
      // Indicator element: single-click for toggle
      this._attachNodeEventHandler(nodeId, 'indicator', 'toggle');
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