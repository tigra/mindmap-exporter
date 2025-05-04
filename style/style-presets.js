/**
 * Mindmap style presets
 * Provides a collection of predefined style configurations for mindmaps
 */
class MindmapStylePresets {
    /**
     * Get all available style presets
     * @return {Object} Map of preset names to their configuration functions
     */
    static getPresets() {
        return {
            'default': MindmapStylePresets.defaultStyle,
            'corporate': MindmapStylePresets.corporateStyle,
            'vibrant': MindmapStylePresets.vibrantStyle,
            'pastel': MindmapStylePresets.pastelStyle,
            'monochrome': MindmapStylePresets.monochromeStyle,
            'nature': MindmapStylePresets.natureStyle,
            'tech': MindmapStylePresets.techStyle,
            'retro': MindmapStylePresets.retroStyle,
            'minimal': MindmapStylePresets.minimalStyle,
            'creative': MindmapStylePresets.creativeStyle
        };
    }

    /**
     * Apply a style preset to a Style object
     * @param {string} presetName - The name of the preset to apply
     * @param {Style} style - The style object to configure
     * @return {Style} The configured style object
     */
    static applyPreset(presetName, style) {
        console.log('applyPreset(', presetName);
        console.log('style', style);
        const presets = MindmapStylePresets.getPresets();
        if (presets[presetName]) {
            console.log("found");
            return presets[presetName](style);
        }
        // Default to the default style if preset not found
        return MindmapStylePresets.defaultStyle(style);
    }

    /**
     * Default style preset - purple/blue gradients with rounded boxes
     * @param {Style} style - The style object to configure
     * @return {Style} The configured style object
     */
    static defaultStyle(style) {
        style.configure({
            levelStyles: {
                1: {
                    fontSize: 24,
                    fontWeight: 'bold',
                    backgroundColor: '#4a57b2',
                    textColor: '#ffffff',
                    borderColor: '#3a459a',
                    borderWidth: 3,
                    borderRadius: 12,
                    nodeType: 'box',
                    connectionColor: '#3a459a',  // Darker for root connections
                    connectionTapered: true,     // Enable tapered connections
                    connectionStartWidth: 10,    // Thickest for root level
                    connectionEndWidth: 4,       // Still relatively thick at the end
                    connectionGradient: true     // Use gradient for more appealing visuals
                },
                2: {
                    fontSize: 18,
                    fontWeight: 'bold',
                    backgroundColor: '#6a75c9',
                    textColor: '#ffffff',
                    borderColor: '#5562b6',
                    borderWidth: 2,
                    borderRadius: 10,
                    nodeType: 'box',
                    connectionColor: '#5562b6',  // Darker than the backgroundColor
                    connectionTapered: true,     // Enable tapered connections
                    connectionStartWidth: 8,     // Slightly thinner than level 1
                    connectionEndWidth: 3,       // Gradually thinner
                    connectionGradient: true     // Use gradient for more appealing visuals
                },
                3: {
                    fontSize: 16,
                    backgroundColor: '#8892d8',
                    textColor: '#ffffff',
                    borderColor: '#6a75c9',
                    borderRadius: 8,
                    nodeType: 'box',
                    connectionColor: '#6a75c9',  // Matches the level 2's borderColor
                    connectionTapered: true,     // Enable tapered connections
                    connectionStartWidth: 6,     // Thinner than level 2
                    connectionEndWidth: 2.5,     // Gradually thinner
                    connectionGradient: true     // Use gradient for more appealing visuals
                },
                4: {
                    fontSize: 14,
                    backgroundColor: '#a5add8',
                    textColor: '#ffffff',
                    borderColor: '#8892d8',
                    borderRadius: 6,
                    nodeType: 'box',
                    connectionColor: '#8892d8',  // Matches the level 3's borderColor
                    connectionTapered: false     // Use normal connections for level 4+
                },
                5: {
                    fontSize: 12,
                    backgroundColor: '#c3c9e9',
                    textColor: '#5562b6',
                    borderColor: '#a5add8',
                    borderRadius: 5,
                    nodeType: 'box',
                    connectionColor: '#8892d8',  // Matches the level 4's borderColor
                    connectionTapered: false     // Use normal connections for level 4+
                },
                6: {
                    fontSize: 12,
                    textColor: '#5562b6',
                    nodeType: 'text-only',
                    connectionColor: '#8892d8',  // Darker color to be more visible
                    connectionTapered: false     // Use normal connections for level 4+
                }
            },
            defaultStyle: {
                fontFamily: 'Arial, sans-serif',
                fontSize: 9,  // Smaller than level 6 (which is 10)
                nodeType: 'text-only',
                textColor: '#5562b6',
                connectionColor: '#8892d8',  // Darker color for better visibility
                connectionTapered: false  // Use normal connections (non-tapered) in default style
            }
        });
        return style;
    }

