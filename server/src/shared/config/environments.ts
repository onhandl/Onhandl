import dotenv from 'dotenv';
import path from 'path';

const NODE_ENV = process.env.NODE_ENV || 'development';

// Load env-specific overrides first, then fall back to base .env
dotenv.config({ path: path.resolve(process.cwd(), `.env.${NODE_ENV}`) });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const ENV = {
    NODE_ENV,
    MONGO_URI: process.env.MONGO_URI as string,
    JWT_SECRET: process.env.JWT_SECRET || 'supersecret_faev',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY as string,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) || [
        'http://localhost:3000',
    ],
    OPENAI_API_KEY: process.env.OPENAI_API_KEY as string,
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL as string,
    OLLAMA_MODEL: process.env.OLLAMA_MODEL as string,
    DEFAULT_AI_PROVIDER: (process.env.DEFAULT_AI_PROVIDER || 'ollama') as 'ollama' | 'gemini' | 'openai',
    APP_URL: process.env.APP_URL || 'http://localhost:3000',
    API_URL: process.env.API_URL || 'http://localhost:3001/api',

    //  Cookie domain — set to .onhandl.com in production so the cookie is shared
    //  between onhandl.com (frontend) and api.onhandl.com (backend).
    //  Leave blank for local dev (cookie scopes to localhost automatically).
    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || '',

    // Stripe (optional for now as we are yet to integrate )
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
    STRIPE_CLIENT_ID: process.env.STRIPE_CLIENT_ID || '',
    STRIPE_REDIRECT_URI:
        process.env.STRIPE_REDIRECT_URI || 'http://localhost:3001/api/payments/stripe/callback',
    // Fiber — platform managed node (optional; agents can supply their own)
    FIBER_NODE_URL:   process.env.FIBER_NODE_URL   || 'http://localhost:8227',
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
