import { GoogleGenAI } from '@google/genai';
import { decode, encode } from '@toon-format/toon';
import chalk from 'chalk';
import Mustache from 'mustache';

import { getEnvironment } from '@shared/env';
import { loadJsonFile, loadPromptTemplate } from '@shared/prompt-renderer';
import { extractText, extractUsage, printRun } from '@shared/run-gemini';

import type { ModerationData } from './moderation.poc';

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
const template = await loadPromptTemplate('./src/prompt/moderation-toon.prompt.md');
const moderationPayload = await loadJsonFile<ModerationData>('./src/data/moderation.data.json');

const toon = encode(moderationPayload);

/**
 * Prepare the data for the prompt
 * */
const toonPayload = ['```toon', toon, '```'].join('\n');

/**
 * Execution Part
 * */

/**
 * Render prompt with Mustache
 * */
const prompt = Mustache.render(template, {
  data_block: toonPayload,
});

console.info(chalk.bold.magenta('Running Moderation PoC'));
console.info(chalk.dim(`Model: ${environment.GEMINI_MODEL} | Format: toon`));

const promptTokens = await ai.models.countTokens({
  model: environment.GEMINI_MODEL,
  contents: [{ role: 'user', parts: [{ text: prompt }] }],
});

console.info(chalk.yellow('\nPrompt token count (countTokens):'));
console.info(chalk.yellow(promptTokens.totalTokens));

/**
 * Generation request to Gemini
 * */
const geminiResponse = await ai.models.generateContent({
  model: environment.GEMINI_MODEL,
  contents: [{ role: 'user', parts: [{ text: prompt }] }],
});

const usageMetadata = extractUsage(geminiResponse);
const text = extractText(geminiResponse).replace('```toon', '').replace('```', '').trim();

printRun('Moderation: Message classification', { promptTokens, usageMetadata, text }, prompt);

const jsonResult = decode(text);

console.info(chalk.green('\nDecoded response (toon → json):'));
console.info(chalk.gray(JSON.stringify(jsonResult, null, 2)));
