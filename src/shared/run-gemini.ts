import { GoogleGenAI } from '@google/genai';
import chalk from 'chalk';

import type { Env as Environment } from './env.js';

export interface GeminiRunResult {
  promptTokens?: unknown;
  usageMetadata?: unknown;
  text: string;
}

function safeStringify(x: unknown): string {
  try {
    return JSON.stringify(x, null, 2);
  } catch {
    return String(x);
  }
}

function extractText(resp: any): string {
  // Handle a few shapes across SDK versions:
  // 1) { text: "..." }
  // 2) { response: { text(): string } }
  // 3) { candidates: ... }
  if (typeof resp?.text === 'string') {
    return resp.text;
  }

  if (typeof resp?.response?.text === 'function') {
    return String(resp.response.text());
  }

  if (typeof resp?.response?.text === 'string') {
    return String(resp.response.text);
  }

  return safeStringify(resp);
}

function extractUsage(resp: any): unknown {
  // Prefer response.usageMetadata if present
  return resp?.usageMetadata ?? resp?.response?.usageMetadata ?? undefined;
}

export async function runGeminiOnce(environment: Environment, prompt: string): Promise<GeminiRunResult> {
  const ai = new GoogleGenAI({ apiKey: environment.GEMINI_API_KEY });

  const promptTokens = await ai.models.countTokens({
    model: environment.GEMINI_MODEL,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });

  const resp = await ai.models.generateContent({
    model: environment.GEMINI_MODEL,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });

  const usageMetadata = extractUsage(resp);
  const text = extractText(resp).trim();

  return { promptTokens, usageMetadata, text };
}

export function printRun(title: string, result: GeminiRunResult, promptPreview: string) {
  console.log(chalk.bold.cyan(`\n=== ${title} ===`));
  console.log(chalk.dim('Prompt preview (first 600 chars):'));
  console.log(chalk.gray(promptPreview.slice(0, 600) + (promptPreview.length > 600 ? '…' : '')));

  console.log(chalk.yellow('\nPrompt token count (countTokens):'));
  console.log(chalk.gray(safeStringify(result.promptTokens)));

  if (result.usageMetadata) {
    console.log(chalk.yellow('\nusageMetadata (actual call):'));
    console.log(chalk.gray(safeStringify(result.usageMetadata)));
  }

  console.log(chalk.green('\nModel output:'));
  console.log(result.text);
}
