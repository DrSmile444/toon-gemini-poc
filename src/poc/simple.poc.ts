import { GoogleGenAI } from '@google/genai';
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
const userRequest = 'Classify each message and propose actions. Be strict on hate/threats, but allow normal criticism and light sarcasm.';

const template = await loadPromptTemplate('./src/prompt/moderation.prompt.md');
const moderationPayload = await loadJsonFile<ModerationData>('./src/data/moderation.data.json');

const json = JSON.stringify(moderationPayload, null, 2);

/**
 * Prepare the data for the prompt
 * */
const jsonPayload = ['```json', json, '```'].join('\n');

/**
 * Execution Part
 * */

/**
 * Render prompt with Mustache
 * */
const prompt = Mustache.render(template, {
  user_request: userRequest,
  data_block: jsonPayload,
});

console.info(chalk.bold.magenta('Running Moderation PoC'));
console.info(chalk.dim(`Model: ${environment.GEMINI_MODEL} | Format: json`));

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
const text = extractText(geminiResponse).trim();

printRun('Moderation: Message classification', { promptTokens, usageMetadata, text }, prompt);
