# AI Painter

AI-powered painting tool for Obsidian with ComfyUI integration

## Installation

1. Download the latest release from GitHub
2. Extract the files to your vault's `.obsidian/plugins/ai-painter/` folder
3. Reload Obsidian and enable the plugin in Settings → Community plugins

## Features

- Layer-based painting with professional tools
- AI image generation with ComfyUI integration
- PSD file support
- Canvas drawing and editing tools
- Color mixing and blend modes

## Setup AI Features (Optional)

**Note**: AI features require ComfyUI running locally on your machine. This plugin will communicate with `localhost:8188` (or your configured port) to generate images.

1. Install [ComfyUI Desktop](https://github.com/comfyanonymous/ComfyUI)
2. Configure CORS settings in ComfyUI to allow connections
3. Set ComfyUI API URL in plugin settings (default: `http://localhost:8188`)
4. Test connection

**Security Note**: This plugin only communicates with locally-running ComfyUI. No data is sent to external servers.

For detailed setup instructions, visit the project repository.