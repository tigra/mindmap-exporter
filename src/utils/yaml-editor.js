// utils/yaml-editor.js

import YamlParser from './yaml-parser.js';

/**
 * YAML Editor component with validation and apply functionality
 */
class YamlEditor {
  /**
   * Create a new YAML editor
   * @param {string} editorId - ID of the editor element
   * @param {string} type - Type of YAML editor ('style' or 'layout')
   * @param {Function} onApply - Callback when apply button is clicked
   */
  constructor(editorId, type, onApply) {
    this.editorId = editorId;
    this.type = type;
    this.onApply = onApply;
    this.editor = null;
    this.statusEl = null;
    this.applyBtn = null;
    this.saveBtn = null;
    this.loadBtn = null;
    this.isValid = false;
  }

  /**
   * Initialize the YAML editor
   */
  init() {
    // Find editor element
    this.editor = document.getElementById(this.editorId);
    if (!this.editor) {
      console.error(`YAML editor element not found: ${this.editorId}`);
      return;
    }
    
    // Create related elements
    this.createRelatedElements();
    
    // Attach event listeners
    this.attachEventListeners();
  }
  
  /**
   * Create status, apply, save and load elements
   */
  createRelatedElements() {
    // Check if elements already exist in the same container
    const existingStatus = document.getElementById(`${this.editorId}-status`);
    const existingButtonContainer = document.getElementById(`${this.editorId}-button-container`);
    
    if (existingStatus && existingButtonContainer) {
      // Reuse existing elements
      this.statusEl = existingStatus;
      this.applyBtn = document.getElementById(`${this.editorId}-apply`);
      this.saveBtn = document.getElementById(`${this.editorId}-save`);
      this.loadBtn = document.getElementById(`${this.editorId}-load`);
      return;
    }
    
    // Create status element
    this.statusEl = document.createElement('div');
    this.statusEl.className = 'yaml-status';
    this.statusEl.id = `${this.editorId}-status`;
    
    // Create apply button
    this.applyBtn = document.createElement('button');
    this.applyBtn.className = 'yaml-apply-btn';
    this.applyBtn.id = `${this.editorId}-apply`;
    this.applyBtn.textContent = 'Apply';
    this.applyBtn.disabled = true;
    
    // Create save button
    this.saveBtn = document.createElement('button');
    this.saveBtn.className = 'yaml-save-btn';
    this.saveBtn.id = `${this.editorId}-save`;
    this.saveBtn.textContent = 'Save Preset';
    
    // Create load button
    this.loadBtn = document.createElement('button');
    this.loadBtn.className = 'yaml-load-btn';
    this.loadBtn.id = `${this.editorId}-load`;
    this.loadBtn.textContent = 'Load Preset';

    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'yaml-button-container';
    buttonContainer.id = `${this.editorId}-button-container`;
    buttonContainer.appendChild(this.applyBtn);
    buttonContainer.appendChild(this.saveBtn);
    buttonContainer.appendChild(this.loadBtn);
    
    // Add elements after the editor
    const parentElement = this.editor.parentElement;
    if (parentElement) {
      // Add to parent instead of directly after the editor
      parentElement.appendChild(this.statusEl);
      parentElement.appendChild(buttonContainer);
    }
  }
  
  /**
   * Attach event listeners to editor and buttons
   */
  attachEventListeners() {
    // Editor input event for validation
    this.editor.addEventListener('input', () => {
      this.validateYaml();
    });
    
    // Apply button click
    this.applyBtn.addEventListener('click', () => {
      if (this.isValid) {
        try {
          const yaml = this.editor.value;
          const parsed = YamlParser.parse(yaml);
          
          if (this.onApply && typeof this.onApply === 'function') {
            this.onApply(parsed);
          }
          
          this.setStatus('Applied successfully', 'success');
        } catch (error) {
          this.setStatus(`Error applying: ${error.message}`, 'error');
        }
      }
    });
    
    // Save button click
    this.saveBtn.addEventListener('click', () => {
      try {
        if (!this.isValid) {
          this.setStatus('Cannot save invalid YAML', 'error');
          return;
        }
        
        const yaml = this.editor.value;
        const presetName = prompt('Enter preset name:');
        
        if (!presetName) return;
        
        // Save to localStorage
        const key = this.type === 'style' ? 'yamlStylePresets' : 'yamlLayoutPresets';
        const presets = JSON.parse(localStorage.getItem(key) || '{}');
        presets[presetName] = yaml;
        localStorage.setItem(key, JSON.stringify(presets));
        
        this.setStatus(`Saved preset: ${presetName}`, 'success');
      } catch (error) {
        this.setStatus(`Error saving: ${error.message}`, 'error');
      }
    });
    
    // Load button click
    this.loadBtn.addEventListener('click', () => {
      try {
        // Get presets from localStorage
        const key = this.type === 'style' ? 'yamlStylePresets' : 'yamlLayoutPresets';
        const presets = JSON.parse(localStorage.getItem(key) || '{}');
        
        // If no presets, show message
        if (Object.keys(presets).length === 0) {
          this.setStatus('No saved presets found', 'info');
          return;
        }
        
        // Create options list
        const presetOptions = Object.keys(presets).map(name => `<option value="${name}">${name}</option>`).join('');
        
        // Show selection dialog
        const presetName = prompt('Select preset to load:\n\n' + Object.keys(presets).join('\n'));
        
        if (!presetName || !presets[presetName]) return;
        
        // Load preset into editor
        this.editor.value = presets[presetName];
        this.validateYaml();
        
        this.setStatus(`Loaded preset: ${presetName}`, 'success');
      } catch (error) {
        this.setStatus(`Error loading: ${error.message}`, 'error');
      }
    });
  }
  
