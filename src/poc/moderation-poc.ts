import chalk from 'chalk';

import { getEnvironment } from '@shared/env.js';
import { loadJsonFile, loadPromptTemplate, makeDataBlock, renderPrompt } from '@shared/prompt-renderer.js';
import { printRun, runGeminiOnce } from '@shared/run-gemini.js';

/** Shape of the moderation data loaded from `moderation.data.json`. */
interface ModerationData {
  /** List of chat messages to be classified. */
  msgs: { id: string; user: string; text: string }[];
}

/**
 * Entry point for the Moderation PoC.
 *
 * Loads the message dataset and the Moderation prompt template, serialises the
 * messages into a toon-encoded block, renders the final prompt and sends it to
 * Gemini. The model is asked to classify each message and propose moderation
 * actions.
 */
async function main() {
  const environment = getEnvironment();

  const format: 'json' | 'toon' = 'toon';

  const userRequest = 'Classify each message and propose actions. Be strict on hate/threats, but allow normal criticism and light sarcasm.';

  const template = await loadPromptTemplate('./src/prompt/moderation.prompt.md');
  const moderationPayload = await loadJsonFile<ModerationData>('./src/data/moderation.data.json');

  const dataBlock = makeDataBlock(moderationPayload, format);
  const prompt = renderPrompt(template, { user_request: userRequest, data_block: dataBlock });

  console.info(chalk.bold.magenta('Running Moderation PoC'));
  console.info(chalk.dim(`Model: ${environment.GEMINI_MODEL} | Format: ${format}`));

  const result = await runGeminiOnce(environment, prompt);

  printRun('Moderation: Message classification', result, prompt);
}

main().catch((error) => {
  console.error(chalk.red(String(error)));
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1);
});
