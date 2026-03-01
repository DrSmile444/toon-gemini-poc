import chalk from 'chalk';

import { getEnvironment } from '@shared/env.js';
import { loadJsonFile, loadPromptTemplate, makeDataBlock, renderPrompt } from '@shared/prompt-renderer.js';
import { printRun, runGeminiOnce } from '@shared/run-gemini.js';

/** Shape of the incident data loaded from `report.data.json`. */
interface ReportData {
  /** List of incidents to include in the generated report. */
  incidents: {
    /** Unique incident identifier. */
    id: string;
    /** Severity level (e.g. P1, P2). */
    sev: string;
    /** ISO timestamp when the incident started. */
    start: string;
    /** ISO timestamp when the incident was mitigated. */
    mitigatedAt: string;
    /** Total minutes from start to mitigation. */
    minToMitigate: number;
    /** Short human-readable summary of what happened. */
    summary: string;
    /** Description of the business or customer impact. */
    impact: string;
  }[];
}

/**
 * Entry point for the Report PoC.
 *
 * Loads the incident dataset and the Report prompt template, serialises the
 * incidents into a toon-encoded block, renders the final prompt and sends it
 * to Gemini. The model is asked to produce a leadership-ready incident report
 * with follow-up owners and due dates.
 */
async function main() {
  const environment = getEnvironment();

  const format: 'json' | 'toon' = 'toon';

  const userRequest =
    'Write an incident report suitable for leadership. Keep it readable and action-oriented. Add reasonable follow-up owners and due dates.';

  const template = await loadPromptTemplate('./src/prompt/report.prompt.md');
  const reportPayload = await loadJsonFile<ReportData>('./src/data/report.data.json');

  const dataBlock = makeDataBlock(reportPayload, format);
  const prompt = renderPrompt(template, { user_request: userRequest, data_block: dataBlock });

  console.info(chalk.bold.magenta('Running Report PoC'));
  console.info(chalk.dim(`Model: ${environment.GEMINI_MODEL} | Format: ${format}`));

  const result = await runGeminiOnce(environment, prompt);

  printRun('Report: Data → document', result, prompt);
}

main().catch((error) => {
  console.error(chalk.red(String(error)));
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1);
});
