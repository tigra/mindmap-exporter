//import Node from './model/node.js';
//import { Style } from './layout.js';

// Wait for the DOM to be fully loaded
var nodeMap = {};
var mindmapContainer;
//var renderer;
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    var markdownInput = document.getElementById('markdown-input');
    var generateBtn = document.getElementById('generate-btn');
    var exportBtn = document.getElementById('export-btn');
    mindmapContainer = document.getElementById('mindmap-container');
    var loadingIndicator = document.getElementById('loading-indicator');
    var statusMessage = document.getElementById('status-message');
    var layoutType = document.getElementById('layout-type');
    var exportFormat = document.getElementById('export-format');

    // Sample data
    markdownInput.value = `# Project Planning
## Research
- bullet 1
    - subbullet 1, a very long bullet point, and even with its own subbullets
        - subsub 1
           - 2222222222222
              - 3
                - 44444444444444444444444444444444444444444
                - 5555555555
        - subsub 2
    - subbullet 2
        - subsub, again
            - 1111111
            - 2222222222222 2222222222
               - 333333
                 - 3
### Market Analysis
### Technical Feasibility
## Design
### UI/UX Design
### System Architecture
#### Class Diagram
#### Deployment Diagram
- bullet 1
- subbullet 1
- subbullet 2
## Development
### Frontend
- bullet 1
- subbullet 1
- subbullet 2
### Backend
## Testing`;
    // Color themes
    var colorThemes = {
        default: {
            root: ['#7E57C2', '#4527A0'],
            level1: ['#5C6BC0', '#283593'],
            level2: ['#26A69A', '#00796B'],
            level3: ['#66BB6A', '#2E7D32'],
            background: '#f5f5f7',
            connection: '#9575CD'
        },
        ocean: {
            root: ['#039BE5', '#01579B'],
            level1: ['#29B6F6', '#0277BD'],
            level2: ['#00ACC1', '#006064'],
            level3: ['#26C6DA', '#00838F'],
            background: '#E3F2FD',
            connection: '#81D4FA'
        },
        forest: {
            root: ['#43A047', '#1B5E20'],
            level1: ['#7CB342', '#33691E'],
            level2: ['#C0CA33', '#827717'],
            level3: ['#FDD835', '#F57F17'],
            background: '#F1F8E9',
            connection: '#AED581'
        },
        sunset: {
            root: ['#FB8C00', '#E65100'],
            level1: ['#F4511E', '#BF360C'],
            level2: ['#E53935', '#B71C1C'],
            level3: ['#8E24AA', '#4A148C'],
            background: '#FFF3E0',
            connection: '#FFCC80'
        }
    };

