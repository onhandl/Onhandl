import { OAuth2Client } from 'google-auth-library';
import { User } from '../../../infrastructure/database/models/User';
import { ENV } from '../../../shared/config/environments';

const googleClient = new OAuth2Client(
    ENV.GOOGLE_CLIENT_ID,
    ENV.GOOGLE_CLIENT_SECRET,
    ENV.GOOGLE_REDIRECT_URI
);

function makeUsername(email: string) {
    return email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 24);
}

async function getAvailableUsername(email: string) {
    const base = makeUsername(email) || 'user';

    let username = base;
    let counter = 1;

    while (await User.exists({ username })) {
        username = `${base}${counter}`;
        counter++;
    }

    return username;
}

export class GoogleAuthService {
    static getAuthUrl(state: string) {
        return googleClient.generateAuthUrl({
            scope: ['openid', 'email', 'profile'],
            state,
            prompt: 'select_account',
            redirect_uri: ENV.GOOGLE_REDIRECT_URI,
        });
    }

    static async authenticate(code: string) {
        const { tokens } = await googleClient.getToken(code);

        if (!tokens.id_token) {
            throw Object.assign(new Error('Missing Google ID token'), { code: 400 });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: tokens.id_token,
            audience: ENV.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        if (!payload?.sub || !payload.email) {
            throw Object.assign(new Error('Invalid Google account'), { code: 400 });
        }

        const googleId = payload.sub;
        const email = payload.email;
        const now = new Date();

        let user = await User.findOne({
            $or: [
                { 'google.id': googleId },
                { email },
            ],
        });

        if (!user) {
            // New Google user -> signup + login
            return await User.create({
                email,
                username: await getAvailableUsername(email),
                name: payload.name || makeUsername(email),
                avatarUrl: payload.picture || '',
                isEmailVerified: Boolean(payload.email_verified),
                google: {
                    id: googleId,
                    linkedAt: now,
                    lastAuthAt: now,
                },
            });
        }

        if (!user.google?.id) {
            // Existing email/password user -> link Google account
            user.google = {
                id: googleId,
                linkedAt: now,
                lastAuthAt: now,
            };
        } else {
            // Existing Google user -> login
            user.google.lastAuthAt = now;
        }

        user.avatarUrl = payload.picture || user.avatarUrl;
        user.isEmailVerified = Boolean(payload.email_verified) || user.isEmailVerified;

        await user.save();

        return user;
    }
}