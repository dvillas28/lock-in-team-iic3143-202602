import tseslint from 'typescript-eslint';
export default tseslint.config(
  {ignores: ['reports/**', 'test-results/**', '.cache/**', 'node_modules/**']},
  ...tseslint.configs.recommended,
  {rules: {
    // Negative HTTP payloads deliberately span incompatible contract shapes.
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['error', {argsIgnorePattern: '^_', varsIgnorePattern: '^_'}],
  }},
);
