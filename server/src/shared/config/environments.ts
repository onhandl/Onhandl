import dotenv from 'dotenv';
import path from 'path';

const NODE_ENV = process.env.NODE_ENV || 'development';

// Load env-specific overrides first, then fall back to base .env
dotenv.config({ path: path.resolve(process.cwd(), `.env.${NODE_ENV}`) });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const ENV = {
    NODE_ENV,
    MONGO_URI: process.env.LOCAL_MONGO_URI || 'mongodb://127.0.0.1:27017/onhandl',
    JWT_SECRET: process.env.JWT_SECRET || 'supersecret_faev',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY as string,
    GEMINI_BASE_URL: process.env.GEMINI_BASE_URL as string,
    GEMINI_MODEL: process.env.GEMINI_MODEL as string,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) || [
        'http://localhost:3000',
    ],
    OPENAI_API_KEY: process.env.OPENAI_API_KEY as string,
    OPENAI_BASE_URL: process.env.OPENAI_BASE_URL as string,
    OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-5.4',
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY as string,
    ANTHROPIC_AUTH_TOKEN: process.env.ANTHROPIC_AUTH_TOKEN as string,
    ANTHROPIC_BASE_URL: (process.env.ANTHROPIC_BASE_URL || 'https://share-ai.ckbdev.com'),
    ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',    
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL as string,
    OLLAMA_MODEL: process.env.OLLAMA_MODEL as string,
    OLLAMA_API_KEY: process.env.OLLAMA_API_KEY || "",
    DEFAULT_AI_PROVIDER: (process.env.DEFAULT_AI_PROVIDER || 'openai'),
    APP_URL: process.env.APP_URL || 'http://localhost:3000',
    API_URL: process.env.API_URL || 'http://localhost:3001/api',

    //  Cookie domain — set to .onhandl.com in production so the cookie is shared
    //  between onhandl.com (frontend) and api.onhandl.com (backend).
    //  Leave blank for local dev (cookie scopes to localhost automatically).
    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || '',

    // Fiber — platform managed node (optional; agents can supply their own)
    FIBER_NODE_URL: process.env.FIBER_NODE_URL || 'http://localhost:8227',
    FIBER_AUTH_TOKEN: process.env.FIBER_AUTH_TOKEN || '',
};

const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET'];

for (const key of REQUIRED_ENV) {
    if (!ENV[key as keyof typeof ENV]) {
        console.error(`Missing required environment variable: ${key}`);
        process.exit(1);
    }
}

if (NODE_ENV !== 'production') {
    console.warn('⚠️  CORS disabled — Development mode (all origins allowed)');
}

console.log(`[ENV] NODE_ENV=${NODE_ENV} | Allowed origins: ${ENV.ALLOWED_ORIGINS.join(', ')}`);
