// src/utils/navigation-override-manager.js

/**
 * Manages custom keyboard navigation overrides and their visualization
 * Used for creating test data for navigation system validation
 */
class NavigationOverrideManager {
  /**
   * Create a new NavigationOverrideManager
   * @param {Object} model - The mindmap model
   * @param {Object} renderer - The mindmap renderer
   * @param {Object} controller - The mindmap controller
   * @param {HTMLElement} container - The mindmap container
   */
  constructor(model, renderer, controller, container) {
    this.model = model;
    this.renderer = renderer;
    this.controller = controller;
    this.container = container;
    
    this.enabled = false;
    this.isDragging = false;
    this.dragStart = null;
    this.dragDirection = null;
    this.dragSourceNode = null;
    this.dragLine = null;
    this.dragPoint = null;
    
    // Storage for navigation overrides
    this.navigationOverrides = new Map(); // nodeId -> { up, down, left, right }
    
    // Visual elements
    this.dragPoints = new Map(); // nodeId -> { north, south, east, west }
    this.arrows = new Map(); // nodeId-direction -> arrow element
    
    this.initializeEventListeners();
  }

  /**
   * Initialize event listeners for drag and drop functionality
   */
  initializeEventListeners() {
    // Listen for checkbox changes
    const checkbox = document.getElementById('enable-navigation-override');
    if (checkbox) {
      checkbox.addEventListener('change', (e) => {
        this.setEnabled(e.target.checked);
      });
    }
    
    // Mouse event listeners for dragging
    this.container.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.container.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.container.addEventListener('mouseup', this.handleMouseUp.bind(this));
    
    // Prevent context menu on right click for better UX
    this.container.addEventListener('contextmenu', (e) => {
      if (this.enabled) {
        e.preventDefault();
      }
    });
  }

  /**
   * Enable or disable navigation override mode
   * @param {boolean} enabled - Whether to enable the mode
   */
  setEnabled(enabled) {
    console.log(`NavigationOverrideManager: Setting enabled to ${enabled}`);
    this.enabled = enabled;
    
    if (enabled) {
      this.initializeOverrides();
      this.showDragPoints();
      // Delay to ensure drag points are created before arrows
      setTimeout(() => {
        console.log('NavigationOverrideManager: Attempting to show arrows after delay');
        console.log('Number of drag points created:', this.dragPoints.size);
        this.showArrows();
      }, 100);
    } else {
      this.hideDragPoints();
      this.hideArrows();
    }
  }

  /**
   * Initialize navigation overrides based on current layout logic
   */
  initializeOverrides() {
    console.log('NavigationOverrideManager: Initializing navigation overrides');
    
    const allNodes = this.getAllNodes();
    
    for (const node of allNodes) {
      const overrides = {
        up: this.findNodeInDirection(node, 'ArrowUp'),
        down: this.findNodeInDirection(node, 'ArrowDown'),
        left: this.findNodeInDirection(node, 'ArrowLeft'),
        right: this.findNodeInDirection(node, 'ArrowRight')
      };
      
      this.navigationOverrides.set(node.id, overrides);
      console.log(`NavigationOverrideManager: Initialized overrides for "${node.text}":`, 
        Object.fromEntries(Object.entries(overrides).map(([k, v]) => [k, v ? v.text : null])));
    }
  }

  /**
   * Find target node in specified direction using current navigation logic
   */
  findNodeInDirection(sourceNode, key) {
    // Try layout-aware navigation first
    const layoutTarget = this.controller.findNodeByLayoutLogic(sourceNode, key);
    if (layoutTarget) {
      return layoutTarget;
    }
    
    // Fall back to spatial navigation
    return this.controller.findNodeInDirection(sourceNode, key);
  }

  /**
   * Get all visible nodes in the mindmap
   */
  getAllNodes() {
    return this.controller.getAllNodes();
  }

  /**
   * Show draggable points on all nodes
   */
  showDragPoints() {
    console.log('NavigationOverrideManager: Showing drag points');
    
    const allNodes = this.getAllNodes();
    
    for (const node of allNodes) {
      this.createDragPointsForNode(node);
    }
  }

