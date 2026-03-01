import chalk from 'chalk';

import { getEnv as getEnvironment } from '@shared/env.js';
import { loadJsonFile, loadPromptTemplate, makeDataBlock, renderPrompt } from '@shared/prompt-renderer.js';
import { printRun, runGeminiOnce } from '@shared/run-gemini.js';

interface ModerationData {
  msgs: Array<{ id: string; user: string; text: string }>;
}

async function main() {
  const environment = getEnvironment();

  const format: 'json' | 'toon' = 'toon';

  const userRequest = 'Classify each message and propose actions. Be strict on hate/threats, but allow normal criticism and light sarcasm.';

  const template = await loadPromptTemplate('./src/prompt/moderation.prompt.md');
  const data = await loadJsonFile<ModerationData>('./src/data/moderation.data.json');

  const dataBlock = makeDataBlock(data, format);
  const prompt = renderPrompt(template, { user_request: userRequest, data_block: dataBlock });

  console.log(chalk.bold.magenta('Running Moderation PoC'));
  console.log(chalk.dim(`Model: ${environment.GEMINI_MODEL} | Format: ${format}`));

  const result = await runGeminiOnce(environment, prompt);

  printRun('Moderation: Message classification', result, prompt);
}

main().catch((error) => {
  console.error(chalk.red(String(error)));
  process.exit(1);
});
