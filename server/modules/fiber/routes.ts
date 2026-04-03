import { FastifyPluginAsync } from 'fastify'
import {
    handleConnectPeer, handleListPeers,
    handleOpenChannel, handleCloseChannel, handleListChannels, handleNodeInfo,
} from './handlers/channel'
import { handleGenerateInvoice, handleDecodeInvoice } from './handlers/invoice'
import { handlePayAgent, handlePayInvoice, handleGetPayments, handlePaymentStatus } from './handlers/payment'

export const fiberRoutes: FastifyPluginAsync = async (fastify) => {
    // Peer lifecycle (required before open_channel)
    fastify.post('/peer/connect',            handleConnectPeer)
    fastify.get('/peers/:agentId',           handleListPeers)

    // Channel lifecycle
    fastify.post('/channel/open',            handleOpenChannel)
    fastify.post('/channel/close',           handleCloseChannel)
    fastify.get('/channels/:agentId',        handleListChannels)
    fastify.get('/node-info/:agentId',       handleNodeInfo)

    // Invoice
    fastify.post('/invoice/generate',        handleGenerateInvoice)
    fastify.post('/invoice/decode',          handleDecodeInvoice)

    // Payments
    fastify.post('/pay',                     handlePayAgent)
    fastify.post('/pay-invoice',             handlePayInvoice)
    fastify.get('/payments/:agentId',        handleGetPayments)
    fastify.get('/payment-status/:paymentHash', handlePaymentStatus)
}
