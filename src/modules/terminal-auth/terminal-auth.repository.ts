import { TerminalSession, ITerminalSession } from '../../infrastructure/database/models/TerminalSession';

export const TerminalAuthRepository = {
    async create(data: Partial<ITerminalSession>) {
        return TerminalSession.create(data);
    },
    async findByDeviceCode(deviceCode: string) {
        return TerminalSession.findOne({ deviceCode }).lean<ITerminalSession>();
    },
    async findByUserCode(userCode: string) {
        return TerminalSession.findOne({ userCode, status: 'pending' }).lean<ITerminalSession>();
    },
    async updateStatus(id: string, status: string, additionalData?: Partial<ITerminalSession>) {
        return TerminalSession.findByIdAndUpdate(
            id,
            { status, ...additionalData },
            { new: true }
        ).lean<ITerminalSession>();
    },
    async deleteByDeviceCode(deviceCode: string) {
        return TerminalSession.deleteOne({ deviceCode });
    },
    async findByUserId(userId: string) {
        return TerminalSession.find({ userId, revoked: false, expiresAt: { $gt: new Date() } })
            .select('-hashedAccessToken') // Don't expose hashes
            .sort({ createdAt: -1 })
            .lean();
    },
    async revokeSession(id: string, userId: string) {
        return TerminalSession.findOneAndUpdate(
            { _id: id, userId },
            { revoked: true, status: 'denied' },
            { new: true }
        ).lean();
    }
};
