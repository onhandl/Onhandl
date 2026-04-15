export const operationalAgentSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "OperationalAgentCharacter",
    "type": "object",
    "required": [
        "agent_type",
        "identity",
        "purpose",
        "character",
        "behavior",
        "interaction",
        "constraints",
        "operational_profile",
        "workflow_policy",
        "execution_policy"
    ],
    "properties": {
        "agent_type": {
            "type": "string",
            "const": "operational_agent"
        },
        "identity": { "$ref": "#/definitions/identity" },
        "purpose": { "$ref": "#/definitions/purpose" },
        "character": { "$ref": "#/definitions/character" },
        "behavior": { "$ref": "#/definitions/behavior" },
        "interaction": { "$ref": "#/definitions/interaction" },
        "constraints": { "$ref": "#/definitions/constraints" },
        "operational_profile": {
            "type": "object",
            "required": [
                "supported_tasks",
                "execution_scope",
                "tool_dependencies"
            ],
            "properties": {
                "supported_tasks": {
                    "type": "array",
                    "items": { "type": "string" }
                },
                "execution_scope": {
                    "type": "string",
                    "enum": [
                        "task_assistance",
                        "task_execution",
                        "monitoring_only",
                        "hybrid"
                    ]
                },
                "tool_dependencies": {
                    "type": "array",
                    "items": { "type": "string" }
                },
                "environment_scope": {
                    "type": "array",
                    "items": { "type": "string" }
                }
            },
            "additionalProperties": false
        },
        "workflow_policy": {
            "type": "object",
            "required": [
                "task_breakdown_style",
                "escalation_policy"
            ],
            "properties": {
                "task_breakdown_style": { "type": "string" },
                "escalation_policy": { "type": "string" },
                "retry_policy": { "type": "string" },
                "failure_reporting_policy": { "type": "string" }
            },
            "additionalProperties": false
        },
        "execution_policy": {
            "type": "object",
            "required": [
                "pre_execution_checks",
                "post_execution_checks"
            ],
            "properties": {
                "pre_execution_checks": {
                    "type": "array",
                    "items": { "type": "string" }
                },
                "post_execution_checks": {
                    "type": "array",
                    "items": { "type": "string" }
                },
                "rollback_policy": { "type": "string" },
                "autonomy_level": {
                    "type": "string",
                    "enum": ["manual", "semi_autonomous", "autonomous"]
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
    "additionalProperties": false
};
