/**
 * MindmapRenderer class for SVG generation with interactive expand/collapse
 */
class MindmapRenderer {
    /**
     * Create a new MindmapRenderer
     * @param {Node} rootNode - The root node of the mindmap
     * @param {Style} style - The style object for the mindmap
     */
    constructor(rootNode, style) {
        this.rootNode = rootNode;
        this.style = style;
        this.minX = Infinity;
        this.minY = Infinity;
        this.maxX = -Infinity;
        this.maxY = -Infinity;
        this.padding = 30;
        this.nodeMap = new Map(); // Store references to nodes by id
    }

    /**
     * Find the bounds of the entire mindmap
     */
    findBounds() {
        this.minX = Infinity;
        this.minY = Infinity;
        this.maxX = -Infinity;
        this.maxY = -Infinity;

        this._findBoundsRecursive(this.rootNode);

        // Add padding
        this.minX -= this.padding;
        this.minY -= this.padding;
        this.maxX += this.padding;
        this.maxY += this.padding;

        this.width = this.maxX - this.minX;
        this.height = this.maxY - this.minY;
    }

    /**
     * Recursively find bounds for node and its children
     * @private
     * @param {Node} node - The node to process
     */
    _findBoundsRecursive(node) {
        this.minX = Math.min(this.minX, node.x);
        this.minY = Math.min(this.minY, node.y);
        this.maxX = Math.max(this.maxX, node.x + node.width);
        this.maxY = Math.max(this.maxY, node.y + node.height);

        // Store node reference in the map
        this.nodeMap.set(node.id, node);

        // Only process children if not collapsed
        if (!node.collapsed) {
            for (let i = 0; i < node.children.length; i++) {
                this._findBoundsRecursive(node.children[i]);
            }
        }
    }

    /**
     * Create SVG container with proper dimensions
     * @return {string} SVG container element
     */
    createSvgContainer() {
        return `<svg xmlns="http://www.w3.org/2000/svg"
                    width="${this.width}"
                    height="${this.height}"
                    viewBox="${this.minX} ${this.minY} ${this.width} ${this.height}">`;
    }

    /**
     * Create gradient and filter definitions
     * @return {string} SVG defs element with gradients and filters
     */
    createDefs() {
        let defs = '<defs>';

        // Create gradients for different levels
        const gradients = [];
        const levelCount = 4; // Maximum number of distinct level styles to create gradients for

        for (let i = 1; i <= levelCount; i++) {
            const levelStyle = this.style.getLevelStyle(i);
            if (levelStyle && levelStyle.backgroundColor) {
                // If the background is already a gradient or uses special format, skip
                if (levelStyle.backgroundColor.startsWith('url') ||
                    levelStyle.backgroundColor.startsWith('linear-gradient')) {
                    continue;
                }

                // Create a gradient variant of the background color
                const baseColor = levelStyle.backgroundColor;
                const lightColor = this._lightenColor(baseColor, 30);
                const darkColor = this._darkenColor(baseColor, 10);

                defs += this._createGradient(`level${i}Gradient`, lightColor, darkColor);
                gradients.push(i);
            }
        }

        // Store the gradients for use in node rendering
        this.gradients = gradients;

        // Drop shadow filter
        defs += `<filter id="dropShadow">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                    <feOffset dx="2" dy="2" result="offsetblur"/>
                    <feComponentTransfer><feFuncA type="linear" slope="0.2"/></feComponentTransfer>
                    <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>`;

        defs += '</defs>';
        return defs;
    }

    /**
     * Create a linear gradient definition
     * @private
     * @param {string} id - The gradient ID
     * @param {string} color1 - The start color
     * @param {string} color2 - The end color
     * @return {string} SVG linearGradient element
     */
    _createGradient(id, color1, color2) {
        return `<linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
                </linearGradient>`;
    }

    /**
     * Get fill color based on node level and style
     * @param {Node} node - The node to get fill color for
     * @return {string} Fill color or gradient
     */
    getFillColor(node) {
        const levelStyle = this.style.getLevelStyle(node.level);

        // If this level has a gradient created, use it
        if (this.gradients && this.gradients.includes(node.level)) {
            return `url(#level${node.level}Gradient)`;
        }

        // Otherwise use the background color from the style
        return levelStyle.backgroundColor || '#f5f5f5';
    }

