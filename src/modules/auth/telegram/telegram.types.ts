export interface TelegramPermissions {
  notifications: boolean;
  write: boolean;
}

export type TelegramSessionState = 'pending' | 'authenticated';

export interface TelegramIdentity {
  userId: string;
  chatId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

export interface TelegramIdentitySnapshot extends TelegramIdentity { }

export interface TelegramSession {
  identity: TelegramIdentitySnapshot;
  permissionMask: number;
  state: TelegramSessionState;
  code?: string;
  expiresAt?: number;
  createdAt: number;
  lastSeenAt: number;
  authenticatedAt?: number;
}

export interface TelegramFailedAttemptState {
  count: number;
  windowStart: number;
  blockedUntil?: number;
}

export interface SafeTelegramProfile {
  linked: boolean;
  username?: string;
  firstName?: string;
  lastName?: string;
  linkedAt?: Date;
  lastAuthAt?: Date;
  permissions?: TelegramPermissions;
}

export interface TelegramVerifyInput {
  telegramUserId: string;
  chatId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}
