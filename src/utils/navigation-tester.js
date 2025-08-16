// src/utils/navigation-tester.js

/**
 * Automated test system for keyboard navigation functionality
 * Compares actual navigation behavior against ground truth JSON files
 */
class NavigationTester {
  /**
   * Create a new NavigationTester
   * @param {MindmapApp} app - The mindmap application instance
   */
  constructor(app) {
    this.app = app;
    this.testResults = {};
    this.groundTruthData = new Map();
    
    // Default markdown content (should match the ground truth data)
    this.defaultMarkdown = `# **Project Planning**<br><img src=https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Farmer_meme_with_apostrophe.jpg/250px-Farmer_meme_with_apostrophe.jpg width=300 height=160></p>
## Research
- competitive landscape
    - existing mindmap apps on the market
        - open source
           - Xmind
              - pros
                - open source
                - more feature rich then FreeMind
              - cons
                - doesn't have a really future-proof file format
                - 5555555555
        - proprietary
    - subbullet 2
        - subsub, again
            - 1111111
            - 2222222222222 2222222222
               - 333333
                 - 3
### Market Analysis
### Technical Feasibility
## **Design** <ul><li>one<li>two<li>three</ul>
### UI/UX Design
### System Architecture
#### Class Diagram
#### Deployment Diagram
- browser
- browser
- and only browser
## Development
### Frontend
- markdown parsing
  - support for
    - headings
    - bullet-point lists
    - paragraphs
    - images
    -
       | aa | bb |
       |----|----| 
       | cc | dd |

- layout algorithms
- styling
- interactivity
### Backend
* not needed
## **Testing**: This document analyzes potential issues with the [dom-to-svg](https://github.com/felixfbecker/dom-to-svg/) library that could cause text elements to be missing in \`SVG\` output. This analysis is relevant for understanding potential rendering issues in the markdown-to-svg integration in our mindmap application.
- Regression
- Functional
- Performance
`;
  }

  /**
   * Load ground truth data for all layouts
   */
  async loadGroundTruthData() {
    const layouts = [
      'taproot',
      'classic', 
      'horizontal-left',
      'horizontal-right',
      'vertical-up',
      'vertical_over_taproot'
    ];

    console.log('NavigationTester: Loading ground truth data...');
    
    for (const layout of layouts) {
      try {
        const response = await fetch(`./test-data/${layout}.json`);
        if (response.ok) {
          const data = await response.json();
          this.groundTruthData.set(layout, data);
          console.log(`Loaded ground truth for ${layout}: ${Object.keys(data.navigationOverrides).length} nodes`);
        } else {
          console.warn(`Failed to load ground truth for ${layout}: ${response.status}`);
        }
      } catch (error) {
        console.error(`Error loading ground truth for ${layout}:`, error);
      }
    }
    
    console.log(`NavigationTester: Loaded ${this.groundTruthData.size} ground truth files`);
  }

  /**
   * Run navigation tests for all layouts
   */
  async runAllTests() {
    console.log('==========================================');
    console.log('NavigationTester: Starting automated tests');
    console.log('==========================================');
    
    if (this.groundTruthData.size === 0) {
      await this.loadGroundTruthData();
    }

    this.testResults = {};

    for (const [layout, groundTruth] of this.groundTruthData) {
      console.log(`\n--- Testing layout: ${layout} ---`);
      const result = await this.testLayout(layout, groundTruth);
      this.testResults[layout] = result;
    }

    this.generateTestReport();
    return this.testResults;
  }

  /**
   * Test navigation for a specific layout
   */
  async testLayout(layoutType, groundTruth) {
    const result = {
      layout: layoutType,
      passed: 0,
      failed: 0,
      errors: [],
      details: {}
    };

    try {
      // Setup the mindmap with the specific layout
      await this.setupMindmapForTesting(layoutType);
      
      // Wait for layout to be applied
      await this.waitForLayout();
      
      // Capture actual navigation behavior
      const actualNavigation = await this.captureNavigationBehavior();
      
      // Compare against ground truth
      const comparison = this.compareNavigationBehavior(actualNavigation, groundTruth.navigationOverrides);
      
      result.passed = comparison.passed;
      result.failed = comparison.failed;
      result.errors = comparison.errors;
      result.details = comparison.details;
      
      console.log(`Layout ${layoutType}: ${result.passed} passed, ${result.failed} failed`);
      
    } catch (error) {
      console.error(`Error testing layout ${layoutType}:`, error);
      result.errors.push(`Test setup error: ${error.message}`);
      result.failed = 1;
    }

    return result;
  }

