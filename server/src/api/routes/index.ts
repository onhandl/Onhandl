import { FastifyInstance } from 'fastify';

import { authRoutes } from '../../modules/auth';
import { userRoutes } from '../../modules/users';
import { workspaceRoutes } from '../../modules/workspaces';
import { agentRoutes } from '../../modules/agents';
import { executionRoutes } from '../../modules/executions';
import { toolRoutes } from '../../modules/tools';
import { paymentRoutes } from '../../modules/payments';
import { marketplaceRoutes } from '../../modules/marketplace';
import { supportRoutes } from '../../modules/support';
import { adminRoutes } from '../../modules/admin';
import { blogRoutes } from '../../modules/blog';
import { reviewRoutes } from '../../modules/reviews';
import { botRoutes } from '../../modules/bots';
import { aiRoutes } from '../../modules/ai';

export async function registerRoutes(app: FastifyInstance) {
    app.register(authRoutes, { prefix: '/auth' });
    app.register(userRoutes, { prefix: '/users' });
    app.register(workspaceRoutes, { prefix: '/workspaces' });
    app.register(agentRoutes, { prefix: '/agents' });
    app.register(executionRoutes, { prefix: '/executions' });
    app.register(toolRoutes, { prefix: '/tools' });
    app.register(paymentRoutes, { prefix: '/payments' });
    app.register(marketplaceRoutes, { prefix: '/marketplace' });
    app.register(supportRoutes, { prefix: '/support' });
    app.register(adminRoutes, { prefix: '/admin' });
    app.register(blogRoutes, { prefix: '/blog' });
    app.register(reviewRoutes, { prefix: '/reviews' }); /* was on /agents/:id/reviews */
    app.register(botRoutes, { prefix: '/bots' }); /* replaces /bot and /telegram */
    app.register(aiRoutes, { prefix: '/ai' });

    // MCP typically gets mounted outside /api occasionally, but we'll register it here.
    // The server setup will prefix all these with /api except where bypassed.
}
