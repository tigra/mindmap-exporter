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
                    fontSize: 18,
                    fontWeight: 'bold',
                    backgroundColor: '#6a75c9',
                    textColor: '#ffffff',
                    borderColor: '#5562b6',
                    borderWidth: 2,
                    borderRadius: 10,
                    nodeType: 'box',
                    connectionColor: '#5562b6'  // Darker than the backgroundColor
                },
                2: {
                    fontSize: 16,
                    backgroundColor: '#8892d8',
                    textColor: '#ffffff',
                    borderColor: '#6a75c9',
                    borderRadius: 8,
                    nodeType: 'box',
                    connectionColor: '#6a75c9'  // Matches the level 1's borderColor
                },
                3: {
                    fontSize: 14,
                    backgroundColor: '#a5add8',
                    textColor: '#ffffff',
                    borderColor: '#8892d8',
                    borderRadius: 6,
                    nodeType: 'box',
                    connectionColor: '#8892d8'  // Matches the level 2's borderColor
                },
                4: {
                    fontSize: 12,
                    textColor: '#5562b6',
                    nodeType: 'text-only',
                    connectionColor: '#8892d8'  // Darker color to be more visible
                }
            },
            defaultStyle: {
                fontFamily: 'Arial, sans-serif',
                nodeType: 'text-only',
                textColor: '#5562b6',
                connectionColor: '#8892d8'  // Darker color for better visibility
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
                    fontSize: 18,
                    fontWeight: 'bold',
                    backgroundColor: '#1a5276',
                    textColor: '#ffffff',
                    borderColor: '#154360',
                    borderWidth: 1,
                    borderRadius: 2,
                    nodeType: 'box',
                    connectionColor: '#2874a6'
                },
                2: {
                    fontSize: 16,
                    backgroundColor: '#2874a6',
                    textColor: '#ffffff',
                    borderColor: '#1a5276',
                    borderRadius: 2,
                    nodeType: 'box',
                    connectionColor: '#3498db'
                },
                3: {
                    fontSize: 14,
                    backgroundColor: '#3498db',
                    textColor: '#ffffff',
                    borderColor: '#2874a6',
                    borderRadius: 2,
                    nodeType: 'box',
                    connectionColor: '#85c1e9'
                },
                4: {
                    fontSize: 12,
                    textColor: '#1a5276',
                    nodeType: 'text-only',
                    connectionColor: '#85c1e9'
                }
            },
            defaultStyle: {
                fontFamily: 'Calibri, Arial, sans-serif',
                nodeType: 'text-only',
                textColor: '#1a5276',
                connectionColor: '#85c1e9'
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
                    fontSize: 18,
                    fontWeight: 'bold',
                    backgroundColor: '#e74c3c',
                    textColor: '#ffffff',
                    borderColor: '#c0392b',
                    borderWidth: 2,
                    borderRadius: 15,
                    nodeType: 'box',
                    connectionColor: '#e67e22'
                },
                2: {
                    fontSize: 16,
                    backgroundColor: '#f39c12',
                    textColor: '#ffffff',
                    borderColor: '#d35400',
                    borderRadius: 15,
                    nodeType: 'box',
                    connectionColor: '#f1c40f'
                },
                3: {
                    fontSize: 14,
                    backgroundColor: '#27ae60',
                    textColor: '#ffffff',
                    borderColor: '#16a085',
                    borderRadius: 15,
                    nodeType: 'box',
                    connectionColor: '#2ecc71'
                },
                4: {
                    fontSize: 12,
                    textColor: '#8e44ad',
                    nodeType: 'text-only',
                    connectionColor: '#9b59b6'
                }
            },
            defaultStyle: {
                fontFamily: 'Verdana, sans-serif',
                nodeType: 'text-only',
                textColor: '#8e44ad',
                connectionColor: '#9b59b6'
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
                    fontSize: 18,
                    fontWeight: 'bold',
                    backgroundColor: '#f8c9d8',
                    textColor: '#875573',
                    borderColor: '#e8b5c7',
                    borderWidth: 1,
                    borderRadius: 20,
                    nodeType: 'box',
                    connectionColor: '#c37a96'  // Much darker than backgroundColor for better visibility
                },
                2: {
                    fontSize: 16,
                    backgroundColor: '#a5dee5',
                    textColor: '#507b83',
                    borderColor: '#91cbd3',
                    borderRadius: 20,
                    nodeType: 'box',
                    connectionColor: '#6aa9b0'  // Much darker than backgroundColor
                },
                3: {
                    fontSize: 14,
                    backgroundColor: '#ffeaa7',
                    textColor: '#8e7e3f',
                    borderColor: '#f3dea0',
                    borderRadius: 20,
                    nodeType: 'box',
                    connectionColor: '#caa550'  // Darker golden tone for connections
                },
                4: {
                    fontSize: 12,
                    textColor: '#875573',
                    nodeType: 'text-only',
                    connectionColor: '#c37a96'  // Match level 1 connection color
                }
            },
            defaultStyle: {
                fontFamily: 'Comic Sans MS, cursive, sans-serif',
                nodeType: 'text-only',
                textColor: '#875573',
                connectionColor: '#c37a96'  // Darker pink for better visibility
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
                    fontSize: 18,
                    fontWeight: 'bold',
                    backgroundColor: '#2c3e50',
                    textColor: '#ffffff',
                    borderColor: '#1c2833',
                    borderWidth: 1,
                    borderRadius: 0,
                    nodeType: 'box',
                    connectionColor: '#566573'
                },
                2: {
                    fontSize: 16,
                    backgroundColor: '#566573',
                    textColor: '#ffffff',
                    borderColor: '#2c3e50',
                    borderRadius: 0,
                    nodeType: 'box',
                    connectionColor: '#808b96'
                },
                3: {
                    fontSize: 14,
                    backgroundColor: '#808b96',
                    textColor: '#ffffff',
                    borderColor: '#566573',
                    borderRadius: 0,
                    nodeType: 'box',
                    connectionColor: '#abb2b9'
                },
                4: {
                    fontSize: 12,
                    textColor: '#2c3e50',
                    nodeType: 'text-only',
                    connectionColor: '#abb2b9'
                }
            },
            defaultStyle: {
                fontFamily: 'Courier New, monospace',
                nodeType: 'text-only',
                textColor: '#2c3e50',
                connectionColor: '#abb2b9'
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
                    fontSize: 18,
                    fontWeight: 'bold',
                    backgroundColor: '#556b2f',
                    textColor: '#ffffff',
                    borderColor: '#454f23',
                    borderWidth: 1,
                    borderRadius: 8,
                    nodeType: 'box',
                    connectionColor: '#6b8e23'
                },
                2: {
                    fontSize: 16,
                    backgroundColor: '#6b8e23',
                    textColor: '#ffffff',
                    borderColor: '#556b2f',
                    borderRadius: 8,
                    nodeType: 'box',
                    connectionColor: '#8fbc8f'
                },
                3: {
                    fontSize: 14,
                    backgroundColor: '#8fbc8f',
                    textColor: '#ffffff',
                    borderColor: '#6b8e23',
                    borderRadius: 8,
                    nodeType: 'box',
                    connectionColor: '#a9dfbf'
                },
                4: {
                    fontSize: 12,
                    textColor: '#556b2f',
                    nodeType: 'text-only',
                    connectionColor: '#a9dfbf'
                }
            },
            defaultStyle: {
                fontFamily: 'Georgia, serif',
                nodeType: 'text-only',
                textColor: '#556b2f',
                connectionColor: '#a9dfbf'
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
                    fontSize: 18,
                    fontWeight: 'bold',
                    backgroundColor: '#1e1e1e',
                    textColor: '#61dafb',
                    borderColor: '#121212',
                    borderWidth: 1,
                    borderRadius: 4,
                    nodeType: 'box',
                    connectionColor: '#528bff'
                },
                2: {
                    fontSize: 16,
                    backgroundColor: '#2d2d2d',
                    textColor: '#61dafb',
                    borderColor: '#1e1e1e',
                    borderRadius: 4,
                    nodeType: 'box',
                    connectionColor: '#528bff'
                },
                3: {
                    fontSize: 14,
                    backgroundColor: '#3c3c3c',
                    textColor: '#61dafb',
                    borderColor: '#2d2d2d',
                    borderRadius: 4,
                    nodeType: 'box',
                    connectionColor: '#528bff'
                },
                4: {
                    fontSize: 12,
                    textColor: '#61dafb',
                    nodeType: 'text-only',
                    connectionColor: '#528bff'
                }
            },
            defaultStyle: {
                fontFamily: 'Consolas, monospace',
                nodeType: 'text-only',
                textColor: '#61dafb',
                connectionColor: '#528bff'
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
                    fontSize: 18,
                    fontWeight: 'bold',
                    backgroundColor: '#ff6b6b',
                    textColor: '#ffffff',
                    borderColor: '#c23a3a',
                    borderWidth: 3,
                    borderRadius: 0,
                    nodeType: 'box',
                    connectionColor: '#ff9e9e'
                },
                2: {
                    fontSize: 16,
                    backgroundColor: '#4ecdc4',
                    textColor: '#ffffff',
                    borderColor: '#30ada5',
                    borderRadius: 0,
                    nodeType: 'box',
                    connectionColor: '#83efe8'
                },
                3: {
                    fontSize: 14,
                    backgroundColor: '#ffe66d',
                    textColor: '#5e5721',
                    borderColor: '#d4be4c',
                    borderRadius: 0,
                    nodeType: 'box',
                    connectionColor: '#efe1a5'
                },
                4: {
                    fontSize: 12,
                    textColor: '#ff6b6b',
                    nodeType: 'text-only',
                    connectionColor: '#ff9e9e'
                }
            },
            defaultStyle: {
                fontFamily: 'Press Start 2P, monospace',
                nodeType: 'text-only',
                textColor: '#ff6b6b',
                connectionColor: '#ff9e9e'
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
                    fontSize: 18,
                    fontWeight: 'bold',
                    backgroundColor: '#ffffff',
                    textColor: '#333333',
                    borderColor: '#e6e6e6',
                    borderWidth: 1,
                    borderRadius: 4,
                    nodeType: 'box',
                    connectionColor: '#888888'  // Much darker than the original #cccccc for better visibility
                },
                2: {
                    fontSize: 16,
                    backgroundColor: '#f9f9f9',
                    textColor: '#333333',
                    borderColor: '#e6e6e6',
                    borderRadius: 4,
                    nodeType: 'box',
                    connectionColor: '#999999'  // Darker than the original
                },
                3: {
                    fontSize: 14,
                    backgroundColor: '#f2f2f2',
                    textColor: '#333333',
                    borderColor: '#e6e6e6',
                    borderRadius: 4,
                    nodeType: 'box',
                    connectionColor: '#aaaaaa'  // Still darker than original but lighter than level 2
                },
                4: {
                    fontSize: 12,
                    textColor: '#666666',
                    nodeType: 'text-only',
                    connectionColor: '#888888'  // Match level 1 connection color for consistency
                }
            },
            defaultStyle: {
                fontFamily: 'Helvetica, Arial, sans-serif',
                nodeType: 'text-only',
                textColor: '#666666',
                connectionColor: '#888888'  // Darker for better visibility
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
                    fontSize: 18,
                    fontWeight: 'bold',
                    backgroundColor: '#9c27b0',
                    textColor: '#ffffff',
                    borderColor: '#7b1fa2',
                    borderWidth: 2,
                    borderRadius: 25,
                    nodeType: 'box',
                    connectionColor: '#ba68c8'
                },
                2: {
                    fontSize: 16,
                    backgroundColor: '#00bcd4',
                    textColor: '#ffffff',
                    borderColor: '#0097a7',
                    borderRadius: 25,
                    nodeType: 'box',
                    connectionColor: '#4dd0e1'
                },
                3: {
                    fontSize: 14,
                    backgroundColor: '#ffeb3b',
                    textColor: '#795548',
                    borderColor: '#fdd835',
                    borderRadius: 25,
                    nodeType: 'box',
                    connectionColor: '#d0d075'
                },
                4: {
                    fontSize: 12,
                    textColor: '#9c27b0',
                    nodeType: 'text-only',
                    connectionColor: '#ce93d8'
                }
            },
            defaultStyle: {
                fontFamily: 'Segoe UI, Tahoma, sans-serif',
                nodeType: 'text-only',
                textColor: '#9c27b0',
                connectionColor: '#ce93d8'
            }
        });
        return style;
    }
}

export default MindmapStylePresets;