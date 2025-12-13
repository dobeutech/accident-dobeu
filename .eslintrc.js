module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
    browser: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  rules: {
    'no-console': 'warn',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-undef': 'error',
    'semi': ['error', 'always'],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'indent': ['error', 2],
    'comma-dangle': ['error', 'never'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never']
  },
  overrides: [
    {
      files: ['backend/**/*.js'],
      env: {
        node: true
      }
    },
    {
      files: ['web/**/*.jsx', 'web/**/*.js'],
      env: {
        browser: true
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    {
      files: ['mobile/**/*.js', 'mobile/**/*.jsx'],
      env: {
        'react-native/react-native': true
      },
      plugins: ['react-native'],
      extends: ['plugin:react-native/recommended']
    }
  ]
};

