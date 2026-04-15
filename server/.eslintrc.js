module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  env: {
    node: true,
    es2022: true,
  },

  rules: {
    // Global safety net
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: [
              '**/*.controller',
              '**/*.controller.*',
              '@/**/*.controller',
              '@/**/*.controller.*',
            ],
            message:
              'Do not import controllers directly. Import services, repositories, contracts, or other pure modules instead.',
          },
        ],
      },
    ],
  },

  overrides: [
    {
      // Core must stay pure
      files: ['src/core/**/*.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: [
                  '**/api/**',
                  '**/infrastructure/**',
                  '**/modules/**',
                  '**/sdk/**',
                  '@/api/**',
                  '@/infrastructure/**',
                  '@/modules/**',
                  '@/sdk/**',
                ],
                message:
                  'Layer violation: core must remain pure and must not import from api, infrastructure, modules, or sdk.',
              },
            ],
          },
        ],
      },
    },
    {
      // Infrastructure must not know about HTTP/API
      files: ['src/infrastructure/**/*.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: [
                  '**/api/**',
                  '@/api/**',
                  '**/*.controller',
                  '**/*.controller.*',
                  '@/**/*.controller',
                  '@/**/*.controller.*',
                ],
                message:
                  'Layer violation: infrastructure must not depend on API transport code or controllers.',
              },
            ],
          },
        ],
      },
    },
    {
      // Modules contain business capabilities, not HTTP transport details
      files: ['src/modules/**/*.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: [
                  '**/api/**',
                  '@/api/**',
                ],
                message:
                  'Layer violation: modules must not depend on API transport code.',
              },
              {
                group: [
                  '**/*.controller',
                  '**/*.controller.*',
                  '@/**/*.controller',
                  '@/**/*.controller.*',
                ],
                message:
                  'Layer violation: modules must not import controllers from other modules. Depend on services, repositories, or shared contracts instead.',
              },
            ],
          },
        ],
      },
    },
    {
      // SDK must expose pure programmatic surfaces only
      files: ['src/sdk/**/*.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: [
                  '**/api/**',
                  '@/api/**',
                  '**/*.controller',
                  '**/*.controller.*',
                  '@/**/*.controller',
                  '@/**/*.controller.*',
                ],
                message:
                  'Layer violation: sdk must not depend on API transport code or controllers.',
              },
            ],
          },
        ],
      },
    },
    {
      // Shared must stay low-level
      files: ['src/shared/**/*.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: [
                  '**/api/**',
                  '**/modules/**',
                  '**/infrastructure/**',
                  '**/sdk/**',
                  '@/api/**',
                  '@/modules/**',
                  '@/infrastructure/**',
                  '@/sdk/**',
                ],
                message:
                  'Layer violation: shared must remain low-level and must not depend on higher-level application layers.',
              },
            ],
          },
        ],
      },
    },
  ],
};