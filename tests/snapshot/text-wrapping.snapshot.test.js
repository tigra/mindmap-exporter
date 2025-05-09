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
    const controller = createMindmapController(container);
    
    // Override the style to force 'none' wrapping
    const styleManager = controller.styleManager;
    
    // Apply wrapping configuration to all levels
    for (let i = 1; i <= 8; i++) {
      const levelStyle = styleManager.getLevelStyle(i);
      levelStyle.textWrap = 'none';
    }
    
    // Parse the markdown and render
    controller.parseMarkdown(longTextMarkdown);
    controller.render();
    
    // Get the generated SVG
    const svg = container.innerHTML;
    expect(svg).toMatchSnapshot();
  });

  test('Custom maxWidth should control wrapping width', () => {
    // Create a custom style with different maxWidth
    const container = createTestContainer();
    const controller = createMindmapController(container);
    
    // Override the style to have narrow width
    const styleManager = controller.styleManager;
    
    // Apply narrow wrapping width to all levels
    for (let i = 1; i <= 8; i++) {
      const levelStyle = styleManager.getLevelStyle(i);
      levelStyle.textWrap = 'word';
      levelStyle.maxWidth = 100; // Narrow width to force more wrapping
    }
    
    // Parse the markdown and render
    controller.parseMarkdown(longTextMarkdown);
    controller.render();
    
    // Get the generated SVG
    const svg = container.innerHTML;
    expect(svg).toMatchSnapshot();
  });

  test('Custom maxWordLength should control word splitting', () => {
    // Create a custom style with different maxWordLength
    const container = createTestContainer();
    const controller = createMindmapController(container);
    
    // Override the style to force more aggressive word splitting
    const styleManager = controller.styleManager;
    
    // Apply short maxWordLength to all levels
    for (let i = 1; i <= 8; i++) {
      const levelStyle = styleManager.getLevelStyle(i);
      levelStyle.textWrap = 'word';
      levelStyle.maxWordLength = 5; // Very short to force aggressive splitting
    }
    
    // Parse the markdown and render
    controller.parseMarkdown(longTextMarkdown);
    controller.render();
    
    // Get the generated SVG
    const svg = container.innerHTML;
    expect(svg).toMatchSnapshot();
  });
});