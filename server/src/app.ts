import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';

import { ENV } from './shared/config/environments';
import { registerRoutes } from './api/routes';

export const app = Fastify({ logger: true });

// ── CORS ────────────────────────────────────────────────────────────────────
app.register(cors, {
    origin: (origin: string | undefined, cb: (err: Error | null, allow: boolean) => void) => {
        if (ENV.NODE_ENV !== 'production') {
            cb(null, true);
            return;
        }
        if (!origin || ENV.ALLOWED_ORIGINS.includes(origin)) {
            cb(null, true);
        } else {
            cb(new Error('Not allowed by CORS'), false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-ai-api-key'],
});

// ── PLUGINS ─────────────────────────────────────────────────────────────────
app.register(fastifyJwt, { secret: ENV.JWT_SECRET });
app.register(fastifyCookie);

// ── ROUTES ──────────────────────────────────────────────────────────────────
app.register(registerRoutes, { prefix: '/api' });

// Health check
app.get('/api/health', async () => ({ status: 'ok' }));
