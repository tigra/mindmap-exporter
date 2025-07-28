// src/controller/drag-drop-manager.js

/**
 * Manages drag and drop functionality for mindmap nodes
 */
class DragDropManager {
  /**
   * Create a new DragDropManager
   * @param {MindmapModel} model - The mindmap model
   * @param {MindmapRenderer} renderer - The mindmap renderer
   * @param {MindmapController} controller - The mindmap controller
   * @param {HTMLElement} container - The mindmap container element
   */
  constructor(model, renderer, controller, container) {
    this.model = model;
    this.renderer = renderer;
    this.controller = controller;
    this.container = container;
    
    // Drag state
    this.isDragging = false;
    this.draggedNode = null;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.originalCursor = '';
    
    // Drop zone detection
    this.currentDropZone = null;
    this.dropZoneElements = [];
    
    // Dragging visual element
    this.draggingElement = null;
    this.draggingOffsetX = 0;
    this.draggingOffsetY = 0;
    
    // Bind methods
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleDragStart = this.handleDragStart.bind(this);
    this.handleDragEnd = this.handleDragEnd.bind(this);
    this.handleSelectStart = this.handleSelectStart.bind(this);
    
    this.initialize();
  }
  
  /**
   * Initialize drag and drop functionality
   */
  initialize() {
    // Add event listeners to the container
    this.container.addEventListener('mousedown', this.handleMouseDown);
    this.container.addEventListener('mousemove', this.handleMouseMove);
    this.container.addEventListener('mouseup', this.handleMouseUp);
    
    // Prevent default drag behavior on images and other elements
    this.container.addEventListener('dragstart', this.handleDragStart);
    this.container.addEventListener('dragend', this.handleDragEnd);
    
    // Prevent text selection on SVG elements
    this.container.addEventListener('selectstart', this.handleSelectStart);
    
    // Add CSS to prevent text selection during drag
    this.addDragStyles();
  }
  
  /**
   * Clean up event listeners
   */
  destroy() {
    this.container.removeEventListener('mousedown', this.handleMouseDown);
    this.container.removeEventListener('mousemove', this.handleMouseMove);
    this.container.removeEventListener('mouseup', this.handleMouseUp);
    this.container.removeEventListener('dragstart', this.handleDragStart);
    this.container.removeEventListener('dragend', this.handleDragEnd);
    this.container.removeEventListener('selectstart', this.handleSelectStart);
    
    // Remove drag styles
    this.removeDragStyles();
  }
  
  /**
   * Handle mouse down event to start potential drag
   * @param {MouseEvent} event - The mouse event
   */
  handleMouseDown(event) {
    // Only handle left mouse button
    if (event.button !== 0) return;
    
    // Find the node element that was clicked
    const nodeElement = this.findNodeElement(event.target);
    if (!nodeElement) return;
    
    // Get the node ID and find the corresponding node
    const nodeId = nodeElement.getAttribute('data-node-id');
    const node = this.model.findNodeById(nodeId);
    if (!node) return;
    
    // Don't allow dragging the root node
    if (node.level === 1) return;
    
    // Store drag start information
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.draggedNode = node;
    
    // Prevent default to avoid text selection
    event.preventDefault();
  }
  
  /**
   * Handle mouse move event for dragging
   * @param {MouseEvent} event - The mouse event
   */
  handleMouseMove(event) {
    if (!this.draggedNode) return;
    
    // Check if we've moved enough to start dragging
    const deltaX = Math.abs(event.clientX - this.dragStartX);
    const deltaY = Math.abs(event.clientY - this.dragStartY);
    const threshold = 5; // Minimum pixels to move before starting drag
    
    if (!this.isDragging && (deltaX > threshold || deltaY > threshold)) {
      this.startDrag(event);
    }
    
    if (this.isDragging) {
      this.updateDrag(event);
    }
  }
  
