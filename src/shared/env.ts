import { z } from 'zod';

import 'dotenv/config';

/** Zod schema that validates the required environment variables for the application. */
const EnvironmentSchema = z.object({
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  GEMINI_MODEL: z.string().min(1, 'GEMINI_MODEL is required'),
});

/** Typed shape of the validated environment variables. */
export type Environment = z.infer<typeof EnvironmentSchema>;

/**
 * Reads, validates and returns the required environment variables.
 *
 * Throws a descriptive {@link Error} when any variable is missing or empty so
 * that misconfigured deployments fail fast at startup instead of silently
 * producing wrong results at runtime.
 *
 * @returns The validated environment variables.
 * @throws {Error} When one or more required variables are absent or invalid.
 */
export function getEnvironment(): Environment {
  const parsed = EnvironmentSchema.safeParse({
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
  });

  if (!parsed.success) {
    const message = parsed.error.issues.map((index) => `${index.path.join('.')}: ${index.message}`).join('\n');

    throw new Error(`Invalid environment variables:\n${message}`);
  }

  return parsed.data;
}
