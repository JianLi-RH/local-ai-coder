# Local AI Coder

A VS Code extension that uses local AI models (via Ollama) to update project code.

## Features

- Supports Ollama local AI model server
- Configurable API URL, model name, and timeout settings
- Interactive webview chat interface
- Commands for activation, help, configuration, and exit
- Code operation commands: update, explain, and fix selected code
- Ability to process code changes from AI responses

## Requirements

- VS Code 1.75.0 or higher
- Ollama installed and running locally
- A supported model (e.g., qwen3-coder, llama2, etc.)

## Installation

1. Clone this repository
2. Run `npm install` to install dependencies
3. Update copy-assets in package.json against your OS (copy for windows cp for linux)
4. Run `npm run compile` to build the extension
5. Press `F5` to launch the extension in debug mode

## Configuration

The extension can be configured via VS Code settings:

- `ollama-coder.apiBaseUrl`: API base URL for Ollama (default: http://localhost:11434/v1)
- `ollama-coder.modelName`: AI model to use (default: qwen3-coder:30b)
- `ollama-coder.apiKey`: API key for Ollama (default: ollama)
- `ollama-coder.timeout`: Request timeout in seconds (default: 600)

## Usage

### Basic Chat

1. Activate the extension by running the `Activate Local AI Coder` command after pressing `Ctrl+Shift+P`
2. A webview panel will open with the Local AI Coder interface
3. Use the buttons in the panel to:
   - **Help** - Show available commands and usage information
   - **Configure** - Open configuration settings
   - **Exit** - Close the panel
4. Use the chat input box to send messages to the AI:
   - Type your message in the input field
   - Click "Send" button or press Enter
   - The AI response will appear in the messages area
5. Configure your AI model settings in VS Code settings before using the chat feature

### Code Operations

1. **Update Code**: Select code in the editor, then run `Update Selected Code` command. Enter instructions for the update when prompted.

2. **Explain Code**: Select code in the editor, then run `Explain Selected Code` command. The AI will provide a detailed explanation of the code.

3. **Fix Code**: Select code in the editor, then run `Fix Selected Code` command. Describe the problem when prompted, and the AI will fix the code.

## Commands

- `local-ai-coder.activate`: Activate the extension and open webview panel
- `local-ai-coder.help`: Show help message
- `local-ai-coder.configure`: Open configuration settings
- `local-ai-coder.exit`: Deactivate the extension
- `local-ai-coder.updateCode`: Update selected code based on instructions
- `local-ai-coder.explainCode`: Explain selected code
- `local-ai-coder.fixCode`: Fix selected code based on problem description

## Example

### Basic Chat Example

1. Activate the extension by running `Activate Local AI Coder` command
2. The webview panel will open automatically
3. Click "Configure" button to open settings and verify your AI model configuration
4. In the chat input box, type a message like "Refactor this function to be more efficient"
5. Click "Send" button or press Enter
6. The AI will respond with suggestions and code changes in the messages area

### Code Update Example

1. Select some code in the editor
2. Open the command palette (Ctrl+Shift+P)
3. Run `Update Selected Code` command
4. Enter instructions like "Make this function more efficient"
5. The AI will provide updated code based on your instructions

## Supported Models

- qwen3-coder (recommended)
- llama2
- Any other model supported by Ollama

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT