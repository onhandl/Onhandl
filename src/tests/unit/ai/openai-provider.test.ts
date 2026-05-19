import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const createCompletion = vi.fn();

vi.mock('openai', () => ({
  default: class MockOpenAI {
    chat = {
      completions: {
        create: createCompletion,
      },
    };
  },
}));

vi.mock('../../../shared/config/environments', () => ({
  ENV: {
    OPENAI_API_KEY: 'test-key',
    OPENAI_BASE_URL: undefined,
    OPENAI_MODEL: 'gpt-5.4',
  },
}));

let OpenAIProvider: typeof import('../../../infrastructure/ai/providers/openai-provider.js').OpenAIProvider;

describe('OpenAIProvider.generateCompletion', () => {
  beforeAll(async () => {
    ({ OpenAIProvider } = await import('../../../infrastructure/ai/providers/openai-provider.js'));
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('supports output_text payloads when choices are absent', async () => {
    createCompletion.mockResolvedValueOnce({
      output_text: '{"agent":{"name":"x"}}',
      usage: {
        prompt_tokens: 1,
        completion_tokens: 1,
        total_tokens: 2,
      },
    });

    const provider = new OpenAIProvider();
    const result = await provider.generateCompletion({
      messages: [{ role: 'user', content: 'draft agent' }],
      temperature: 0.1,
    });

    expect(result.content).toBe('{"agent":{"name":"x"}}');
  });

  it('supports nested content text values from OpenAI-compatible proxy payloads', async () => {
    createCompletion.mockResolvedValueOnce({
      data: {
        choices: [
          {
            message: {
              content: [
                {
                  type: 'text',
                  text: {
                    value: '{"agent":{"name":"Airtel"}}',
                  },
                },
              ],
            },
          },
        ],
      },
      usage: {
        prompt_tokens: 1,
        completion_tokens: 1,
        total_tokens: 2,
      },
    });

    const provider = new OpenAIProvider();
    const result = await provider.generateCompletion({
      messages: [{ role: 'user', content: 'draft agent' }],
      temperature: 0.1,
    });

    expect(result.content).toBe('{"agent":{"name":"Airtel"}}');
  });

  it('throws a controlled error when the payload shape is unsupported', async () => {
    createCompletion.mockResolvedValueOnce({
      usage: {
        prompt_tokens: 1,
        completion_tokens: 1,
        total_tokens: 2,
      },
    });

    const provider = new OpenAIProvider();

    await expect(
      provider.generateCompletion({
        messages: [{ role: 'user', content: 'draft agent' }],
        temperature: 0.1,
      })
    ).rejects.toMatchObject({
      code: 502,
      message: 'OpenAI provider returned an unsupported completion payload shape',
    });
  });
});
