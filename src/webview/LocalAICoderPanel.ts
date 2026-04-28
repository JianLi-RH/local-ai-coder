import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class LocalAICoderPanel {
    public static currentPanel: LocalAICoderPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel) {
        this._panel = panel;

        this._panel.webview.html = this._getWebviewContent();

        this._panel.webview.onDidReceiveMessage(
            (message) => this._handleMessage(message),
            undefined,
            this._disposables
        );

        this._panel.onDidDispose(
            () => {
                this.dispose();
            },
            null,
            this._disposables
        );
    }

    public static createOrShow() {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn || vscode.ViewColumn.One
            : vscode.ViewColumn.One;

        if (LocalAICoderPanel.currentPanel) {
            LocalAICoderPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'localAICoder',
            'Local AI Coder',
            column,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        LocalAICoderPanel.currentPanel = new LocalAICoderPanel(panel);
    }

    public dispose() {
        LocalAICoderPanel.currentPanel = undefined;

        this._panel.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    public postMessage(message: { type: string; text: string }) {
        this._panel.webview.postMessage(message);
    }

    private _handleMessage(message: { command: string; text?: string }) {
        switch (message.command) {
            case 'help':
                vscode.commands.executeCommand('local-ai-coder.help');
                break;
            case 'configure':
                vscode.commands.executeCommand('local-ai-coder.configure');
                break;
            case 'chat':
                if (message.text) {
                    vscode.commands.executeCommand('local-ai-coder.chat', message.text);
                }
                break;
            case 'exit':
                vscode.commands.executeCommand('local-ai-coder.exit');
                break;
        }
    }

    private _getWebviewContent(): string {
        const htmlPath = path.join(__dirname, 'panel.html');
        return fs.readFileSync(htmlPath, 'utf-8');
    }
}