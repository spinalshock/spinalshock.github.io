# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal knowledge base website built with Docusaurus 3.7, featuring a blog, documentation sections, and a custom pastebin-like page with vim-style keybindings and compression features.

## Common Commands

### Development
- `npm start` - Start development server (accessible at 0.0.0.0)
- `npm run build` - Build static site for production
- `npm run serve` - Serve built site locally
- `npm run typecheck` - Run TypeScript type checking
- `npm run clear` - Clear Docusaurus cache

### Other Commands
- `npm run swizzle` - Customize Docusaurus components
- `npm run deploy` - Deploy to GitHub Pages
- `npm run write-translations` - Generate translation files
- `npm run write-heading-ids` - Auto-generate heading IDs

Note: README mentions yarn commands, but package.json uses npm scripts.

## Architecture

### Core Structure
- **Docusaurus Site**: Classic preset with docs, blog, and custom pages
- **Content**: Blog posts in `/blog/`, documentation in `/docs/` with category-based organization
- **Custom Components**: Located in `/src/components/` with specialized functionality
- **Theme**: Dark mode by default with custom CSS overrides

### Key Features

#### Paste Page (`/src/pages/paste.tsx`)
- Vim-style modal editing with keyboard shortcuts
- Compression using Zstd for content > 100 bytes
- Base64 encoding for URL storage
- MDX preview with syntax highlighting
- Toast notifications for user feedback

#### Custom Components
- **KeyboardShortcuts**: Vim-like keybinding system
- **MdxComponents**: Custom renderers including Codeblock component
- **BlogLayout**: Theme override for blog styling

### Configuration
- Site configured for GitHub Pages deployment (`spinalshock.github.io`)
- TypeScript support with strict type checking
- Custom webpack plugin in `/plugins/custom-webpack/`
- Prism syntax highlighting with bash and lua support

### Dependencies
- React 19 with MDX support
- Zstd compression (`@oneidentity/zstd-js`)
- React MD Editor for live editing
- React Syntax Highlighter for code blocks
- Toast notifications for UX feedback

## File Organization
- `/blog/` - Blog posts with YAML frontmatter
- `/docs/` - Documentation organized by categories (js/, html/, miscellaneous/, tutorial-*)
- `/src/components/` - React components with TypeScript
- `/src/utils/` - Utility functions (base64-helper.ts)
- `/static/img/` - Static assets and favicons