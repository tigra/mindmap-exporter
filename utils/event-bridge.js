// src/utils/event-bridge.js

/**
 * Bridge for handling node events in the mindmap
 * Acts as a global connection point between DOM events and the controller
 */
class EventBridge {
  /**
   * Create a new EventBridge
   */
  constructor() {
    this.controller = null;
  }

  /**
   * Initialize the bridge with a controller reference
   * @param {Object} controller - The controller to handle events
   */
  initialize(controller) {
    this.controller = controller;
  }

  /**
   * Handle a node event
   * @param {string} nodeId - The ID of the node that triggered the event
   * @param {string} eventType - The type of event ('toggle', 'select', etc.)
   */
  handleNodeEvent(nodeId, eventType) {
    if (!this.controller) {
      console.warn('EventBridge: No controller registered to handle events');
      return;
    }

    // Forward the event to the controller
    if (typeof this.controller.handleNodeEvent === 'function') {
      this.controller.handleNodeEvent(nodeId, eventType);
    }
  }
}

// Create a singleton instance
const eventBridge = new EventBridge();

// For backward compatibility, make it available globally
if (typeof window !== 'undefined') {
  window.mindmapEventBridge = eventBridge;
}

//export default eventBridge;