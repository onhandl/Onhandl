import crypto from 'crypto';
import { TerminalAuthRepository } from './terminal-auth.repository';
import { ENV } from '../../shared/config/environments';
import { UserService } from '../users/user.service';

const POLL_INTERVAL = 5; // seconds
const SESSION_EXPIRY = 15 * 60; // 15 mins

export const TerminalAuthService = {
    async startLoginSession() {
        const deviceCode = crypto.randomBytes(32).toString('hex');
        const userCode = crypto.randomBytes(4).toString('hex').toUpperCase();

        const expiresAt = new Date(Date.now() + SESSION_EXPIRY * 1000);

        await TerminalAuthRepository.create({
            deviceCode,
            userCode,
            expiresAt,
            status: 'pending'
        });

        // The URL the user should open on the frontend
        const apiUrl = process.env.API_URL || 'http://localhost:3001/api';
        const loginUrl = `${apiUrl}/terminal/auth/approve?userCode=${userCode}`;

        return {
            deviceCode,
            userCode,
            loginUrl,
            expiresIn: SESSION_EXPIRY,
            pollInterval: POLL_INTERVAL
        };
    },

    async pollSession(deviceCode: string) {
        const session = await TerminalAuthRepository.findByDeviceCode(deviceCode);
        if (!session) {
            throw new Error('Session not found or expired');
        }

        if (session.status === 'approved') {
            if (session.hashedAccessToken) {
                // Token was already issued to a prior poll, do not return it again.
                // We return 'expired' or 'denied' to avoid replay fetches.
                return { status: 'expired' };
            }

            // Generate opaque high-entropy token
            const rawToken = crypto.randomBytes(32).toString('hex');
            const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

            await TerminalAuthRepository.updateStatus(session._id.toString(), 'approved', {
                hashedAccessToken: hashedToken
            });

            // Fetch user info to return in poll response
            let username = 'Authenticated User';
            let plan = 'free';
            if (session.userId) {
                try {
                    const user = await UserService.getProfile(session.userId.toString(), 'username plan tokens');
                    if (user) {
                        username = (user as any).username || (user as any).email || 'Authenticated User';
                        plan = (user as any).plan || 'free';
                    }
                } catch (e) {
                    // Ignore and use defaults
                }
            }

            return {
                status: 'approved',
                accessToken: rawToken, // This is explicitly the ONLY time raw token is available
                userId: session.userId?.toString(),
                workspaceId: session.workspaceId?.toString(),
                username,
                plan
            };
        }

        if (session.status === 'denied' || session.status === 'expired') {
            return { status: session.status };
        }

        if (new Date() > session.expiresAt) {
            await TerminalAuthRepository.updateStatus(session._id.toString(), 'expired');
            return { status: 'expired' };
        }

        return { status: 'pending' };
    },

    async approveSession(userCode: string, userId: string, workspaceId: string, deviceName = 'Onhandl CLI') {
        const session = await TerminalAuthRepository.findByUserCode(userCode);
        if (!session || session.status !== 'pending') {
            throw new Error('Invalid or expired user code');
        }

        await TerminalAuthRepository.updateStatus(session._id.toString(), 'approved', {
            userId: userId as any,
            workspaceId: workspaceId as any,
            deviceName,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Extend session to 7 days
        });

        return { success: true };
    },

    async getSessions(userId: string) {
        return TerminalAuthRepository.findByUserId(userId);
    },

    async revokeSession(sessionId: string, userId: string) {
        const session = await TerminalAuthRepository.revokeSession(sessionId, userId);
        if (!session) {
            throw new Error('Session not found or not authorized to revoke');
        }
        return { success: true, message: 'Terminal session successfully revoked.' };
    },

    async logout(deviceCode: string) {
        await TerminalAuthRepository.deleteByDeviceCode(deviceCode);
    }
};
