import type { GenerateContentResponse } from '@google/genai';
import { GoogleGenAI } from '@google/genai';
import chalk from 'chalk';

import type { Environment } from './env.js';

/** Shape of the result returned by {@link runGeminiOnce}. */
export interface GeminiRunResult {
  /** Raw token-count metadata returned by `countTokens` (shape varies by SDK version). */
  promptTokens?: unknown;
  /** Usage statistics returned by `generateContent` (shape varies by SDK version). */
  usageMetadata?: unknown;
  /** The model's text response, trimmed of leading/trailing whitespace. */
  text: string;
}

/**
 * Safely serialises any value to a pretty-printed JSON string.
 * Falls back to `String(x)` when `JSON.stringify` throws (e.g. circular refs).
 *
 * @param x - The value to serialise.
 * @returns A human-readable string representation of {@link x}.
 */
function safeStringify(x: unknown): string {
  try {
    return JSON.stringify(x, null, 2);
  } catch {
    return String(x);
  }
}

/**
 * Extracts the plain text string from a Gemini SDK response object.
 *
 * The Google GenAI SDK has shipped different response shapes across versions.
 * This function handles three known shapes so the rest of the code stays
 * version-agnostic:
 *   1. `{ text: "..." }` – direct string property.
 *   2. `{ response: { text(): string } }` – text exposed as a method.
 *   3. `{ response: { text: string } }` – text as a nested string property.
 *
 * Falls back to a JSON dump when none of the known shapes match.
 *
 * @param geminiResponse - The raw value returned by `generateContent`.
 * @returns The extracted text, or a JSON serialisation of the whole response.
 */
function extractText(geminiResponse: GenerateContentResponse): string {
  // Handle a few shapes across SDK versions:
  // 1) { text: "..." }
  // 2) { response: { text(): string } }
  // 3) { candidates: ... }
  if (typeof geminiResponse?.text === 'string') {
    return geminiResponse.text;
  }

  // if (typeof geminiResponse?.response?.text === 'function') {
  //   return String(geminiResponse.response.text());
  // }
  //
  // if (typeof geminiResponse?.response?.text === 'string') {
  //   return String(geminiResponse.response.text);
  // }

  return safeStringify(geminiResponse);
}

/**
 * Extracts the usage-metadata object from a Gemini SDK response.
 *
 * Checks both `response.usageMetadata` (nested) and top-level `usageMetadata`
 * to cover differences between SDK versions.
 *
 * @param geminiResponse - The raw value returned by `generateContent`.
 * @returns The usage-metadata object, or `undefined` when it is absent.
 */
function extractUsage(geminiResponse: unknown): unknown {
  // Prefer response.usageMetadata if present
  if (typeof geminiResponse !== 'object' || geminiResponse === null) {
    return undefined;
  }

  const raw = geminiResponse as Record<string, unknown>;

  if ('usageMetadata' in raw) {
    return raw.usageMetadata;
  }

  if ('response' in raw && typeof raw.response === 'object' && raw.response !== null) {
    const inner = raw.response as Record<string, unknown>;

    return inner.usageMetadata;
  }

  return undefined;
}

/**
 * Sends a single prompt to the configured Gemini model and returns the result.
 *
 * Calls `countTokens` before the generation request so callers can inspect the
 * prompt token count without an additional round-trip.
 *
 * @param environment - Validated environment variables (API key + model name).
 * @param prompt      - The fully rendered prompt string to send to the model.
 * @returns A {@link GeminiRunResult} containing the model text, token count, and usage metadata.
 */
export async function runGeminiOnce(environment: Environment, prompt: string): Promise<GeminiRunResult> {
  const ai = new GoogleGenAI({ apiKey: environment.GEMINI_API_KEY });

  const promptTokens = await ai.models.countTokens({
    model: environment.GEMINI_MODEL,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });

  const geminiResponse = await ai.models.generateContent({
    model: environment.GEMINI_MODEL,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });

  const usageMetadata = extractUsage(geminiResponse);
  const text = extractText(geminiResponse).trim();

  return { promptTokens, usageMetadata, text };
}

/**
 * Prints a formatted summary of a Gemini run to stdout.
 *
 * Displays the prompt preview (first 600 chars), prompt token count,
 * usage metadata (when present), and the full model output – all colour-coded
 * via `chalk` for easy reading in a terminal.
 *
 * @param title         - Section heading shown above the output block.
 * @param result        - The {@link GeminiRunResult} to display.
 * @param promptPreview - The full prompt string (only the first 600 chars are shown).
 */
export function printRun(title: string, result: GeminiRunResult, promptPreview: string) {
  console.info(chalk.bold.cyan(`\n=== ${title} ===`));
  console.info(chalk.dim('Prompt preview (first 600 chars):'));
  console.info(chalk.gray(promptPreview.slice(0, 600) + (promptPreview.length > 600 ? '…' : '')));

  console.info(chalk.yellow('\nPrompt token count (countTokens):'));
  console.info(chalk.gray(safeStringify(result.promptTokens)));

  if (result.usageMetadata) {
    console.info(chalk.yellow('\nusageMetadata (actual call):'));
    console.info(chalk.gray(safeStringify(result.usageMetadata)));
  }

  console.info(chalk.green('\nModel output:'));
  console.info(result.text);
}
