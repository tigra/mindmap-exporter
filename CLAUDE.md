# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Browser-based mindmap exporter that converts Markdown to visual mindmaps (SVG/PNG).

## Running the Application
- Open `index.html` directly in a browser

## Code Style Guidelines
- **Stubs and Fallbacks Discouraged** - don't create fallbacks unless explicitly asked for. When something is broken, fix it from the first principles, not by stub or fallback.
- **Normal imports**: Imports at start of the file, no ES imports. You have Vite.
- **Formatting**: 2-space indentation, ES6 module syntax
- **Naming**: Classes in PascalCase, methods/variables in camelCase
- **Documentation**: Use JSDoc for classes/methods, add inline comments for complex logic
- **Architecture**: Follow existing MVC pattern (model, controller, renderer)
- **Imports**: Group by category (core, models, utilities)
- **Error Handling**: Use console.error for warnings, check objects before operations

## File Organization
- `model/`: Data structures (Node, Integration, etc.)
- `controller/`: User interaction logic
- `layout/`: Various layout strategies
- `renderer/`: Visualization rendering
- `style/`: Appearance configurations
- `utils/`: Helper functions

When modifying code, always match existing patterns and maintain architectural separation.