    /**
     * Corporate style preset - professional blue tones with square edges
     * @param {Style} style - The style object to configure
     * @return {Style} The configured style object
     */
    static corporateStyle(style) {
        style.configure({
            levelStyles: {
                1: {
                    fontSize: 24,
                    fontWeight: 'bold',
                    backgroundColor: '#0c3654',
                    textColor: '#ffffff',
                    borderColor: '#082538',
                    borderWidth: 2,
                    borderRadius: 2,
                    nodeType: 'box',
                    connectionColor: '#1a5276',
                    connectionTapered: true,
                    connectionStartWidth: 9,    // Professional, slightly thinner than default preset
                    connectionEndWidth: 3.5,    // Still substantial for corporate look
                    connectionGradient: true
                },
                2: {
                    fontSize: 18,
                    fontWeight: 'bold',
                    backgroundColor: '#1a5276',
                    textColor: '#ffffff',
                    borderColor: '#154360',
                    borderWidth: 1,
                    borderRadius: 2,
                    nodeType: 'box',
                    connectionColor: '#2874a6',
                    connectionTapered: true,
                    connectionStartWidth: 7.5,  // Gradually thinner
                    connectionEndWidth: 3,
                    connectionGradient: true
                },
                3: {
                    fontSize: 16,
                    backgroundColor: '#2874a6',
                    textColor: '#ffffff',
                    borderColor: '#1a5276',
                    borderRadius: 2,
                    nodeType: 'box',
                    connectionColor: '#3498db',
                    connectionTapered: true,
                    connectionStartWidth: 6,    // Gradually thinner
                    connectionEndWidth: 2.5,
                    connectionGradient: true
                },
                4: {
                    fontSize: 14,
                    backgroundColor: '#3498db',
                    textColor: '#ffffff',
                    borderColor: '#2874a6',
                    borderRadius: 2,
                    nodeType: 'box',
                    connectionColor: '#85c1e9',
                    connectionTapered: false    // Use normal connections for level 4+
                },
                5: {
                    fontSize: 13,
                    backgroundColor: '#85c1e9',
                    textColor: '#154360',
                    borderColor: '#3498db',
                    borderRadius: 2,
                    nodeType: 'box',
                    connectionColor: '#aed6f1',
                    connectionTapered: false    // Use normal connections for level 4+
                },
                6: {
                    fontSize: 12,
                    textColor: '#1a5276',
                    nodeType: 'text-only',
                    connectionColor: '#85c1e9',
                    connectionTapered: false    // Use normal connections for level 4+
                }
            },
            defaultStyle: {
                fontFamily: 'Calibri, Arial, sans-serif',
                fontSize: 9,  // Smaller than level 6 (which is 10)
                nodeType: 'text-only',
                textColor: '#1a5276',
                connectionColor: '#85c1e9',
                connectionTapered: false  // Use normal connections (non-tapered) in default style
            }
        });
        return style;
    }

