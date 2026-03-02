import './logs.poc';
import './moderation.poc';
import './report.poc';
import './simple.poc';
import './simple-toon.poc';
import './token-comparison.poc';

/**
 * This file imports all the individual PoCs so they can be run together.
 * Each PoC is designed to be run independently, but this allows us to execute them all with a single command if desired.
 *
 * To run all PoCs together, use the command:
 * ```
 * npm run poc:all
 * ```
 *
 * Note that running all PoCs together will execute them sequentially, and each PoC will make its own call to the Gemini API. Be mindful of rate limits and costs when doing this.
 * */