//    // Helper function to escape XML in SVG text
//    function escapeXml(text) {
//        return text
//            .replace(/&/g, '&amp;')
//            .replace(/</g, '&lt;')
//            .replace(/>/g, '&gt;')
//            .replace(/"/g, '&quot;')
//            .replace(/'/g, '&apos;');
//    }


    // Set up help button functionality
    function initHelpButton() {
        const helpButton = document.getElementById('help-button');
        const helpTooltip = document.getElementById('help-tooltip');

        let tooltipTimeout;

        // When moving out of the tooltip or button, start a timer to hide the tooltip
        function startHideTimer() {
            tooltipTimeout = setTimeout(() => {
                helpTooltip.style.visibility = 'hidden';
                helpTooltip.style.opacity = '0';
            }, 300); // Delay in milliseconds before hiding
        }

        // If moving back over the tooltip or button, cancel the timer
        function cancelHideTimer() {
            if (tooltipTimeout) {
                clearTimeout(tooltipTimeout);
                tooltipTimeout = null;
            }
        }

        // Attach event listeners for mouse movements
        helpButton.addEventListener('mouseenter', () => {
            cancelHideTimer();
            helpTooltip.style.visibility = 'visible';
            helpTooltip.style.opacity = '1';
        });

        helpButton.addEventListener('mouseleave', startHideTimer);
        helpTooltip.addEventListener('mouseenter', cancelHideTimer);
        helpTooltip.addEventListener('mouseleave', startHideTimer);
    }

    // Function to initialize the mindmap container for scrolling
    function initMindmapContainer() {
        const container = document.getElementById('mindmap-container');

        // Set up panning functionality
        let isPanning = false;
        let startX, startY, scrollLeft, scrollTop;

        // Mouse events for panning (middle-click or ctrl+click)
        container.addEventListener('mousedown', (e) => {
            // Only initiate panning with middle mouse button or ctrl+left click
            if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
                e.preventDefault();
                isPanning = true;
                startX = e.pageX - container.offsetLeft;
                startY = e.pageY - container.offsetTop;
                scrollLeft = container.scrollLeft;
                scrollTop = container.scrollTop;

                // Change cursor to indicate panning
                container.style.cursor = 'grabbing';
            }
        });

        container.addEventListener('mousemove', (e) => {
            if (!isPanning) return;
            e.preventDefault();

            const x = e.pageX - container.offsetLeft;
            const y = e.pageY - container.offsetTop;
            const walkX = (x - startX) * 1.5; // Adjust for faster/slower panning
            const walkY = (y - startY) * 1.5;

            container.scrollLeft = scrollLeft - walkX;
            container.scrollTop = scrollTop - walkY;
        });

        container.addEventListener('mouseup', () => {
            isPanning = false;
            container.style.cursor = 'auto';
        });

        container.addEventListener('mouseleave', () => {
            isPanning = false;
            container.style.cursor = 'auto';
        });

        // Zoom state tracking
        let currentZoom = 1.0;
        const minZoom = 0.3;
        const maxZoom = 3.0;

        // Handle wheel events for zooming
        container.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                // Prevent the default zoom of the entire page
                e.preventDefault();

                // Determine zoom direction
                const delta = e.deltaY < 0 ? 0.1 : -0.1;
                const newZoom = Math.min(maxZoom, Math.max(minZoom, currentZoom + delta));

                // If zoom didn't change (at limits), don't proceed
                if (newZoom === currentZoom) return;

                // Get SVG element
                const svg = container.querySelector('svg');
                if (!svg) return;

                // Get mouse position relative to container
                const rect = container.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                // Get scroll position before zoom
                const scrollXBeforeZoom = container.scrollLeft;
                const scrollYBeforeZoom = container.scrollTop;

                // Scale SVG
                svg.style.transformOrigin = '0 0';
                svg.style.transform = `scale(${newZoom})`;

                // Calculate new scroll position to keep mouse over the same point
                const scrollXAfterZoom = (scrollXBeforeZoom + mouseX) * (newZoom / currentZoom) - mouseX;
                const scrollYAfterZoom = (scrollYBeforeZoom + mouseY) * (newZoom / currentZoom) - mouseY;

                // Update scroll position
                container.scrollLeft = scrollXAfterZoom;
                container.scrollTop = scrollYAfterZoom;

                // Update current zoom
                currentZoom = newZoom;

                // Update status or display zoom level (optional)
                const zoomPercent = Math.round(newZoom * 100);
                const statusMessage = document.getElementById('status-message');
                if (statusMessage) {
                    statusMessage.textContent = `Zoom: ${zoomPercent}%`;
                    // Clear the status message after a delay
                    clearTimeout(statusMessage.timeout);
                    statusMessage.timeout = setTimeout(() => {
                        statusMessage.textContent = '';
                    }, 1500);
                }
            }
            // If not holding Ctrl, let the default scroll behavior happen
        });
    }

    // Generate mindmap from markdown
    function generateMindMap() {
        loadingIndicator.textContent = 'Generating mindmap...';
        loadingIndicator.style.display = 'block';
        mindmapContainer.innerHTML = '';
        statusMessage.className = '';
        statusMessage.textContent = '';
        statusMessage.style.display = 'none';

        var markdown = markdownInput.value.trim();

        if (!markdown) {
            statusMessage.textContent = 'Please enter some markdown content.';
            statusMessage.className = 'status-error';
            statusMessage.style.display = 'block';
            loadingIndicator.style.display = 'none';
            return;
        }

        try {
            // Parse markdown
            var rootNode = enhancedParseMindmap(markdown);

            if (!rootNode) {
                statusMessage.textContent = 'Could not parse the markdown. Make sure it starts with a # heading.';
                statusMessage.className = 'status-error';
                statusMessage.style.display = 'block';
                loadingIndicator.style.display = 'none';
                return;
            }

            const stylePresetSelect = document.getElementById('style-preset');

            var style = window.styleManager || new Style();
            const presetName = stylePresetSelect.value;
            MindmapStylePresets.applyPreset(presetName, style);

            style.setGlobalLayoutType(layoutType.value);
            const layout = style.getLevelStyle(1).getLayout();
            layout.applyLayout(rootNode, 0, 0, style);

//             renderer = new MindmapRenderer(rootNode, style);

            // Generate SVG string
//            const svg = renderer.generateSvg();

            // Display mindmap
//            mindmapContainer.innerHTML = svg;
//            mindmapContainer.dataset.svgContent = svg;

//            renderer.addNodeListeners();

//            var style = window.styleManager || new Style();
//            const presetName = stylePresetSelect.value;
//            MindmapStylePresets.applyPreset(presetName, style);

//            style.setGlobalLayoutType(layoutType.value);
//            const layout = style.getLevelStyle(1).getLayout();
//            layout.applyLayout(rootNode, 0, 0, style);

//             renderer = new MindmapRenderer(rootNode, style);

            // Generate SVG string
//            const svg = renderer.generateSvg();
//
//            // Display mindmap
//            mindmapContainer.innerHTML = svg;
//            mindmapContainer.dataset.svgContent = svg;
//
//            renderer.addNodeListeners();

//              console.log('controller', window.mindmapController);
              window.mindmapController.handleStyleChange(stylePresetSelect.value);
              window.mindmapController.handleLayoutChange(layoutType.value);

//              mindmapController.renderMindmap();

//            console.log(renderer.getNodeMap());

            // Enable export button
            exportBtn.disabled = false;

            // Show success message
            statusMessage.textContent = 'MindMap generated successfully!';
            statusMessage.className = 'status-success';
            statusMessage.style.display = 'block';
        } catch (error) {
            console.error('Error generating mindmap:', error);
            statusMessage.textContent = 'Error generating mindmap: ' + error.message;
            statusMessage.className = 'status-error';
            statusMessage.style.display = 'block';
        }

        loadingIndicator.style.display = 'none';
    }


    /**
     * Create and render a mindmap
     * @param {Node} rootNode - The root node of the mindmap
     * @param {Style} style - The style object for the mindmap
     * @param {Object} options - Additional render options
     * @param {Function} options.onStateChanged - Callback when node states change
     * @return {string} SVG representation of the mindmap
     */
    function renderMindmap(rootNode, style, options = {}) {
        const renderer = new MindmapRenderer(rootNode, style);

        // Generate SVG string
        const svgString = renderer.generateSvg();

        for (var nodeId in renderer.nodeMap)
            newMap[nodeId] = renderer.nodeMap[nodeId];
        console.log('node map:', nodeMap);

        // If a container element is provided, add the SVG to it
        if (options.container) {
            const container = typeof options.container === 'string'
                ? document.getElementById(options.container)
                : options.container;

            if (container) {
                container.innerHTML = svgString;

                // Set up global callback for state changes if provided
                if (typeof options.onStateChanged === 'function') {
                    window.onMindmapStateChanged = function() {
                        // Re-render the mindmap with the updated node states
                        container.innerHTML = renderer.generateSvg();

                        // Call the user's callback
                        options.onStateChanged(rootNode);
                    };
                }
            }
        }

        return svgString;
    }

    /**
     * Create a wrapper HTML for mindmap with additional UI controls
     * @param {string} svgString - SVG string representation of the mindmap
     * @param {Object} options - Additional UI options
     * @return {string} HTML with the mindmap and controls
     */
    function createMindmapUI(svgString, options = {}) {
        const containerId = options.containerId || 'mindmap-container';
        const title = options.title || 'Mindmap';

        return `
        <div class="mindmap-ui">
            <div class="mindmap-header">
                <h2>${title}</h2>
                ${options.showControls ? `
                <div class="mindmap-controls">
                    <button onclick="expandAll()">Expand All</button>
                    <button onclick="collapseAll()">Collapse All</button>
                </div>
                ` : ''}
            </div>
            <div id="${containerId}" class="mindmap-container">
                ${svgString}
            </div>
            ${options.showControls ? `
            <script>
                function expandAll() {
                    nodeMap.forEach(node => {
                        node.collapsed = false;
                    });
                    redrawMindmap();
                }

                function collapseAll() {
                    nodeMap.forEach(node => {
                        if (node.level > 1) { // Don't collapse the root node
                            node.collapsed = true;
                        }
                    });
                    redrawMindmap();
                }
            </script>
            ` : ''}
        </div>
        `;
    }

    // Export mindmap
    function exportMindMap() {
        var svgContent = mindmapContainer.dataset.svgContent;

        if (!svgContent) {
            statusMessage.textContent = 'No mindmap to export. Generate one first.';
            statusMessage.className = 'status-error';
            statusMessage.style.display = 'block';
            return;
        }

        var format = exportFormat.value;
        var rootTextMatch = svgContent.match(/<text[^>]*>([^<]+)<\/text>/);
        var fileName = rootTextMatch ?
            rootTextMatch[1].replace(/[^\w\s]/g, '').replace(/\s+/g, '_').toLowerCase() :
            'mindmap';

        if (format === 'svg') {
            // Create link to download SVG
            var blob = new Blob([svgContent], { type: 'image/svg+xml' });
            var url = URL.createObjectURL(blob);

            var a = document.createElement('a');
            a.href = url;
            a.download = fileName + '.svg';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            statusMessage.textContent = 'SVG exported successfully!';
            statusMessage.className = 'status-success';
            statusMessage.style.display = 'block';
        } else if (format === 'png') {
            // Convert SVG to PNG
            var img = new Image();
            img.onload = function() {
                var canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;

                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                canvas.toBlob(function(blob) {
                    var url = URL.createObjectURL(blob);

                    var a = document.createElement('a');
                    a.href = url;
                    a.download = fileName + '.png';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    statusMessage.textContent = 'PNG exported successfully!';
                    statusMessage.className = 'status-success';
                    statusMessage.style.display = 'block';
                });
            };

            var svgBlob = new Blob([svgContent], {type: 'image/svg+xml'});
            var url = URL.createObjectURL(svgBlob);
            img.src = url;
        }
    }

    // Add event listeners
    generateBtn.addEventListener('click', generateMindMap);
//    exportBtn.addEventListener('click', exportMindMap);
    exportBtn.addEventListener('click', function() {
//      if (window.mindmapController) {
        const format = document.getElementById('export-format').value;
        const rootTextMatch = mindmapContainer.dataset.svgContent.match(/<text[^>]*>([^<]+)<\/text>/);
        const fileName = rootTextMatch ?
          rootTextMatch[1].replace(/[^\w\s]/g, '').replace(/\s+/g, '_').toLowerCase() :
          'mindmap';

        if (format === 'svg') {
          window.mindmapController.exportToSVG(fileName + '.svg');
        } else if (format === 'png') {
          window.mindmapController.exportToPNG(fileName + '.png');
        }
//      } else {
//        // Fallback to old export function
//        exportMindMap();
//      }
    });
    initHelpButton();
    initMindmapContainer();

    // Generate initial mindmap
    generateMindMap();
});