  /**
   * Create draggable points for a single node
   */
  createDragPointsForNode(node) {
    const svg = this.container.querySelector('svg');
    if (!svg) return;
    
    const directions = [
      { name: 'north', x: node.x + node.width / 2, y: node.y, cursor: 'n-resize' },
      { name: 'south', x: node.x + node.width / 2, y: node.y + node.height, cursor: 's-resize' },
      { name: 'east', x: node.x + node.width, y: node.y + node.height / 2, cursor: 'e-resize' },
      { name: 'west', x: node.x, y: node.y + node.height / 2, cursor: 'w-resize' }
    ];
    
    const points = {};
    
    for (const dir of directions) {
      const point = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      point.setAttribute('cx', dir.x);
      point.setAttribute('cy', dir.y);
      point.setAttribute('r', '6');
      point.setAttribute('fill', '#007bff');
      point.setAttribute('stroke', '#ffffff');
      point.setAttribute('stroke-width', '2');
      point.setAttribute('class', 'navigation-drag-point');
      point.setAttribute('data-node-id', node.id);
      point.setAttribute('data-direction', dir.name);  // Store direction name directly
      point.style.cursor = dir.cursor;
      point.style.opacity = '0.8';
      point.style.pointerEvents = 'all';  // Ensure it's clickable
      
      // Add hover effects
      point.addEventListener('mouseenter', () => {
        if (!this.isDragging) {
          point.setAttribute('r', '8');
          point.style.opacity = '1';
        }
      });
      
      point.addEventListener('mouseleave', () => {
        if (!this.isDragging) {
          point.setAttribute('r', '6');
          point.style.opacity = '0.8';
        }
      });
      
      svg.appendChild(point);
      points[dir.name] = point;
    }
    
    this.dragPoints.set(node.id, points);
  }

  /**
   * Convert direction name to arrow key
   */
  getDirectionKey(directionName) {
    const mapping = {
      north: 'ArrowUp',
      south: 'ArrowDown',
      east: 'ArrowRight',
      west: 'ArrowLeft'
    };
    return mapping[directionName];
  }

  /**
   * Convert arrow key to direction name
   */
  getDirectionName(arrowKey) {
    const mapping = {
      ArrowUp: 'north',
      ArrowDown: 'south',
      ArrowRight: 'east',
      ArrowLeft: 'west'
    };
    return mapping[arrowKey];
  }

  /**
   * Hide all drag points
   */
  hideDragPoints() {
    console.log('NavigationOverrideManager: Hiding drag points');
    
    for (const points of this.dragPoints.values()) {
      for (const point of Object.values(points)) {
        if (point.parentNode) {
          point.parentNode.removeChild(point);
        }
      }
    }
    
    this.dragPoints.clear();
  }

  /**
   * Show arrows for all navigation connections
   */
  showArrows() {
    console.log('NavigationOverrideManager: Showing navigation arrows');
    
    for (const [nodeId, overrides] of this.navigationOverrides) {
      const sourceNode = this.model.findNodeById(nodeId);
      if (!sourceNode) continue;
      
      for (const [direction, targetNode] of Object.entries(overrides)) {
        if (targetNode) {
          this.createArrow(sourceNode, targetNode, direction);
        }
      }
    }
  }

  /**
   * Create a curved arrow between two nodes
   */
  createArrow(sourceNode, targetNode, direction) {
    const arrowKey = `${sourceNode.id}-${direction}`;
    
    // Remove existing arrow if present
    if (this.arrows.has(arrowKey)) {
      const existingArrow = this.arrows.get(arrowKey);
      if (existingArrow.parentNode) {
        existingArrow.parentNode.removeChild(existingArrow);
      }
    }
    
    // Get the exact drag point position for this direction
    const dragPointsForNode = this.dragPoints.get(sourceNode.id);
    if (!dragPointsForNode) {
      console.warn(`No drag points found for node ${sourceNode.id}`);
      return;
    }

    // Try to find the drag point, handling direction name conversion
    let dragPoint = dragPointsForNode[direction];
    if (!dragPoint) {
      // Try converting direction names (up->north, down->south, etc.)
      const directionMapping = {
        'up': 'north',
        'down': 'south', 
        'left': 'west',
        'right': 'east',
        'ArrowUp': 'north',
        'ArrowDown': 'south',
        'ArrowLeft': 'west', 
        'ArrowRight': 'east'
      };
      const mappedDirection = directionMapping[direction];
      if (mappedDirection) {
        dragPoint = dragPointsForNode[mappedDirection];
      }
    }
    
    if (!dragPoint) {
      console.warn(`No drag point found for node ${sourceNode.id}, direction ${direction}, available directions:`, Object.keys(dragPointsForNode));
      return;
    }
    
    const startPoint = {
      x: parseFloat(dragPoint.getAttribute('cx')),
      y: parseFloat(dragPoint.getAttribute('cy'))
    };
    
    // Get target node center
    const endPoint = this.getNodeCenterPoint(targetNode);
    
    // Create curved path
    const path = this.createCurvedPath(startPoint, endPoint);
    
    // Create SVG path element
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arrow.setAttribute('d', path);
    arrow.setAttribute('stroke', '#28a745');
    arrow.setAttribute('stroke-width', '2');
    arrow.setAttribute('fill', 'none');
    arrow.setAttribute('class', 'navigation-arrow');
    arrow.setAttribute('data-source', sourceNode.id);
    arrow.setAttribute('data-target', targetNode.id);
    arrow.setAttribute('data-direction', direction);
    arrow.style.opacity = '0.7';
    arrow.style.pointerEvents = 'none';
    
    // Add arrowhead
    arrow.setAttribute('marker-end', 'url(#arrowhead)');
    
    // Insert arrow before drag points to keep points on top
    const svg = this.container.querySelector('svg');
    const firstDragPoint = svg.querySelector('.navigation-drag-point');
    if (firstDragPoint) {
      svg.insertBefore(arrow, firstDragPoint);
    } else {
      svg.appendChild(arrow);
    }
    
    this.arrows.set(arrowKey, arrow);
    
    // Ensure arrowhead marker exists
    this.ensureArrowheadMarker();
  }

