import { defineConfig } from 'eslint/config';

import { plugin } from './no-inline-interface-object-types.eslint.mjs';

/**
 * ESLint flat-config export (same pattern as your nodePlugin config file).
 * Import this file in your main eslint.config.js and spread it into the config array.
 */
export default defineConfig([
  {
    name: 'lintlord/no-inline-interface-object-types',
    plugins: {
      lintlord: plugin,
    },
    rules: {
      'lintlord/no-inline-interface-object-types': 'error',

      // Optional example: also forbid `type X = { ... }`
      // "lintlord/no-inline-interface-object-types": ["error", { allowTypeAliases: false }],
    },
  },
]);
