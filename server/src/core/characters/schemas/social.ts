export const socialAgentSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "SocialAgentCharacter",
    "type": "object",
    "required": [
        "agent_type",
        "identity",
        "purpose",
        "character",
        "behavior",
        "interaction",
        "constraints",
        "social_profile",
        "content_policy",
        "engagement_rules"
    ],
    "properties": {
        "agent_type": {
            "type": "string",
            "const": "social_agent"
        },
        "identity": { "$ref": "#/definitions/identity" },
        "purpose": { "$ref": "#/definitions/purpose" },
        "character": { "$ref": "#/definitions/character" },
        "behavior": { "$ref": "#/definitions/behavior" },
        "interaction": { "$ref": "#/definitions/interaction" },
        "constraints": { "$ref": "#/definitions/constraints" },
        "social_profile": {
            "type": "object",
            "required": [
                "supported_platforms",
                "audience_type",
                "brand_voice"
            ],
            "properties": {
                "supported_platforms": {
                    "type": "array",
                    "items": {
                        "type": "string",
                        "enum": [
                            "twitter",
                            "telegram",
                            "discord",
                            "whatsapp",
                            "instagram",
                            "linkedin",
                            "reddit"
                        ]
                    }
                },
                "audience_type": {
                    "type": "array",
                    "items": { "type": "string" }
                },
                "brand_voice": {
                    "type": "string"
                },
                "engagement_mode": {
                    "type": "string",
                    "enum": ["reactive", "proactive", "hybrid"]
                }
            },
            "additionalProperties": false
        },
        "content_policy": {
            "type": "object",
            "required": [
                "allowed_content_types",
                "forbidden_content_types"
            ],
            "properties": {
                "allowed_content_types": {
                    "type": "array",
                    "items": { "type": "string" }
                },
                "forbidden_content_types": {
                    "type": "array",
                    "items": { "type": "string" }
                },
                "sensitive_topics_policy": {
                    "type": "string"
                }
            },
            "additionalProperties": false
        },
        "engagement_rules": {
            "type": "object",
            "required": [
                "reply_policy",
                "escalation_triggers"
            ],
            "properties": {
                "reply_policy": { "type": "string" },
                "dm_policy": { "type": "string" },
                "escalation_triggers": {
                    "type": "array",
                    "items": { "type": "string" }
                },
                "community_moderation_policy": {
                    "type": "string"
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
