import { FastifyInstance } from 'fastify';
import { ENV } from '../../shared/config/environments';
import { UserService } from '../users/user.service';
import {
    registerUser, verifyEmailOtp, loginUser,
    sendForgotPasswordOtp, resetPassword,
} from './auth.service';
import {
    cookieAuthSecurity,
    standardErrorResponses,
    authErrorResponses,
    resourceErrorResponses,
    userProfileSchema,
    authUserSchema,
} from '../../shared/docs';

function setAuthCookie(fastify: any, reply: any, userId: string, username: string, isAdmin = false) {
    const token = fastify.jwt.sign({ id: userId, username, isAdmin });
    const isProd = process.env.NODE_ENV === 'production';
    const cookieOptions: Record<string, unknown> = {
        path: '/',
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
    };
    if (isProd && ENV.COOKIE_DOMAIN) cookieOptions.domain = ENV.COOKIE_DOMAIN;
    return reply.setCookie('auth_token', token, cookieOptions);
}

function toSafeUserProfile(record: any) {
    const tg = record?.telegram;
    return {
        ...record,
        telegram: tg ? {
            linked: true,
            username: tg.username,
            firstName: tg.firstName,
            lastName: tg.lastName,
            linkedAt: tg.linkedAt,
            lastAuthAt: tg.lastAuthAt,
        } : { linked: false },
    };
}