  /**
   * Validate the YAML content
   */
  validateYaml() {
    try {
      const yaml = this.editor.value;
      
      // Parse YAML
      const parsed = YamlParser.parse(yaml);
      
      // Validate according to type
      let validation;
      if (this.type === 'style') {
        validation = YamlParser.validateStylePreset(parsed);
      } else if (this.type === 'layout') {
        validation = YamlParser.validateLayoutPreset(parsed);
      } else {
        throw new Error('Unknown YAML editor type');
      }
      
      // Update status based on validation
      if (validation.valid) {
        this.isValid = true;
        this.setStatus('Valid YAML', 'success');
        this.applyBtn.disabled = false;
      } else {
        this.isValid = false;
        this.setStatus(`Invalid YAML: ${validation.errors.join('; ')}`, 'error');
        this.applyBtn.disabled = true;
      }
    } catch (error) {
      this.isValid = false;
      this.setStatus(`Parse error: ${error.message}`, 'error');
      this.applyBtn.disabled = true;
    }
  }
  
  /**
   * Set the status message
   * @param {string} message - Status message
   * @param {string} type - Status type ('success', 'error', 'info')
   */
  setStatus(message, type = 'info') {
    if (!this.statusEl) return;
    
    this.statusEl.textContent = message;
    this.statusEl.className = `yaml-status yaml-status-${type}`;
    
    // Clear status after a delay for success messages
    if (type === 'success') {
      setTimeout(() => {
        this.statusEl.textContent = '';
        this.statusEl.className = 'yaml-status';
      }, 3000);
    }
  }
  
  /**
   * Set the editor content
   * @param {string} yaml - YAML content
   */
  setValue(yaml) {
    if (this.editor) {
      this.editor.value = yaml;
      this.validateYaml();
    }
  }
  
  /**
   * Get the editor content
   * @returns {string} YAML content
   */
  getValue() {
    return this.editor ? this.editor.value : '';
  }
  
  /**
   * Generate template YAML content
   * @returns {string} Template YAML
   */
  generateTemplate() {
    if (this.type === 'style') {
      return `levelStyles:
  1:
    fontSize: 18
    fontWeight: bold
    backgroundColor: "#f5f5f5"
    textColor: "#333333"
    borderColor: "#aaaaaa"
    borderWidth: 2
    borderRadius: 5
  2:
    fontSize: 16
    backgroundColor: "#e6f7ff"
    textColor: "#0066cc"
  3:
    fontSize: 14
    backgroundColor: "#fff0f5"
    textColor: "#cc0066"
  4:
    fontSize: 12
    nodeType: "text-only"
  default:
    fontSize: 12
    fontFamily: "Arial, sans-serif"
    backgroundColor: "#ffffff"
    textColor: "#333333"
    borderColor: "#cccccc"
    borderWidth: 1
    borderRadius: 3
`;
    } else if (this.type === 'layout') {
      return `levelStyles:
  1:
    layoutType: "classic"
    parentPadding: 80
    childPadding: 30
  2:
    layoutType: "taproot"
    columnGap: 100
    parentPadding: 60
    childPadding: 20
  3:
    layoutType: "horizontal"
    direction: "right"
    parentPadding: 40
    childPadding: 15
  4:
    layoutType: "horizontal"
    parentPadding: 30
    childPadding: 10
  default:
    layoutType: "horizontal"
    direction: "right"
    parentPadding: 30
    childPadding: 10
`;
    }
    
    return '';
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.YamlEditor = YamlEditor;
}

export default YamlEditor;