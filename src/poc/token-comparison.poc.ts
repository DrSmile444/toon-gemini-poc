import { GoogleGenAI } from '@google/genai';
import { encode } from '@toon-format/toon';
import chalk from 'chalk';
import Mustache from 'mustache';

import { getEnvironment } from '@shared/env';
import { loadJsonFile, loadPromptTemplate } from '@shared/prompt-renderer';

import type { ModerationData } from './moderation.poc';

async function main() {
  /**
   * Setup Part
   * */

  /**
   * Setting Gemini API
   * */
  const environment = getEnvironment();
  const ai = new GoogleGenAI({ apiKey: environment.GEMINI_API_KEY });

  /**
   * Input data and prompt template
   * */
  const template = await loadPromptTemplate(
    './src/prompt/moderation.prompt.md',
  );

  const moderationPayload = await loadJsonFile<ModerationData>(
    './src/data/moderation.data.json',
  );

  const json = JSON.stringify(moderationPayload, null, 2);
  const toon = encode(moderationPayload);

  /**
   * Prepare the data for the prompt
   * */
  const jsonPayload = ['```json', json, '```'].join('\n');
  const toonPayload = ['```toon', toon, '```'].join('\n');

  /**
   * Execution Part
   * */

  /**
   * Render prompt with Mustache
   * */
  const jsonPrompt = Mustache.render(template, {
    data_block: jsonPayload,
  });

  const toonPrompt = Mustache.render(template, {
    data_block: toonPayload,
  });

  console.info(chalk.bold.magenta('Token Comparison – Moderation PoC'));

  console.info(
    chalk.dim(`Model: ${environment.GEMINI_MODEL} | Format: json,toon`),
  );

  const jsonPromptTokens = await ai.models.countTokens({
    model: environment.GEMINI_MODEL,
    contents: [{ role: 'user', parts: [{ text: jsonPrompt }] }],
  });

  const toonPromptTokens = await ai.models.countTokens({
    model: environment.GEMINI_MODEL,
    contents: [{ role: 'user', parts: [{ text: toonPrompt }] }],
  });

  const jsonTotalTokens = jsonPromptTokens.totalTokens || 0;
  const toonTotalTokens = toonPromptTokens.totalTokens || 0;

  console.info(chalk.yellow('\nPrompt json token count (countTokens):'));
  console.info(chalk.red(jsonTotalTokens));

  console.info(chalk.yellow('\nPrompt toon token count (countTokens):'));
  console.info(chalk.blue(toonTotalTokens));

  /**
   * Delta between json and toon token counts
   * */
  const delta = jsonTotalTokens - toonTotalTokens;

  const deltaPercentage = ((delta / jsonTotalTokens) * 100).toFixed(2);

  console.info(
    chalk.green(
      `\nDelta (json - toon): ${chalk.blue(delta)} tokens (${chalk.blue(deltaPercentage)}%)`,
    ),
  );
}

main().catch(console.error);
