import fs from 'node:fs/promises';

import { encode } from '@toon-format/toon';
import Mustache from 'mustache';

/** Supported serialisation formats for the data block embedded in a prompt. */
export type DataFormat = 'json' | 'toon';

/**
 * Reads a JSON file from disk and parses it into the requested type {@link T}.
 *
 * @param path - Absolute or relative path to the JSON file.
 * @returns The parsed file contents cast to {@link T}.
 */
export async function loadJsonFile<T>(path: string): Promise<T> {
  const raw = await fs.readFile(path, 'utf8');

  return JSON.parse(raw) as T;
}

/**
 * Reads a Mustache prompt template file from disk and returns its raw string content.
 *
 * @param path - Absolute or relative path to the `.prompt.md` template file.
 * @returns The raw template string ready to be rendered with {@link renderPrompt}.
 */
export async function loadPromptTemplate(path: string): Promise<string> {
  return fs.readFile(path, 'utf8');
}

/**
 * Serialises an arbitrary payload into a fenced code block for inclusion in a prompt.
 *
 * Supports two formats:
 * - `'toon'` – uses the compact toon encoding (smaller token footprint).
 * - `'json'` – pretty-printed JSON for maximum readability.
 *
 * @param payload - The data to serialise.
 * @param format  - The target serialisation format.
 * @returns A Markdown fenced code block string containing the serialised payload.
 */
export function makeDataBlock(payload: unknown, format: DataFormat): string {
  if (format === 'toon') {
    const toon = encode(payload);

    return ['```toon', toon.trimEnd(), '```'].join('\n');
  }

  const json = JSON.stringify(payload, null, 2);

  return ['```json', json, '```'].join('\n');
}

export interface RenderPromptVariables {
  user_request: string;
  data_block: string;
}

/**
 * Renders a Mustache template with the provided variables.
 *
 * @param template  - The raw Mustache template string (e.g. loaded via {@link loadPromptTemplate}).
 * @param variables - An object containing `user_request` and `data_block` placeholders.
 * @returns The fully rendered prompt string ready to send to the model.
 */
export function renderPrompt(template: string, variables: RenderPromptVariables): string {
  return Mustache.render(template, variables);
}
