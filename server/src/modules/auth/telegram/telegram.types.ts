export interface TelegramPermissions {
    notifications: boolean;
    write: boolean;
}

export interface TelegramIdentity {
    userId: string;
    chatId: string;
    username?: string;
    firstName?: string;
    lastName?: string;
}

export interface TelegramVerifyInput {
    telegramUserId: string;
    chatId: string;
    username?: string;
    firstName?: string;
    lastName?: string;
}
