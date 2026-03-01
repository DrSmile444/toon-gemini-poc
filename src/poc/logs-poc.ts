import chalk from 'chalk';

import { getEnv as getEnvironment } from '@shared/env.js';
import { loadJsonFile, loadPromptTemplate, makeDataBlock, renderPrompt } from '@shared/prompt-renderer.js';
import { printRun, runGeminiOnce } from '@shared/run-gemini.js';

interface LogsData {
  events: Array<{ t: string; svc: string; lvl: string; msg: string; trace: string }>;
}

async function main() {
  const environment = getEnvironment();

  const format: 'json' | 'toon' = 'toon';

  const userRequest = 'Explain what likely happened, what the primary root cause is, and what we should do to prevent it. Keep it crisp.';

  const template = await loadPromptTemplate('./src/prompt/logs.prompt.md');
  const data = await loadJsonFile<LogsData>('./src/data/logs.data.json');

  const dataBlock = makeDataBlock(data, format);
  const prompt = renderPrompt(template, { user_request: userRequest, data_block: dataBlock });

  console.log(chalk.bold.magenta('Running Logs PoC'));
  console.log(chalk.dim(`Model: ${environment.GEMINI_MODEL} | Format: ${format}`));

  const result = await runGeminiOnce(environment, prompt);

  printRun('Logs: Root-cause narrative', result, prompt);
}

main().catch((error) => {
  console.error(chalk.red(String(error)));
  process.exit(1);
});
