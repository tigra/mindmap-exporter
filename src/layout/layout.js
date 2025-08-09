// src/layout/layout.js

import ConnectionPoint from './connection-point.js';
import textMetrics from '../utils/text-metrics.js';
import { markdownToSvg, markdownToSvgSync } from '../utils/markdown-to-svg.js';

/**
 * Base Layout class that handles common functionality
 */
class Layout {
  /**
   * Calculate own dimensions of a node based on text and level style
   * @param {string} text - The text content of the node
   * @param {Object} levelStyle - The style for this node's level
   * @return {Object} The calculated width and height
   */
  getNodeSize(text, levelStyle) {
    // Check if markdown is enabled
//    const useMarkdown = levelStyle.enableMarkdown || false;
    const useMarkdown = true;

    // Get text wrapping configuration
    const wrapConfig = levelStyle.getTextWrapConfig();
    const maxWidth = wrapConfig.maxWidth;
    const textWrap = wrapConfig.textWrap;
    const maxWordLength = wrapConfig.maxWordLength;

    let textDimensions;

    if (useMarkdown) {
      // For markdown content, use the markdownToSvgSync function for immediate sizing
      try {
        // Get style properties
        const fontFamily = levelStyle.fontFamily;
        const fontSize = levelStyle.fontSize;
        const fontWeight = levelStyle.fontWeight;
        const textColor = levelStyle.textColor;
        
        // Pass style properties to the markdownToSvgSync function
        const svgData = markdownToSvgSync(text, maxWidth, {
          debug: false, 
          verbose: false,
          fontFamily: fontFamily,
          fontSize: fontSize,
          fontWeight: fontWeight,
          textColor: textColor
        });
        
        if (svgData && svgData.dimensions) {
          textDimensions = svgData.dimensions;
        } else {
          throw new Error(`markdownToSvg returned invalid dimensions: ${svgData}`);
        }
      } catch (error) {
        console.error('Error using markdownToSvg:', error);
        
        // Return simple fallback dimensions on error
        return {
          width: 200, 
          height: 100
        };
      }
    } else {
      // Regular text measurement for non-markdown content
      if (textWrap === 'none') {
        // Simple case - just measure without wrapping
        textDimensions = textMetrics.measureText(
          text,
          levelStyle.fontFamily,
          levelStyle.fontSize,
          levelStyle.fontWeight
        );
      } else {
        // Use text wrapping measurement
        textDimensions = textMetrics.wrapText(
          text,
          maxWidth,
          levelStyle.fontFamily,
          levelStyle.fontSize,
          levelStyle.fontWeight,
          textWrap,
          maxWordLength
        );
      }
    }

    // Apply padding to the calculated dimensions
    return {
      width: textDimensions.width + (levelStyle.horizontalPadding * 2),
      height: textDimensions.height + (levelStyle.verticalPadding * 2)
    };
  }

  /**
   * Adjust position of node and all its children recursively
   * @param {MindmapNode} node - The node to adjust
   * @param {number} deltaX - Horizontal adjustment
   * @param {number} deltaY - Vertical adjustment
   */
  adjustPositionRecursive(node, deltaX, deltaY) {
    node.x += deltaX;
    node.y += deltaY;
    if (node.boundingBox) {
        node.boundingBox.x += deltaX;
        node.boundingBox.y += deltaY;
    }
    for (let i = 0; i < node.children.length; i++) {
      this.adjustPositionRecursive(node.children[i], deltaX, deltaY);
    }
  }

  /**
   * Apply layout to a node and its children.
   * x and y are only the initial position. The position may change after laying out children recursively
   * and finding out their positions/bounding boxes.
   * @param {MindmapNode} node - The node to layout
   * @param {number} x - The x coordinate
   * @param {number} y - The y coordinate
   * @param {Object} style - The style to apply
   * @return {Object} The size of the laid out subtree
   */
  applyLayout(node, x, y, style) {
    throw new Error('Method applyLayout must be implemented by subclasses');
  }

