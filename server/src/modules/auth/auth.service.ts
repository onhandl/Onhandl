import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { User } from '../../infrastructure/database/models/User';
import { Workspace } from '../../infrastructure/database/models/Workspace';
import { Otp } from '../../infrastructure/database/models/Otp';
import { sendOtpEmail } from '../../infrastructure/messaging/email/email.service';
import { WELCOME_TOKENS } from '../../shared/constants/tokens';

function generateOtp(): string {
    return String(crypto.randomInt(100000, 999999));
}

async function issueOtp(
    email: string,
    purpose: 'signup' | 'forgot_password',
    pendingData?: { username?: string; password: string; name?: string }
): Promise<void> {
    await Otp.deleteMany({ email, purpose, used: false });

    const rawCode = generateOtp();
    const hashedCode = await bcrypt.hash(rawCode, 10);

    await Otp.create({
        email,
        code: hashedCode,
        purpose,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        used: false,
        pendingData,
    });

    await sendOtpEmail(email, rawCode, purpose);
}

export async function registerUser(params: {
    username: string;
    email: string;
    password: string;
    name?: string;
}) {
    const { username, email, password, name } = params;

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing?.email === email) throw { code: 409, message: 'Email already in use' };
    if (existing?.username === username) throw { code: 409, message: 'Username already taken' };

    const hashedPassword = await bcrypt.hash(password, 10);
    await issueOtp(email, 'signup', { username, password: hashedPassword, name });
}

export async function verifyEmailOtp(email: string, code: string) {
    const otp = await Otp.findOne({ email, purpose: 'signup', used: false });
    if (!otp) throw { code: 400, message: 'No pending verification found for this email' };
    if (otp.expiresAt < new Date()) throw { code: 400, message: 'Verification code has expired' };

    const isMatch = await bcrypt.compare(code, otp.code);
    if (!isMatch) throw { code: 400, message: 'Invalid verification code' };

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

    return user;
}

export async function loginUser(usernameOrEmail: string, password: string) {
    const user = await User.findOne({ $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }] });
    if (!user || !user.password) throw { code: 401, message: 'Invalid credentials' };

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw { code: 401, message: 'Invalid credentials' };

    return user;
}

export async function sendForgotPasswordOtp(email: string) {
    const user = await User.findOne({ email });
    if (user) {
        await issueOtp(email, 'forgot_password');
    }
}

export async function resetPassword(email: string, code: string, newPassword: string) {
    if (newPassword.length < 8) throw { code: 400, message: 'Password must be at least 8 characters' };

    const otp = await Otp.findOne({ email, purpose: 'forgot_password', used: false });
    if (!otp) throw { code: 400, message: 'No active reset request found for this email' };
    if (otp.expiresAt < new Date()) throw { code: 400, message: 'Reset code has expired' };

    const isMatch = await bcrypt.compare(code, otp.code);
    if (!isMatch) throw { code: 400, message: 'Invalid reset code' };

    otp.used = true;
    await otp.save();

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ email }, { password: hashedPassword });
}