  /**
   * Get the point on a node's edge for a given direction
   */
  getNodeDirectionPoint(node, direction) {
    const directionMap = {
      up: { x: node.x + node.width / 2, y: node.y },
      down: { x: node.x + node.width / 2, y: node.y + node.height },
      left: { x: node.x, y: node.y + node.height / 2 },
      right: { x: node.x + node.width, y: node.y + node.height / 2 }
    };
    
    return directionMap[direction] || this.getNodeCenterPoint(node);
  }

  /**
   * Get the center point of a node
   */
  getNodeCenterPoint(node) {
    return {
      x: node.x + node.width / 2,
      y: node.y + node.height / 2
    };
  }

  /**
   * Create a curved path between two points
   */
  createCurvedPath(start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    
    // Control point for curve (offset perpendicular to the line)
    const midX = start.x + dx / 2;
    const midY = start.y + dy / 2;
    
    // Offset the control point perpendicular to create curve
    const distance = Math.sqrt(dx * dx + dy * dy);
    const offset = Math.min(distance * 0.2, 50); // Curve intensity
    
    const perpX = -dy / distance * offset;
    const perpY = dx / distance * offset;
    
    const controlX = midX + perpX;
    const controlY = midY + perpY;
    
    return `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`;
  }

  /**
   * Ensure arrowhead marker exists in SVG defs
   */
  ensureArrowheadMarker() {
    const svg = this.container.querySelector('svg');
    let defs = svg.querySelector('defs');
    
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svg.appendChild(defs);
    }
    
