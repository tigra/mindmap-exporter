// src/layout/tap-root-layout.js - Update for direction overrides

import ColumnBasedLayout from './column-based-layout.js';
import ConnectionPoint from './connection-point.js';
import LayoutFactory from './layout-factory.js';

/**
 * TapRootLayout implementation that arranges children in balanced left and right columns
 */
class TapRootLayout extends ColumnBasedLayout {
  /**
   * Create a new TapRootLayout
   * @param {number} parentPadding - Padding between parent and children
   * @param {number} childPadding - Padding between siblings
   * @param {number} columnGap - Gap between left and right columns
   */
  constructor(parentPadding = 50, childPadding = 20, columnGap = 80) {
    super(parentPadding, childPadding, columnGap);
  }

  /**
   * Navigate from current node based on keyboard input
   * @param {Object} currentNode - The currently selected node
   * @param {string} key - The arrow key pressed
   * @param {Object} styleManager - The style manager for getting node styles
   * @returns {Object|null} The target node to navigate to
   */
  navigateByKey(currentNode, key, styleManager) {
    console.log(`TapRootLayout.navigateByKey: Processing key "${key}" for node "${currentNode.text}"`);
    
    // In taproot, children are arranged in columns
    // Up/Down navigates within column
    // Left/Right navigates between columns
    
    if (key === 'ArrowUp' || key === 'ArrowDown') {
      console.log(`TapRootLayout.navigateByKey: Vertical navigation - looking for column nodes`);
      
      // Find nodes in the same column
      const columnNodes = this.findNodesInSameColumn(currentNode);
      if (columnNodes.length > 1) {
        const currentIndex = columnNodes.indexOf(currentNode);
        console.log(`TapRootLayout.navigateByKey: Found ${columnNodes.length} nodes in column, current index: ${currentIndex}`);
        
        if (key === 'ArrowUp' && currentIndex > 0) {
          const targetNode = columnNodes[currentIndex - 1];
          console.log(`TapRootLayout.navigateByKey: Moving up to "${targetNode.text}"`);
          return targetNode;
        }
        if (key === 'ArrowDown' && currentIndex < columnNodes.length - 1) {
          const targetNode = columnNodes[currentIndex + 1];
          console.log(`TapRootLayout.navigateByKey: Moving down to "${targetNode.text}"`);
          return targetNode;
        }
      }
      
      // If we're at the edge of a column, check for parent
      if (key === 'ArrowUp' && currentNode.parent) {
        const parentLayout = styleManager.getEffectiveValue(currentNode.parent, 'layoutType');
        console.log(`TapRootLayout.navigateByKey: At column edge, parent layout is "${parentLayout}"`);
        
        if (parentLayout !== 'taproot') {
          console.log(`TapRootLayout.navigateByKey: Parent has different layout, navigating to parent "${currentNode.parent.text}"`);
          return currentNode.parent;
        }
      }
      
      console.log(`TapRootLayout.navigateByKey: No vertical navigation available`);
    }
    
    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      console.log(`TapRootLayout.navigateByKey: Horizontal navigation - looking between columns`);
      
      // Navigate between columns (siblings with different x positions)
      const siblings = this.getSiblings(currentNode);
      if (siblings.length > 0) {
        const sortedByX = siblings.sort((a, b) => a.x - b.x);
        const currentIndex = sortedByX.indexOf(currentNode);
        console.log(`TapRootLayout.navigateByKey: Found ${siblings.length} siblings, current X-sorted index: ${currentIndex}`);
        
        if (key === 'ArrowLeft' && currentIndex > 0) {
          const targetNode = sortedByX[currentIndex - 1];
          console.log(`TapRootLayout.navigateByKey: Moving left to "${targetNode.text}"`);
          return targetNode;
        }
        if (key === 'ArrowRight' && currentIndex < sortedByX.length - 1) {
          const targetNode = sortedByX[currentIndex + 1];
          console.log(`TapRootLayout.navigateByKey: Moving right to "${targetNode.text}"`);
          return targetNode;
        }
      }
      
      console.log(`TapRootLayout.navigateByKey: No horizontal navigation available`);
    }
    
