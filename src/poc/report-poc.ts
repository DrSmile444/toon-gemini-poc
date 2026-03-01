import chalk from 'chalk';

import { getEnv as getEnvironment } from '@shared/env.js';
import { loadJsonFile, loadPromptTemplate, makeDataBlock, renderPrompt } from '@shared/prompt-renderer.js';
import { printRun, runGeminiOnce } from '@shared/run-gemini.js';

interface ReportData {
  incidents: Array<{
    id: string;
    sev: string;
    start: string;
    mitigatedAt: string;
    minToMitigate: number;
    summary: string;
    impact: string;
  }>;
}

async function main() {
  const environment = getEnvironment();

  const format: 'json' | 'toon' = 'toon';

  const userRequest =
    'Write an incident report suitable for leadership. Keep it readable and action-oriented. Add reasonable follow-up owners and due dates.';

  const template = await loadPromptTemplate('./src/prompt/report.prompt.md');
  const data = await loadJsonFile<ReportData>('./src/data/report.data.json');

  const dataBlock = makeDataBlock(data, format);
  const prompt = renderPrompt(template, { user_request: userRequest, data_block: dataBlock });

  console.log(chalk.bold.magenta('Running Report PoC'));
  console.log(chalk.dim(`Model: ${environment.GEMINI_MODEL} | Format: ${format}`));

  const result = await runGeminiOnce(environment, prompt);

  printRun('Report: Data → document', result, prompt);
}

main().catch((error) => {
  console.error(chalk.red(String(error)));
  process.exit(1);
});