    /**
     * Draw all nodes starting from root
     * @return {string} SVG elements for all nodes
     */
    drawNodes() {
        return this._drawNodeRecursive(this.rootNode);
    }

    /**
     * Recursively draw a node and its children
     * @private
     * @param {Node} node - The node to draw
     * @return {string} SVG elements for the node and its children
     */
    _drawNodeRecursive(node) {
        let svg = '';
        const levelStyle = this.style.getLevelStyle(node.level);

        // Only draw connections to children if not collapsed
        if (!node.collapsed) {
            for (let i = 0; i < node.children.length; i++) {
                const child = node.children[i];
                svg += this._drawConnection(node, child);
                // Recursively draw child nodes
                svg += this._drawNodeRecursive(child);
            }
        }

        // Draw the node based on its nodeType
        if (levelStyle.nodeType === 'text-only') {
            // For text-only nodes, draw just the text
            svg += this._drawNodeText(node, false);
        } else {
            // For box nodes, draw both shape and text
            svg += this._drawNodeShape(node);
            svg += this._drawNodeText(node, true);
        }

        // Add collapsible indicator if node has children
        if (node.hasChildren()) {
            svg += this._drawCollapseIndicator(node);
        }

        return svg;
    }

    /**
     * Draw a connection between parent and child nodes
     * @private
     * @param {Node} parent - The parent node
     * @param {Node} child - The child node
     * @return {string} SVG path element for the connection
     */
    _drawConnection(parent, child) {
        const parentStyle = this.style.getLevelStyle(parent.level);
        const childStyle = this.style.getLevelStyle(child.level);

        const parentLayout = parentStyle.getLayout();
        const childLayout = childStyle.getLayout();

        const startPoint = parentLayout.getParentConnectionPoint(parent, parentStyle);
        const endPoint = childLayout.getChildConnectionPoint(child, childStyle);

        // Determine the curve control points based on connection directions
        let path = '';

        // Check if it's a vertical or horizontal connection
        const isVerticalLayout = parentLayout instanceof VerticalLayout;

        if (isVerticalLayout) {
            // For vertical layout, create a curve that bends vertically
            const dy = endPoint.y - startPoint.y;
            path = `M ${startPoint.x} ${startPoint.y}
                   C ${startPoint.x} ${startPoint.y + dy * 0.4},
                     ${endPoint.x} ${startPoint.y + dy * 0.6},
                     ${endPoint.x} ${endPoint.y}`;
        } else {
            // For horizontal layout, create a curve that bends horizontally
            const dx = endPoint.x - startPoint.x;
            path = `M ${startPoint.x} ${startPoint.y}
                   C ${startPoint.x + dx * 0.4} ${startPoint.y},
                     ${startPoint.x + dx * 0.6} ${endPoint.y},
                     ${endPoint.x} ${endPoint.y}`;
        }

        // Get connection color from style
        const connectionColor = parentStyle.connectionColor || '#666';
        const connectionWidth = parentStyle.connectionWidth || 2;

        return `<path d="${path}" stroke="${connectionColor}" stroke-width="${connectionWidth}" fill="none" />`;
    }

    /**
     * Draw the shape for a node
     * @private
     * @param {Node} node - The node to draw shape for
     * @return {string} SVG rect element for the node shape
     */
    _drawNodeShape(node) {
        const levelStyle = this.style.getLevelStyle(node.level);
        const fillColor = this.getFillColor(node);
        const borderRadius = levelStyle.borderRadius || 5;
        const borderColor = levelStyle.borderColor || '#fff';
        const borderWidth = levelStyle.borderWidth || 1.5;

        return `<rect x="${node.x}" y="${node.y}"
                      width="${node.width}" height="${node.height}"
                      rx="${borderRadius}" ry="${borderRadius}" fill="${fillColor}"
                      stroke="${borderColor}" stroke-width="${borderWidth}" filter="url(#dropShadow)"
                      id="${node.id}_rect" class="node-shape" />`;
    }

