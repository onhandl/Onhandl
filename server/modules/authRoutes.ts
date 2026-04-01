import { FastifyPluginAsync } from 'fastify';
import { User } from '../models/User';
import { Workspace } from '../models/Workspace';
import { Otp } from '../models/Otp';
import bcrypt from 'bcrypt';
import { sendOtpEmail } from '../services/emailService';
import crypto from 'crypto';
import { WELCOME_TOKENS } from '../lib/tokens';

function generateOtp(): string {
    return String(crypto.randomInt(100000, 999999));
}

async function issueOtp(
    email: string,
    purpose: 'signup' | 'forgot_password',
    pendingData?: { username?: string; password: string; name?: string }
): Promise<void> {
    // Invalidate any existing unused OTPs for this email+purpose
    await Otp.deleteMany({ email, purpose, used: false });

    const rawCode = generateOtp();
    const hashedCode = await bcrypt.hash(rawCode, 10);

    await Otp.create({
        email,
        code: hashedCode,
        purpose,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        used: false,
        pendingData,
    });

    await sendOtpEmail(email, rawCode, purpose);
}

function setAuthCookie(fastify: any, reply: any, userId: string, username: string) {
    const token = fastify.jwt.sign({ id: userId, username });
    return reply.setCookie('auth_token', token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
    });
}

