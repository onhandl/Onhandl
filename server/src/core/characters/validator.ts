import Ajv from 'ajv';
import { financialAgentSchema } from './schemas/financial';
import { socialAgentSchema } from './schemas/social';
import { operationalAgentSchema } from './schemas/operational';

const ajv = new Ajv({ allErrors: true });

function getSchema(agentType: string) {
    switch (agentType) {
        case 'financial_agent':
            return financialAgentSchema;
        case 'social_agent':
            return socialAgentSchema;
        case 'operational_agent':
            return operationalAgentSchema;
        default:
            throw new Error(`Unsupported agent type: ${agentType}`);
    }
}

export function validateCharacter(agentType: string, payload: any) {
    const schema = getSchema(agentType);
    const validate = ajv.compile(schema);

    // The schema expects agent_type to be inside the payload
    if (!payload.agent_type) {
        payload.agent_type = agentType;
    }

    const valid = validate(payload);

    if (!valid) {
        return {
            isValid: false,
            errors: validate.errors
        };
    }

    return {
        isValid: true,
        errors: null
    };
}
