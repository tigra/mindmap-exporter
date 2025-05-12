// utils/yaml-parser.js

/**
 * Simple YAML parsing and validation utility for MindMap presets
 */
class YamlParser {
  /**
   * Parse a YAML string into a JavaScript object
   * @param {string} yamlString - The YAML string to parse
   * @returns {Object} The parsed JavaScript object
   * @throws {Error} If parsing fails
   */
  static parse(yamlString) {
    if (!yamlString || yamlString.trim() === '') {
      return {};
    }

    try {
      // Simple line-by-line YAML parser
      const lines = yamlString.split('\n');
      const [result] = this._parseLines(lines);
      
      // Log the parsed result for debugging
      console.log('Parsed YAML:', result);
      
      return result;
    } catch (error) {
      console.error('YAML parsing error:', error);
      throw new Error(`YAML parsing error: ${error.message}`);
    }
  }

  /**
   * Parse YAML lines into a nested JavaScript object
   * @param {string[]} lines - Array of YAML lines
   * @param {number} startIndex - Starting index in the lines array
   * @param {number} indentLevel - Current indentation level
   * @returns {Object} Parsed object
   * @private
   */
  static _parseLines(lines, startIndex = 0, indentLevel = 0) {
    const result = {};
    let currentKey = null;
    let currentValue = null;
    let currentIndent = null;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip empty lines and comments
      if (line.trim() === '' || line.trim().startsWith('#')) {
        continue;
      }
      
      // Calculate indentation level
      const indent = line.search(/\S/);
      
      // Initialize currentIndent on first non-empty line
      if (currentIndent === null) {
        currentIndent = indent;
      }
      
      // If this line has less indentation than our starting level, return to parent
      if (indent < indentLevel) {
        return [result, i - 1]; // Go back one line to process in parent context
      }
      
      // If this is a key-value pair (contains colon not in quotes)
      if (line.includes(':')) {
        const colonIndex = line.indexOf(':');
        const key = line.substring(indent, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        
        // If value is empty, this might be a map or list
        if (!value) {
          // Store the key for nested object
          currentKey = key;
          
          // Parse nested object starting from next line
          const [nestedValue, nextIndex] = this._parseLines(lines, i + 1, indent + 2);
          result[currentKey] = nestedValue;
          i = nextIndex; // Skip processed lines
        } else {
          // Process value (string, number, boolean)
          result[key] = this._parseValue(value);
        }
      } else {
        // List item (starts with - )
        if (line.trim().startsWith('- ')) {
          // If result[currentKey] is not an array yet, make it one
          if (!Array.isArray(result[currentKey])) {
            result[currentKey] = [];
          }
          
          // Extract the value
          const value = line.trim().substring(2);
          
          if (value) {
            // Regular list item
            result[currentKey].push(this._parseValue(value));
          } else {
            // Nested object in list - not implemented for our simple needs
            console.warn('Nested objects in lists not fully supported');
          }
        }
      }
    }
    
    return [result, lines.length - 1];
  }

  /**
   * Parse a value from a string to appropriate JavaScript type
   * @param {string} value - The string value
   * @returns {*} Parsed value (string, number, boolean, etc.)
   * @private
   */
  static _parseValue(value) {
    // Remove quotes for string literals
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      return value.substring(1, value.length - 1);
    }
    
    // Check for boolean
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    
    // Check for null
    if (value.toLowerCase() === 'null') return null;
    
    // Check for numbers
    if (!isNaN(value) && value.trim() !== '') {
      return Number(value);
    }
    
    // Default to string
    return value;
  }

  /**
   * Validate YAML for MindMap style preset format
   * @param {Object} parsedYaml - The parsed YAML object
   * @returns {Object} Validation result {valid: boolean, errors: string[]}
   */
  static validateStylePreset(parsedYaml) {
    const errors = [];
    
    // Check if levelStyles is present
    if (!parsedYaml.levelStyles) {
      errors.push("Missing 'levelStyles' section in style preset");
    } else if (typeof parsedYaml.levelStyles !== 'object') {
      errors.push("'levelStyles' must be an object");
    } else {
      // Check level styles
      for (const [level, style] of Object.entries(parsedYaml.levelStyles)) {
        if (level !== 'default' && isNaN(parseInt(level))) {
          errors.push(`Invalid level number: ${level}`);
        }
        
        if (typeof style !== 'object') {
          errors.push(`Style for level ${level} must be an object`);
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate YAML for MindMap layout preset format
   * @param {Object} parsedYaml - The parsed YAML object
   * @returns {Object} Validation result {valid: boolean, errors: string[]}
   */
  static validateLayoutPreset(parsedYaml) {
    const errors = [];
    
    // Check if levelStyles is present
    if (!parsedYaml.levelStyles) {
      errors.push("Missing 'levelStyles' section in layout preset");
    } else if (typeof parsedYaml.levelStyles !== 'object') {
      errors.push("'levelStyles' must be an object");
    } else {
      // Check level styles
      for (const [level, layout] of Object.entries(parsedYaml.levelStyles)) {
        if (level !== 'default' && isNaN(parseInt(level))) {
          errors.push(`Invalid level number: ${level}`);
        }
        
        if (typeof layout !== 'object') {
          errors.push(`Layout for level ${level} must be an object`);
        } else {
          // Check for layoutType property
          if (layout.layoutType) {
            const validLayoutTypes = ['horizontal', 'vertical', 'taproot', 'classic'];
            if (!validLayoutTypes.includes(layout.layoutType)) {
              errors.push(`Invalid layoutType for level ${level}: ${layout.layoutType}. Valid values are: ${validLayoutTypes.join(', ')}`);
            }
          }
          
          // Check for direction property
          if (layout.direction) {
            const validDirections = ['up', 'down', 'left', 'right'];
            if (!validDirections.includes(layout.direction)) {
              errors.push(`Invalid direction for level ${level}: ${layout.direction}. Valid values are: ${validDirections.join(', ')}`);
            }
          }
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Convert a JavaScript object to YAML format
   * @param {Object} obj - The JavaScript object to convert
   * @param {number} indent - Initial indentation level
   * @returns {string} YAML string representation
   */
  static stringify(obj, indent = 0) {
    if (!obj || typeof obj !== 'object') {
      return '';
    }
    
    let result = '';
    const indentStr = ' '.repeat(indent);
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Object value
        result += `${indentStr}${key}:\n${this.stringify(value, indent + 2)}`;
      } else if (Array.isArray(value)) {
        // Array value
        result += `${indentStr}${key}:\n`;
        for (const item of value) {
          result += `${indentStr}  - ${item}\n`;
        }
      } else {
        // Scalar value
        const formattedValue = this._formatValue(value);
        result += `${indentStr}${key}: ${formattedValue}\n`;
      }
    }
    
    return result;
  }
  
  /**
   * Format a value for YAML output
   * @param {*} value - The value to format
   * @returns {string} Formatted value
   * @private
   */
  static _formatValue(value) {
    if (value === null) return 'null';
    if (value === undefined) return '';
    
    // Handle strings that need quotes
    if (typeof value === 'string') {
      if (value.includes(':') || value.includes('#') || value.match(/^\s+|\s+$/) || 
          ['true', 'false', 'null', 'yes', 'no', 'on', 'off'].includes(value.toLowerCase()) ||
          !isNaN(value)) {
        return `"${value.replace(/"/g, '\\"')}"`;
      }
      return value;
    }
    
    return String(value);
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.YamlParser = YamlParser;
}

export default YamlParser;