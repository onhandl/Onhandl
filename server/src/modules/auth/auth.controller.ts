import { FastifyInstance } from 'fastify';
import { ENV } from '../../shared/config/environments';
import { verifyAuthCookie } from '../../api/middlewares/auth';
import { User } from '../../infrastructure/database/models/User';
import {
    registerUser,
    verifyEmailOtp,
    loginUser,
    sendForgotPasswordOtp,
    resetPassword,
} from './auth.service';

function setAuthCookie(fastify: any, reply: any, userId: string, username: string) {
    const token = fastify.jwt.sign({ id: userId, username });
    const isProd = process.env.NODE_ENV === 'production';
    const cookieOptions: Record<string, any> = {
        path: '/',
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
    };
    if (isProd && ENV.COOKIE_DOMAIN) {
        cookieOptions.domain = ENV.COOKIE_DOMAIN;
    }
    return reply.setCookie('auth_token', token, cookieOptions);
}

export async function authController(fastify: FastifyInstance) {
    fastify.post<{ Body: { username?: string; email?: string; password?: string; name?: string } }>(
        '/register',
        async (request, reply) => {
            const { username, email, password, name } = request.body;
            if (!password) return reply.code(400).send({ error: 'Password is required' });
            if (!email) return reply.code(400).send({ error: 'Email is required' });
            if (!username) return reply.code(400).send({ error: 'Username is required' });
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
        async (request, reply) => {
            const { email, code } = request.body;
            if (!email || !code) return reply.code(400).send({ error: 'Email and code are required' });
            try {
                const user = await verifyEmailOtp(email, code);
                setAuthCookie(fastify, reply, String(user._id), user.username ?? '');
                return reply.code(201).send({
                    success: true,
                    user: { id: user._id, username: user.username, email: user.email },
                });
            } catch (e: any) {
                return reply.code(e.code || 500).send({ error: e.message });
            }
        }
    );

    fastify.post<{ Body: { username: string; password?: string } }>(
        '/login',
        async (request, reply) => {
            const { username, password } = request.body;
            if (!password) return reply.code(400).send({ error: 'Password is required' });
            try {
                const user = await loginUser(username, password);
                setAuthCookie(fastify, reply, String(user._id), user.username ?? '');
                return reply.send({
                    success: true,
                    user: { id: user._id, username: user.username, email: user.email },
                });
            } catch (e: any) {
                return reply.code(e.code || 500).send({ error: e.message });
            }
        }
    );

    fastify.post('/logout', async (_request, reply) => {
        return reply
            .setCookie('auth_token', '', {
                path: '/',
                httpOnly: true,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
                expires: new Date(0),
            })
            .send({ success: true, message: 'Logged out successfully' });
    });

    fastify.post<{ Body: { email: string } }>(
        '/forgot-password',
        async (request, reply) => {
            const { email } = request.body;
            if (!email) return reply.code(400).send({ error: 'Email is required' });
            await sendForgotPasswordOtp(email);
            return reply.send({ message: 'If that email is registered, a reset code has been sent.' });
        }
    );

    fastify.post<{ Body: { email: string; code: string; newPassword: string } }>(
        '/reset-password',
        async (request, reply) => {
            const { email, code, newPassword } = request.body;
            if (!email || !code || !newPassword) {
                return reply.code(400).send({ error: 'Email, code, and newPassword are required' });
            }
            try {
                await resetPassword(email, code, newPassword);
                return reply.send({ success: true, message: 'Password updated successfully' });
            } catch (e: any) {
                return reply.code(e.code || 500).send({ error: e.message });
            }
        }
    );

    // ── Profile read handled here (previously in authRoutes as /me) ──────────
    fastify.get('/me', async (request, reply) => {
        const decoded = verifyAuthCookie(fastify, request.cookies, reply);
        if (!decoded) return;
        const user = await User.findById(decoded.id)
            .select('username email name whatsapp telegramUsername avatarUrl bio tokens plan planExpiry notifications savedPaymentMethods apiKeys profileViews isAdmin createdAt updatedAt')
            .lean();
        if (!user) return reply.code(404).send({ error: 'User not found' });
        return reply.send({ avatarUrl: '', ...user });
    });

    fastify.get('/me/avatar', async (request, reply) => {
        const decoded = verifyAuthCookie(fastify, request.cookies, reply);
        if (!decoded) return;
        const user = await User.findById(decoded.id).select('avatarUrl name username').lean();
        if (!user) return reply.code(404).send({ error: 'User not found' });
        return reply.send({ avatarUrl: user.avatarUrl || null, name: user.name || user.username || null });
    });

    fastify.post<{ Body: { username?: string; email?: string; whatsapp?: string; telegramUsername?: string; avatarUrl?: string } }>(
        '/me',
        async (request, reply) => {
            const decoded = verifyAuthCookie(fastify, request.cookies, reply);
            if (!decoded) return;
            const { username, email, whatsapp, telegramUsername, avatarUrl } = request.body;
            const $set: Record<string, string> = {};
            if (username) $set.username = username;
            if (email) $set.email = email;
            if (whatsapp !== undefined) $set.whatsapp = whatsapp;
            if (telegramUsername !== undefined) $set.telegramUsername = telegramUsername;
            if (avatarUrl !== undefined) $set.avatarUrl = avatarUrl;
            const user = await User.findByIdAndUpdate(decoded.id, { $set }, { new: true })
                .select('username email name whatsapp telegramUsername avatarUrl bio tokens plan profileViews')
                .lean();
            if (!user) return reply.code(404).send({ error: 'User not found' });
            return reply.send(user);
        }
    );
}