    /**
     * Vibrant style preset - bright, contrasting colors
     * @param {Style} style - The style object to configure
     * @return {Style} The configured style object
     */
    static vibrantStyle(style) {
        style.configure({
            levelStyles: {
                1: {
                    fontSize: 24,
                    fontWeight: 'bold',
                    backgroundColor: '#c0392b',
                    textColor: '#ffffff',
                    borderColor: '#922b1f',
                    borderWidth: 3,
                    borderRadius: 18,
                    nodeType: 'box',
                    connectionColor: '#d35400',
                    parentConnectionPoints: 'distributeEvenly',
                    parentWidthPortionForConnectionPoints: 0.75,
                    connectionTapered: true,
                    connectionStartWidth: 12,    // Thicker for vibrant style
                    connectionEndWidth: 4.5,     // Still substantial for strong visual impact
                    connectionGradient: true
                },
                2: {
                    fontSize: 18,
                    fontWeight: 'bold',
                    backgroundColor: '#e74c3c',
                    textColor: '#ffffff',
                    borderColor: '#c0392b',
                    borderWidth: 2,
                    borderRadius: 15,
                    nodeType: 'box',
                    connectionColor: '#e67e22',
                    parentConnectionPoints: 'distributeEvenly',
                    connectionTapered: true,
                    connectionStartWidth: 10,    // Gradually thinner
                    connectionEndWidth: 3.5,
                    connectionGradient: true
                },
                3: {
                    fontSize: 16,
                    backgroundColor: '#f39c12',
                    textColor: '#ffffff',
                    borderColor: '#d35400',
                    borderRadius: 15,
                    nodeType: 'box',
                    connectionColor: '#f1c40f',
                    parentConnectionPoints: 'distributeEvenly',
                    connectionTapered: true,
                    connectionStartWidth: 8,     // Gradually thinner
                    connectionEndWidth: 3,
                    connectionGradient: true
                },
                4: {
                    fontSize: 14,
                    backgroundColor: '#27ae60',
                    textColor: '#ffffff',
                    borderColor: '#16a085',
                    borderRadius: 15,
                    nodeType: 'box',
                    connectionColor: '#2ecc71',
                    parentConnectionPoints: 'distributeEvenly',
                    connectionTapered: false    // Use normal connections for level 4+
                },
                5: {
                    fontSize: 13,
                    backgroundColor: '#2ecc71',
                    textColor: '#ffffff',
                    borderColor: '#27ae60',
                    borderRadius: 12,
                    nodeType: 'box',
                    connectionColor: '#7dcea0',
                    parentConnectionPoints: 'distributeEvenly',
                    connectionTapered: false    // Use normal connections for level 4+
                },
                6: {
                    fontSize: 12,
                    textColor: '#8e44ad',
                    nodeType: 'text-only',
                    connectionColor: '#9b59b6',
                    parentConnectionPoints: 'distributeEvenly',
                    connectionTapered: false    // Use normal connections for level 4+
                }
            },
            defaultStyle: {
                fontFamily: 'Verdana, sans-serif',
                fontSize: 9,  // Smaller than level 6 (which is 10)
                nodeType: 'text-only',
                textColor: '#8e44ad',
                connectionColor: '#9b59b6',
                parentConnectionPoints: 'distributeEvenly', // Enable evenly distributed connection points for vertical layouts
                connectionTapered: false  // Use normal connections (non-tapered) in default style
            }
        });
        return style;
    }

