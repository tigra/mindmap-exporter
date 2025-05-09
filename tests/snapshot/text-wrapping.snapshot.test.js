/**
 * Snapshot tests for text wrapping in mindmap-exporter
 */

// DOM environment is set up in tests/setup.js

// Import the modules needed for testing
import {
  generateMindmapSnapshot,
  createTestContainer,
  createMindmapController
} from '../utils/test-utils';

import StyleManager from '../../style/style-manager';
import StyleConfiguration from '../../style/style-configuration';
import MindmapController from '../../controller/mindmap-controller';
import MindmapRenderer from '../../renderer/mindmap-renderer';
import MindmapModel from '../../model/mindmap-model';

describe('Text Wrapping Snapshots', () => {
  // Test markdown with long text for wrapping
  const longTextMarkdown = `# Text Wrapping Test
## This is a level 2 heading with a very long text that should be wrapped to multiple lines based on configured maximum width
- Level 3 bullet with a significantly long text string that will definitely need to wrap because it exceeds any reasonable node width limit
  - Level 4 contains a very very very very very very very very very very very long word supercalifragilisticexpialidocious which should be split based on maxWordLength
    - Level 5 with normal text
      - Level 6 with ThisIsAReallyLongWordWithNoSpacesThatShouldBeSplitIntoMultipleChunksWhenWrappingIsEnabled for testing purposes
## Regular heading
- Short bullet`;

  test('Default preset with word wrapping renders correctly', () => {
    const svg = generateMindmapSnapshot(longTextMarkdown, 'default', true);
    expect(svg).toMatchSnapshot();
  });

  test('Text with wrap=none should not wrap regardless of length', () => {
    // Create a custom style where wrap is set to 'none'
    const container = createTestContainer();
    
    // Create a fresh style manager with no wrapping
    const styleManager = new StyleManager();
    
    // Add getLevelStyle method since we override levelStyles directly
    styleManager.getLevelStyle = function(level) {
      return this.levelStyles[level] || this.levelStyles[1]; // Fallback to level 1
    };
    
    // Create our own level styles with explicit 'none' wrapping
    styleManager.levelStyles = {
      1: new StyleConfiguration({ 
        fontSize: 18, 
        fontWeight: 'bold', 
        textWrap: 'none',
        nodeType: 'box'
      }, styleManager),
      2: new StyleConfiguration({ 
        fontSize: 16, 
        textWrap: 'none',
        nodeType: 'box'
      }, styleManager),
      3: new StyleConfiguration({ 
        fontSize: 14, 
        textWrap: 'none',
        nodeType: 'box'
      }, styleManager)
    };
    
    // Using generateMindmapSnapshot which handles the parsing and rendering
    const svg = generateMindmapSnapshot(longTextMarkdown, 'default', true, styleManager);
    expect(svg).toMatchSnapshot();
  });

  test('Custom maxWidth should control wrapping width', () => {
    // Create a fresh style manager with custom wrapping width
    const styleManager = new StyleManager();
    
    // Add getLevelStyle method since we override levelStyles directly
    styleManager.getLevelStyle = function(level) {
      return this.levelStyles[level] || this.levelStyles[1]; // Fallback to level 1
    };
    
    // Create our own level styles with narrow maxWidth
    styleManager.levelStyles = {
      1: new StyleConfiguration({ 
        fontSize: 18, 
        fontWeight: 'bold', 
        textWrap: 'word',
        maxWidth: 100, // Narrow width to force more wrapping
        nodeType: 'box'
      }, styleManager),
      2: new StyleConfiguration({ 
        fontSize: 16, 
        textWrap: 'word',
        maxWidth: 100, // Narrow width to force more wrapping
        nodeType: 'box'
      }, styleManager),
      3: new StyleConfiguration({ 
        fontSize: 14, 
        textWrap: 'word',
        maxWidth: 100, // Narrow width to force more wrapping
        nodeType: 'box'
      }, styleManager)
    };
    
    // Using generateMindmapSnapshot which handles the parsing and rendering
    const svg = generateMindmapSnapshot(longTextMarkdown, 'default', true, styleManager);
    expect(svg).toMatchSnapshot();
  });

  test('Custom maxWordLength should control word splitting', () => {
    // Create a fresh style manager with aggressive word splitting
    const styleManager = new StyleManager();
    
    // Add getLevelStyle method since we override levelStyles directly
    styleManager.getLevelStyle = function(level) {
      return this.levelStyles[level] || this.levelStyles[1]; // Fallback to level 1
    };
    
    // Create our own level styles with short maxWordLength
    styleManager.levelStyles = {
      1: new StyleConfiguration({ 
        fontSize: 18, 
        fontWeight: 'bold', 
        textWrap: 'word',
        maxWordLength: 5, // Very short to force aggressive splitting
        nodeType: 'box'
      }, styleManager),
      2: new StyleConfiguration({ 
        fontSize: 16, 
        textWrap: 'word',
        maxWordLength: 5, // Very short to force aggressive splitting
        nodeType: 'box'
      }, styleManager),
      3: new StyleConfiguration({ 
        fontSize: 14, 
        textWrap: 'word',
        maxWordLength: 5, // Very short to force aggressive splitting
        nodeType: 'box'
      }, styleManager)
    };
    
    // Using generateMindmapSnapshot which handles the parsing and rendering
    const svg = generateMindmapSnapshot(longTextMarkdown, 'default', true, styleManager);
    expect(svg).toMatchSnapshot();
  });
});