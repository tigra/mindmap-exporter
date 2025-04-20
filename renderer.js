// MindmapRenderer class for SVG generation
class MindmapRenderer {
    constructor(rootNode, theme, isVertical) {
        this.rootNode = rootNode;
        this.theme = theme;
        this.isVertical = isVertical;
        this.minX = Infinity;
        this.minY = Infinity;
        this.maxX = -Infinity;
        this.maxY = -Infinity;
        this.padding = 30;
    }

    // Find the bounds of the entire mindmap
    findBounds() {
        this._findBoundsRecursive(this.rootNode);

        // Add padding
        this.minX -= this.padding;
        this.minY -= this.padding;
        this.maxX += this.padding;
        this.maxY += this.padding;

        this.width = this.maxX - this.minX;
        this.height = this.maxY - this.minY;
    }

    _findBoundsRecursive(node) {
        this.minX = Math.min(this.minX, node.x);
        this.minY = Math.min(this.minY, node.y);
        this.maxX = Math.max(this.maxX, node.x + node.width);
        this.maxY = Math.max(this.maxY, node.y + node.height);

        for (let i = 0; i < node.children.length; i++) {
            this._findBoundsRecursive(node.children[i]);
        }
    }

    // Create SVG container with proper dimensions
    createSvgContainer() {
        return `<svg xmlns="http://www.w3.org/2000/svg"
                    width="${this.width}"
                    height="${this.height}"
                    viewBox="${this.minX} ${this.minY} ${this.width} ${this.height}">`;
    }

    // Create gradient and filter definitions
    createDefs() {
        let defs = '<defs>';

        // Root node gradient
        defs += this._createGradient('rootGradient', this.theme.root[0], this.theme.root[1]);

        // Level 1 gradient
        defs += this._createGradient('level1Gradient', this.theme.level1[0], this.theme.level1[1]);

        // Level 2 gradient
        defs += this._createGradient('level2Gradient', this.theme.level2[0], this.theme.level2[1]);

        // Level 3 gradient
        defs += this._createGradient('level3Gradient', this.theme.level3[0], this.theme.level3[1]);

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

    _createGradient(id, color1, color2) {
        return `<linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
                </linearGradient>`;
    }

    // Get fill color based on node level
    getFillColor(level) {
        if (level === 1) return "url(#rootGradient)";
        if (level === 2) return "url(#level1Gradient)";
        if (level === 3) return "url(#level2Gradient)";
        return "url(#level3Gradient)";
    }

    // Draw all nodes starting from root
    drawNodes() {
        return this._drawNodeRecursive(this.rootNode);
    }

    _drawNodeRecursive(node) {
        let svg = '';

        // Draw connections to children first
        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            svg += this._drawConnection(node, child);
            // Recursively draw child nodes
            svg += this._drawNodeRecursive(child);
        }

        // Draw the node based on its level
        if (node.level <= 3) {
            // For levels 1-3, draw a box with text
            svg += this._drawNodeShape(node);
            svg += this._drawNodeText(node, true); // true = text is within a box
        } else {
            // For levels 4+, draw just the text (no box)
            svg += this._drawNodeText(node, false); // false = text is standalone
        }

        return svg;
    }

    _drawConnection(parent, child) {
        let startX, startY, endX, endY;

        // For parent level 4+, connections should start from the end of text
        if (parent.level > 3) {
            // Calculate approximate text width based on content
            const textLength = parent.text.length;
            const avgCharWidth = parent.level === 1 ? 12 : 8; // Estimated width per character
            const textWidth = Math.min(textLength * avgCharWidth, parent.width);

            if (this.isVertical) {
                // For vertical layout, connect from bottom of text
                startX = parent.x + textWidth / 2;
                startY = parent.y + parent.height;
            } else {
                // For horizontal layout, connect from right end of text
                startX = parent.x + textWidth;
                startY = parent.y + parent.height / 2;
            }
        } else {
            // For boxed nodes (levels 1-3), connect from the box edge
            if (this.isVertical) {
                startX = parent.x + parent.width / 2;
                startY = parent.y + parent.height;
            } else {
                startX = parent.x + parent.width;
                startY = parent.y + parent.height / 2;
            }
        }

        // For child level 4+, connections should end at the start of text
        if (child.level > 3) {
            if (this.isVertical) {
                endX = child.x;
                endY = child.y + (child.height / 2);
            } else {
                endX = child.x;
                endY = child.y + (child.height / 2);
            }
        } else {
            // For boxed nodes (levels 1-3), connect to the box edge
            if (this.isVertical) {
                endX = child.x + child.width / 2;
                endY = child.y;
            } else {
                endX = child.x;
                endY = child.y + child.height / 2;
            }
        }

        // Draw the curved connection
        if (this.isVertical) {
            const dy = endY - startY;
            return `<path d="M ${startX} ${startY}
                           C ${startX} ${startY + dy * 0.4},
                             ${endX} ${startY + dy * 0.6},
                             ${endX} ${endY}"
                     stroke="${this.theme.connection}" stroke-width="2" fill="none" />`;
        } else {
            const dx = endX - startX;
            return `<path d="M ${startX} ${startY}
                           C ${startX + dx * 0.4} ${startY},
                             ${startX + dx * 0.6} ${endY},
                             ${endX} ${endY}"
                     stroke="${this.theme.connection}" stroke-width="2" fill="none" />`;
        }
    }

    _drawNodeShape(node) {
        const fillColor = this.getFillColor(node.level);
        return `<rect x="${node.x}" y="${node.y}"
                      width="${node.width}" height="${node.height}"
                      rx="6" ry="6" fill="${fillColor}"
                      stroke="#fff" stroke-width="1.5" filter="url(#dropShadow)" />`;
    }

    _drawNodeText(node, insideBox) {
        const fontSize = node.level === 1 ? 18 : 14;
        const fontWeight = node.level === 1 ? 'bold' : 'normal';
        let x, y, fill;

        if (insideBox) {
            // Text inside a box (centered)
            x = node.x + node.width / 2;
            y = node.y + node.height / 2;
            fill = "white"; // White text on colored background
        } else {
            // Standalone text (no box)
            x = node.x;
            y = node.y + node.height / 2;
            fill = "#333"; // Dark text directly on background
        }

        const textAnchor = insideBox ? "middle" : "start";

        return `<text x="${x}" y="${y}"
                      font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="${fontWeight}"
                      fill="${fill}" text-anchor="${textAnchor}" dominant-baseline="middle">
                      ${this._escapeXml(node.text)}
                </text>`;
    }

    _escapeXml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    // Generate the complete SVG
    generateSvg() {
        this.findBounds();

        let svg = this.createSvgContainer();
        svg += this.createDefs();
        svg += this.drawNodes();
        svg += '</svg>';

        return svg;
    }
}

// The main function now just creates a renderer and calls generateSvg
function renderMindmap(rootNode, theme, isVertical) {
    const renderer = new MindmapRenderer(rootNode, theme, isVertical);
    return renderer.generateSvg();
}