    if (!defs.querySelector('#arrowhead')) {
      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
      marker.setAttribute('id', 'arrowhead');
      marker.setAttribute('markerWidth', '10');
      marker.setAttribute('markerHeight', '7');
      marker.setAttribute('refX', '9');
      marker.setAttribute('refY', '3.5');
      marker.setAttribute('orient', 'auto');
      
      const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
      polygon.setAttribute('fill', '#28a745');
      
      marker.appendChild(polygon);
      defs.appendChild(marker);
    }
  }

  /**
   * Hide all navigation arrows
   */
  hideArrows() {
    console.log('NavigationOverrideManager: Hiding navigation arrows');
    
    for (const arrow of this.arrows.values()) {
      if (arrow.parentNode) {
        arrow.parentNode.removeChild(arrow);
      }
    }
    
    this.arrows.clear();
  }

  /**
   * Refresh arrows display by hiding and showing them again
   */
  refreshArrows() {
    console.log('NavigationOverrideManager: Refreshing arrows display');
    this.hideArrows();
    this.showArrows();
  }

  /**
   * Handle mouse down events for starting drag operations
   */
  handleMouseDown(event) {
    if (!this.enabled) return;
    
    const target = event.target;
    // Check if target is an SVG circle with the navigation-drag-point class
    if (target && target.tagName === 'circle' && target.classList && target.classList.contains('navigation-drag-point')) {
      this.isDragging = true;
      this.dragStart = { x: event.clientX, y: event.clientY };
      this.dragSourceNode = target.getAttribute('data-node-id');
      this.dragDirection = target.getAttribute('data-direction');
      this.dragPoint = target;  // Store reference to the drag point
      
      // Create drag line for visual feedback
      this.createDragLine(event);
      
      // Highlight the drag point
      target.setAttribute('r', '8');
      target.style.opacity = '1';
      target.style.fill = '#0056b3';
      
      console.log(`NavigationOverrideManager: Started dragging from node ${this.dragSourceNode}, direction ${this.dragDirection}`);
      
      event.preventDefault();
      event.stopPropagation();
    }
  }

  /**
   * Handle mouse move events for drag operations
   */
  handleMouseMove(event) {
    if (!this.enabled || !this.isDragging) return;
    
    // Update drag line position
    this.updateDragLine(event);
    
    // Highlight potential target node
    const targetNode = this.findNodeUnderMouse(event);
    this.highlightTargetNode(targetNode);
    
    event.preventDefault();
  }

  /**
   * Handle mouse up events for completing drag operations
   */
  handleMouseUp(event) {
    if (!this.enabled || !this.isDragging) return;
    
    // Find the target node under the mouse
    const targetNode = this.findNodeUnderMouse(event);
    
    if (targetNode && targetNode.id !== this.dragSourceNode) {
      // Update the navigation override to new target
      this.setNavigationOverride(this.dragSourceNode, this.dragDirection, targetNode);
      console.log(`NavigationOverrideManager: Set navigation override: ${this.dragSourceNode} -> ${this.dragDirection} -> ${targetNode.id}`);
    } else {
      // No valid target found - remove the old connection
      this.removeNavigationOverride(this.dragSourceNode, this.dragDirection);
      console.log(`NavigationOverrideManager: Removed navigation override: ${this.dragSourceNode} -> ${this.dragDirection}`);
      
      // Refresh the display to show the removed connection
      this.refreshArrows();
    }
    
    // Clean up drag visualization
    this.cleanupDrag();
    
    // Reset drag point appearance
    if (this.dragPoint) {
      this.dragPoint.setAttribute('r', '6');
      this.dragPoint.style.opacity = '0.8';
      this.dragPoint.style.fill = '#007bff';
    }
    
    this.isDragging = false;
    this.dragStart = null;
    this.dragSourceNode = null;
    this.dragDirection = null;
    this.dragPoint = null;
    
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Create a drag line for visual feedback
   */
  createDragLine(event) {
    const svg = this.container.querySelector('svg');
    if (!svg) return;
    
    // Get the drag point position directly from the circle element
    if (!this.dragPoint) return;
    
    const startX = this.dragPoint.getAttribute('cx');
    const startY = this.dragPoint.getAttribute('cy');
    
    // Create initial path (starts as a dot at the drag point)
    const initialPath = `M ${startX} ${startY} L ${startX} ${startY}`;
    
    // Create the drag line as a path element
    this.dragLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    this.dragLine.setAttribute('d', initialPath);
    this.dragLine.setAttribute('x1', startX); // Store start point for reference
    this.dragLine.setAttribute('y1', startY);
    this.dragLine.setAttribute('stroke', '#0056b3');
    this.dragLine.setAttribute('stroke-width', '2');
    this.dragLine.setAttribute('stroke-dasharray', '5,5');
    this.dragLine.setAttribute('fill', 'none');
    this.dragLine.setAttribute('class', 'navigation-drag-line');
    this.dragLine.style.pointerEvents = 'none';
    
    svg.appendChild(this.dragLine);
  }
  
  /**
   * Update the drag line position with curved path following mouse
   */
  updateDragLine(event) {
    if (!this.dragLine) return;
    
    const svg = this.container.querySelector('svg');
    if (!svg) return;
    
    // Convert screen coordinates to SVG coordinates with viewBox transformation (same as DragDropManager)
    const rect = svg.getBoundingClientRect();
    
    // Get SVG viewBox to handle coordinate transformations
    const viewBox = svg.getAttribute('viewBox');
    let scaleX = 1, scaleY = 1, offsetX = 0, offsetY = 0;
    
    if (viewBox) {
      const [vbX, vbY, vbWidth, vbHeight] = viewBox.split(' ').map(Number);
      scaleX = vbWidth / rect.width;
      scaleY = vbHeight / rect.height;
      offsetX = vbX;
      offsetY = vbY;
    }
    
    // Convert screen coordinates to SVG coordinates with viewBox transformation
    const mouseX = (event.clientX - rect.left) * scaleX + offsetX;
    const mouseY = (event.clientY - rect.top) * scaleY + offsetY;
    
    // Get start point from the actual drag point position (already in SVG coordinates)
    const startX = parseFloat(this.dragPoint.getAttribute('cx'));
    const startY = parseFloat(this.dragPoint.getAttribute('cy'));
    
    // Create curved path in SVG coordinate space
    const path = this.createCurvedPath({x: startX, y: startY}, {x: mouseX, y: mouseY});
    
    // Update the path
    this.dragLine.setAttribute('d', path);
  }
  
  /**
   * Highlight a target node during drag
   */
  highlightTargetNode(targetNode) {
    // Remove previous highlight
    const previousHighlight = this.container.querySelector('.navigation-target-highlight');
    if (previousHighlight) {
      previousHighlight.parentNode.removeChild(previousHighlight);
    }
    
    if (!targetNode || targetNode.id === this.dragSourceNode) return;
    
    const svg = this.container.querySelector('svg');
    if (!svg) return;
    
    // Create highlight rectangle
    const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    highlight.setAttribute('x', targetNode.x - 4);
    highlight.setAttribute('y', targetNode.y - 4);
    highlight.setAttribute('width', targetNode.width + 8);
    highlight.setAttribute('height', targetNode.height + 8);
    highlight.setAttribute('fill', 'none');
    highlight.setAttribute('stroke', '#28a745');
    highlight.setAttribute('stroke-width', '3');
    highlight.setAttribute('stroke-dasharray', '8,4');
    highlight.setAttribute('class', 'navigation-target-highlight');
    highlight.style.pointerEvents = 'none';
    
    // Insert before drag points to keep them on top
    const firstDragPoint = svg.querySelector('.navigation-drag-point');
    if (firstDragPoint) {
      svg.insertBefore(highlight, firstDragPoint);
    } else {
      svg.appendChild(highlight);
    }
  }
  
  /**
   * Clean up drag visualization
   */
  cleanupDrag() {
    // Remove drag line
    if (this.dragLine && this.dragLine.parentNode) {
      console.log('NavigationOverrideManager: Removing drag line');
      this.dragLine.parentNode.removeChild(this.dragLine);
      this.dragLine = null;
    }
    
    // Also remove any stray drag lines that might exist
    const svg = this.container.querySelector('svg');
    if (svg) {
      const strayDragLines = svg.querySelectorAll('.navigation-drag-line');
      if (strayDragLines.length > 0) {
        console.log(`NavigationOverrideManager: Removing ${strayDragLines.length} stray drag lines`);
        strayDragLines.forEach(line => {
          if (line.parentNode) {
            line.parentNode.removeChild(line);
          }
        });
      }
    }
    
    // Remove target highlight
    const highlight = this.container.querySelector('.navigation-target-highlight');
    if (highlight) {
      highlight.parentNode.removeChild(highlight);
    }
  }

  /**
   * Find the node under the mouse cursor
   */
  findNodeUnderMouse(event) {
    const svg = this.container.querySelector('svg');
    if (!svg) return null;
    
    // Convert screen coordinates to SVG coordinates with viewBox transformation (same as DragDropManager)
    const rect = svg.getBoundingClientRect();
    
    // Get SVG viewBox to handle coordinate transformations
    const viewBox = svg.getAttribute('viewBox');
    let scaleX = 1, scaleY = 1, offsetX = 0, offsetY = 0;
    
    if (viewBox) {
      const [vbX, vbY, vbWidth, vbHeight] = viewBox.split(' ').map(Number);
      scaleX = vbWidth / rect.width;
      scaleY = vbHeight / rect.height;
      offsetX = vbX;
      offsetY = vbY;
    }
    
    // Convert screen coordinates to SVG coordinates with viewBox transformation
    const mouseX = (event.clientX - rect.left) * scaleX + offsetX;
    const mouseY = (event.clientY - rect.top) * scaleY + offsetY;
    
    const allNodes = this.getAllNodes();
    
    for (const node of allNodes) {
      if (mouseX >= node.x && mouseX <= node.x + node.width &&
          mouseY >= node.y && mouseY <= node.y + node.height) {
        return node;
      }
    }
    
    return null;
  }

  /**
   * Set a navigation override for a specific node and direction
   */
  setNavigationOverride(sourceNodeId, direction, targetNode) {
    if (!this.navigationOverrides.has(sourceNodeId)) {
      this.navigationOverrides.set(sourceNodeId, {
        up: null,
        down: null,
        left: null,
        right: null
      });
    }
    
    const overrides = this.navigationOverrides.get(sourceNodeId);
    
    // Normalize direction to simple form (north -> up, south -> down, etc.)
    const directionMap = {
      'north': 'up',
      'south': 'down',
      'east': 'right',
      'west': 'left',
      'ArrowUp': 'up',
      'ArrowDown': 'down',
      'ArrowRight': 'right',
      'ArrowLeft': 'left',
      'up': 'up',
      'down': 'down',
      'left': 'left',
      'right': 'right'
    };
    
    const normalizedDirection = directionMap[direction] || direction;
    
    // Remove old arrow if it exists
    const oldArrowKey = `${sourceNodeId}-${direction}`;  // Use original direction for arrow key
    if (this.arrows.has(oldArrowKey)) {
      const oldArrow = this.arrows.get(oldArrowKey);
      if (oldArrow && oldArrow.parentNode) {
        oldArrow.parentNode.removeChild(oldArrow);
      }
      this.arrows.delete(oldArrowKey);
    }
    
    // Update the override
    overrides[normalizedDirection] = targetNode;
    
    // Create new arrow (use original direction for consistency with drag points)
    const sourceNode = this.model.findNodeById(sourceNodeId);
    if (sourceNode && targetNode) {
      this.createArrow(sourceNode, targetNode, direction);
    }
    
    console.log(`NavigationOverrideManager: Updated ${normalizedDirection} navigation for "${sourceNode.text}" to "${targetNode.text}"`);
  }

  /**
   * Remove a navigation override for a specific node and direction
   */
  removeNavigationOverride(sourceNodeId, direction) {
    if (!this.navigationOverrides.has(sourceNodeId)) {
      return; // No overrides for this node
    }
    
    const overrides = this.navigationOverrides.get(sourceNodeId);
    
    // Normalize direction to simple form (north -> up, south -> down, etc.)
    const directionMap = {
      'north': 'up',
      'south': 'down',
      'east': 'right',
      'west': 'left',
      'ArrowUp': 'up',
      'ArrowDown': 'down',
      'ArrowRight': 'right',
      'ArrowLeft': 'left',
      'up': 'up',
      'down': 'down',
      'left': 'left',
      'right': 'right'
    };
    
    const normalizedDirection = directionMap[direction] || direction;
    
    // Remove old arrow if it exists
    const oldArrowKey = `${sourceNodeId}-${direction}`;  // Use original direction for arrow key
    if (this.arrows.has(oldArrowKey)) {
      const oldArrow = this.arrows.get(oldArrowKey);
      if (oldArrow && oldArrow.parentNode) {
        oldArrow.parentNode.removeChild(oldArrow);
      }
      this.arrows.delete(oldArrowKey);
    }
    
    // Remove the override (set to null)
    overrides[normalizedDirection] = null;
    
    const sourceNode = this.model.findNodeById(sourceNodeId);
    console.log(`NavigationOverrideManager: Removed ${normalizedDirection} navigation for "${sourceNode?.text}"`);
  }

  /**
   * Export navigation overrides as test data
   */
  exportNavigationData() {
    const exportData = {
      timestamp: new Date().toISOString(),
      mindmapTitle: this.extractMindmapTitle(),
      navigationOverrides: {}
    };
    
    for (const [nodeId, overrides] of this.navigationOverrides) {
      const node = this.model.findNodeById(nodeId);
      if (node) {
        exportData.navigationOverrides[nodeId] = {
          nodeText: node.text,
          level: node.level,
          connections: {
            up: overrides.up ? { id: overrides.up.id, text: overrides.up.text } : null,
            down: overrides.down ? { id: overrides.down.id, text: overrides.down.text } : null,
            left: overrides.left ? { id: overrides.left.id, text: overrides.left.text } : null,
            right: overrides.right ? { id: overrides.right.id, text: overrides.right.text } : null
          }
        };
      }
    }
    
    return exportData;
  }

  /**
   * Extract mindmap title from the model
   */
  extractMindmapTitle() {
    const rootNode = this.model.getRoot();
    return rootNode ? rootNode.text : 'Untitled Mindmap';
  }

  /**
   * Refresh the display when nodes change
   */
  refresh() {
    if (!this.enabled) return;
    
    console.log('NavigationOverrideManager: Refreshing display');
    this.hideDragPoints();
    this.hideArrows();
    this.initializeOverrides();
    this.showDragPoints();
    this.showArrows();
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.hideDragPoints();
    this.hideArrows();
    this.navigationOverrides.clear();
  }
}

// For backward compatibility
if (typeof window !== 'undefined') {
  window.NavigationOverrideManager = NavigationOverrideManager;
}

export default NavigationOverrideManager;