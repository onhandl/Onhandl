import { FastifyInstance } from 'fastify';

export default (fastify: FastifyInstance) => {
  fastify.get("/api/health", async () => {
    return { ok: true };
});
};
