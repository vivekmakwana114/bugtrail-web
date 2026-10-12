import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';

/*
 * Design-system guardrails (docs/design/DESIGN_SYSTEM.md). Colours, type sizes, radii and
 * shadows come from the tokens in src/app/globals.css; these patterns catch the usual escapes.
 * Layout values (a 24rem column, 80vh) are fine: they aren't design decisions.
 */
const designRules = [
  {
    pattern: '#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?([0-9a-fA-F]{2})?\\b',
    message: 'Raw hex colour. Use a token class (text-ink, bg-surface, text-failed...).',
  },
  {
    pattern: '\\[(#|rgb|hsl|oklch|color-mix)',
    message: 'Arbitrary colour value. Use a token class, or add a token to globals.css.',
  },
  {
    pattern:
      '\\b(bg|text|border|ring|fill|stroke|outline|decoration|divide|accent|caret|from|to|via)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)\\b',
    message:
      "Tailwind's stock palette is switched off. Use a token class (ink, surface, failed...).",
  },
  {
    pattern: '\\b(text|rounded|shadow|font|leading|tracking)-\\[',
    message: 'Arbitrary type/radius/shadow value. Use the scale (text-sm, rounded-md, shadow-pop).',
  },
];

const restrictedSyntax = designRules.flatMap(({ pattern, message }) => [
  { selector: `Literal[value=/${pattern}/]`, message },
  { selector: `TemplateElement[value.raw=/${pattern}/]`, message },
]);

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: { 'no-restricted-syntax': ['error', ...restrictedSyntax] },
  },
  // Must be last: turns off ESLint rules that conflict with Prettier formatting.
  prettier,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);

export default eslintConfig;
