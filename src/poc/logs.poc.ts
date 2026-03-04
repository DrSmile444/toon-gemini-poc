import chalk from 'chalk';

import { getEnvironment } from '@shared/env.js';
import {
  loadJsonFile,
  loadPromptTemplate,
  makeDataBlock,
  renderPrompt,
} from '@shared/prompt-renderer.js';
import { printRun, runGeminiOnce } from '@shared/run-gemini.js';

interface LogsDataEvent {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  t: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  svc: string;
  lvl: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  msg: string;
  trace: string;
}

/**
 * Shape of the log data loaded from `logs.data.json`.
 * Field names match the JSON keys exactly (abbreviated to minimise file size).
 */
interface LogsData {
  events: LogsDataEvent[];
}

/**
 * Entry point for the Logs PoC.
 *
 * Loads the log event data and the Logs prompt template, serialises the data
 * into a toon-encoded block, renders the final prompt and sends it to Gemini.
 * The model is asked to produce a concise root-cause narrative for the events.
 */
async function main() {
  const environment = getEnvironment();

  const format: 'json' | 'toon' = 'toon';

  const userRequest =
    'Explain what likely happened, what the primary root cause is, and what we should do to prevent it. Keep it crisp.';

  const template = await loadPromptTemplate('./src/prompt/logs.prompt.md');
  const logsPayload = await loadJsonFile<LogsData>('./src/data/logs.data.json');

  const dataBlock = makeDataBlock(logsPayload, format);

  const prompt = renderPrompt(template, {
    user_request: userRequest,
    data_block: dataBlock,
  });

  console.info(chalk.bold.magenta('Running Logs PoC'));

  console.info(
    chalk.dim(`Model: ${environment.GEMINI_MODEL} | Format: ${format}`),
  );

  const result = await runGeminiOnce(environment, prompt);

  printRun('Logs: Root-cause narrative', result, prompt);
}

main().catch((error) => {
  console.error(chalk.red(String(error)));
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1);
});
