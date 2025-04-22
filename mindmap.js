// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    var markdownInput = document.getElementById('markdown-input');
    var generateBtn = document.getElementById('generate-btn');
    var exportBtn = document.getElementById('export-btn');
    var mindmapContainer = document.getElementById('mindmap-container');
    var loadingIndicator = document.getElementById('loading-indicator');
    var statusMessage = document.getElementById('status-message');
    var themeSelector = document.getElementById('theme-selector');
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

    // Helper function to escape XML in SVG text
    function escapeXml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    /**
     * Parse markdown text into a mindmap structure
     * @param {string} markdown - The markdown text to parse
     * @return {Node|null} The root node of the mindmap, or null if no valid nodes were found
     */
    function parseMindmap(markdown) {
      const lines = markdown.split('\n');
      const root = new Node('', 0);
      const stack = [root];
      let currentHeadingLevel = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        let level = 0;
        let text = '';

        // Check if it's a heading
        if (line.startsWith('#')) {
          // Count # characters to determine level
          for (let j = 0; j < line.length; j++) {
            if (line[j] === '#') level++;
            else break;
          }

          // Extract text
          text = line.substring(level).trim();
          currentHeadingLevel = level;
        }
        // Check if it's a bullet point
        else if (line.startsWith('-') || line.startsWith('*')) {
          // Get raw line to calculate actual indentation
          const rawLine = lines[i];
          const indentLength = rawLine.length - rawLine.trimLeft().length;
          const bulletDepth = Math.floor(indentLength / 2); // Assuming 2 spaces per level

          // Bullet points should be children of the current heading
          level = currentHeadingLevel + bulletDepth + 1;

          // Extract text
          text = line.substring(1).trim(); // Remove the '-' character
        } else {
          continue; // Skip lines that aren't headings or bullet points
        }

        // Create node
        const node = new Node(text, level);

        // Find the parent node
        while (stack.length > 1 && stack[stack.length - 1].level >= level) {
          stack.pop();
        }

        // Add to parent
        stack[stack.length - 1].addChild(node);

        // Add to stack
        stack.push(node);
      }

      return root.hasChildren() ? root.children[0] : null;
    }

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
            var rootNode = parseMindmap(markdown);

            if (!rootNode) {
                statusMessage.textContent = 'Could not parse the markdown. Make sure it starts with a # heading.';
                statusMessage.className = 'status-error';
                statusMessage.style.display = 'block';
                loadingIndicator.style.display = 'none';
                return;
            }

            const mindmapStyle = new Style();
//            mindmapStyle.configure({
//              levelStyles: {
//                1: {
//                  backgroundColor: '#e9f7fe',
//                  borderColor: '#4a90e2',
////                  layoutType: 'vertical'
//                  layoutType: 'horizontal'
//                },
//                2: {
//                    layoutType: 'vertical'
//                }
//              }
//            });
            mindmapStyle.setGlobalLayoutType(layoutType.value);
            // Apply layout with style
            const layout = mindmapStyle.getLevelStyle(1).getLayout();
            layout.applyLayout(rootNode, 0, 0, mindmapStyle);

            if (layoutType.value === 'vertical') {
                isVertical = true;
            } else {
                isVertical = false;
            }


            // Render mindmap
//            var theme = colorThemes[themeSelector.value];
            var svg = renderMindmap(rootNode, mindmapStyle);
            // TODO move remaining layout related responsibilities from Renderer to Layout

            // Display mindmap
            mindmapContainer.innerHTML = svg;
            mindmapContainer.dataset.svgContent = svg;

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
    exportBtn.addEventListener('click', exportMindMap);
    initHelpButton();
    initMindmapContainer();

    // Generate initial mindmap
    generateMindMap();
});