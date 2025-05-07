/**
 * Snapshot tests for style presets in mindmap-exporter
 */

// DOM environment is set up in tests/setup.js

// Now import the modules needed for testing
import {
  generateMindmapSnapshot,
  getAllStylePresets
} from '../utils/test-utils';

// Test markdown document with multiple levels for comprehensive style testing
const testMarkdown = `# Mindmap Style Testing
## Level 2 Heading
- Level 3 (bullet)
  - Level 4 (bullet)
    - Level 5 (bullet)
      - Level 6 (bullet)
        - Level 7 (bullet)
          - Level 8 (bullet)
## Another Branch
- This helps show branching
  - With some deep children
    - To ensure proper styling
### Level 3 Heading
- With its own bullets
  - And sub-bullets`;

describe('Style Preset Snapshots', () => {
  // Get all available presets
  const presets = getAllStylePresets();
  
  // Test each preset in collapsed mode
  describe('Default (Collapsed) State', () => {
    presets.forEach(preset => {
      test(`"${preset}" style preset renders correctly with default collapsed state`, () => {
        const svg = generateMindmapSnapshot(testMarkdown, preset, false);
        expect(svg).toMatchSnapshot();
      });
    });
  });
  
  // Test each preset with all nodes expanded
  describe('Expanded State', () => {
    presets.forEach(preset => {
      test(`"${preset}" style preset renders correctly with all nodes expanded`, () => {
        const svg = generateMindmapSnapshot(testMarkdown, preset, true);
        expect(svg).toMatchSnapshot();
      });
    });
  });
});

// Additional specific test cases
describe('Style Snapshot Specifics', () => {
  // Deep nesting test with minimal text (focused on structure)
  const deepNestingMarkdown = `# Root
## A
- B
  - C
    - D
      - E
        - F
          - G
            - H
              - I
## X
- Y
  - Z`;

  // Test each layout type with a specific preset
  const layoutConfigurations = [
    { name: 'horizontal-right', preset: 'default' },
    { name: 'horizontal-left', preset: 'corporate' },
    { name: 'vertical-down', preset: 'vibrant' },
    { name: 'vertical-up', preset: 'pastel' },
    { name: 'taproot', preset: 'tech' },
    { name: 'classic', preset: 'retro' },
    { name: 'vertical-over-taproot', preset: 'nature' }
  ];
  
  test('Deep nesting renders correctly with default style', () => {
    const svg = generateMindmapSnapshot(deepNestingMarkdown, 'default', true);
    expect(svg).toMatchSnapshot();
  });
  
  // Layout configurations aren't directly testable with our current utility
  // because it doesn't simulate UI interactions, but we include this comment
  // to document the possible layouts that would need testing in a more integrated
  // environment.
  
  test.todo('Test different layout configurations (needs UI integration)');
});