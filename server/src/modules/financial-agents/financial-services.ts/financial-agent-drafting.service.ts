import { AiService } from '../../ai/ai.service';
import {
  DraftFinancialAgentInput,
  FinancialAgentPreset,
  FINANCIAL_AGENT_PRESETS,
  draftFinancialAgentInputSchema,
} from './financial-agent-validation.service';
import { buildFinancialAgentDraftPrompt } from './financial-agent-drafting.prompt';

function extractBalancedJsonObjects(text: string): string[] {
  const objects: string[] = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') {
      if (depth === 0) start = i;
      depth += 1;
      continue;
    }

    if (char === '}') {
      if (depth === 0) continue;
      depth -= 1;
      if (depth === 0 && start !== -1) {
        objects.push(text.slice(start, i + 1));
        start = -1;
      }
    }
  }

  return objects;
}

function collectJsonCandidates(text: string): string[] {
  const candidates: string[] = [];
  const trimmed = text.trim();

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    candidates.push(trimmed);
  }

  const fenceRegex = /```(?:json)?\s*([\s\S]*?)```/gi;
  let match: RegExpExecArray | null;

  while ((match = fenceRegex.exec(text)) !== null) {
    const body = (match[1] || '').trim();
    if (body) candidates.push(body);
  }

  candidates.push(...extractBalancedJsonObjects(text));

  return [...new Set(candidates)].sort((a, b) => b.length - a.length);
}

function parseDraftFromModelOutput(content: string): DraftFinancialAgentInput {
  const candidates = collectJsonCandidates(content);

  if (candidates.length === 0) {
    throw { code: 400, message: 'Drafting model did not return JSON content' };
  }

  let validationError: string | undefined;

  for (const candidate of candidates) {
    let parsed: unknown;

    try {
      parsed = JSON.parse(candidate);
    } catch {
      continue;
    }

    const result = draftFinancialAgentInputSchema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }

    if (!validationError) {
      validationError = result.error.issues[0]?.message;
    }
  }

  throw {
    code: 400,
    message: validationError || 'Drafting model returned invalid JSON',
  };
}

export const FinancialAgentDraftingService = {
  async draftFromPrompt(input: {
    name: string;
    prompt: string;
    preset?: FinancialAgentPreset;
  }): Promise<DraftFinancialAgentInput> {
    if (!input.prompt?.trim()) {
      throw { code: 400, message: 'Prompt is required' };
    }

    const preset =
      input.preset && FINANCIAL_AGENT_PRESETS.includes(input.preset)
        ? input.preset
        : 'balanced_allocator';

    const completion = await AiService.generateCompletion({
      messages: [
        {
          role: 'user',
          content: buildFinancialAgentDraftPrompt({
            name: input.name,
            prompt: input.prompt,
            preset,
          }),
        },
      ],
      temperature: 0.1,
    });

    const draft = parseDraftFromModelOutput(completion.content || '');
    draft.agent.name = input.name;
    return draft;
  },
};