    /**
     * Pastel style preset - soft, muted colors
     * @param {Style} style - The style object to configure
     * @return {Style} The configured style object
     */
    static pastelStyle(style) {
        style.configure({
            levelStyles: {
                1: {
                    fontSize: 24,
                    fontWeight: 'bold',
                    backgroundColor: '#e8b5c7',
                    textColor: '#6e4a5f',
                    borderColor: '#d89fb2',
                    borderWidth: 2,
                    borderRadius: 25,
                    nodeType: 'box',
                    connectionColor: '#a35f7c',  // Even darker for better root connections
                    connectionTapered: true,
                    connectionStartWidth: 9,     // Soft, slightly thinner look for pastel
                    connectionEndWidth: 3.5,
                    connectionGradient: true
                },
                2: {
                    fontSize: 18,
                    fontWeight: 'bold',
                    backgroundColor: '#f8c9d8',
                    textColor: '#875573',
                    borderColor: '#e8b5c7',
                    borderWidth: 1,
                    borderRadius: 20,
                    nodeType: 'box',
                    connectionColor: '#c37a96',  // Much darker than backgroundColor for better visibility
                    connectionTapered: true,
                    connectionStartWidth: 7.5,   // Gradually thinner
                    connectionEndWidth: 3,
                    connectionGradient: true
                },
                3: {
                    fontSize: 16,
                    backgroundColor: '#a5dee5',
                    textColor: '#507b83',
                    borderColor: '#91cbd3',
                    borderRadius: 20,
                    nodeType: 'box',
                    connectionColor: '#6aa9b0',  // Much darker than backgroundColor
                    connectionTapered: true,
                    connectionStartWidth: 6,     // Gradually thinner
                    connectionEndWidth: 2.5,
                    connectionGradient: true
                },
                4: {
                    fontSize: 14,
                    backgroundColor: '#ffeaa7',
                    textColor: '#8e7e3f',
                    borderColor: '#f3dea0',
                    borderRadius: 20,
                    nodeType: 'box',
                    connectionColor: '#caa550',  // Darker golden tone for connections
                    connectionTapered: false     // Use normal connections for level 4+
                },
                5: {
                    fontSize: 13,
                    backgroundColor: '#c4e3a3',
                    textColor: '#5a6d43',
                    borderColor: '#b2d18e',
                    borderRadius: 18,
                    nodeType: 'box',
                    connectionColor: '#86a85b',  // Darker green for connections
                    connectionTapered: false     // Use normal connections for level 4+
                },
                6: {
                    fontSize: 12,
                    textColor: '#875573',
                    nodeType: 'text-only',
                    connectionColor: '#c37a96',  // Match level 2 connection color
                    connectionTapered: false     // Use normal connections for level 4+
                }
            },
            defaultStyle: {
                fontFamily: 'Comic Sans MS, cursive, sans-serif',
                fontSize: 9,  // Smaller than level 6 (which is 10)
                nodeType: 'text-only',
                textColor: '#875573',
                connectionColor: '#c37a96',  // Darker pink for better visibility
                connectionTapered: false  // Use normal connections (non-tapered) in default style
            }
        });
        return style;
    }

    /**
     * Monochrome style preset - black, white, and grays
     * @param {Style} style - The style object to configure
     * @return {Style} The configured style object
     */
    static monochromeStyle(style) {
        style.configure({
            levelStyles: {
                1: {
                    fontSize: 24,
                    fontWeight: 'bold',
                    backgroundColor: '#1c2833',
                    textColor: '#ffffff',
                    borderColor: '#0e1318',
                    borderWidth: 2,
                    borderRadius: 0,
                    nodeType: 'box',
                    connectionColor: '#34495e',
                    connectionTapered: true,
                    connectionStartWidth: 8,     // More subdued for monochrome style
                    connectionEndWidth: 3,
                    connectionGradient: false    // No gradients for clean monochrome look
                },
                2: {
                    fontSize: 18,
                    fontWeight: 'bold',
                    backgroundColor: '#2c3e50',
                    textColor: '#ffffff',
                    borderColor: '#1c2833',
                    borderWidth: 1,
                    borderRadius: 0,
                    nodeType: 'box',
                    connectionColor: '#566573',
                    connectionTapered: true,
                    connectionStartWidth: 7,    // Gradually thinner
                    connectionEndWidth: 2.75,
                    connectionGradient: false   // No gradients for clean monochrome look
                },
                3: {
                    fontSize: 16,
                    backgroundColor: '#566573',
                    textColor: '#ffffff',
                    borderColor: '#2c3e50',
                    borderRadius: 0,
                    nodeType: 'box',
                    connectionColor: '#808b96',
                    connectionTapered: true,
                    connectionStartWidth: 6,    // Gradually thinner
                    connectionEndWidth: 2.5,
                    connectionGradient: false   // No gradients for clean monochrome look
                },
                4: {
                    fontSize: 14,
                    backgroundColor: '#808b96',
                    textColor: '#ffffff',
                    borderColor: '#566573',
                    borderRadius: 0,
                    nodeType: 'box',
                    connectionColor: '#abb2b9',
                    connectionTapered: false    // Use normal connections for level 4+
                },
                5: {
                    fontSize: 13,
                    backgroundColor: '#abb2b9',
                    textColor: '#1c2833',
                    borderColor: '#808b96',
                    borderRadius: 0,
                    nodeType: 'box',
                    connectionColor: '#d5dbdb',
                    connectionTapered: false    // Use normal connections for level 4+
                },
                6: {
                    fontSize: 12,
                    textColor: '#2c3e50',
                    nodeType: 'text-only',
                    connectionColor: '#abb2b9',
                    connectionTapered: false    // Use normal connections for level 4+
                }
            },
            defaultStyle: {
                fontFamily: 'Courier New, monospace',
                fontSize: 9,  // Smaller than level 6 (which is 10)
                nodeType: 'text-only',
                textColor: '#2c3e50',
                connectionColor: '#abb2b9',
                connectionTapered: false   // Use normal connections (non-tapered) in default style
            }
        });
        return style;
    }

