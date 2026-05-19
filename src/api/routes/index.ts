import { FastifyInstance } from 'fastify';

import { authRoutes } from '../../modules/auth';
import { terminalAuthRoutes } from '../../modules/terminal-auth';
import { userRoutes } from '../../modules/users';
import { workspaceRoutes } from '../../modules/workspaces';
import { paymentRoutes } from '../../modules/payments';
import { supportRoutes } from '../../modules/support';
import { adminRoutes } from '../../modules/admin';
import { blogRoutes } from '../../modules/blog';
import { botRoutes } from '../../modules/bots';
import { aiRoutes } from '../../modules/ai';
import { developerApiKeyController } from '../../modules/developer-api-keys/developer-api-key.controller';
import { financialAgentRoutes } from '../../modules/financial-agents';

export async function registerRoutes(app: FastifyInstance) {
    app.register(authRoutes, { prefix: '/auth' });
    app.register(terminalAuthRoutes, { prefix: '/terminal/auth' });
    app.register(userRoutes, { prefix: '/users' });
    app.register(workspaceRoutes, { prefix: '/workspaces' });
    app.register(paymentRoutes, { prefix: '/payments' });
    app.register(financialAgentRoutes);
    app.register(supportRoutes, { prefix: '/support' });
    app.register(adminRoutes, { prefix: '/admin' });
    app.register(blogRoutes, { prefix: '/blog' });
    app.register(botRoutes, { prefix: '/bots' });
    app.register(aiRoutes, { prefix: '/ai' });
    app.register(developerApiKeyController, { prefix: '/developer' });
}