  /**
   * Setup mindmap for testing with specific layout
   */
  async setupMindmapForTesting(layoutType) {
    console.log(`Setting up mindmap for layout: ${layoutType}`);
    
    // Set the markdown content
    if (this.app.markdownInput) {
      this.app.markdownInput.value = this.defaultMarkdown;
    }
    
    // Set the layout type
    if (this.app.layoutType) {
      this.app.layoutType.value = layoutType;
    }
    
    // Generate the mindmap
    await this.app.handleGenerate();
    
    console.log(`Mindmap generated for layout: ${layoutType}`);
  }

  /**
   * Wait for layout to be fully applied
   */
  async waitForLayout() {
    return new Promise(resolve => {
      // Give time for layout calculations and rendering
      setTimeout(resolve, 500);
    });
  }

  /**
   * Capture actual navigation behavior for all nodes
   */
  async captureNavigationBehavior() {
    console.log('Capturing actual navigation behavior...');
    
    const navigation = {};
    const allNodes = this.app.controller.getAllNodes();
    
    for (const node of allNodes) {
      navigation[node.id] = {
        nodeText: node.text,
        level: node.level,
        connections: {
          up: this.getNavigationTarget(node, 'ArrowUp'),
          down: this.getNavigationTarget(node, 'ArrowDown'),
          left: this.getNavigationTarget(node, 'ArrowLeft'),
          right: this.getNavigationTarget(node, 'ArrowRight')
        }
      };
    }
    
    console.log(`Captured navigation for ${allNodes.length} nodes`);
    return navigation;
  }

  /**
   * Get navigation target for a node in a specific direction
   */
  getNavigationTarget(sourceNode, arrowKey) {
    try {
      // Use the controller's navigation logic
      const targetNode = this.app.controller.findNodeByLayoutLogic(sourceNode, arrowKey) ||
                         this.app.controller.findNodeInDirection(sourceNode, arrowKey);
      
      if (targetNode) {
        return {
          id: targetNode.id,
          text: targetNode.text
        };
      }
      return null;
    } catch (error) {
      console.warn(`Error getting navigation target for ${sourceNode.text} -> ${arrowKey}:`, error);
      return null;
    }
  }

  /**
   * Compare actual navigation behavior against ground truth
   */
  compareNavigationBehavior(actual, expected) {
    console.log('Comparing navigation behavior...');
    
    const result = {
      passed: 0,
      failed: 0,
      errors: [],
      details: {}
    };

    // Check each node in the ground truth
    for (const [nodeId, expectedNode] of Object.entries(expected)) {
      const actualNode = actual[nodeId];
      
      if (!actualNode) {
        result.failed++;
        result.errors.push(`Node ${nodeId} (${expectedNode.nodeText}) not found in actual results`);
        continue;
      }

      const nodeResult = {
        nodeText: expectedNode.nodeText,
        level: expectedNode.level,
        directions: {}
      };

      // Check each direction
      for (const direction of ['up', 'down', 'left', 'right']) {
        const expectedTarget = expectedNode.connections[direction];
        const actualTarget = actualNode.connections[direction];
        
        const directionResult = this.compareDirection(expectedTarget, actualTarget, direction, nodeId);
        nodeResult.directions[direction] = directionResult;
        
        if (directionResult.passed) {
          result.passed++;
        } else {
          result.failed++;
          result.errors.push(`${nodeId} -> ${direction}: ${directionResult.error}`);
        }
      }
      
      result.details[nodeId] = nodeResult;
    }

    console.log(`Navigation comparison: ${result.passed} passed, ${result.failed} failed`);
    return result;
  }