    /**
     * Nature style preset - organic greens and browns
     * @param {Style} style - The style object to configure
     * @return {Style} The configured style object
     */
    static natureStyle(style) {
        style.configure({
            levelStyles: {
                1: {
                    fontSize: 24,
                    fontWeight: 'bold',
                    backgroundColor: '#3d4d22',
                    textColor: '#ffffff',
                    borderColor: '#2c3618',
                    borderWidth: 2,
                    borderRadius: 10,
                    nodeType: 'box',
                    connectionColor: '#556b2f',
                    connectionTapered: true,
                    connectionStartWidth: 12,    // Thicker, branch-like for nature theme
                    connectionEndWidth: 4,
                    connectionGradient: true
                },
                2: {
                    fontSize: 18,
                    fontWeight: 'bold',
                    backgroundColor: '#556b2f',
                    textColor: '#ffffff',
                    borderColor: '#454f23',
                    borderWidth: 1,
                    borderRadius: 8,
                    nodeType: 'box',
                    connectionColor: '#6b8e23',
                    connectionTapered: true,
                    connectionStartWidth: 10,    // Gradually thinner
                    connectionEndWidth: 3.5,
                    connectionGradient: true
                },
                3: {
                    fontSize: 16,
                    backgroundColor: '#6b8e23',
                    textColor: '#ffffff',
                    borderColor: '#556b2f',
                    borderRadius: 8,
                    nodeType: 'box',
                    connectionColor: '#8fbc8f',
                    connectionTapered: true,
                    connectionStartWidth: 8,     // Gradually thinner
                    connectionEndWidth: 3,
                    connectionGradient: true
                },
                4: {
                    fontSize: 14,
                    backgroundColor: '#8fbc8f',
                    textColor: '#ffffff',
                    borderColor: '#6b8e23',
                    borderRadius: 8,
                    nodeType: 'box',
                    connectionColor: '#a9dfbf',
                    connectionTapered: false     // Use normal connections for level 4+
                },
                5: {
                    fontSize: 13,
                    backgroundColor: '#a9dfbf',
                    textColor: '#2c3618',
                    borderColor: '#8fbc8f',
                    borderRadius: 7,
                    nodeType: 'box',
                    connectionColor: '#c5e7d0',
                    connectionTapered: false     // Use normal connections for level 4+
                },
                6: {
                    fontSize: 12,
                    textColor: '#556b2f',
                    nodeType: 'text-only',
                    connectionColor: '#a9dfbf',
                    connectionTapered: false     // Use normal connections for level 4+
                }
            },
            defaultStyle: {
                fontFamily: 'Georgia, serif',
                fontSize: 9,  // Smaller than level 6 (which is 10)
                nodeType: 'text-only',
                textColor: '#556b2f',
                connectionColor: '#a9dfbf',
                connectionTapered: false  // Use normal connections (non-tapered) in default style
            }
        });
        return style;
    }