  /**
   * Handle mouse up event to end drag
   * @param {MouseEvent} event - The mouse event
   */
  handleMouseUp(event) {
    if (this.isDragging) {
      this.endDrag(event);
    } else {
      // Reset drag state if we didn't actually start dragging
      this.draggedNode = null;
    }
  }
  
  /**
   * Prevent default drag behavior
   * @param {DragEvent} event - The drag event
   */
  handleDragStart(event) {
    event.preventDefault();
  }
  
  /**
   * Handle drag end
   * @param {DragEvent} event - The drag event
   */
  handleDragEnd(event) {
    this.endDrag(event);
  }
  
  /**
   * Start the drag operation
   * @param {MouseEvent} event - The mouse event
   */
  startDrag(event) {
    this.isDragging = true;
    
    // Create the dragging visual element
    this.createDraggingElement(event);
    
    // Change cursor to indicate dragging
    this.originalCursor = document.body.style.cursor;
    console.log(`Original cursor: "${this.originalCursor}"`);
    document.body.style.cursor = 'grabbing';
    console.log(`Set cursor to: grabbing`);
    
    // Add dragging class to container and body for CSS cursor control
    this.container.classList.add('dragging');
    document.body.classList.add('dragging-mindmap');
    console.log(`Added 'dragging' class to container and body`);
    
    // Update drop zone elements for detection
    this.updateDropZoneElements();
    
    console.log(`Started dragging node: ${this.draggedNode.text}`);
    console.log(`Current body cursor: "${document.body.style.cursor}"`);
  }
  
  /**
   * Update drag operation
   * @param {MouseEvent} event - The mouse event
   */
  updateDrag(event) {
    // Update dragging element position
    this.updateDraggingElement(event);
    
    // Detect drop zone under cursor
    const dropZone = this.detectDropZone(event.clientX, event.clientY);
    
    if (dropZone !== this.currentDropZone) {
      this.currentDropZone = dropZone;
      this.updateDropZoneHighlight();
      this.updateDragCursor();
    }
  }
  
  /**
   * End the drag operation
   * @param {MouseEvent} event - The mouse event
   */
  endDrag(event) {
    if (!this.isDragging) return;
    
    // Remove the dragging visual element
    this.removeDraggingElement();
    
    // Force cleanup of any remaining dragging elements
    this.cleanupDraggingElements();
    
    // Restore cursor
    document.body.style.cursor = this.originalCursor;
    
    // Remove dragging classes from container and body
    this.container.classList.remove('dragging', 'drop-zone-hover');
    document.body.classList.remove('dragging-mindmap', 'drop-zone-hover');
    
    // Perform drop if we have a valid drop zone
    if (this.currentDropZone) {
      this.performDrop();
    }
    
    // Reset drag state
    this.isDragging = false;
    this.draggedNode = null;
    this.currentDropZone = null;
    this.clearDropZoneHighlight();
    
    console.log('Ended drag operation');
  }
  
  /**
   * Update cursor based on current drag state
   */
  updateDragCursor() {
    if (!this.isDragging) return;
    
    if (this.currentDropZone) {
      // Over a valid drop zone - show different cursor based on drop type
      if (this.currentDropZone.type === 'child') {
        // Child drop zone - show copy cursor (making node a child)
        document.body.style.cursor = 'copy';
      } else if (this.currentDropZone.type === 'parent') {
        // Parent drop zone - show alias cursor (moving as sibling)
        document.body.style.cursor = 'alias';
      }
      this.container.classList.add('drop-zone-hover');
      document.body.classList.add('drop-zone-hover');
      
      console.log(`Cursor over ${this.currentDropZone.type} drop zone - cursor: ${document.body.style.cursor}`);
    } else {
      // Not over a drop zone - show grabbing cursor
      document.body.style.cursor = 'grabbing';
      this.container.classList.remove('drop-zone-hover');
      document.body.classList.remove('drop-zone-hover');
    }
  }
  
