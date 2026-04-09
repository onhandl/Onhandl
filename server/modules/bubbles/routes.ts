import { FastifyPluginAsync } from 'fastify';
import {
    listBubbles,
    createBubble,
    getBubble,
    updateBubble,
    deleteBubble,
    getMessages,
    submitTask,
} from './handlers';
import { streamGossip } from './sseHandler';

export const bubbleRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.get('/',              listBubbles);
    fastify.post('/',             createBubble);
    fastify.get('/:id',           getBubble);
    fastify.put('/:id',           updateBubble);
    fastify.delete('/:id',        deleteBubble);
    fastify.get('/:id/messages',  getMessages);
    fastify.get('/:id/stream',    streamGossip);
    fastify.post('/:id/task',     submitTask);
};