    /**
     * Tech style preset - dark mode with blue accents
     * @param {Style} style - The style object to configure
     * @return {Style} The configured style object
     */
    static techStyle(style) {
        style.configure({
            levelStyles: {
                1: {
                    fontSize: 24,
                    fontWeight: 'bold',
                    backgroundColor: '#121212',
                    textColor: '#61dafb',
                    borderColor: '#000000',
                    borderWidth: 3,
                    borderRadius: 6,
                    nodeType: 'box',
                    connectionColor: '#0078d7',
                    connectionTapered: true,
                    connectionStartWidth: 10,    // Sleek tech style connections
                    connectionEndWidth: 3,
                    connectionGradient: true
                },
                2: {
                    fontSize: 18,
                    fontWeight: 'bold',
                    backgroundColor: '#1e1e1e',
                    textColor: '#61dafb',
                    borderColor: '#121212',
                    borderWidth: 2,
                    borderRadius: 4,
                    nodeType: 'box',
                    connectionColor: '#528bff',
                    connectionTapered: true,
                    connectionStartWidth: 8,     // Gradually thinner
                    connectionEndWidth: 2.5,
                    connectionGradient: true
                },
                3: {
                    fontSize: 16,
                    backgroundColor: '#2d2d2d',
                    textColor: '#61dafb',
                    borderColor: '#1e1e1e',
                    borderRadius: 4,
                    nodeType: 'box',
                    connectionColor: '#528bff',
                    connectionTapered: true,
                    connectionStartWidth: 6,     // Gradually thinner
                    connectionEndWidth: 2,
                    connectionGradient: true
                },
                4: {
                    fontSize: 14,
                    backgroundColor: '#3c3c3c',
                    textColor: '#61dafb',
                    borderColor: '#2d2d2d',
                    borderRadius: 4,
                    nodeType: 'box',
                    connectionColor: '#528bff',
                    connectionTapered: false     // Use normal connections for level 4+
                },
                5: {
                    fontSize: 13,
                    backgroundColor: '#4a4a4a',
                    textColor: '#61dafb',
                    borderColor: '#3c3c3c',
                    borderRadius: 4,
                    nodeType: 'box',
                    connectionColor: '#528bff',
                    connectionTapered: false     // Use normal connections for level 4+
                },
                6: {
                    fontSize: 12,
                    textColor: '#61dafb',
                    nodeType: 'text-only',
                    connectionColor: '#528bff',
                    connectionTapered: false     // Use normal connections for level 4+
                }
            },
            defaultStyle: {
                fontFamily: 'Consolas, monospace',
                fontSize: 9,  // Smaller than level 6 (which is 10)
                nodeType: 'text-only',
                textColor: '#61dafb',
                connectionColor: '#528bff',
                connectionTapered: false  // Use normal connections (non-tapered) in default style
            }
        });
        return style;
    }