    /**
     * Draw text for a node
     * @private
     * @param {Node} node - The node to draw text for
     * @param {boolean} insideBox - Whether the text is inside a box
     * @return {string} SVG text element
     */
    _drawNodeText(node, insideBox) {
        const levelStyle = this.style.getLevelStyle(node.level);
        const fontSize = levelStyle.fontSize || 14;
        const fontWeight = levelStyle.fontWeight || 'normal';
        const fontFamily = levelStyle.fontFamily || 'Arial, sans-serif';

        let x, y, fill, textAnchor;

        if (insideBox) {
            // Text inside a box (centered)
            x = node.x + node.width / 2;
            y = node.y + node.height / 2;
            fill = levelStyle.textColor || "white";
            textAnchor = "middle";
        } else {
            // Standalone text (no box)
            x = node.x;
            y = node.y + node.height / 2;
            fill = levelStyle.textColor || "#333";
            textAnchor = "start";
        }

        return `<text x="${x}" y="${y}"
                      id="${node.id}_text"
                      font-family="${fontFamily}" font-size="${fontSize}px" font-weight="${fontWeight}"
                      fill="${fill}" text-anchor="${textAnchor}" dominant-baseline="middle"
                      class="node-text" pointer-events="none">
                      ${this._escapeXml(node.text)}
                </text>`;
    }

    /**
     * Draw the collapse/expand indicator for a node
     * @private
     * @param {Node} node - The node to draw indicator for
     * @return {string} SVG elements for the indicator
     */
    _drawCollapseIndicator(node) {
        const levelStyle = this.style.getLevelStyle(node.level);
        const parentLayout = levelStyle.getLayout();
        const isVerticalLayout = parentLayout instanceof VerticalLayout;

        // Get the connection point where the indicator should be placed
        const connectionPoint = parentLayout.getParentConnectionPoint(node, levelStyle);
        const radius = 6;

        // Determine position based on layout direction
        let indicatorX, indicatorY;

        if (isVerticalLayout) {
            indicatorX = connectionPoint.x;
            indicatorY = connectionPoint.y + 6;
        } else {
            indicatorX = connectionPoint.x + 6;
            indicatorY = connectionPoint.y;
        }

        // Draw different icons based on collapsed state
        const fillColor = this._darkenColor(this.getFillColor(node), 10);
        let icon;

        if (node.collapsed) {
            // Plus icon for collapsed nodes
            icon = `<circle cx="${indicatorX}" cy="${indicatorY}" r="${radius}" fill="${fillColor}" stroke="#666" stroke-width="1" />
                    <line x1="${indicatorX - 3}" y1="${indicatorY}" x2="${indicatorX + 3}" y2="${indicatorY}" stroke="#fff" stroke-width="1.5" />
                    <line x1="${indicatorX}" y1="${indicatorY - 3}" x2="${indicatorX}" y2="${indicatorY + 3}" stroke="#fff" stroke-width="1.5" />`;
        } else {
            // Minus icon for expanded nodes
            icon = `<circle cx="${indicatorX}" cy="${indicatorY}" r="${radius}" fill="${fillColor}" stroke="#666" stroke-width="1" />
                    <line x1="${indicatorX - 3}" y1="${indicatorY}" x2="${indicatorX + 3}" y2="${indicatorY}" stroke="#fff" stroke-width="1.5" />`;
        }

        return `<g class="collapse-indicator" id="${node.id}_indicator" ondblclick="toggleNodeCollapse('${node.id}')">${icon}</g>`;
    }

    /**
     * Escape XML special characters
     * @private
     * @param {string} text - The text to escape
     * @return {string} Escaped text
     */
    _escapeXml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    /**
     * Lighten a color
     * @private
     * @param {string} color - The base color in hex format
     * @param {number} percent - The percentage to lighten
     * @return {string} Lightened color in hex format
     */
    _lightenColor(color, percent) {
        // Remove # if present
        color = color.replace('#', '');

        // Parse the hex values
        const r = parseInt(color.substring(0, 2), 16);
        const g = parseInt(color.substring(2, 4), 16);
        const b = parseInt(color.substring(4, 6), 16);

        // Lighten the colors
        const newR = Math.min(255, r + (255 - r) * (percent / 100));
        const newG = Math.min(255, g + (255 - g) * (percent / 100));
        const newB = Math.min(255, b + (255 - b) * (percent / 100));

        // Convert back to hex
        return '#' +
            Math.round(newR).toString(16).padStart(2, '0') +
            Math.round(newG).toString(16).padStart(2, '0') +
            Math.round(newB).toString(16).padStart(2, '0');
    }

