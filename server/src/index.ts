import Fastify from 'fastify'
import cors from '@fastify/cors'
import connectDb from '../database/connectDB'
import fastifyJwt from '@fastify/jwt'
import fastifyCookie from '@fastify/cookie'
import { authRoutes } from '../modules/authRoutes'
import { workspaceRoutes } from '../modules/workspaceRoutes'
import { agentRoutes } from '../modules/agentRoutes'
import { executionRoutes } from '../modules/executionRoutes'
import { teleCronRoutes } from '../modules/teleCronRoutes'
import { aiRoutes } from '../modules/aiRoutes'
import { botRoutes } from '../modules/botRoutes'
import { templateRoutes } from '../modules/templateRoutes'
import toolsRoutes from '../modules/toolsRoutes'
import { exportRoutes } from '../modules/exportRoutes'
import { marketplaceRoutes } from '../modules/marketplaceRoutes'
import { paymentRoutes } from '../modules/paymentRoutes'
import { blogRoutes } from '../modules/blogRoutes'
import { supportRoutes } from '../modules/supportRoutes'
import { adminRoutes } from '../modules/admin/index'
import { waitlistRoutes } from '../modules/waitlistRoutes'
import { userSettingsRoutes } from '../modules/userSettingsRoutes'
import { reviewRoutes } from '../modules/reviewRoutes'
import { creatorRoutes } from '../modules/creatorRoutes'
import { mcpRoutes } from '../modules/mcp/routes'
import { simulateRoutes } from '../modules/simulateRoutes'
import { syncBlockchainToolsToDb } from '../services/ToolSyncer'
import { ENV } from '../lib/environments'
import { startWorkers } from '../workers/agenda'

const fastify = Fastify({ logger: true })

// ── CORS ────────────────────────────────────────────────────────────────────
// Development: allow all origins including null (file:// PWA testing).
// Production: strict whitelist from ENV.ALLOWED_ORIGINS.
fastify.register(cors, {
    origin: (origin: string | undefined, cb: (err: Error | null, allow: boolean) => void) => {
        if (ENV.NODE_ENV !== 'production') {
            cb(null, true)
            return
        }
        if (!origin || ENV.ALLOWED_ORIGINS.includes(origin)) {
            cb(null, true)
        } else {
            cb(new Error('Not allowed by CORS'), false)
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-ai-api-key'],
})

fastify.register(fastifyJwt, { secret: ENV.JWT_SECRET })
fastify.register(fastifyCookie)

fastify.register(authRoutes, { prefix: '/api/auth' })
fastify.register(aiRoutes, { prefix: '/api/ai' })
fastify.register(botRoutes, { prefix: '/api/bot' })
fastify.register(workspaceRoutes, { prefix: '/api' })
fastify.register(agentRoutes, { prefix: '/api' })
fastify.register(executionRoutes, { prefix: '/api' })
fastify.register(teleCronRoutes, { prefix: '/api' })
fastify.register(templateRoutes, { prefix: '/api' })
fastify.register(toolsRoutes, { prefix: '/api/tools' })
fastify.register(exportRoutes, { prefix: '/api' })
fastify.register(marketplaceRoutes, { prefix: '/api' })
fastify.register(paymentRoutes, { prefix: '/api/payments' })
fastify.register(blogRoutes, { prefix: '/api' })
fastify.register(supportRoutes, { prefix: '/api' })
fastify.register(adminRoutes, { prefix: '/api/admin' })
fastify.register(waitlistRoutes, { prefix: '/api' })
fastify.register(userSettingsRoutes, { prefix: '/api/auth' })
fastify.register(reviewRoutes, { prefix: '/api' })
fastify.register(creatorRoutes, { prefix: '/api' })
fastify.register(mcpRoutes, { prefix: '/mcp' })
fastify.register(simulateRoutes, { prefix: '/api/simulate' })

fastify.get('/api/health', async () => ({ status: 'ok' }))

const startServer = async () => {
    try {
        await startWorkers()
        await syncBlockchainToolsToDb()
        await fastify.listen({ port: 3001, host: '0.0.0.0' })
        fastify.log.info(`Server listening — NODE_ENV=${ENV.NODE_ENV}`)
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}

connectDb(startServer)
