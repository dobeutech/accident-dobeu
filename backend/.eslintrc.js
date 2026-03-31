module.exports = {
  env: {
    node: true,
    commonjs: true,
    es2021: true,
    jest: true,
  },
  extends: ['airbnb-base'],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'max-len': ['warn', { code: 120, ignoreUrls: true, ignoreStrings: true, ignoreTemplateLiterals: true }],
    'consistent-return': 'warn',
    'camelcase': 'warn',
    'arrow-body-style': 'off',
    'class-methods-use-this': 'warn',
    'no-restricted-syntax': 'warn',
    'no-await-in-loop': 'warn',
    'global-require': 'warn',
    'no-use-before-define': ['error', { functions: false, classes: true, variables: true }],
    'no-plusplus': 'off',
    'no-bitwise': 'off',
    'radix': 'off',
    'no-restricted-globals': 'off',
    'no-param-reassign': 'warn',
    'guard-for-in': 'warn',
    'no-return-await': 'warn'
  },
};
