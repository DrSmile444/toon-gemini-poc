import { z } from 'zod';

import 'dotenv/config';

const EnvironmentSchema = z.object({
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  GEMINI_MODEL: z.string().min(1, 'GEMINI_MODEL is required'),
});

export type Env = z.infer<typeof EnvironmentSchema>;

export function getEnv(): Env {
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
