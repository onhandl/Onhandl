import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';

import { ENV } from './shared/config/environments';
import { registerRoutes } from './api/routes';

import authPlugin from './api/plugins/auth.plugin';
import apiKeyAuthPlugin from './api/plugins/api-key-auth.plugin';
import rateLimitPlugin from './api/plugins/rate-limit.plugin';

import { registerOpenApi } from './api/docs/openapi';
import { registerScalarDocs } from './api/docs/scalar.controller';
import { bootstrapAgentBalances } from './core/financial-runtime/AgentBalances/bootstrap';

export async function buildApp() {
  bootstrapAgentBalances();
  const app = Fastify({ logger: true });

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
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-workspace-id'],
  });

  app.register(fastifyCookie);

  app.register(fastifyJwt, {
    secret: ENV.JWT_SECRET,
    cookie: {
      cookieName: 'auth_token',
      signed: false,
    },
  });

  app.register(authPlugin);
  app.register(apiKeyAuthPlugin);
  app.register(rateLimitPlugin);

  await registerOpenApi(app);
  await registerScalarDocs(app);

  app.register(registerRoutes, { prefix: '/api' });

  // Global terminal redirects (handle both /api prefix and root)
  const terminalApproveRedirect = async (request: any, reply: any) => {
    const { userCode } = request.query as { userCode: string };
    const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/api$/, '');
    const url = `${appUrl}/terminal/approve?userCode=${userCode}`;
    return reply.redirect(url);
  };
  app.get('/api/terminal/approve', terminalApproveRedirect);
  app.get('/terminal/approve', terminalApproveRedirect);

  app.get('/api/health', async () => ({ status: 'ok' }));

  return app;
}