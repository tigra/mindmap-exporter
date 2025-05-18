/**
 * Tests for the markdown parser in MindmapModel
 */

// Set up the global window object for browser compatibility
//if (typeof global !== 'undefined' && typeof window === 'undefined') {
//  global.window = {};
//}

import MindmapModel from './mindmap-model.js';

describe('Markdown Parsing', () => {
  let model;

  beforeEach(() => {
    model = new MindmapModel();
  });

  afterEach(() => {
    model = null;
  });

  test('parses basic headings correctly', async () => {
    const markdown = `# Root
## Level 2
### Level 3`;
    
    const root = await model.parseFromMarkdown(markdown);
    
    expect(root.text).toBe('Root');
    expect(root.level).toBe(1);
    expect(root.children.length).toBe(1);
    
    const level2 = root.children[0];
    expect(level2.text).toBe('Level 2');
    expect(level2.level).toBe(2);
    expect(level2.children.length).toBe(1);
    
    const level3 = level2.children[0];
    expect(level3.text).toBe('Level 3');
    expect(level3.level).toBe(3);
  });

  test('parses bullet points with consistent levels', async () => {
    const markdown = `# Root
- Level 2 (bullet)
  - Level 3 (2 spaces)
    - Level 4 (4 spaces)
      - Level 5 (6 spaces)`;
    
    const root = await model.parseFromMarkdown(markdown);
    
    expect(root.text).toBe('Root');
    expect(root.level).toBe(1);
    expect(root.children.length).toBe(1);
    
    const level2 = root.children[0];
    expect(level2.text).toBe('Level 2 (bullet)');
    expect(level2.level).toBe(2);
    expect(level2.children.length).toBe(1);
    
    const level3 = level2.children[0];
    expect(level3.text).toBe('Level 3 (2 spaces)');
    expect(level3.level).toBe(3);
    
    const level4 = level3.children[0];
    expect(level4.text).toBe('Level 4 (4 spaces)');
    expect(level4.level).toBe(4);
    
    const level5 = level4.children[0];
    expect(level5.text).toBe('Level 5 (6 spaces)');
    expect(level5.level).toBe(5);
  });
  
  test('handles mixed heading and bullet point levels', async () => {
    const markdown = `# Project
## Planning
- Tasks
  - Subtask
### Design
- Components`;
    
    const root = await model.parseFromMarkdown(markdown);
    
    expect(root.text).toBe('Project');
    
    // In the current hierarchy, Design (level 3) is a child of Planning (level 2)
    expect(root.children.length).toBe(1);
    
    const planning = root.children[0];
    expect(planning.text).toBe('Planning');
    expect(planning.level).toBe(2);
    expect(planning.children.length).toBe(2); // Has Tasks and Design as children
    
    const tasks = planning.children[0];
    expect(tasks.text).toBe('Tasks');
    expect(tasks.level).toBe(3);
    expect(tasks.children.length).toBe(1);
    
    const subtask = tasks.children[0];
    expect(subtask.text).toBe('Subtask');
    expect(subtask.level).toBe(4);
    
    const design = planning.children[1];
    expect(design.text).toBe('Design');
    expect(design.level).toBe(3);
    expect(design.children.length).toBe(1);
    
    const components = design.children[0];
    expect(components.text).toBe('Components');
    expect(components.level).toBe(4);
  });
  
  test('correctly handles the problematic 4-space indentation pattern', async () => {
    const markdown = `# Project Planning
## Research
- competitive landscape
    - existing mindmap apps on the market
        - proprietary`;
    
    const root = await model.parseFromMarkdown(markdown);
    
    expect(root.text).toBe('Project Planning');
    expect(root.level).toBe(1);
    
    const research = root.children[0];
    expect(research.text).toBe('Research');
    expect(research.level).toBe(2);
    
    const landscape = research.children[0];
    expect(landscape.text).toBe('competitive landscape');
    expect(landscape.level).toBe(3);
    
    const existing = landscape.children[0];
    expect(existing.text).toBe('existing mindmap apps on the market');
    expect(existing.level).toBe(4);
    
    const proprietary = existing.children[0];
    expect(proprietary.text).toBe('proprietary');
    expect(proprietary.level).toBe(5);
  });
  
  test('handles inconsistent indentation gracefully', async () => {
    const markdown = `# Root
- Level 2
   - Oddly indented (3 spaces)
     - Another odd indent (5 spaces)
  - Back to 2 spaces`;
    
    const root = await model.parseFromMarkdown(markdown);
    
    // Verify the structure maintains proper parent-child relationships
    expect(root.text).toBe('Root');
    expect(root.children.length).toBe(1);
    
    const level2 = root.children[0];
    expect(level2.text).toBe('Level 2');
    expect(level2.level).toBe(2);
    expect(level2.children.length).toBe(2); // Should have 2 children
    
    // The oddly indented bullet should still be level 3
    const level3a = level2.children[0];
    expect(level3a.text).toBe('Oddly indented (3 spaces)');
    expect(level3a.level).toBe(3);
    
    // The other level 3 item
    const level3b = level2.children[1];
    expect(level3b.text).toBe('Back to 2 spaces');
    expect(level3b.level).toBe(3);
    
    // Check the fourth level
    const level4 = level3a.children[0];
    expect(level4.text).toBe('Another odd indent (5 spaces)');
    expect(level4.level).toBe(4);
  });
  
  test('handles complex nested indentation with deep levels', async () => {
    const markdown = `# Project Planning
## Research
- competitive landscape
    - subbullet 2
        - subsub, again
            - 2222222222222 2222222222
               - 333333
                 - 3`;
    
    const root = await model.parseFromMarkdown(markdown);
    
    // Helper function to print the complete tree hierarchy for debugging
    const printTree = (node, indent = '') => {
      console.log(`${indent}${node.text} (Level ${node.level})`);
      node.children.forEach(child => printTree(child, indent + '  '));
    };
    
    // Uncomment if you need to see the parsed tree structure
    // printTree(root);
    
    // Root level checks
    expect(root.text).toBe('Project Planning');
    expect(root.level).toBe(1);
    expect(root.children.length).toBe(1);
    
    // Level 2 (Research)
    const research = root.children[0];
    expect(research.text).toBe('Research');
    expect(research.level).toBe(2);
    expect(research.children.length).toBe(1);
    
    // Level 3 (competitive landscape)
    const landscape = research.children[0];
    expect(landscape.text).toBe('competitive landscape');
    expect(landscape.level).toBe(3);
    expect(landscape.children.length).toBe(1);
    
    // Level 4 (subbullet 2)
    const subbullet = landscape.children[0];
    expect(subbullet.text).toBe('subbullet 2');
    expect(subbullet.level).toBe(4);
    expect(subbullet.children.length).toBe(1);
    
    // Level 5 (subsub, again)
    const subsub = subbullet.children[0];
    expect(subsub.text).toBe('subsub, again');
    expect(subsub.level).toBe(5);
    expect(subsub.children.length).toBe(1);
    
    // Level 6 (2222222222222 2222222222)
    const level6 = subsub.children[0];
    expect(level6.text).toBe('2222222222222 2222222222');
    expect(level6.level).toBe(6);
    expect(level6.children.length).toBe(1);
    
    // Level 7 (333333) - with oddly indented (3 spaces)
    const level7 = level6.children[0];
    expect(level7.text).toBe('333333');
    expect(level7.level).toBe(7);
    expect(level7.children.length).toBe(1);
    
    // Level 8 (3) - with two additional spaces of indentation
    const level8 = level7.children[0];
    expect(level8.text).toBe('3');
    expect(level8.level).toBe(8);
  });
  
  test('handles returning to root level bullets after deep nesting', async () => {
    const markdown = `# Root
## Section 1
- Level 3 Bullet
  - Level 4 Bullet
    - Level 5 Bullet
      - Level 6 Bullet
- Back to Level 3
## Section 2
- Another Level 3 bullet
  - Level 4 under Section 2`;
    
    const root = await model.parseFromMarkdown(markdown);
    
    // Helper function to print the complete tree hierarchy for debugging
    const printTree = (node, indent = '') => {
      console.log(`${indent}${node.text} (Level ${node.level})`);
      node.children.forEach(child => printTree(child, indent + '  '));
    };
    
    // Uncomment to see the tree structure
    // printTree(root);
    
    // Root level checks
    expect(root.text).toBe('Root');
    expect(root.level).toBe(1);
    expect(root.children.length).toBe(2); // Should have both sections
    
    // Section 1
    const section1 = root.children[0];
    expect(section1.text).toBe('Section 1');
    expect(section1.level).toBe(2);
    expect(section1.children.length).toBe(2); // Should have 2 level 3 bullets
    
    // First level 3 bullet under Section 1
    const firstL3 = section1.children[0];
    expect(firstL3.text).toBe('Level 3 Bullet');
    expect(firstL3.level).toBe(3);
    expect(firstL3.children.length).toBe(1);
    
    // Level 4 bullet
    const l4 = firstL3.children[0];
    expect(l4.text).toBe('Level 4 Bullet');
    expect(l4.level).toBe(4);
    
    // Level 5 bullet
    const l5 = l4.children[0];
    expect(l5.text).toBe('Level 5 Bullet');
    expect(l5.level).toBe(5);
    
    // Level 6 bullet
    const l6 = l5.children[0];
    expect(l6.text).toBe('Level 6 Bullet');
    expect(l6.level).toBe(6);
    
    // Second level 3 bullet (back to root level bullet after nesting)
    const secondL3 = section1.children[1];
    expect(secondL3.text).toBe('Back to Level 3');
    expect(secondL3.level).toBe(3);
    
    // Section 2
    const section2 = root.children[1];
    expect(section2.text).toBe('Section 2');
    expect(section2.level).toBe(2);
    expect(section2.children.length).toBe(1);
    
    // Level 3 bullet under Section 2
    const section2L3 = section2.children[0];
    expect(section2L3.text).toBe('Another Level 3 bullet');
    expect(section2L3.level).toBe(3);
    
    // Level 4 bullet under Section 2
    const section2L4 = section2L3.children[0];
    expect(section2L4.text).toBe('Level 4 under Section 2');
    expect(section2L4.level).toBe(4);
  });
  
  test('treats paragraphs as parents for lists', async () => {
    const markdown = `### Classic MindMap Layout

The Classic MindMap Layout places the parent node in the center with children distributed evenly on both sides. Children are vertically centered relative to the parent.

Best suited for:
- Traditional mind mapping
- Balanced content organization
- Presentations where the main topic has equal importance on subtopics`;

    const root = await model.parseFromMarkdown(markdown);
    
    // Helper function to print the complete tree hierarchy for debugging
    const printTree = (node, indent = '') => {
      console.log(`${indent}${node.text} (Level ${node.level})`);
      node.children.forEach(child => printTree(child, indent + '  '));
    };
    
    // Uncomment to see the tree structure
    // printTree(root);
    
    // Verify the structure maintains proper parent-child relationships
    expect(root.text).toBe('Classic MindMap Layout');
    expect(root.level).toBe(3);
    expect(root.children.length).toBe(2); // Should have 2 paragraph children
    
    // The first paragraph
    const descriptionParagraph = root.children[0];
    expect(descriptionParagraph.text).toBe('The Classic MindMap Layout places the parent node in the center with children distributed evenly on both sides. Children are vertically centered relative to the parent.');
    expect(descriptionParagraph.level).toBe(4);
    expect(descriptionParagraph.children.length).toBe(0);
    
    // The "Best suited for:" paragraph
    const bestSuitedParagraph = root.children[1];
    expect(bestSuitedParagraph.text).toBe('Best suited for:');
    expect(bestSuitedParagraph.level).toBe(4);
    expect(bestSuitedParagraph.children.length).toBe(3); // Should have 3 list item children
    
    // Check list items under "Best suited for:"
    const listItem1 = bestSuitedParagraph.children[0];
    expect(listItem1.text).toBe('Traditional mind mapping');
    expect(listItem1.level).toBe(5);
    
    const listItem2 = bestSuitedParagraph.children[1];
    expect(listItem2.text).toBe('Balanced content organization');
    expect(listItem2.level).toBe(5);
    
    const listItem3 = bestSuitedParagraph.children[2];
    expect(listItem3.text).toBe('Presentations where the main topic has equal importance on subtopics');
    expect(listItem3.level).toBe(5);
  });
  
  // Old test removed: test('falls back to traditional parser if marked fails'...) 
  
  test('handles multiple paragraph-list patterns with nested items', async () => {
    const markdown = `## Features Overview

Our mindmap tool supports various features:
- Basic Features
  - Node creation and editing
  - Connection styling
- Advanced Features
  - Markdown rendering in nodes
  - Export capabilities
  
Implementation status:
- Completed:
  - Core rendering engine
  - Layout algorithms
- In Progress:
  - Enhanced styling options
  - Mobile responsiveness`;

    const root = await model.parseFromMarkdown(markdown);
    
    // Verify top-level structure
    expect(root.text).toBe('Features Overview');
    expect(root.level).toBe(2);
    expect(root.children.length).toBe(2); // Should have 2 paragraph children
    
    // First paragraph with list
    const featuresParag = root.children[0];
    expect(featuresParag.text).toBe('Our mindmap tool supports various features:');
    expect(featuresParag.level).toBe(3);
    expect(featuresParag.children.length).toBe(2); // Should have 2 main list items
    
    // Check "Basic Features" and its children
    const basicFeatures = featuresParag.children[0];
    expect(basicFeatures.text).toBe('Basic Features');
    expect(basicFeatures.level).toBe(4);
    expect(basicFeatures.children.length).toBe(2);
    
    expect(basicFeatures.children[0].text).toBe('Node creation and editing');
    expect(basicFeatures.children[1].text).toBe('Connection styling');
    
    // Check "Advanced Features" and its children
    const advancedFeatures = featuresParag.children[1];
    expect(advancedFeatures.text).toBe('Advanced Features');
    expect(advancedFeatures.level).toBe(4);
    expect(advancedFeatures.children.length).toBe(2);
    
    expect(advancedFeatures.children[0].text).toBe('Markdown rendering in nodes');
    expect(advancedFeatures.children[1].text).toBe('Export capabilities');
    
    // Second paragraph with list
    const statusParag = root.children[1];
    expect(statusParag.text).toBe('Implementation status:');
    expect(statusParag.level).toBe(3);
    expect(statusParag.children.length).toBe(2); // Should have 2 main list items
    
    // Check "Completed" and its children
    const completed = statusParag.children[0];
    expect(completed.text).toBe('Completed:');
    expect(completed.level).toBe(4);
    expect(completed.children.length).toBe(2);
    
    expect(completed.children[0].text).toBe('Core rendering engine');
    expect(completed.children[1].text).toBe('Layout algorithms');
    
    // Check "In Progress" and its children
    const inProgress = statusParag.children[1];
    expect(inProgress.text).toBe('In Progress:');
    expect(inProgress.level).toBe(4);
    expect(inProgress.children.length).toBe(2);
    
    expect(inProgress.children[0].text).toBe('Enhanced styling options');
    expect(inProgress.children[1].text).toBe('Mobile responsiveness');
  });
});