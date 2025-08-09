// Test script for markdown conversion
// This can be run in browser console to test the backward conversion

function testMarkdownConversion() {
  console.log('Testing backward markdown conversion...');
  
  // Test markdown input
  const testMarkdown = `# Project Planning
## Research
- competitive landscape
  - existing mindmap apps
    - open source
      - Xmind
        - pros
          - open source
          - feature rich
        - cons
          - file format issues
    - proprietary
- market analysis
## Design
### UI/UX Design
### System Architecture
#### Class Diagram
- browser based
- client-side only
## Development
### Frontend
- markdown parsing
- layout algorithms
- styling
### Testing
- unit tests
- integration tests`;

  // Test the conversion
  if (typeof window !== 'undefined' && window.mindmapModel) {
    window.mindmapModel.parseFromMarkdown(testMarkdown).then(rootNode => {
      if (rootNode) {
        console.log('✅ Parsed markdown successfully');
        console.log('Root node:', rootNode);
        
        // Test backward conversion
        const convertedMarkdown = window.mindmapModel.toMarkdown();
        console.log('✅ Converted back to markdown:');
        console.log(convertedMarkdown);
        
        // Compare structure
        console.log('\n=== COMPARISON ===');
        console.log('Original lines:', testMarkdown.split('\n').length);
        console.log('Converted lines:', convertedMarkdown.split('\n').length);
        
        return convertedMarkdown;
      } else {
        console.error('❌ Failed to parse markdown');
      }
    }).catch(error => {
      console.error('❌ Error during parsing:', error);
    });
  } else {
    console.error('❌ MindmapModel not available in window');
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.testMarkdownConversion = testMarkdownConversion;
  console.log('Test function available as window.testMarkdownConversion()');
}