    /**
     * Retro style preset - nostalgic colors with pixelated look
     * @param {Style} style - The style object to configure
     * @return {Style} The configured style object
     */
    static retroStyle(style) {
        style.configure({
            levelStyles: {
                1: {
                    fontSize: 24,
                    fontWeight: 'bold',
                    backgroundColor: '#cc3333',
                    textColor: '#ffffff',
                    borderColor: '#992222',
                    borderWidth: 4,
                    borderRadius: 0,
                    nodeType: 'box',
                    connectionColor: '#cc3333',
                    connectionTapered: true,
                    connectionStartWidth: 9,     // Slightly pixelated appearance for retro
                    connectionEndWidth: 4,
                    connectionGradient: false    // No gradient for pixelated retro feel
                },
                2: {
                    fontSize: 18,
                    fontWeight: 'bold',
                    backgroundColor: '#ff6b6b',
                    textColor: '#ffffff',
                    borderColor: '#c23a3a',
                    borderWidth: 3,
                    borderRadius: 0,
                    nodeType: 'box',
                    connectionColor: '#ff9e9e',
                    connectionTapered: true,
                    connectionStartWidth: 8,     // Gradually thinner
                    connectionEndWidth: 3.5,
                    connectionGradient: false    // No gradient for pixelated retro feel
                },
                3: {
                    fontSize: 16,
                    backgroundColor: '#4ecdc4',
                    textColor: '#ffffff',
                    borderColor: '#30ada5',
                    borderRadius: 0,
                    nodeType: 'box',
                    connectionColor: '#83efe8',
                    connectionTapered: true,
                    connectionStartWidth: 7,     // Gradually thinner
                    connectionEndWidth: 3,
                    connectionGradient: false    // No gradient for pixelated retro feel
                },
                4: {
                    fontSize: 14,
                    backgroundColor: '#ffe66d',
                    textColor: '#5e5721',
                    borderColor: '#d4be4c',
                    borderRadius: 0,
                    nodeType: 'box',
                    connectionColor: '#efe1a5',
                    connectionTapered: false     // Use normal connections for level 4+
                },
                5: {
                    fontSize: 13,
                    backgroundColor: '#ff9e9e',
                    textColor: '#8e2323',
                    borderColor: '#ff6b6b',
                    borderRadius: 0,
                    nodeType: 'box',
                    connectionColor: '#ffc8c8',
                    connectionTapered: false     // Use normal connections for level 4+
                },
                6: {
                    fontSize: 12,
                    textColor: '#ff6b6b',
                    nodeType: 'text-only',
                    connectionColor: '#ff9e9e',
                    connectionTapered: false     // Use normal connections for level 4+
                }
            },
            defaultStyle: {
                fontFamily: 'Press Start 2P, monospace',
                fontSize: 9,  // Smaller than level 6 (which is 10)
                nodeType: 'text-only',
                textColor: '#ff6b6b',
                connectionColor: '#ff9e9e',
                connectionTapered: false   // Use normal connections (non-tapered) in default style
            }
        });
        return style;
    }

    /**
     * Minimal style preset - clean, simple, mostly white
     * @param {Style} style - The style object to configure
     * @return {Style} The configured style object
     */
    static minimalStyle(style) {
        style.configure({
            levelStyles: {
                1: {
                    fontSize: 24,
                    fontWeight: 'bold',
                    backgroundColor: '#f0f0f0',
                    textColor: '#222222',
                    borderColor: '#aaaaaa',
                    borderWidth: 2,
                    borderRadius: 6,
                    nodeType: 'box',
                    connectionColor: '#666666',
                    connectionTapered: true,
                    connectionStartWidth: 7,     // Subtle, thin for minimal style
                    connectionEndWidth: 3,
                    connectionGradient: false    // Clean, flat look without gradients
                },
                2: {
                    fontSize: 18,
                    fontWeight: 'bold',
                    backgroundColor: '#ffffff',
                    textColor: '#333333',
                    borderColor: '#e6e6e6',
                    borderWidth: 1,
                    borderRadius: 4,
                    nodeType: 'box',
                    connectionColor: '#888888',  // Much darker than the original #cccccc for better visibility
                    connectionTapered: true,
                    connectionStartWidth: 6,     // Gradually thinner
                    connectionEndWidth: 2.5,
                    connectionGradient: false    // Clean, flat look without gradients
                },
                3: {
                    fontSize: 16,
                    backgroundColor: '#f9f9f9',
                    textColor: '#333333',
                    borderColor: '#e6e6e6',
                    borderRadius: 4,
                    nodeType: 'box',
                    connectionColor: '#999999',  // Darker than the original
                    connectionTapered: true,
                    connectionStartWidth: 5,     // Gradually thinner
                    connectionEndWidth: 2,
                    connectionGradient: false    // Clean, flat look without gradients
                },
                4: {
                    fontSize: 14,
                    backgroundColor: '#f2f2f2',
                    textColor: '#333333',
                    borderColor: '#e6e6e6',
                    borderRadius: 4,
                    nodeType: 'box',
                    connectionColor: '#aaaaaa',  // Still darker than original but lighter than level 3
                    connectionTapered: false     // Use normal connections for level 4+
                },
                5: {
                    fontSize: 13,
                    backgroundColor: '#e9e9e9',
                    textColor: '#444444',
                    borderColor: '#dddddd',
                    borderRadius: 4,
                    nodeType: 'box',
                    connectionColor: '#bbbbbb',
                    connectionTapered: false     // Use normal connections for level 4+
                },
                6: {
                    fontSize: 12,
                    textColor: '#666666',
                    nodeType: 'text-only',
                    connectionColor: '#888888',  // Match level 2 connection color for consistency
                    connectionTapered: false     // Use normal connections for level 4+
                }
            },
            defaultStyle: {
                fontFamily: 'Helvetica, Arial, sans-serif',
                fontSize: 9,  // Smaller than level 6 (which is 10)
                nodeType: 'text-only',
                textColor: '#666666',
                connectionColor: '#888888',  // Darker for better visibility
                connectionTapered: false     // Use normal connections (non-tapered) in default style
            }
        });
        return style;
    }

