// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Base public path when deployed to GitHub Pages
  base: './', // Use relative paths for GitHub Pages compatibility
  
  // Configure server options for development
  server: {
    open: true, // Automatically open browser on dev server start
  },
  
  // Build options
  build: {
    outDir: 'dist', // Output directory for build
    assetsDir: 'assets', // Directory for assets in output
    minify: true, // Enable minification
    sourcemap: true, // Generate sourcemaps for debugging
    
    // Fix HTML output path by using root as input
    rollupOptions: {
      input: {
        main: 'index.html',
      },
    },
  },
});