    /**
     * Darken a color
     * @private
     * @param {string} color - The base color in hex format
     * @param {number} percent - The percentage to darken
     * @return {string} Darkened color in hex format
     */
    _darkenColor(color, percent) {
        // Remove # if present
        color = color.replace('#', '');

        // Parse the hex values
        const r = parseInt(color.substring(0, 2), 16);
        const g = parseInt(color.substring(2, 4), 16);
        const b = parseInt(color.substring(4, 6), 16);

        // Darken the colors
        const newR = Math.max(0, r - (r * (percent / 100)));
        const newG = Math.max(0, g - (g * (percent / 100)));
        const newB = Math.max(0, b - (b * (percent / 100)));

        // Convert back to hex
        return '#' +
            Math.round(newR).toString(16).padStart(2, '0') +
            Math.round(newG).toString(16).padStart(2, '0') +
            Math.round(newB).toString(16).padStart(2, '0');
    }

//    /**
//     * Add JavaScript functionality to the SVG
//     * @return {string} SVG script element with interaction code
//     */
//    createInteractiveScript() {
//        return `<script type="text/javascript">
//            <![CDATA[
//                // Store node references in a global map for interactivity
//                const nodeMap = new Map();
//
//                // Function to handle node collapse/expand
//                function toggleNodeCollapse(nodeId) {
//                    // Get the node data
//                    const node = nodeMap.get(nodeId);
//                    if (!node) return;
//
//                    // Toggle the collapsed state
//                    node.collapsed = !node.collapsed;
//
//                    // Trigger redraw of the mindmap
//                    redrawMindmap();
//                }
//
//                // Function to redraw the mindmap after state changes
//                function redrawMindmap() {
//                    if (typeof onMindmapStateChanged === 'function') {
//                        onMindmapStateChanged();
//                    }
//                }
//
//                // Initialize node map with the node data
//                ${this._generateNodeMapInitCode()}
//            ]]>
//        </script>`;
//    }

//    /**
//     * Generate code to initialize node map in SVG script
//     * @private
//     * @return {string} JavaScript code for initializing node map
//     */
//    _generateNodeMapInitCode() {
//        let code = '';
//        this.nodeMap.forEach((node, id) => {
//            code += `
//                nodeMap.set("${id}", {
//                    id: "${id}",
//                    text: "${this._escapeXml(node.text)}",
//                    level: ${node.level},
//                    collapsed: ${node.collapsed},
//                    hasChildren: ${node.children.length > 0}
//                });
//            `;
//        });
//        return code;
//    }

    /**
     * Generate the complete SVG
     * @return {string} Complete SVG document
     */
    generateSvg() {
        this.findBounds();

        let svg = this.createSvgContainer();
        svg += this.createDefs();
        svg += this.drawNodes();
//        svg += this.createInteractiveScript();
        svg += '</svg>';

        return svg;
    }

    addEventListener(elem, event, nodeId) {
        if (elem != null) {
            elem.addEventListener(event, function() {
                console.log(`double-clicked`, nodeId);
                console.log(`double-clicked:`, nodeMap[nodeId]);
                nodeMap[nodeId].toggleCollapse();
                let svg = renderer.generateSvg();
                mindmapContainer.innerHTML = svg;
                mindmapContainer.dataset.svgContent = svg;
                renderer.addNodeListeners();
            });
        }
    }

    addNodeListeners() {
        console.log(this.nodeMap);
        this.nodeMap.forEach((node, nodeId) => {
            console.log(nodeId);
            this.addEventListener(document.getElementById(nodeId + "_rect"), 'dblclick', nodeId);
            this.addEventListener(document.getElementById(nodeId + "_indicator"), 'dblclick', nodeId);
            this.addEventListener(document.getElementById(nodeId + "_indicator"), 'click', nodeId);

        });
        console.log("addNodeListeners() ended.");
    }

    getNodeMap() {
        return this.nodeMap;
    }

}

/**
 * Create and render a mindmap
 * @param {Node} rootNode - The root node of the mindmap
 * @param {Style} style - The style object for the mindmap
 * @return {string} SVG representation of the mindmap
 */
//function renderMindmap(rootNode, style) {
//    const renderer = new MindmapRenderer(rootNode, style);
//    return renderer.generateSvg();
//}