  /**
   * Compare navigation in a specific direction
   */
  compareDirection(expected, actual, direction, nodeId) {
    if (expected === null && actual === null) {
      return { passed: true, expected: null, actual: null };
    }
    
    if (expected === null && actual !== null) {
      return {
        passed: false,
        expected: null,
        actual: actual,
        error: `Expected no ${direction} navigation, but got ${actual.id}`
      };
    }
    
    if (expected !== null && actual === null) {
      return {
        passed: false,
        expected: expected,
        actual: null,
        error: `Expected ${direction} navigation to ${expected.id}, but got null`
      };
    }
    
    if (expected.id !== actual.id) {
      return {
        passed: false,
        expected: expected,
        actual: actual,
        error: `Expected ${direction} navigation to ${expected.id}, but got ${actual.id}`
      };
    }
    
    return { passed: true, expected: expected, actual: actual };
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport() {
    console.log('\n==========================================');
    console.log('NAVIGATION TEST REPORT');
    console.log('==========================================');
    
    let totalPassed = 0;
    let totalFailed = 0;
    let totalLayouts = 0;
    
    for (const [layout, result] of Object.entries(this.testResults)) {
      totalLayouts++;
      totalPassed += result.passed;
      totalFailed += result.failed;
      
      console.log(`\n--- ${layout.toUpperCase()} LAYOUT ---`);
      console.log(`✅ Passed: ${result.passed}`);
      console.log(`❌ Failed: ${result.failed}`);
      console.log(`📊 Success Rate: ${(result.passed / (result.passed + result.failed) * 100).toFixed(1)}%`);
      
      if (result.errors.length > 0) {
        console.log('❌ Errors:');
        result.errors.slice(0, 5).forEach(error => console.log(`   - ${error}`));
        if (result.errors.length > 5) {
          console.log(`   ... and ${result.errors.length - 5} more errors`);
        }
      }
    }
    
    console.log('\n==========================================');
    console.log('OVERALL SUMMARY');
    console.log('==========================================');
    console.log(`📋 Layouts tested: ${totalLayouts}`);
    console.log(`✅ Total passed: ${totalPassed}`);
    console.log(`❌ Total failed: ${totalFailed}`);
    console.log(`📊 Overall success rate: ${(totalPassed / (totalPassed + totalFailed) * 100).toFixed(1)}%`);
    
    // Generate detailed CSV report
    this.generateCSVReport();
  }

  /**
   * Generate CSV report for detailed analysis
   */
  generateCSVReport() {
    const csvLines = ['Layout,NodeId,NodeText,Direction,Expected,Actual,Status'];
    
    for (const [layout, result] of Object.entries(this.testResults)) {
      for (const [nodeId, nodeDetails] of Object.entries(result.details)) {
        const nodeText = nodeDetails.nodeText.replace(/,/g, ';'); // Escape commas
        
        for (const [direction, dirResult] of Object.entries(nodeDetails.directions)) {
          const expected = dirResult.expected ? dirResult.expected.id : 'null';
          const actual = dirResult.actual ? dirResult.actual.id : 'null';
          const status = dirResult.passed ? 'PASS' : 'FAIL';
          
          csvLines.push(`${layout},${nodeId},"${nodeText}",${direction},${expected},${actual},${status}`);
        }
      }
    }
    
    const csvContent = csvLines.join('\n');
    console.log('\n📄 CSV Report generated (copy to spreadsheet for analysis):');
    console.log('='.repeat(60));
    console.log(csvContent);
    console.log('='.repeat(60));
    
    // Also save to downloadable file
    this.downloadCSVReport(csvContent);
  }

  /**
   * Download CSV report as file
   */
  downloadCSVReport(csvContent) {
    try {
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `navigation-test-report-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      console.log('📥 CSV report downloaded');
    } catch (error) {
      console.error('Failed to download CSV report:', error);
    }
  }

  /**
   * Run tests for a specific layout only
   */
  async testSpecificLayout(layoutType) {
    if (this.groundTruthData.size === 0) {
      await this.loadGroundTruthData();
    }
    
    const groundTruth = this.groundTruthData.get(layoutType);
    if (!groundTruth) {
      console.error(`No ground truth data found for layout: ${layoutType}`);
      return null;
    }
    
    console.log(`Testing specific layout: ${layoutType}`);
    return await this.testLayout(layoutType, groundTruth);
  }
}

// Make it globally available
if (typeof window !== 'undefined') {
  window.NavigationTester = NavigationTester;
}

export default NavigationTester;