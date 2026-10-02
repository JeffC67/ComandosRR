/* ============================================================
   ESLint — config plana (ESLint 9, `next lint` está obsoleto)
   `eslint-config-next` aún publica formato eslintrc, así que se
   envuelve con FlatCompat (vía oficial de migración de Next 15).
   - `next/core-web-vitals`: reglas de Next (Link, img, hooks…)
   - `next/typescript`: reglas de TS adaptadas a Next
   Solo los errores rompen `npm run lint`; los avisos no.
   ============================================================ */

import { FlatCompat } from '@eslint/eslintrc';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const config = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: ['**/node_modules/**', '**/.next/**', '**/.next-dev/**', '**/out/**', 'public/media/**', 'next-env.d.ts'],
  },
  {
    rules: {
      /* Los scripts de scripts/ son CLIs: el console es su salida. */
      'no-console': 'off',
      /* _prefixed = intencionadamente sin usar (firmas de Next). */
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      /* any donde el SDK/Directus no tipa (se revisa caso a caso). */
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
];

export default config;
