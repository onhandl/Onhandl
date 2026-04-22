import { FastifyInstance } from 'fastify';
import { AdminService } from '../admin.service';
import {
    cookieAuthSecurity,
    idParamSchema,
    userSchema,
    standardErrorResponses,
} from '../../../shared/docs';

/**
 * UserAdminHandlers: High-privilege user management.
 */
export function registerUserHandlers(fastify: FastifyInstance) {
    // GET /api/admin/users
    fastify.get('/users', {
        onRequest: [fastify.authorizeAdmin],
        schema: {
            tags: ['Admin'],
            summary: 'List all users (Admin)',
            description: 'Returns all registered users in the system. Restricted to administrators.',
            security: [cookieAuthSecurity],
            response: {
                200: {
                    description: 'Full user directory',
                    type: 'array',
                    items: userSchema,
                },
                ...standardErrorResponses([401, 403, 500]),
            },
        },
    }, async () => AdminService.listUsers());

    // DELETE /api/admin/users/:id
    fastify.delete<{ Params: { id: string } }>('/users/:id', {
        onRequest: [fastify.authorizeAdmin],
        schema: {
            tags: ['Admin'],
            summary: 'Force delete user (Admin)',
            description: 'Permanently removes a user and all their data. Restricted to administrators.',
            security: [cookieAuthSecurity],
            params: idParamSchema('User ID'),
            response: {
                200: {
                    description: 'User successfully deleted',
                    type: 'object',
                    properties: { success: { type: 'boolean' } },
                },
                ...standardErrorResponses([401, 403, 404, 500]),
            },
        },
    }, async (request, reply) => {
        try {
            await AdminService.deleteUser(request.params.id);
            return { success: true };
        } catch (err: any) {
            return reply.code(err.code || 500).send({ error: err.message });
        }
    });

    // PATCH /api/admin/users/:id/admin
    fastify.patch<{ Params: { id: string }; Body: { isAdmin: boolean } }>(
        '/users/:id/admin',
        {
            onRequest: [fastify.authorizeAdmin],
            schema: {
                tags: ['Admin'],
                summary: 'Toggle admin status',
                description: 'Promotes or demotes a user to/from administrator role.',
                security: [cookieAuthSecurity],
                params: idParamSchema('User ID'),
                body: {
                    type: 'object',
                    required: ['isAdmin'],
                    properties: {
                        isAdmin: { type: 'boolean' },
                    },
                },
                response: {
                    200: {
                        description: 'User role updated',
                        ...userSchema,
                    },
                    ...standardErrorResponses([401, 403, 404, 500]),
                },
            },
        },
        async (request, reply) => {
            try {
                return await AdminService.toggleUserAdmin(request.params.id, request.body.isAdmin);
            } catch (err: any) {
                return reply.code(err.code || 500).send({ error: err.message });
            }
        }
    );
}
