/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from 'tsup';

export default defineConfig({
  clean: true,
  entry: ['src/poc/all.poc.ts', 'src/poc/simple.poc.ts', 'src/poc/token-comparison.poc.ts'],
  format: 'esm'
});
