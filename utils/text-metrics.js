// src/utils/text-metrics.js

/**
 * Service for measuring text dimensions
 */
class TextMetricsService {
  /**
   * Create a new TextMetricsService
   */
  constructor() {
    this.tempElement = null;
  }

  /**
   * Measure the dimensions of text with given style
   * @param {string} text - The text to measure
   * @param {string} fontFamily - Font family
   * @param {number} fontSize - Font size in pixels
   * @param {string} fontWeight - Font weight
   * @return {Object} The width and height of the text
   */
  measureText(text, fontFamily, fontSize, fontWeight) {
    // Create temporary element for measurement
    const temp = document.createElement('div');
    temp.style.position = 'absolute';
    temp.style.visibility = 'hidden';
    temp.style.fontFamily = fontFamily;
    temp.style.fontSize = fontSize + 'px';
    temp.style.fontWeight = fontWeight;
    temp.style.whiteSpace = 'nowrap';
    temp.textContent = text;

    document.body.appendChild(temp);
    const width = temp.offsetWidth;
    const height = temp.offsetHeight;
    document.body.removeChild(temp);

    return {
      width: Math.max(width, 0),
      height: Math.max(height, 0)
    };
  }

  /**
   * Wrap text to fit within a maximum width
   * @param {string} text - The text to wrap
   * @param {number} maxWidth - Maximum width in pixels
   * @param {string} fontFamily - Font family
   * @param {number} fontSize - Font size in pixels
   * @param {string} fontWeight - Font weight
   * @param {string} wrapType - Type of wrapping ('none', 'word')
   * @param {number} maxWordLength - Maximum length of a word before splitting (for word wrap)
   * @return {Object} Object containing wrapped lines and dimensions
   */
  wrapText(text, maxWidth, fontFamily, fontSize, fontWeight, wrapType = 'word', maxWordLength = 15) {
    // If no wrapping, just return the text
    if (wrapType === 'none' || !maxWidth) {
      const metrics = this.measureText(text, fontFamily, fontSize, fontWeight);
      return {
        lines: [text],
        width: metrics.width,
        height: metrics.height,
        lineHeight: metrics.height
      };
    }

    // Create temporary element for measurement
    const temp = document.createElement('div');
    temp.style.position = 'absolute';
    temp.style.visibility = 'hidden';
    temp.style.fontFamily = fontFamily;
    temp.style.fontSize = fontSize + 'px';
    temp.style.fontWeight = fontWeight;
    // No wrapping for measurement
    temp.style.whiteSpace = 'nowrap';
    document.body.appendChild(temp);

    // Measure a space character to determine word spacing
    temp.textContent = ' ';
    const spaceWidth = temp.offsetWidth;
    
    // Measure the line height using a character with descenders
    temp.textContent = 'gjpqy';
    const lineHeight = temp.offsetHeight;

    const lines = [];
    let currentLine = '';
    let currentLineWidth = 0;
    let maxLineWidth = 0;

    // Split text into words
    const words = text.split(' ');

    // Handle word wrapping
    for (let i = 0; i < words.length; i++) {
      let word = words[i];
      
      // Handle very long words that need splitting
      if (wrapType === 'word' && word.length > maxWordLength) {
        // If current line is not empty, add it to lines
        if (currentLine) {
          lines.push(currentLine);
          maxLineWidth = Math.max(maxLineWidth, currentLineWidth);
          currentLine = '';
          currentLineWidth = 0;
        }
        
        // Split long word into chunks according to maxWordLength
        let remainingWord = word;
        while (remainingWord.length > 0) {
          // Determine segment length - consider available width
          let segmentLength = Math.min(remainingWord.length, maxWordLength);
          let segment = remainingWord.substring(0, segmentLength);
          
          // Measure this segment
          temp.textContent = segment;
          const segmentWidth = temp.offsetWidth;
          
          // If it fits on current line, add it
          if (currentLineWidth + segmentWidth <= maxWidth || currentLine === '') {
            currentLine += segment;
            currentLineWidth += segmentWidth;
            remainingWord = remainingWord.substring(segmentLength);
          } else {
            // Start a new line
            lines.push(currentLine);
            maxLineWidth = Math.max(maxLineWidth, currentLineWidth);
            currentLine = segment;
            currentLineWidth = segmentWidth;
            remainingWord = remainingWord.substring(segmentLength);
          }
          
          // If there's more word remaining, finish current line
          if (remainingWord.length > 0 && currentLine) {
            lines.push(currentLine);
            maxLineWidth = Math.max(maxLineWidth, currentLineWidth);
            currentLine = '';
            currentLineWidth = 0;
          }
        }
      } else {
        // Normal word handling
        temp.textContent = word;
        const wordWidth = temp.offsetWidth;
        
        // Check if adding this word would exceed maxWidth
        const widthWithWord = currentLineWidth + (currentLine ? spaceWidth : 0) + wordWidth;
        
        if (widthWithWord > maxWidth && currentLine !== '') {
          // Add current line to lines array and start a new line
          lines.push(currentLine);
          currentLine = word;
          currentLineWidth = wordWidth;
        } else {
          // Add word to current line with a space if needed
          if (currentLine) {
            currentLine += ' ' + word;
            currentLineWidth = widthWithWord;
          } else {
            currentLine = word;
            currentLineWidth = wordWidth;
          }
        }
      }
    }
    
    // Add the last line if not empty
    if (currentLine) {
      lines.push(currentLine);
      maxLineWidth = Math.max(maxLineWidth, currentLineWidth);
    }
    
    document.body.removeChild(temp);
    
    return {
      lines: lines,
      width: maxLineWidth,
      height: lines.length * lineHeight,
      lineHeight: lineHeight
    };
  }
}

// Create a singleton instance
const textMetrics = new TextMetricsService();

// For backward compatibility
if (typeof window !== 'undefined') {
  window.textMetrics = textMetrics;
}

export default textMetrics;