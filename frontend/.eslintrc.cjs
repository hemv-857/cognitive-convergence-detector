module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'coverage', '*.config.js'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  rules: {
    'react/prop-types': 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^(Icon|MiniBar|StatCard|Calendar|TrendingUp|TrendingDown|Minus|Gauge|AreaChart|Activity|AlertTriangle)$' }],
    'react/no-unescaped-entities': 'warn',
    'no-empty': ['error', { allowEmptyCatch: true }],
  },
};
