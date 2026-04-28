import * as vscode from 'vscode';
import { LocalAICoderPanel } from './webview/LocalAICoderPanel';
import { OllamaClient } from './ollamaClient';

class LocalAICoder {
    private outputChannel: vscode.OutputChannel;
    private isActive: boolean = false;
    private ollamaClient: OllamaClient;

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('Local AI Coder');
        this.ollamaClient = new OllamaClient();
    }

    public activate() {
        this.isActive = true;
        LocalAICoderPanel.createOrShow();
        this.outputChannel.appendLine('Local AI Coder activated!');
    }

    public deactivate() {
        this.isActive = false;
        if (LocalAICoderPanel.currentPanel) {
            LocalAICoderPanel.currentPanel.dispose();
        }
        this.outputChannel.appendLine('Local AI Coder deactivated.');
    }

    public showHelp() {
        const helpText = '=== Local AI Coder Help ===\n\n' +
            'Available Commands:\n' +
            '? Help - Show this help message\n' +
            '? Configure - Open configuration settings\n' +
            '? Chat - Send a message to the AI\n' +
            '? Exit - Close the panel\n\n' +
            'Configuration:\n' +
            '? API Base URL: http://localhost:11434/v1\n' +
            '? Model: qwen3-coder:30b\n\n' +
            'Usage:\n' +
            '1. Configure your AI model settings\n' +
            '2. Type your message in the chat box\n' +
            '3. Click Send or press Enter\n' +
            '4. AI will respond with suggestions\n' +
            '==========================';
        
        this.outputChannel.appendLine(helpText);
        
        if (LocalAICoderPanel.currentPanel) {
            LocalAICoderPanel.currentPanel.postMessage({ type: 'help', text: helpText.replace(/\n/g, '<br>') });
        }
    }

    public async openConfiguration() {
        await vscode.commands.executeCommand('workbench.action.openSettings', 'ollama-coder');
        this.outputChannel.appendLine('Configuration settings opened.');
        
        if (LocalAICoderPanel.currentPanel) {
            LocalAICoderPanel.currentPanel.postMessage({ type: 'system', text: 'Configuration settings opened.' });
        }
    }

    public async chat(message: string) {
        this.outputChannel.appendLine(`You: ${message}`);

        try {
            // Extract file names mentioned in the message and read their contents
            const fileContents = await this.extractAndReadFiles(message);
            this.outputChannel.appendLine(`system: File Contents: ${JSON.stringify(fileContents)}`);
            const response = await this.ollamaClient.generateCompletion(message, fileContents);
            this.outputChannel.appendLine(`AI: ${response}`);
            
            if (LocalAICoderPanel.currentPanel) {
                LocalAICoderPanel.currentPanel.postMessage({ type: 'aiResponse', text: response });
            }
            
            await this.processCodeChanges(response);
        } catch (error) {
            const errorMsg = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
            this.outputChannel.appendLine(errorMsg);
            if (LocalAICoderPanel.currentPanel) {
                LocalAICoderPanel.currentPanel.postMessage({ type: 'aiResponse', text: errorMsg });
            }
        }
    }

    public async updateCode(selectedCode: string, instruction: string) {
        try {
            const response = await this.ollamaClient.updateCode(selectedCode, instruction);
            
            this.outputChannel.appendLine('Code updated successfully!');
            
            if (LocalAICoderPanel.currentPanel) {
                LocalAICoderPanel.currentPanel.postMessage({ type: 'aiResponse', text: response });
            }
            
            return response;
        } catch (error) {
            const errorMsg = `Error updating code: ${error instanceof Error ? error.message : 'Unknown error'}`;
            this.outputChannel.appendLine(errorMsg);
            if (LocalAICoderPanel.currentPanel) {
                LocalAICoderPanel.currentPanel.postMessage({ type: 'aiResponse', text: errorMsg });
            }
            throw error;
        }
    }

    public async explainCode(code: string) {
        try {
            const response = await this.ollamaClient.explainCode(code);
            
            this.outputChannel.appendLine('Code explanation:');
            this.outputChannel.appendLine(response);
            
            if (LocalAICoderPanel.currentPanel) {
                LocalAICoderPanel.currentPanel.postMessage({ type: 'aiResponse', text: response });
            }
            
            return response;
        } catch (error) {
            const errorMsg = `Error explaining code: ${error instanceof Error ? error.message : 'Unknown error'}`;
            this.outputChannel.appendLine(errorMsg);
            if (LocalAICoderPanel.currentPanel) {
                LocalAICoderPanel.currentPanel.postMessage({ type: 'user', text: errorMsg });
            }
            throw error;
        }
    }

    public async fixCode(code: string, problem: string) {
        try {
            const response = await this.ollamaClient.fixCode(code, problem);
            
            this.outputChannel.appendLine('Code fixed successfully!');
            
            if (LocalAICoderPanel.currentPanel) {
                LocalAICoderPanel.currentPanel.postMessage({ type: 'aiResponse', text: response });
            }
            
            return response;
        } catch (error) {
            const errorMsg = `Error fixing code: ${error instanceof Error ? error.message : 'Unknown error'}`;
            this.outputChannel.appendLine(errorMsg);
            if (LocalAICoderPanel.currentPanel) {
                LocalAICoderPanel.currentPanel.postMessage({ type: 'aiResponse', text: errorMsg });
            }
            throw error;
        }
    }

    private async extractAndReadFiles(message: string): Promise<Record<string, string>> {
        const fileContents: Record<string, string> = {};
        
        // Pattern to match file names mentioned in the message
        // Matches common file extensions like .ts, .js, .py, .java, .cpp, .go, .rs, .json, .md, .html, .css
        const fileNamePattern = /\b([a-zA-Z0-9_.-]+\.(?:ts|js|py|java|cpp|go|rs|json|md|html|css|vue|react|svelte))\b/g;
        
        const matches = message.match(fileNamePattern);
        if (!matches || !vscode.workspace.workspaceFolders) {
            return fileContents;
        }
        
        const workspaceFolder = vscode.workspace.workspaceFolders[0];
        
        for (const fileName of matches) {
            try {
                // Search for the file in the workspace
                const files = await vscode.workspace.findFiles(`**/${fileName}`);
                if (files.length > 0) {
                    const fileUri = files[0];
                    const document = await vscode.workspace.openTextDocument(fileUri);
                    fileContents[fileName] = document.getText();
                    this.outputChannel.appendLine(`Read file: ${fileName}`);
                }
            } catch (error) {
                this.outputChannel.appendLine(`Error reading file ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        
        return fileContents;
    }

    private async processCodeChanges(response: string) {
        const codeBlocks = response.match(/```[\s\S]*?```/g);
        if (codeBlocks) {
            this.outputChannel.appendLine('Detected code blocks in response.');
        }
    }

    public exit() {
        this.deactivate();
    }
}

let localAICoder: LocalAICoder;

export function activate(context: vscode.ExtensionContext) {
    localAICoder = new LocalAICoder();

    let activateCommand = vscode.commands.registerCommand('local-ai-coder.activate', () => {
        localAICoder.activate();
    });

    let helpCommand = vscode.commands.registerCommand('local-ai-coder.help', () => {
        localAICoder.showHelp();
    });

    let configureCommand = vscode.commands.registerCommand('local-ai-coder.configure', () => {
        localAICoder.openConfiguration();
    });

    let chatCommand = vscode.commands.registerCommand('local-ai-coder.chat', async (message?: string) => {
        if (message) {
            await localAICoder.chat(message);
        }
    });

    let exitCommand = vscode.commands.registerCommand('local-ai-coder.exit', () => {
        localAICoder.exit();
    });

    // Add new commands for code operations
    let updateCodeCommand = vscode.commands.registerCommand('local-ai-coder.updateCode', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }
        if (editor) {
            const selectedCode = editor.document.getText(editor.selection);
            if (selectedCode) {
                const instruction = await vscode.window.showInputBox({ prompt: 'Enter instructions for code update:' });
                if (instruction) {
                    await localAICoder.updateCode(selectedCode, instruction);
                }
            } else {
                vscode.window.showErrorMessage('Please select some code first.');
            }
        }
    });

    let explainCodeCommand = vscode.commands.registerCommand('local-ai-coder.explainCode', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const selectedCode = editor.document.getText(editor.selection);
            if (selectedCode) {
                await localAICoder.explainCode(selectedCode);
            } else {
                vscode.window.showErrorMessage('Please select some code first.');
            }
        }
    });

    let fixCodeCommand = vscode.commands.registerCommand('local-ai-coder.fixCode', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const selectedCode = editor.document.getText(editor.selection);
            if (selectedCode) {
                const problem = await vscode.window.showInputBox({ prompt: 'Describe the problem:' });
                if (problem) {
                    await localAICoder.fixCode(selectedCode, problem);
                }
            } else {
                vscode.window.showErrorMessage('Please select some code first.');
            }
        }
    });

    context.subscriptions.push(
        activateCommand, 
        helpCommand, 
        configureCommand, 
        chatCommand,
        exitCommand,
        updateCodeCommand,
        explainCodeCommand,
        fixCodeCommand
    );
}

export function deactivate() {
    if (localAICoder) {
        localAICoder.deactivate();
    }
}