  /**
   * Find the closest node element from a target element
   * @param {HTMLElement} target - The target element
   * @return {HTMLElement|null} The node element or null
   */
  findNodeElement(target) {
    let element = target;
    while (element && element !== this.container) {
      if (element.hasAttribute('data-node-id')) {
        return element;
      }
      element = element.parentElement;
    }
    return null;
  }
  
  /**
   * Update the list of drop zone elements
   */
  updateDropZoneElements() {
    this.dropZoneElements = Array.from(this.container.querySelectorAll('.drop-zone'));
  }
  
  /**
   * Detect which drop zone is under the cursor
   * @param {number} x - Mouse X coordinate
   * @param {number} y - Mouse Y coordinate
   * @return {Object|null} Drop zone information or null
   */
  detectDropZone(x, y) {
    // Convert screen coordinates to SVG coordinates
    const svgElement = this.container.querySelector('svg');
    if (!svgElement) return null;
    
    const rect = svgElement.getBoundingClientRect();
    
    // Get SVG viewBox to handle coordinate transformations
    const viewBox = svgElement.getAttribute('viewBox');
    let scaleX = 1, scaleY = 1, offsetX = 0, offsetY = 0;
    
    if (viewBox) {
      const [vbX, vbY, vbWidth, vbHeight] = viewBox.split(' ').map(Number);
      scaleX = vbWidth / rect.width;
      scaleY = vbHeight / rect.height;
      offsetX = vbX;
      offsetY = vbY;
    }
    
    // Convert screen coordinates to SVG coordinates with viewBox transformation
    const svgX = (x - rect.left) * scaleX + offsetX;
    const svgY = (y - rect.top) * scaleY + offsetY;
    
    // Check each drop zone
    for (const dropZoneElement of this.dropZoneElements) {
      const dropZoneRect = this.getElementBounds(dropZoneElement);
      
      if (svgX >= dropZoneRect.x && svgX <= dropZoneRect.x + dropZoneRect.width &&
          svgY >= dropZoneRect.y && svgY <= dropZoneRect.y + dropZoneRect.height) {
        
        return this.parseDropZone(dropZoneElement);
      }
    }
    
    return null;
  }
  
  /**
   * Get the bounds of an SVG element
   * @param {SVGElement} element - The SVG element
   * @return {Object} Bounds object with x, y, width, height
   */
  getElementBounds(element) {
    const x = parseFloat(element.getAttribute('x') || 0);
    const y = parseFloat(element.getAttribute('y') || 0);
    const width = parseFloat(element.getAttribute('width') || 0);
    const height = parseFloat(element.getAttribute('height') || 0);
    
    return { x, y, width, height };
  }
  
  /**
   * Parse drop zone element to extract information
   * @param {SVGElement} element - The drop zone element
   * @return {Object} Drop zone information
   */
  parseDropZone(element) {
    const className = element.getAttribute('class');
    const bounds = this.getElementBounds(element);
    
    if (className.includes('child-drop-zone')) {
      // Find the associated node for child drop zones
      const nodeId = this.findNodeIdForDropZone(element, bounds);
      return {
        type: 'child',
        nodeId: nodeId,
        element: element
      };
    } else if (className.includes('parent-drop-zone-top')) {
      const nodeId = this.findNodeIdForDropZone(element, bounds);
      return {
        type: 'parent',
        position: 'before',
        nodeId: nodeId,
        element: element
      };
    } else if (className.includes('parent-drop-zone-bottom')) {
      const nodeId = this.findNodeIdForDropZone(element, bounds);
      return {
        type: 'parent',
        position: 'after',
        nodeId: nodeId,
        element: element
      };
    }
    
    return null;
  }
  
  /**
   * Find the node ID associated with a drop zone
   * @param {SVGElement} dropZoneElement - The drop zone element
   * @param {Object} bounds - The drop zone bounds
   * @return {string|null} The node ID or null
   */
  findNodeIdForDropZone(dropZoneElement, bounds) {
    console.log('=== FIND NODE ID FOR DROP ZONE DEBUG ===');
    console.log('Drop zone element:', dropZoneElement);
    
    // Simply get the node ID from the drop zone's data-node-id attribute
    const nodeId = dropZoneElement.getAttribute('data-node-id');
    console.log(`Drop zone data-node-id: "${nodeId}"`);
    
    if (nodeId) {
      console.log(`=== FOUND NODE ID: "${nodeId}" ===`);
      return nodeId;
    }
    
    console.log('=== NO NODE ID FOUND ON DROP ZONE ===');
    return null;
  }
  
  
  /**
   * Update drop zone highlighting
   */
  updateDropZoneHighlight() {
    // Clear previous highlights
    this.clearDropZoneHighlight();
    
    // Always highlight current drop zone during drag for visual feedback
    if (this.currentDropZone && this.currentDropZone.element) {
      this.currentDropZone.element.style.fillOpacity = '0.3';
      this.currentDropZone.element.style.strokeWidth = '2';
    }
  }
  
  /**
   * Clear drop zone highlighting
   */
  clearDropZoneHighlight() {
    // Respect the renderer's showDropZones setting
    const baseOpacity = this.renderer.showDropZones ? '0.1' : '0.0';
    
    for (const element of this.dropZoneElements) {
      element.style.fillOpacity = baseOpacity;
      element.style.strokeWidth = '1';
    }
  }
  
  /**
   * Perform the drop operation
   */
  performDrop() {
    if (!this.currentDropZone || !this.draggedNode) {
      console.log('DEBUG: performDrop called but missing drop zone or dragged node');
      console.log('currentDropZone:', this.currentDropZone);
      console.log('draggedNode:', this.draggedNode);
      return;
    }
    
    console.log(`=== PERFORM DROP DEBUG ===`);
    console.log('Current drop zone:', this.currentDropZone);
    
    const targetNodeId = this.currentDropZone.nodeId;
    const targetNode = this.model.findNodeById(targetNodeId);
    
    if (!targetNode) {
      console.error('Target node not found for drop operation, nodeId:', targetNodeId);
      return;
    }
    
    // Prevent dropping a node onto itself or its descendants
    if (this.wouldCreateCycle(this.draggedNode, targetNode)) {
      console.warn('Cannot drop node onto itself or its descendants');
      return;
    }
    
    console.log(`Dropping "${this.draggedNode.text}" into "${targetNode.text}" (${this.currentDropZone.type})`);
    
    // Log model state before changes
    console.log('Model state before drop:');
    this.logModelState();
    
    if (this.currentDropZone.type === 'child') {
      this.dropAsChild(this.draggedNode, targetNode);
    } else if (this.currentDropZone.type === 'parent') {
      this.dropAsSibling(this.draggedNode, targetNode, this.currentDropZone.position);
    }
    
    // Log model state after changes
    console.log('Model state after drop:');
    this.logModelState();
    
    console.log('Calling controller.rerenderMindmap()...');
    
    // Re-render the mindmap without re-parsing markdown
    this.controller.rerenderMindmap();
    
    console.log('=== END PERFORM DROP DEBUG ===');
  }
  
  /**
   * Check if dropping would create a cycle
   * @param {Object} draggedNode - The node being dragged
   * @param {Object} targetNode - The target node
   * @return {boolean} True if it would create a cycle
   */
  wouldCreateCycle(draggedNode, targetNode) {
    // Check if target is the dragged node itself
    if (targetNode.id === draggedNode.id) return true;
    
    // Check if target is a descendant of dragged node
    return this.isDescendant(draggedNode, targetNode);
  }
  