  /**
   * Get the connection point for a parent node connecting to its children
   * @param {MindmapNode} node - The parent node
   * @param {Object} levelStyle - The style for this node's level
   * @param {MindmapNode} childNode - The specific child node being connected to (optional)
   * @return {ConnectionPoint} The connection point
   */
  getParentConnectionPoint(node, levelStyle, childNode = null) {
    throw new Error('Method getParentConnectionPoint must be implemented by subclasses');
  }
  
  /**
   * Calculate horizontal position for parent connection points when distributed
   * @param {MindmapNode} node - The parent node
   * @param {MindmapNode} childNode - The child node
   * @param {string} connectionPointsType - Type of distribution ('single', 'distributedRelativeToParentSize', 'distributeEvenly')
   * @param {number} widthPortion - Portion of parent width to use for connections (0.0-1.0), default 0.8
   * @returns {number} The x-coordinate for the connection point
   */
  calculateConnectionPointX(node, childNode, connectionPointsType, widthPortion = 0.8) {
    // Default to center position
    if (!childNode || connectionPointsType === 'single') {
      return node.x + (node.width / 2);
    }
    
    // Calculate margins - evenly distribute remaining width to both sides
    const marginPortion = (1 - widthPortion) / 2;
    const parentWidth = node.width;
    
    // Handle specific distribution types
    if (connectionPointsType === 'distributedRelativeToParentSize') {
      // Position based on child's horizontal center
      const childCenterX = childNode.x + (childNode.width / 2);
      
      // Calculate relative position with configured margins
      let relativePosition = (childCenterX - node.x) / parentWidth;
      // Constrain within the usable range
      relativePosition = Math.max(marginPortion, Math.min(1 - marginPortion, relativePosition));
      
      return node.x + (parentWidth * relativePosition);
    }
    
    if (connectionPointsType === 'distributeEvenly') {
      // Position based on child's index among siblings
      const children = node.children;
      
      // Return center if no children or child not found
      if (!children || children.length === 0) {
        return node.x + (node.width / 2);
      }
      
      const childIndex = children.findIndex(child => child === childNode);
      if (childIndex === -1) {
        return node.x + (node.width / 2);
      }
      
      // Calculate evenly spaced positions
      const usableWidth = parentWidth * widthPortion;  // Configurable portion of width
      const startX = node.x + (parentWidth * marginPortion);  // Left margin
      
      // For one child, use center; otherwise space evenly
      if (children.length === 1) {
        return startX + (usableWidth / 2);
      } else {
        const gap = usableWidth / (children.length - 1);
        return startX + (gap * childIndex);
      }
    }
    
    // Default fallback to center
    return node.x + (node.width / 2);
  }

  /**
   * Get the connection point for a child node connecting to its parent
   * @param {MindmapNode} node - The child node
   * @param {Object} levelStyle - The style for this node's level
   * @return {ConnectionPoint} The connection point
   */
  getChildConnectionPoint(node, levelStyle) {
    throw new Error('Method getChildConnectionPoint must be implemented by subclasses');
  }

  /**
   * Get the dimensions for parent drop zones
   * Drop zones should extend into the connection area for precise node ordering
   * @param {Object} node - The node to get drop zone dimensions for
   * @param {Object} parentNode - The parent node (null for root)
   * @param {number} parentPadding - The padding between parent and children
   * @return {Object} Object with {x, width} for the drop zone dimensions
   */
  getParentDropZoneDimensions(node, parentNode, parentPadding) {
    // Default implementation: extend towards parent into connection area
    
    // Determine if node is to the left or right of parent
    const isLeftOfParent = parentNode && node.x < parentNode.x;
    
    // Calculate drop zone dimensions based on position relative to parent
    let dropZoneX, dropZoneWidth;
    
    if (isLeftOfParent) {
      // Node is to the left of parent - extend RIGHT towards parent
      dropZoneX = node.x;
      dropZoneWidth = node.width + parentPadding;
    } else {
      // Node is to the right of parent (or default) - extend LEFT towards parent
      dropZoneWidth = node.width + parentPadding;
      dropZoneX = node.x - parentPadding;
    }
    
    return { x: dropZoneX, width: dropZoneWidth };
  }
}

// For backward compatibility
if (typeof window !== 'undefined') {
  window.BaseLayout = Layout;
}

export default Layout;