    /**
     * Creative style preset - artistic colors with rounded shapes
     * @param {Style} style - The style object to configure
     * @return {Style} The configured style object
     */
    static creativeStyle(style) {
        style.configure({
            levelStyles: {
                1: {
                    fontSize: 24,
                    fontWeight: 'bold',
                    backgroundColor: '#7b1fa2',
                    textColor: '#ffffff',
                    borderColor: '#6a1b9a',
                    borderWidth: 3,
                    borderRadius: 30,
                    nodeType: 'box',
                    connectionColor: '#8e24aa',
                    connectionTapered: true,
                    connectionStartWidth: 14,   // Extra thick for creative style
                    connectionEndWidth: 5,
                    connectionGradient: true
                },
                2: {
                    fontSize: 18,
                    fontWeight: 'bold',
                    backgroundColor: '#9c27b0',
                    textColor: '#ffffff',
                    borderColor: '#7b1fa2',
                    borderWidth: 2,
                    borderRadius: 25,
                    nodeType: 'box',
                    connectionColor: '#ba68c8',
                    connectionTapered: true,
                    connectionStartWidth: 11,   // Gradually thinner
                    connectionEndWidth: 4,
                    connectionGradient: true
                },
                3: {
                    fontSize: 16,
                    backgroundColor: '#00bcd4',
                    textColor: '#ffffff',
                    borderColor: '#0097a7',
                    borderRadius: 25,
                    nodeType: 'box',
                    connectionColor: '#4dd0e1',
                    connectionTapered: true,
                    connectionStartWidth: 9,    // Gradually thinner
                    connectionEndWidth: 3,
                    connectionGradient: true
                },
                4: {
                    fontSize: 14,
                    backgroundColor: '#ffeb3b',
                    textColor: '#795548',
                    borderColor: '#fdd835',
                    borderRadius: 25,
                    nodeType: 'box',
                    connectionColor: '#d0d075',
                    connectionTapered: false    // Use normal connections for level 4+
                },
                5: {
                    fontSize: 13,
                    backgroundColor: '#ce93d8',
                    textColor: '#4a148c',
                    borderColor: '#ab47bc',
                    borderRadius: 22,
                    nodeType: 'box',
                    connectionColor: '#e1bee7',
                    connectionTapered: false    // Use normal connections for level 4+
                },
                6: {
                    fontSize: 12,
                    textColor: '#9c27b0',
                    nodeType: 'text-only',
                    connectionColor: '#ce93d8',
                    connectionTapered: false    // Use normal connections for level 4+
                }
            },
            defaultStyle: {
                fontFamily: 'Segoe UI, Tahoma, sans-serif',
                fontSize: 9,  // Smaller than level 6 (which is 10)
                nodeType: 'text-only',
                textColor: '#9c27b0',
                connectionColor: '#ce93d8',
                connectionTapered: false  // Use normal connections (non-tapered) in default style
            }
        });
        return style;
    }
}

export default MindmapStylePresets;