export async function authController(fastify: FastifyInstance) {
    fastify.post<{ Body: { username?: string; email?: string; password?: string; name?: string } }>(
        '/register',
        {
            schema: {
                tags: ['Auth'],
                summary: 'Register a new user',
                description: 'Creates a new user account and sends a verification OTP to the provided email. The account is inactive until verified.',
                body: {
                    type: 'object',
                    required: ['username', 'email', 'password'],
                    properties: {
                        username: { type: 'string', minLength: 3 },
                        email: { type: 'string', format: 'email' },
                        password: { type: 'string', minLength: 6 },
                        name: { type: 'string' },
                    },
                },
                response: {
                    200: {
                        description: 'Registration successful — verification email sent',
                        type: 'object',
                        properties: {
                            requiresVerification: { type: 'boolean' },
                            message: { type: 'string' },
                        },
                    },
                    ...standardErrorResponses([400, 409, 500]),
                },
            },
        },
        async (request, reply) => {
            const { username, email, password, name } = request.body;
            if (!password || !email || !username) return reply.code(400).send({ error: 'Username, email and password are required' });

            try {
                await registerUser({ username, email, password, name });
                return reply.code(200).send({
                    requiresVerification: true,
                    message: 'A verification code has been sent to your email. Enter it to complete registration.',
                });
            } catch (e: any) {
                return reply.code(e.code || 500).send({ error: e.message });
            }
        }
    );

    fastify.post<{ Body: { email: string; code: string } }>(
        '/verify-email',
        {
            schema: {
                tags: ['Auth'],
                summary: 'Verify email address',
                description: 'Verifies the OTP sent to the user email after registration. On success, sets the auth cookie and activates the account.',
                body: {
                    type: 'object',
                    required: ['email', 'code'],
                    properties: {
                        email: { type: 'string', format: 'email' },
                        code: { type: 'string', description: '6-digit OTP code from email' },
                    },
                },
                response: {
                    201: {
                        description: 'Email verified and user logged in',
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            user: authUserSchema,
                        },
                    },
                    ...standardErrorResponses([400, 500]),
                },
            },
        },
        async (request, reply) => {
            const { email, code } = request.body;
            if (!email || !code) return reply.code(400).send({ error: 'Email and code are required' });

            try {
                const user = await verifyEmailOtp(email, code);
                setAuthCookie(fastify, reply, String(user._id), user.username ?? '', user.isAdmin);
                return reply.code(201).send({
                    success: true,
                    user: {
                        _id: String(user._id),
                        username: user.username,
                        email: user.email,
                    },
                });
            } catch (e: any) {
                return reply.code(e.code || 500).send({ error: e.message });
            }
        }
    );

    fastify.post<{ Body: { username: string; password?: string } }>(
        '/login',
        {
            schema: {
                tags: ['Auth'],
                summary: 'Login',
                description: 'Authenticates a user with username and password. Sets an HTTP-only `auth_token` cookie on success.',
                body: {
                    type: 'object',
                    required: ['username', 'password'],
                    properties: {
                        username: { type: 'string' },
                        password: { type: 'string' },
                    },
                },
                response: {
                    200: {
                        description: 'Login successful',
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            user: authUserSchema,
                        },
                    },
                    ...standardErrorResponses([400, 401, 500]),
                },
            },
        },
        async (request, reply) => {
            const { username, password } = request.body;
            if (!password) return reply.code(400).send({ error: 'Password is required' });

            try {
                const user = await loginUser(username, password);
                setAuthCookie(fastify, reply, String(user._id), user.username ?? '', user.isAdmin);
                return reply.send({
                    success: true,
                    user: {
                        _id: String(user._id),
                        username: user.username,
                        email: user.email,
                    },
                });
            } catch (e: any) {
                return reply.code(e.code || 500).send({ error: e.message });
            }
        }
    );

    fastify.post(
        '/logout',
        {
            schema: {
                tags: ['Auth'],
                summary: 'Logout',
                description: 'Clears the `auth_token` cookie, ending the current session.',
                response: {
                    200: {
                        description: 'Logged out successfully',
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            message: { type: 'string' },
                        },
                    },
                },
            },
        },
        async (_request, reply) => reply
            .setCookie('auth_token', '', {
                path: '/',
                httpOnly: true,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
                expires: new Date(0),
            })
            .send({ success: true, message: 'Logged out successfully' })
    );

    fastify.post<{ Body: { email: string } }>(
        '/forgot-password',
        {
            schema: {
                tags: ['Auth'],
                summary: 'Request password reset',
                description: 'Sends a password reset OTP to the given email if it is registered.',
                body: {
                    type: 'object',
                    required: ['email'],
                    properties: { email: { type: 'string', format: 'email' } },
                },
                response: {
                    200: {
                        description: 'Reset code sent (silently ignored if not registered)',
                        type: 'object',
                        properties: { message: { type: 'string' } },
                    },
                    ...standardErrorResponses([400]),
                },
            },
        },
        async (request, reply) => {
            const { email } = request.body;
            if (!email) return reply.code(400).send({ error: 'Email is required' });
            await sendForgotPasswordOtp(email);
            return reply.send({ message: 'If that email is registered, a reset code has been sent.' });
        }
    );

    fastify.post<{ Body: { email: string; code: string; newPassword: string } }>(
        '/reset-password',
        {
            schema: {
                tags: ['Auth'],
                summary: 'Reset password',
                description: 'Resets the user password using the OTP received from the forgot-password flow.',
                body: {
                    type: 'object',
                    required: ['email', 'code', 'newPassword'],
                    properties: {
                        email: { type: 'string', format: 'email' },
                        code: { type: 'string' },
                        newPassword: { type: 'string', minLength: 6 },
                    },
                },
                response: {
                    200: {
                        description: 'Password updated',
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            message: { type: 'string' },
                        },
                    },
                    ...standardErrorResponses([400, 500]),
                },
            },
        },
        async (request, reply) => {
            const { email, code, newPassword } = request.body;
            if (!email || !code || !newPassword) return reply.code(400).send({ error: 'Email, code, and newPassword are required' });

            try {
                await resetPassword(email, code, newPassword);
                return reply.send({ success: true, message: 'Password updated successfully' });
            } catch (e: any) {
                return reply.code(e.code || 500).send({ error: e.message });
            }
        }
    );

    fastify.get(
        '/me',
        {
            onRequest: [fastify.authenticateAny],
            schema: {
                tags: ['Auth'],
                summary: 'Get current user profile',
                description: 'Returns the full profile of the currently authenticated user.',
                security: [cookieAuthSecurity],
                response: {
                    200: { description: 'User profile', ...userProfileSchema },
                    ...resourceErrorResponses(),
                },
            },
        },
        async (request, reply) => {
            try {
                const user = await UserService.getProfile(
                    request.user.id,
                    'username email name whatsapp telegram avatarUrl bio tokens plan planExpiry notifications savedPaymentMethods apiKeys profileViews isAdmin createdAt updatedAt'
                );
                return reply.send(toSafeUserProfile(user));
            } catch (e: any) {
                return reply.code(e.code || 404).send({ error: e.message });
            }
        }
    );

    fastify.get(
        '/me/avatar',
        {
            onRequest: [fastify.authenticate],
            schema: {
                tags: ['Auth'],
                summary: 'Get current user avatar',
                description: 'Returns only the avatar URL for the authenticated user.',
                security: [cookieAuthSecurity],
                response: {
                    200: {
                        description: 'Avatar URL',
                        type: 'object',
                        properties: { avatarUrl: { type: 'string' } },
                    },
                    ...resourceErrorResponses(),
                },
            },
        },
        async (request, reply) => {
            try {
                return reply.send(await UserService.getAvatar(request.user.id));
            } catch (e: any) {
                return reply.code(e.code || 404).send({ error: e.message });
            }
        }
    );

    fastify.post<{ Body: { username?: string; email?: string; whatsapp?: string; avatarUrl?: string } }>(
        '/me',
        {
            onRequest: [fastify.authenticate],
            schema: {
                tags: ['Auth'],
                summary: 'Update current user profile',
                description: 'Updates editable profile fields for the authenticated user.',
                security: [cookieAuthSecurity],
                body: {
                    type: 'object',
                    properties: {
                        username: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        whatsapp: { type: 'string' },
                        avatarUrl: { type: 'string' },
                    },
                },
                response: {
                    200: { description: 'Updated profile', ...userProfileSchema },
                    ...authErrorResponses(),
                },
            },
        },
        async (request, reply) => {
            try {
                const updated = await UserService.updateProfile(request.user.id, request.body);
                return reply.send(toSafeUserProfile(updated));
            } catch (e: any) {
                return reply.code(e.code || 404).send({ error: e.message });
            }
        }
    );
}
