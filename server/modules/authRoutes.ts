import { FastifyPluginAsync } from 'fastify';
import { User } from '../models/User';
import { Workspace } from '../models/Workspace';
import bcrypt from 'bcrypt';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.post<{ Body: { username?: string; email?: string; password?: string; name?: string } }>(
        '/register',
        async (request, reply) => {
            const { username, email, password, name } = request.body;

            if (!password) {
                return reply.code(400).send({ error: 'Password is required' });
            }

            if (!username && !email) {
                return reply.code(400).send({ error: 'Username or email is required' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            const user = new User({
                username,
                email,
                password: hashedPassword,
                name,
            });

            await user.save();

            // Create a default workspace for the user
            const workspace = new Workspace({
                name: `${username || email}'s Workspace`,
                ownerId: user._id,
                members: [user._id]
            });
            await workspace.save();

            const token = fastify.jwt.sign({ id: user._id, username: user.username });

            return reply
                .setCookie('auth_token', token, {
                    path: '/',
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24 * 7 // 7 days
                })
                .code(201)
                .send({ success: true, user: { id: user._id, username: user.username, email: user.email } });
        }
    );

    fastify.post<{ Body: { username: string; password?: string } }>(
        '/login',
        async (request, reply) => {
            const { username, password } = request.body;

            if (!password) {
                return reply.code(400).send({ error: 'Password is required' });
            }

            const user = await User.findOne({
                $or: [{ username }, { email: username }]
            });

            if (!user || !user.password) {
                return reply.code(401).send({ error: 'Invalid credentials' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return reply.code(401).send({ error: 'Invalid credentials' });
            }

            const token = fastify.jwt.sign({ id: user._id, username: user.username });

            return reply
                .setCookie('auth_token', token, {
                    path: '/',
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24 * 7 // 7 days
                })
                .send({ success: true, user: { id: user._id, username: user.username, email: user.email } });
        }
    );

    fastify.post('/logout', async (request, reply) => {
        request.log.info('User logout sequence initiated');

        return reply
            .setCookie('auth_token', '', {
                path: '/',
                httpOnly: true,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
                expires: new Date(0) // Force immediate expiration
            })
            .send({ success: true, message: 'Logged out successfully' });
    });
};
