import Fastify from 'fastify'
import cors from '@fastify/cors'
import connectDb from '../database/connectDB'
import fastifyJwt from '@fastify/jwt'
import fastifyCookie from '@fastify/cookie'
import { authRoutes } from '../modules/authRoutes'
import { userRoutes } from '../modules/userRoutes'
import { workspaceRoutes } from '../modules/workspaceRoutes'
import { agentRoutes } from '../modules/agentRoutes'
import { executionRoutes } from '../modules/executionRoutes'
import { teleCronRoutes } from '../modules/teleCronRoutes'
import { aiRoutes } from '../modules/aiRoutes'
import toolsRoutes from '../modules/toolsRoutes'
import { syncBlockchainToolsToDb } from '../services/ToolSyncer'
import { ENV } from '../lib/environments'
import { startWorkers } from '../workers/agenda'

const fastify = Fastify({
    logger: true
})

// Use ENV.ALLOWED_ORIGINS instead of hardcoded values
fastify.register(cors, {
    origin: ENV.ALLOWED_ORIGINS,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
})

fastify.register(fastifyJwt, { secret: ENV.JWT_SECRET })
fastify.register(fastifyCookie)

fastify.register(authRoutes, { prefix: '/api/auth' })
fastify.register(aiRoutes, { prefix: '/api/ai' })
fastify.register(userRoutes, { prefix: '/api' })
fastify.register(workspaceRoutes, { prefix: '/api' })
fastify.register(agentRoutes, { prefix: '/api' })
fastify.register(executionRoutes, { prefix: '/api' })
fastify.register(teleCronRoutes, { prefix: '/api' })
fastify.register(toolsRoutes, { prefix: '/api/tools' })

fastify.get('/api/health', async (request, reply) => {
    return { status: 'ok' }
})

const startServer = async () => {
    try {
        await startWorkers()
        await syncBlockchainToolsToDb()
        await fastify.listen({ port: 3001, host: '0.0.0.0' })
        fastify.log.info(`Server listening on ${fastify.server.address()}`)
        fastify.log.info(`CORS allowed origins: ${ENV.ALLOWED_ORIGINS.join(', ')}`)
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}

// Start database and then server
connectDb(startServer)  