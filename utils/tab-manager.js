// utils/tab-manager.js

/**
 * Manages tab switching functionality
 */
class TabManager {
  /**
   * Initialize tab switching
   * @param {string} tabSelector - CSS selector for tab elements
   * @param {string} contentSelector - CSS selector for tab content elements
   */
  init(tabSelector = '.tab', contentSelector = '.tab-content') {
    this.tabs = document.querySelectorAll(tabSelector);
    this.contents = document.querySelectorAll(contentSelector);
    
    this.attachEventListeners();
  }
  
  /**
   * Attach event listeners to tabs
   */
  attachEventListeners() {
    if (!this.tabs.length) return;
    
    this.tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabId = tab.getAttribute('data-tab');
        this.switchTab(tabId);
      });
    });
  }
  
  /**
   * Switch to the selected tab
   * @param {string} tabId - The ID of the tab to switch to
   */
  switchTab(tabId) {
    // Remove active class from all tabs and contents
    this.tabs.forEach(tab => tab.classList.remove('active'));
    this.contents.forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab and content
    const selectedTab = document.querySelector(`.tab[data-tab="${tabId}"]`);
    const selectedContent = document.getElementById(`${tabId}-tab`);
    
    if (selectedTab) selectedTab.classList.add('active');
    if (selectedContent) selectedContent.classList.add('active');
  }
}

// Create singleton instance
const tabManager = new TabManager();

// For global availability
if (typeof window !== 'undefined') {
  window.tabManager = tabManager;
}

export default tabManager;