    console.log(`TapRootLayout.navigateByKey: No navigation rule matched, returning null`);
    return null;
  }

  /**
   * Check if the key press should expand a collapsed node instead of navigating
   * @param {string} key - The arrow key pressed
   * @param {Object} currentNode - The currently selected node
   * @param {Object} styleManager - The style manager for getting node styles
   * @returns {boolean} True if the node should be expanded, false otherwise
   */
  shouldExpandOnKey(key, currentNode, styleManager) {
    console.log(`TapRootLayout.shouldExpandOnKey: Checking key "${key}" for node "${currentNode.text}"`);
    
    // Only expand if node is collapsed and has children
    if (!currentNode.collapsed || !currentNode.children || currentNode.children.length === 0) {
      console.log(`TapRootLayout.shouldExpandOnKey: Node not collapsed or has no children, returning false`);
      return false;
    }
    
    // In taproot layout, children are arranged below the parent
    // So down arrow should expand collapsed nodes
    const shouldExpand = key === 'ArrowDown';
    console.log(`TapRootLayout.shouldExpandOnKey: shouldExpand=${shouldExpand}`);
    
    return shouldExpand;
  }

  /**
   * Find nodes in the same column (for taproot layout)
   * @param {Object} node - The current node
   * @returns {Array} Array of nodes in the same column
   */
  findNodesInSameColumn(node) {
    console.log(`TapRootLayout.findNodesInSameColumn: Finding column nodes for "${node.text}"`);
    
    if (!node.parent) {
      console.log(`TapRootLayout.findNodesInSameColumn: No parent, returning single node`);
      return [node];
    }
    
    const siblings = node.parent.children;
    const nodeX = node.x + node.width / 2;
    const tolerance = 30; // Tolerance for "same column"
    
    console.log(`TapRootLayout.findNodesInSameColumn: Node centerX=${nodeX}, tolerance=${tolerance}, checking ${siblings.length} siblings`);
    
    // Find all siblings in the same column
    const columnNodes = siblings.filter(sibling => {
      const siblingX = sibling.x + sibling.width / 2;
      const distance = Math.abs(siblingX - nodeX);
      const inColumn = distance < tolerance;
      console.log(`TapRootLayout.findNodesInSameColumn: "${sibling.text}" centerX=${siblingX}, distance=${distance}, inColumn=${inColumn}`);
      return inColumn;
    });
    
    console.log(`TapRootLayout.findNodesInSameColumn: Found ${columnNodes.length} nodes in same column`);
    
    // Sort by Y position
    const sortedNodes = columnNodes.sort((a, b) => a.y - b.y);
    console.log(`TapRootLayout.findNodesInSameColumn: Y-sorted order: ${sortedNodes.map(n => `"${n.text}"(${n.y})`).join(', ')}`);
    
    return sortedNodes;
  }

  /**
   * Position children in left and right columns
   * @param {Node} node - The parent node
   * @param {Array} leftChildren - Children in left column 
   * @param {Array} rightChildren - Children in right column
   * @param {number} childStartY - Starting Y coordinate for children
   * @param {Object} style - The style to apply
   */
  positionChildrenInColumns(node, leftChildren, rightChildren, childStartY, style) {
    // Calculate the center point for the parent node
    const parentCenterX = node.x + (node.width / 2);
    const levelStyle = style.getLevelStyle(node.level);
    
    // Initialize current Y positions for both columns
    let currentLeftY = childStartY;
    let currentRightY = childStartY;
    
    // Get layouts for the columns
    const leftLayout = LayoutFactory.createLayout('horizontal', levelStyle.parentPadding, levelStyle.childPadding, 'left');
    const rightLayout = LayoutFactory.createLayout('horizontal', levelStyle.parentPadding, levelStyle.childPadding, 'right');
    
    // Process left column
    for (let i = 0; i < leftChildren.length; i++) {
      const child = leftChildren[i];
      child.setOverride('layoutType', 'horizontal');
      
      // Apply layout and get actual size with its children
      const childSize = leftLayout.applyLayout(child, 0, currentLeftY, style);
      
      // Position the child so its right side aligns with leftColumnX
      const targetX = this.leftColumnX - childSize.width;
      const deltaX = targetX - childSize.x;
      this.adjustPositionRecursive(child, deltaX, 0);
      
      // Update Y position for next left child
      currentLeftY += childSize.height + this.childPadding;
      
      // Update max column width
      this.leftColumnMaxWidth = Math.max(this.leftColumnMaxWidth, childSize.width);
      
      // Update max Y coordinate for debugging visualization
      this.columnMaxY = Math.max(this.columnMaxY, currentLeftY - this.childPadding);
    }
    
    // Process right column
    for (let i = 0; i < rightChildren.length; i++) {
      const child = rightChildren[i];
      child.setOverride('layoutType', 'horizontal');
      
      // Apply layout and get actual size with its children
      const childSize = rightLayout.applyLayout(child, 0, currentRightY, style);
      
      // Position the child so its left side aligns with rightColumnX
      const deltaX = this.rightColumnX - childSize.x;
      this.adjustPositionRecursive(child, deltaX, 0);
      
      // Update Y position for next right child
      currentRightY += childSize.height + this.childPadding;
      
      // Update max column width
      this.rightColumnMaxWidth = Math.max(this.rightColumnMaxWidth, childSize.width);
      
      // Update max Y coordinate for debugging visualization
      this.columnMaxY = Math.max(this.columnMaxY, currentRightY - this.childPadding);
    }
  }
  
  /**
   * Apply tap root layout to a node and its children
   * @param {Node} node - The node to layout
   * @param {number} x - The x coordinate
   * @param {number} y - The y coordinate
   * @param {Object} style - The style to apply
   * @return {Object} The size of the laid out subtree
   */
  applyLayout(node, x, y, style) {
    console.groupCollapsed(`TaprootLayout.applyLayout(${node.text})`);
    
    // Call the parent implementation for the main layout work
    const boundingBox = super.applyLayout(node, x, y, style);
    
    // Fix the bounding box to the desired position
    node.moveBoundingBoxTo(x, y);
    
    // Add debug elements to the node
    // Uncomment this line to enable debug visualization
    // this.createDebugElements(node);
    
    console.groupEnd();
    return boundingBox;
  }

  /**
   * Estimate height contribution of a node and its subtree for column balancing
   * In TapRootLayout, we consider the child branch height when balancing columns
   * @param {Node} node - The node to estimate
   * @return {number} Estimated height
   */
  estimateNodeHeight(node) {
    // If node has a known height from previous layout, use that
    if (node.height) {
      if (node.children.length > 0 && !node.collapsed) {
        // For nodes with children, consider their contribution to height
        return node.height * (1 + 0.5 * node.children.length);
      }
      return node.height;
    }
    
    // Base estimate considering children count
    const baseHeight = 30;
    if (node.children.length > 0 && !node.collapsed) {
      return baseHeight * (1 + 0.3 * node.children.length);
    }
    
    return baseHeight;
  }
}

// For backward compatibility
if (typeof window !== 'undefined') {
  window.TapRootLayout = TapRootLayout;
}

export default TapRootLayout;