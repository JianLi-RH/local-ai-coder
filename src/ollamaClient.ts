import * as vscode from 'vscode';
import axios, { AxiosInstance } from 'axios';

export interface OllamaRequest {
  model: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
}

export interface OllamaResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
}

export class OllamaClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: this.getApiBaseUrl(),
      timeout: this.getTimeout(),
    });
    
    // 添加拦截器处理认证
    this.client.interceptors.request.use(
      config => {
        config.headers.Authorization = `Bearer ${this.getApiKey()}`;
        return config;
      },
      error => Promise.reject(error)
    );
  }

  private getApiBaseUrl(): string {
    return vscode.workspace.getConfiguration('ollama-coder').get('apiBaseUrl') || 'http://localhost:11434/v1';
  }

  private getModelName(): string {
    return vscode.workspace.getConfiguration('ollama-coder').get('modelName') || 'qwen3-coder:30b';
  }

  private getTimeout(): number {
    // Get timeout in seconds and convert to milliseconds
    const timeoutSeconds = vscode.workspace.getConfiguration('ollama-coder').get<number>('timeout') || 120;
    // Limit timeout to maximum 1 hour (3600 seconds)
    const maxTimeoutSeconds = 3600;
    const clampedSeconds = Math.min(timeoutSeconds, maxTimeoutSeconds);
    return clampedSeconds * 1000;
  }

  private getApiKey(): string {
    // Ollama通常不需要API密钥，但某些代理可能需要
    return vscode.workspace.getConfiguration('ollama-coder').get('apiKey') || 'ollama';
  }

  async generateCompletion(prompt: string, fileContents?: Record<string, string>): Promise<string> {
    let systemContent = 'You are an expert software developer. Analyze the code provided by the user and respond with high-quality, efficient, and well-documented code solutions. Always provide complete, working code that follows best practices.';
    
    if (fileContents && Object.keys(fileContents).length > 0) {
      systemContent += '\n\nAdditional files referenced by the user:';
      for (const [fileName, content] of Object.entries(fileContents)) {
        systemContent += `\n\n=== ${fileName} ===\n${content}`;
      }
    }
    
    const request: OllamaRequest = {
      model: this.getModelName(),
      messages: [
        {
          role: 'system',
          content: systemContent
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 2048
    };

    try {
      const response = await this.client.post<OllamaResponse>('/chat/completions', request);
      return response.data.choices[0].message.content.trim();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to call Ollama API: ${error.response?.data?.error?.message || error.message}`);
      }
      throw error;
    }
  }

  async updateCode(selectedCode: string, instruction: string): Promise<string> {
    const prompt = `The following is code that needs to be updated based on the instruction provided:\n\n${selectedCode}\n\nInstruction: ${instruction}\n\nPlease provide only the updated code without any explanations. Make sure the updated code maintains the same functionality while implementing the requested changes.`;
    return await this.generateCompletion(prompt);
  }

  async explainCode(code: string): Promise<string> {
    const prompt = `Please explain the following code in detail:\n\n${code}\n\nProvide a clear explanation of what the code does, including any important functions, variables, and logic flows.`;
    return await this.generateCompletion(prompt);
  }

  async fixCode(code: string, problem: string): Promise<string> {
    const prompt = `The following code has a problem:\n\n${code}\n\nProblem: ${problem}\n\nPlease fix the code to resolve the issue. Provide only the corrected code without any explanations.`;
    return await this.generateCompletion(prompt);
  }
}