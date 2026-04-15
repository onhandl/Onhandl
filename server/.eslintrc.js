module.exports = {
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    rules: {
        // Architectural Guardrails: Prevent layer leakage
        'no-restricted-imports': ['error', {
            patterns: [
                {
                    group: ['**/src/api/**'],
                    message: 'Layer Violation: Cannot import HTTP/transport (API layer) dependencies into Core or Infrastructure.',
                },
                {
                    group: ['**/modules/**/*.controller'],
                    message: 'Layer Violation: Cannot import module controllers into other layers. Re-export business logic via Services instead.',
                }
            ]
        }]
    },
    overrides: [
        {
            // Core code overrides
            files: ['src/core/**/*.ts'],
            rules: {
                'no-restricted-imports': ['error', {
                    patterns: [{
                        group: ['**/api/**', '**/infrastructure/**', '**/modules/**'],
                        message: 'Layer Violation: Core is pure domain logic and must not import from infrastructure, modules, or api layers.'
                    }]
                }]
            }
        },
        {
            // Infrastructure overrides
            files: ['src/infrastructure/**/*.ts'],
            rules: {
                'no-restricted-imports': ['error', {
                    patterns: [{
                        group: ['**/api/**'],
                        message: 'Layer Violation: Infrastructure must not depend on HTTP transport code.'
                    }]
                }]
            }
        },
        {
            // SDK overrides
            files: ['src/sdk/**/*.ts'],
            rules: {
                'no-restricted-imports': ['error', {
                    patterns: [{
                        group: ['**/api/**', '**/modules/**/*.controller*'],
                        message: 'Layer Violation: SDK must expose only pure contracts/services, never route controllers or HTTP wrappers.'
                    }]
                }]
            }
        }
    ]
};
