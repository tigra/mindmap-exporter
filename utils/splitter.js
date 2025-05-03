// utils/splitter.js

/**
 * Adds resizable split panel functionality
 */
class SplitterService {
  /**
   * Initialize the splitter functionality
   * @param {string} splitterId - The ID of the splitter element
   * @param {string} leftPanelSelector - CSS selector for the left panel
   * @param {string} rightPanelSelector - CSS selector for the right panel
   * @param {Object} options - Additional options
   */
  init(splitterId = 'splitter', leftPanelSelector = '.sidebar', rightPanelSelector = '.preview', options = {}) {
    this.splitter = document.getElementById(splitterId);
    this.leftPanel = document.querySelector(leftPanelSelector);
    this.rightPanel = document.querySelector(rightPanelSelector);
    
    this.minLeftWidth = options.minLeftWidth || 200;
    this.minRightWidth = options.minRightWidth || 200;
    
    this.isDragging = false;
    this.startX = 0;
    this.startLeftWidth = 0;
    
    this.attachEventListeners();
  }
  
  /**
   * Attach event listeners for drag operation
   */
  attachEventListeners() {
    if (!this.splitter) return;
    
    // Mouse events
    this.splitter.addEventListener('mousedown', this.startDrag.bind(this));
    document.addEventListener('mousemove', this.drag.bind(this));
    document.addEventListener('mouseup', this.stopDrag.bind(this));
    
    // Touch events for mobile
    this.splitter.addEventListener('touchstart', this.startDragTouch.bind(this), { passive: false });
    document.addEventListener('touchmove', this.dragTouch.bind(this), { passive: false });
    document.addEventListener('touchend', this.stopDrag.bind(this));
    
    // Double-click to reset
    this.splitter.addEventListener('dblclick', this.resetPanels.bind(this));
    
    // Keep panels sized correctly on window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }
  
  /**
   * Start drag operation
   * @param {MouseEvent} e - The mouse event
   */
  startDrag(e) {
    this.isDragging = true;
    this.startX = e.clientX;
    this.startLeftWidth = this.leftPanel.offsetWidth;
    
    // Add dragging class for styling
    document.body.classList.add('resizing');
    
    // Prevent text selection during drag
    e.preventDefault();
  }
  
  /**
   * Start drag operation for touch events
   * @param {TouchEvent} e - The touch event
   */
  startDragTouch(e) {
    if (e.touches.length === 1) {
      this.isDragging = true;
      this.startX = e.touches[0].clientX;
      this.startLeftWidth = this.leftPanel.offsetWidth;
      
      // Add dragging class for styling
      document.body.classList.add('resizing');
      
      // Prevent scrolling during drag
      e.preventDefault();
    }
  }
  
  /**
   * Handle drag operation
   * @param {MouseEvent} e - The mouse event
   */
  drag(e) {
    if (!this.isDragging) return;
    
    const deltaX = e.clientX - this.startX;
    let newLeftWidth = this.startLeftWidth + deltaX;
    
    // Enforce minimum widths
    const windowWidth = window.innerWidth;
    newLeftWidth = Math.max(this.minLeftWidth, newLeftWidth);
    newLeftWidth = Math.min(windowWidth - this.minRightWidth, newLeftWidth);
    
    // Apply new width
    this.leftPanel.style.width = newLeftWidth + 'px';
    
    // Prevent text selection during drag
    e.preventDefault();
  }
  
  /**
   * Handle drag operation for touch events
   * @param {TouchEvent} e - The touch event
   */
  dragTouch(e) {
    if (!this.isDragging || e.touches.length !== 1) return;
    
    const deltaX = e.touches[0].clientX - this.startX;
    let newLeftWidth = this.startLeftWidth + deltaX;
    
    // Enforce minimum widths
    const windowWidth = window.innerWidth;
    newLeftWidth = Math.max(this.minLeftWidth, newLeftWidth);
    newLeftWidth = Math.min(windowWidth - this.minRightWidth, newLeftWidth);
    
    // Apply new width
    this.leftPanel.style.width = newLeftWidth + 'px';
    
    // Prevent scrolling during drag
    e.preventDefault();
  }
  
  /**
   * End drag operation
   */
  stopDrag() {
    this.isDragging = false;
    document.body.classList.remove('resizing');
  }
  
  /**
   * Reset panels to default width on double-click
   */
  resetPanels() {
    this.leftPanel.style.width = '380px';
  }
  
  /**
   * Ensure panels respect screen size on window resize
   */
  onWindowResize() {
    const windowWidth = window.innerWidth;
    const currentLeftWidth = this.leftPanel.offsetWidth;
    
    // Make sure panels don't exceed window bounds
    if (currentLeftWidth + this.minRightWidth > windowWidth) {
      this.leftPanel.style.width = (windowWidth - this.minRightWidth) + 'px';
    }
  }
}

// Create singleton instance
const splitterService = new SplitterService();

// For global availability
if (typeof window !== 'undefined') {
  window.splitterService = splitterService;
}

export default splitterService;