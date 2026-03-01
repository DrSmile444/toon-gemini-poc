import fs from 'node:fs/promises';

import { encode } from '@toon-format/toon';
import Mustache from 'mustache';

export type DataFormat = 'json' | 'toon';

export async function loadJsonFile<T>(path: string): Promise<T> {
  const raw = await fs.readFile(path, 'utf8');

  return JSON.parse(raw) as T;
}

export async function loadPromptTemplate(path: string): Promise<string> {
  return fs.readFile(path, 'utf8');
}

export function makeDataBlock(data: unknown, format: DataFormat): string {
  if (format === 'toon') {
    const toon = encode(data);

    return ['```toon', toon.trimEnd(), '```'].join('\n');
  }

  const json = JSON.stringify(data, null, 2);

  return ['```json', json, '```'].join('\n');
}

export function renderPrompt(template: string, variables: { user_request: string; data_block: string }): string {
  return Mustache.render(template, variables);
}