export const authRoutes: FastifyPluginAsync = async (fastify) => {

    // ─── Register: send OTP, don't create user yet ──────────────────────────
    fastify.post<{ Body: { username?: string; email?: string; password?: string; name?: string } }>(
        '/register',
        async (request, reply) => {
            const { username, email, password, name } = request.body;

            if (!password) return reply.code(400).send({ error: 'Password is required' });
            if (!email) return reply.code(400).send({ error: 'Email is required' });
            if (!username) return reply.code(400).send({ error: 'Username is required' });

            // Check for existing users
            const existing = await User.findOne({ $or: [{ email }, { username }] });
            if (existing?.email === email) return reply.code(409).send({ error: 'Email already in use' });
            if (existing?.username === username) return reply.code(409).send({ error: 'Username already taken' });

            const hashedPassword = await bcrypt.hash(password, 10);

            await issueOtp(email, 'signup', { username, password: hashedPassword, name });

            return reply.code(200).send({
                requiresVerification: true,
                message: 'A verification code has been sent to your email. Enter it to complete registration.',
            });
        }
    );

    // ─── Verify email OTP → create user + workspace ─────────────────────────
    fastify.post<{ Body: { email: string; code: string } }>(
        '/verify-email',
        async (request, reply) => {
            const { email, code } = request.body;
            if (!email || !code) return reply.code(400).send({ error: 'Email and code are required' });

            const otp = await Otp.findOne({ email, purpose: 'signup', used: false });

            if (!otp) return reply.code(400).send({ error: 'No pending verification found for this email' });
            if (otp.expiresAt < new Date()) return reply.code(400).send({ error: 'Verification code has expired' });

            const isMatch = await bcrypt.compare(code, otp.code);
            if (!isMatch) return reply.code(400).send({ error: 'Invalid verification code' });

            // Mark OTP used before creating user (idempotency)
            otp.used = true;
            await otp.save();

            const { username, password, name } = otp.pendingData!;

            const user = await User.create({
                username,
                email,
                password,
                name,
                isEmailVerified: true,
                tokens: WELCOME_TOKENS,
                plan: 'free',
            });

            await Workspace.create({
                name: `${username || email}'s Workspace`,
                ownerId: user._id,
                members: [user._id],
            });

            setAuthCookie(fastify, reply, String(user._id), user.username ?? '');
            return reply.code(201).send({
                success: true,
                user: { id: user._id, username: user.username, email: user.email },
            });
        }
    );

    // ─── Login ───────────────────────────────────────────────────────────────
    fastify.post<{ Body: { username: string; password?: string } }>(
        '/login',
        async (request, reply) => {
            const { username, password } = request.body;

            if (!password) return reply.code(400).send({ error: 'Password is required' });

            const user = await User.findOne({ $or: [{ username }, { email: username }] });
            if (!user || !user.password) return reply.code(401).send({ error: 'Invalid credentials' });

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return reply.code(401).send({ error: 'Invalid credentials' });

            setAuthCookie(fastify, reply, String(user._id), user.username ?? '');
            return reply.send({
                success: true,
                user: { id: user._id, username: user.username, email: user.email },
            });
        }
    );

    // ─── Current user ────────────────────────────────────────────────────────
    fastify.get('/me', async (request, reply) => {
        const token = (request.cookies as any)['auth_token'];
        if (!token) return reply.code(401).send({ error: 'Unauthorized' });
        let decoded: any;
        try { decoded = fastify.jwt.verify(token); } catch { return reply.code(401).send({ error: 'Invalid token' }); }
        const user = await User.findById(decoded.id)
            .select('username email name whatsapp telegramUsername avatarUrl bio tokens plan planExpiry notifications savedPaymentMethods apiKeys profileViews isAdmin createdAt updatedAt')
            .lean();
        if (!user) return reply.code(404).send({ error: 'User not found' });
        return reply.send({ avatarUrl: '', ...user });
    });

    // ─── Get avatar URL (lightweight) ────────────────────────────────────────
    fastify.get('/me/avatar', async (request, reply) => {
        const token = (request.cookies as any)['auth_token'];
        if (!token) return reply.code(401).send({ error: 'Unauthorized' });
        let decoded: any;
        try { decoded = fastify.jwt.verify(token); } catch { return reply.code(401).send({ error: 'Invalid token' }); }
        const user = await User.findById(decoded.id).select('avatarUrl name username').lean();
        if (!user) return reply.code(404).send({ error: 'User not found' });
        return reply.send({
            avatarUrl: (user as any).avatarUrl || null,
            name:      (user as any).name      || (user as any).username || null,
        });
    });

    // ─── Update profile (username, email, contacts, avatarUrl) ──────────────
    fastify.post<{ Body: { username?: string; email?: string; whatsapp?: string; telegramUsername?: string; avatarUrl?: string } }>(
        '/me',
        async (request, reply) => {
            const token = (request.cookies as any)['auth_token'];
            if (!token) return reply.code(401).send({ error: 'Unauthorized' });
            let decoded: any;
            try { decoded = fastify.jwt.verify(token); } catch { return reply.code(401).send({ error: 'Invalid token' }); }

            const { username, email, whatsapp, telegramUsername, avatarUrl } = request.body;
            const $set: Record<string, any> = {};
            if (username)              $set.username        = username;
            if (email)                 $set.email           = email;
            if (whatsapp !== undefined)          $set.whatsapp        = whatsapp;
            if (telegramUsername !== undefined)  $set.telegramUsername = telegramUsername;
            if (avatarUrl !== undefined)         $set.avatarUrl        = avatarUrl;

            const user = await User.findByIdAndUpdate(decoded.id, { $set }, { new: true })
                .select('username email name whatsapp telegramUsername avatarUrl bio tokens plan profileViews')
                .lean();
            if (!user) return reply.code(404).send({ error: 'User not found' });
            return reply.send(user);
        }
    );

    // ─── Logout ──────────────────────────────────────────────────────────────
    fastify.post('/logout', async (request, reply) => {
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

    // ─── Forgot password: send OTP ───────────────────────────────────────────
    fastify.post<{ Body: { email: string } }>(
        '/forgot-password',
        async (request, reply) => {
            const { email } = request.body;
            if (!email) return reply.code(400).send({ error: 'Email is required' });

            // Always return 200 to avoid email enumeration
            const user = await User.findOne({ email });
            if (user) {
                await issueOtp(email, 'forgot_password');
            }

            return reply.send({
                message: 'If that email is registered, a reset code has been sent.',
            });
        }
    );

    // ─── Reset password: verify OTP + update password ───────────────────────
    fastify.post<{ Body: { email: string; code: string; newPassword: string } }>(
        '/reset-password',
        async (request, reply) => {
            const { email, code, newPassword } = request.body;
            if (!email || !code || !newPassword) {
                return reply.code(400).send({ error: 'Email, code, and newPassword are required' });
            }
            if (newPassword.length < 8) {
                return reply.code(400).send({ error: 'Password must be at least 8 characters' });
            }

            const otp = await Otp.findOne({ email, purpose: 'forgot_password', used: false });
            if (!otp) return reply.code(400).send({ error: 'No active reset request found for this email' });
            if (otp.expiresAt < new Date()) return reply.code(400).send({ error: 'Reset code has expired' });

            const isMatch = await bcrypt.compare(code, otp.code);
            if (!isMatch) return reply.code(400).send({ error: 'Invalid reset code' });

            otp.used = true;
            await otp.save();

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await User.updateOne({ email }, { password: hashedPassword });

            return reply.send({ success: true, message: 'Password updated successfully' });
        }
    );
};
