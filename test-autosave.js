// Test script for autosave functionality
// This can be run in browser console to test the autosave feature

function testAutosaveFeature() {
  console.log('🧪 Testing autosave functionality...');
  
  if (!window.mindmapApp || !window.mindmapModel) {
    console.error('❌ MindmapApp or MindmapModel not available');
    return;
  }

  const app = window.mindmapApp;
  const checkbox = app.autosaveMarkdownCheckbox;
  const markdownInput = app.markdownInput;
  
  if (!checkbox || !markdownInput) {
    console.error('❌ Autosave checkbox or markdown input not found');
    return;
  }

  console.log('✅ Found autosave elements');
  
  // Test 1: Check if checkbox exists and can be toggled
  console.log('Test 1: Checkbox functionality');
  const originalChecked = checkbox.checked;
  checkbox.checked = true;
  console.log('Checkbox set to:', checkbox.checked ? 'enabled' : 'disabled');
  
  // Test 2: Test the autoSaveToMarkdown method directly
  console.log('Test 2: Testing autoSaveToMarkdown method');
  const originalMarkdown = markdownInput.value;
  console.log('Original markdown length:', originalMarkdown.length);
  
  // Generate a mindmap first to have something to convert
  app.handleGenerate().then(() => {
    console.log('Mindmap generated successfully');
    
    // Test the autosave method
    app.autoSaveToMarkdown();
    
    setTimeout(() => {
      const newMarkdown = markdownInput.value;
      console.log('New markdown length:', newMarkdown.length);
      console.log('Markdown changed:', originalMarkdown !== newMarkdown ? '✅ Yes' : '❌ No');
      
      if (originalMarkdown !== newMarkdown) {
        console.log('📝 Updated markdown preview:');
        console.log(newMarkdown.substring(0, 200) + (newMarkdown.length > 200 ? '...' : ''));
      }
      
      console.log('🎉 Autosave test completed!');
    }, 500);
  }).catch(error => {
    console.error('❌ Error generating mindmap:', error);
  });
  
  // Reset checkbox to original state
  checkbox.checked = originalChecked;
}

// Test drag-drop autosave integration
function testDragDropAutosave() {
  console.log('🧪 Testing drag-drop autosave integration...');
  
  if (!window.mindmapApp) {
    console.error('❌ MindmapApp not available');
    return;
  }

  const app = window.mindmapApp;
  const checkbox = app.autosaveMarkdownCheckbox;
  
  if (!checkbox) {
    console.error('❌ Autosave checkbox not found');
    return;
  }

  // Enable autosave
  checkbox.checked = true;
  console.log('✅ Autosave enabled for drag-drop test');
  console.log('💡 Now try dragging a node in the mindmap to test autosave...');
  console.log('💡 Check the markdown editor - it should update automatically after drag operations');
  
  // Set up a listener to detect when autosave happens
  const originalMethod = app.autoSaveToMarkdown;
  let callCount = 0;
  
  app.autoSaveToMarkdown = function() {
    callCount++;
    console.log(`🔄 Autosave triggered (call #${callCount})`);
    const result = originalMethod.call(this);
    console.log('✅ Autosave completed');
    return result;
  };
  
  // Restore after 30 seconds
  setTimeout(() => {
    app.autoSaveToMarkdown = originalMethod;
    console.log(`📊 Autosave test completed. Total calls: ${callCount}`);
  }, 30000);
}

// Comprehensive test suite
function runAutosaveTestSuite() {
  console.log('🚀 Running comprehensive autosave test suite...');
  
  // Test the basic functionality first
  testAutosaveFeature();
  
  // Wait a bit, then test drag-drop integration
  setTimeout(() => {
    testDragDropAutosave();
  }, 2000);
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.testAutosaveFeature = testAutosaveFeature;
  window.testDragDropAutosave = testDragDropAutosave;
  window.runAutosaveTestSuite = runAutosaveTestSuite;
  
  console.log('🧪 Autosave test functions available:');
  console.log('- testAutosaveFeature()');
  console.log('- testDragDropAutosave()'); 
  console.log('- runAutosaveTestSuite()');
}