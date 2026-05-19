export const financialAgentSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "FinancialAgentCharacter",
    "type": "object",
    "required": [
        "agent_type",
        "identity",
        "purpose",
        "character",
        "behavior",
        "interaction",
        "constraints",
        "financial_profile",
        "execution_policy",
        "risk_controls"
    ],
    "properties": {
        "agent_type": {
            "type": "string",
            "const": "financial_agent"
        },
        "identity": { "$ref": "#/definitions/identity" },
        "purpose": { "$ref": "#/definitions/purpose" },
        "character": { "$ref": "#/definitions/character" },
        "behavior": { "$ref": "#/definitions/behavior" },
        "interaction": { "$ref": "#/definitions/interaction" },
        "constraints": { "$ref": "#/definitions/constraints" },
        "financial_profile": {
            "type": "object",
            "required": [
                "supported_assets",
                "supported_actions",
                "account_scope"
            ],
            "properties": {
                "supported_assets": {
                    "type": "array",
                    "minItems": 1,
                    "items": { "type": "string" }
                },
                "supported_actions": {
                    "type": "array",
                    "minItems": 1,
                    "items": {
                        "type": "string",
                        "enum": [
                            "check_balance",
                            "transfer_funds",
                            "track_transactions",
                            "portfolio_summary",
                            "payment_execution",
                            "allowance_management"
                        ]
                    }
                },
                "account_scope": {
                    "type": "string",
                    "enum": ["single_account", "multi_account", "delegated_access"]
                },
                "custody_model": {
                    "type": "string",
                    "enum": ["non_custodial", "custodial", "hybrid"]
                }
            },
            "additionalProperties": false
        },
        "execution_policy": {
            "type": "object",
            "required": [
                "requires_explicit_confirmation",
                "pre_execution_checks"
            ],
            "properties": {
                "requires_explicit_confirmation": { "type": "boolean" },
                "pre_execution_checks": {
                    "type": "array",
                    "items": { "type": "string" }
                },
                "post_execution_checks": {
                    "type": "array",
                    "items": { "type": "string" }
                },
                "failure_recovery_policy": { "type": "string" }
            },
            "additionalProperties": false
        },
        "risk_controls": {
            "type": "object",
            "required": [
                "confirmation_required_for",
                "forbidden_financial_actions"
            ],
            "properties": {
                "confirmation_required_for": {
                    "type": "array",
                    "items": { "type": "string" }
                },
                "forbidden_financial_actions": {
                    "type": "array",
                    "items": { "type": "string" }
                },
                "transaction_limits": {
                    "type": ["object", "null"],
                    "properties": {
                        "single_transaction_limit": { "type": ["number", "null"] },
                        "daily_limit": { "type": ["number", "null"] }
                    },
                    "additionalProperties": false
                }
            },
            "additionalProperties": false
        }
    },
    "definitions": {
        "identity": {
            "type": "object",
            "required": ["name", "role", "description"],
            "properties": {
                "name": { "type": "string" },
                "role": { "type": "string" },
                "description": { "type": "string" },
                "version": { "type": "string" }
            },
            "additionalProperties": false
        },
        "purpose": {
            "type": "object",
            "required": ["primary_goal"],
            "properties": {
                "primary_goal": { "type": "string" },
                "secondary_goals": { "type": "array", "items": { "type": "string" } },
                "non_goals": { "type": "array", "items": { "type": "string" } }
            },
            "additionalProperties": false
        },
        "character": {
            "type": "object",
            "required": ["bio", "tone", "traits"],
            "properties": {
                "bio": { "type": "string" },
                "tone": { "type": "string" },
                "traits": { "type": "array", "items": { "type": "string" } },
                "values": { "type": "array", "items": { "type": "string" } },
                "communication_style": { "type": "array", "items": { "type": "string" } }
            },
            "additionalProperties": false
        },
        "behavior": {
            "type": "object",
            "required": ["clarification_policy", "fallback_behavior"],
            "properties": {
                "clarification_policy": { "type": "string" },
                "ambiguity_policy": { "type": "string" },
                "fallback_behavior": { "type": "string" },
                "initiative_level": {
                    "type": "string",
                    "enum": ["low", "moderate", "high", "Low", "Moderate", "High"]
                }
            },
            "additionalProperties": false
        },
        "interaction": {
            "type": "object",
            "required": ["response_style", "verbosity"],
            "properties": {
                "response_style": { "type": "string" },
                "verbosity": {
                    "type": "string",
                    "enum": ["concise", "balanced", "detailed", "Concise", "Balanced", "Detailed"]
                },
                "confirmation_style": { "type": "string" },
                "status_reporting": { "type": "boolean" }
            },
            "additionalProperties": false
        },
        "constraints": {
            "type": "object",
            "required": ["must_not_do"],
            "properties": {
                "must_not_do": { "type": "array", "items": { "type": "string" } },
                "safety_rules": { "type": "array", "items": { "type": "string" } },
                "human_in_the_loop": { "type": "boolean" }
            },
            "additionalProperties": false
        }
    },
    "additionalProperties": false,
    "instructions": {
        "length": "",
    }
};
