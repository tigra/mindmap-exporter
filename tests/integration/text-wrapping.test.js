/**
 * Tests for text wrapping functionality
 */

import { createTestContainer } from '../utils/test-utils.js';
import StyleManager from '../../style/style-manager.js';
import StyleConfiguration from '../../style/style-configuration.js';
import textMetrics from '../../utils/text-metrics.js';
import MindmapModel from '../../model/mindmap-model.js';
import Node from '../../model/node.js';
import MindmapController from '../../controller/mindmap-controller.js';

// The mock text metrics wrapText function is used in these tests

describe('Text Wrapping', () => {
  // Test the configured wrapping settings
  test('Default wrapping configuration should be provided', () => {
    const style = new StyleConfiguration();
    const config = style.getTextWrapConfig();
    
    expect(config).toHaveProperty('textWrap');
    expect(config).toHaveProperty('maxWidth');
    expect(config).toHaveProperty('maxWordLength');
  });
  
  // Test line breaking logic
  test('wrapText should correctly break long text', () => {
    // Create a long text string that should wrap
    const longText = 'This is a very long text that should be wrapped into multiple lines based on the maximum width setting';
    
    // Mock textMetrics.wrapText is already defined in setup.js
    const result = textMetrics.wrapText(
      longText,
      200, // maxWidth
      'Arial', 
      14, // fontSize
      'normal',
      'word',
      15 // maxWordLength
    );
    
    // Should be wrapped into multiple lines
    expect(result.lines.length).toBeGreaterThan(1);
    
    // Width should not exceed maxWidth
    expect(result.width).toBeLessThanOrEqual(200);
    
    // Height should account for multiple lines
    expect(result.height).toBeGreaterThan(result.lineHeight);
  });
  
  // Test very long word handling
  test('wrapText should handle very long words', () => {
    const textWithLongWord = 'Text with supercalifragilisticexpialidocious word that needs splitting';
    
    const result = textMetrics.wrapText(
      textWithLongWord,
      200,
      'Arial',
      14,
      'normal',
      'word',
      10 // Short maxWordLength to force splitting
    );
    
    // The long word should cause additional line breaks
    expect(result.lines.length).toBeGreaterThan(2);
  });
  
  // Test with wrapping disabled
  test('With textWrap="none", text should not be wrapped', () => {
    const longText = 'This is a very long text that should not be wrapped even with very narrow width';
    
    const result = textMetrics.wrapText(
      longText,
      100, // Small maxWidth
      'Arial',
      14,
      'normal',
      'none', // No wrapping
      15
    );
    
    // Should be just one line
    expect(result.lines.length).toBe(1);
    expect(result.lines[0]).toBe(longText);
  });
  
  // Test node rendering with wrapped text
  test('Node dimensions should account for wrapped text', () => {
    // Create model and manually add nodes
    const model = new MindmapModel();
    
    // Create a simple mindmap with a root and a long text node
    const root = new Node('Root', 1);
    const longTextNode = new Node('This is a very long text that should be wrapped into multiple lines when displayed in the mindmap visualization', 2);
    
    // Setup the tree structure
    root.addChild(longTextNode);
    model.rootNode = root;
    
    // Create a custom style manager with wrapping enabled
    const styleManager = new StyleManager();
    
    // Add level styles with wrapping enabled for level 2
    styleManager.levelStyles = {
      1: new StyleConfiguration({ 
        fontSize: 18,
        fontWeight: 'bold',
        nodeType: 'box'
      }),
      2: new StyleConfiguration({
        fontSize: 16, 
        textWrap: 'word',
        maxWidth: 150, // Narrow width to force wrapping
        nodeType: 'box'
      })
    };
    
    // Create a basic controller for layout
    const renderer = {
      render: jest.fn() // Mock renderer that doesn't actually render
    };
    const container = createTestContainer();
    const controller = new MindmapController(model, renderer, styleManager, container);
    
    // Apply layout which should use our text wrapping settings
    controller.applyLayout();
    
    // Node height should be taller for wrapped text
    // For our mock implementation, line height is 1.2 * fontSize
    const expectedLineHeight = styleManager.levelStyles[2].fontSize * 1.2;
    
    // Should be tall enough for multiple lines, plus padding
    const verticalPadding = styleManager.levelStyles[2].verticalPadding;
    expect(longTextNode.height).toBeGreaterThan(expectedLineHeight + verticalPadding);
    
    // Width should not exceed configured maxWidth plus padding
    const horizontalPadding = styleManager.levelStyles[2].horizontalPadding;
    const maxWidth = styleManager.levelStyles[2].maxWidth;
    expect(longTextNode.width).toBeLessThanOrEqual(maxWidth + (horizontalPadding * 2) + 1); // +1 for rounding
  });
});