  /**
   * Check if a node is a descendant of another node
   * @param {Object} ancestor - The potential ancestor node
   * @param {Object} node - The node to check
   * @return {boolean} True if node is a descendant of ancestor
   */
  isDescendant(ancestor, node) {
    for (const child of ancestor.children) {
      if (child.id === node.id || this.isDescendant(child, node)) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Drop a node as a child of the target node
   * @param {Object} draggedNode - The node being dragged
   * @param {Object} targetNode - The target parent node
   */
  dropAsChild(draggedNode, targetNode) {
    console.log(`=== DROP AS CHILD DEBUG ===`);
    console.log(`Dragged node: "${draggedNode.text}" (level ${draggedNode.level})`);
    console.log(`Target node: "${targetNode.text}" (level ${targetNode.level})`);
    
    // Remove from current parent
    const currentParent = this.model.findParentNode(draggedNode);
    console.log(`Current parent: ${currentParent ? `"${currentParent.text}"` : 'null'}`);
    
    if (currentParent) {
      const index = currentParent.children.indexOf(draggedNode);
      console.log(`Removing from parent at index: ${index}`);
      console.log(`Parent children before removal:`, currentParent.children.map(c => c.text));
      if (index !== -1) {
        currentParent.children.splice(index, 1);
      }
      console.log(`Parent children after removal:`, currentParent.children.map(c => c.text));
    }
    
    // Add to new parent
    console.log(`Target children before addition:`, targetNode.children.map(c => c.text));
    targetNode.children.push(draggedNode);
    console.log(`Target children after addition:`, targetNode.children.map(c => c.text));
    
    // Update parent reference
    draggedNode.parent = targetNode;
    console.log(`Updated parent reference: "${draggedNode.parent?.text}"`);
    
    // Update level recursively
    const oldLevel = draggedNode.level;
    this.updateNodeLevel(draggedNode, targetNode.level + 1);
    console.log(`Updated level: ${oldLevel} -> ${draggedNode.level}`);
    
    console.log(`=== END DROP AS CHILD DEBUG ===`);
    console.log(`Moved "${draggedNode.text}" as child of "${targetNode.text}"`);
  }
  
  /**
   * Drop a node as a sibling of the target node
   * @param {Object} draggedNode - The node being dragged
   * @param {Object} targetNode - The target sibling node
   * @param {string} position - 'before' or 'after'
   */
  dropAsSibling(draggedNode, targetNode, position) {
    const targetParent = this.model.findParentNode(targetNode);
    if (!targetParent) {
      console.error('Cannot find parent of target node');
      return;
    }
    
    // Remove from current parent
    const currentParent = this.model.findParentNode(draggedNode);
    if (currentParent) {
      const index = currentParent.children.indexOf(draggedNode);
      if (index !== -1) {
        currentParent.children.splice(index, 1);
      }
    }
    
    // Find target index and insert
    const targetIndex = targetParent.children.indexOf(targetNode);
    const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
    
    targetParent.children.splice(insertIndex, 0, draggedNode);
    
    // Update parent reference
    draggedNode.parent = targetParent;
    
    // Update level recursively
    this.updateNodeLevel(draggedNode, targetParent.level + 1);
    
    console.log(`Moved "${draggedNode.text}" ${position} "${targetNode.text}"`);
  }
  
  /**
   * Update node level recursively
   * @param {Object} node - The node to update
   * @param {number} newLevel - The new level
   */
  updateNodeLevel(node, newLevel) {
    node.level = newLevel;
    for (const child of node.children) {
      this.updateNodeLevel(child, newLevel + 1);
    }
  }
  
  /**
   * Handle selectstart event to prevent text selection during drag
   * @param {Event} event - The selectstart event
   */
  handleSelectStart(event) {
    // Prevent text selection when a node is being prepared for drag
    if (this.draggedNode) {
      event.preventDefault();
      return false;
    }
  }
  
  /**
   * Add CSS styles to prevent text selection during drag
   */
  addDragStyles() {
    // Create a style element if it doesn't exist
    if (!document.getElementById('drag-drop-styles')) {
      const style = document.createElement('style');
      style.id = 'drag-drop-styles';
      style.textContent = `
        .mindmap-container svg {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
        .mindmap-container svg text {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
          pointer-events: auto;
        }
        .mindmap-container [data-node-id] {
          cursor: grab;
        }
        .mindmap-container [data-node-id]:active {
          cursor: grabbing;
        }
        .mindmap-container.dragging {
          cursor: grabbing !important;
        }
        .mindmap-container.dragging * {
          cursor: grabbing !important;
        }
        .mindmap-container.dragging.drop-zone-hover {
          cursor: copy !important;
        }
        .mindmap-container.dragging.drop-zone-hover * {
          cursor: copy !important;
        }
        body.dragging-mindmap {
          cursor: grabbing !important;
        }
        body.dragging-mindmap * {
          cursor: grabbing !important;
        }
        body.dragging-mindmap.drop-zone-hover {
          cursor: copy !important;
        }
        body.dragging-mindmap.drop-zone-hover * {
          cursor: copy !important;
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  /**
   * Remove CSS styles for drag and drop
   */
  removeDragStyles() {
    const style = document.getElementById('drag-drop-styles');
    if (style) {
      style.remove();
    }
  }
  
  /**
   * Log the current model state for debugging
   */
  logModelState() {
    const root = this.model.getRoot();
    if (!root) {
      console.log('No root node in model');
      return;
    }
    
    console.log('Root node:', root.text);
    this.logNodeTree(root, 0);
  }
  
  /**
   * Recursively log the node tree structure
   * @param {Object} node - The node to log
   * @param {number} depth - The current depth for indentation
   */
  logNodeTree(node, depth) {
    const indent = '  '.repeat(depth);
    console.log(`${indent}- "${node.text}" (level ${node.level}, children: ${node.children.length})`);
    
    for (const child of node.children) {
      this.logNodeTree(child, depth + 1);
    }
  }
  
  /**
   * Create the dragging visual element
   * @param {MouseEvent} event - The mouse event
   */
  createDraggingElement(event) {
    // Remove any existing dragging element first
    if (this.draggingElement) {
      this.removeDraggingElement();
    }
    
    // Force cleanup of any stray dragging elements
    this.cleanupDraggingElements();
    
    // Get the SVG element and its bounding rect
    const svgElement = this.container.querySelector('svg');
    if (!svgElement) return;
    
    // Find the node's rect element (the actual shape)
    const nodeRectElement = document.getElementById(`${this.draggedNode.id}_rect`);
    if (!nodeRectElement) {
      // Fallback to any element with data-node-id
      const nodeElement = document.querySelector(`[data-node-id="${this.draggedNode.id}"]`);
      if (!nodeElement) return;
    }
    
    const svgRect = svgElement.getBoundingClientRect();
    
    // Get the actual node position from the model
    const nodeX = this.draggedNode.x;
    const nodeY = this.draggedNode.y;
    
    // Get SVG viewBox to handle coordinate transformations
    const viewBox = svgElement.getAttribute('viewBox');
    let scaleX = 1, scaleY = 1, offsetX = 0, offsetY = 0;
    
    if (viewBox) {
      const [vbX, vbY, vbWidth, vbHeight] = viewBox.split(' ').map(Number);
      scaleX = svgRect.width / vbWidth;
      scaleY = svgRect.height / vbHeight;
      offsetX = -vbX * scaleX;
      offsetY = -vbY * scaleY;
    }
    
    // Convert SVG coordinates to screen coordinates
    const screenX = svgRect.left + offsetX + (nodeX * scaleX);
    const screenY = svgRect.top + offsetY + (nodeY * scaleY);
    
    // Calculate offset from mouse to node position
    this.draggingOffsetX = screenX - event.clientX;
    this.draggingOffsetY = screenY - event.clientY;
    
    // Create a div to hold the dragging element
    this.draggingElement = document.createElement('div');
    this.draggingElement.className = 'dragging-node';
    this.draggingElement.id = 'dragging-node-visual'; // Add unique ID
    this.draggingElement.style.position = 'fixed';
    this.draggingElement.style.zIndex = '10000';
    this.draggingElement.style.pointerEvents = 'none';
    this.draggingElement.style.opacity = '0.7';
    this.draggingElement.style.filter = 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))';
    
    // Clone the node's visual representation
    const clonedNode = this.cloneNodeVisual(this.draggedNode);
    this.draggingElement.innerHTML = clonedNode;
    
    // Position the element
    this.updateDraggingElement(event);
    
    // Add to body
    document.body.appendChild(this.draggingElement);
    
    // Debug: Check how many dragging elements exist
    const draggingElements = document.querySelectorAll('.dragging-node');
    console.log(`Number of dragging elements after creation: ${draggingElements.length}`);
    
    // Debug: Check the content
    console.log('Dragging element HTML:', this.draggingElement.outerHTML.substring(0, 200) + '...');
  }
  
  /**
   * Clone the visual representation of a node
   * @param {Object} node - The node to clone
   * @return {string} SVG string of the cloned node
   */
  cloneNodeVisual(node) {
    const levelStyle = this.renderer.styleManager.getLevelStyle(node.level);
    const isTextOnly = levelStyle.nodeType === 'text-only';
    
    // Create a minimal SVG with just the node
    let svg = `<svg width="${node.width + 20}" height="${node.height + 20}" style="overflow: visible;">`;
    
    if (!isTextOnly) {
      // Add the node rectangle
      svg += `<rect x="10" y="10" width="${node.width}" height="${node.height}"
              rx="${levelStyle.borderRadius || 5}" ry="${levelStyle.borderRadius || 5}"
              fill="${levelStyle.backgroundColor || '#4a9eff'}"
              fill-opacity="${levelStyle.fillOpacity || 0.5}"
              stroke="${levelStyle.borderColor || '#fff'}"
              stroke-width="${levelStyle.borderWidth || 1.5}"/>`;
    }
    
    // Add the text
    const textX = 10 + node.width / 2;
    const textY = 10 + node.height / 2;
    const textColor = isTextOnly ? (levelStyle.textColor || '#333') : (levelStyle.textColorBoxed || 'white');
    
    svg += `<text x="${textX}" y="${textY}"
            text-anchor="middle" dominant-baseline="middle"
            font-family="${levelStyle.fontFamily || 'Arial, sans-serif'}"
            font-size="${levelStyle.fontSize || 14}"
            font-weight="${levelStyle.fontWeight || 'normal'}"
            fill="${textColor}">${this.escapeHtml(node.text)}</text>`;
    
    svg += '</svg>';
    return svg;
  }
  
  /**
   * Update the position of the dragging element
   * @param {MouseEvent} event - The mouse event
   */
  updateDraggingElement(event) {
    if (!this.draggingElement) return;
    
    const x = event.clientX + this.draggingOffsetX;
    const y = event.clientY + this.draggingOffsetY;
    
    this.draggingElement.style.left = `${x}px`;
    this.draggingElement.style.top = `${y}px`;
  }
  
  /**
   * Remove the dragging visual element
   */
  removeDraggingElement() {
    if (this.draggingElement && this.draggingElement.parentNode) {
      this.draggingElement.parentNode.removeChild(this.draggingElement);
      this.draggingElement = null;
    }
  }
  
  /**
   * Clean up any stray dragging elements from the DOM
   */
  cleanupDraggingElements() {
    const strayElements = document.querySelectorAll('.dragging-node');
    if (strayElements.length > 0) {
      console.log(`Cleaning up ${strayElements.length} stray dragging elements`);
      strayElements.forEach((element, index) => {
        console.log(`Removing stray element ${index}:`, element.id);
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
    }
  }
  
  /**
   * Escape HTML special characters
   * @param {string} text - The text to escape
   * @return {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

export default DragDropManager;