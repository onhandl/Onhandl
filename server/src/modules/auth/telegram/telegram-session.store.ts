import { TelegramFailedAttemptState, TelegramIdentitySnapshot, TelegramSession } from './telegram.types';

const CODE_TTL_MS = 5 * 60 * 1000;
const LOCK_WINDOW_MS = 5 * 60 * 1000;
const LOCK_DURATION_MS = 5 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 3;
const CLEANUP_INTERVAL_MS = 60 * 1000;
const AUTH_SESSION_MAX_IDLE_MS = 30 * 24 * 60 * 60 * 1000;

class TelegramSessionStore {
  private sessionsByTelegramUserId = new Map<string, TelegramSession>();
  private codeToTelegramUserId = new Map<string, string>();
  private failedAttemptsByVerifier = new Map<string, TelegramFailedAttemptState>();
  private cleanupHandle: NodeJS.Timeout;

  constructor() {
    this.cleanupHandle = setInterval(() => this.cleanup(), CLEANUP_INTERVAL_MS);
  }

  issueCode(identity: TelegramIdentitySnapshot): string {
    const now = Date.now();
    const existing = this.sessionsByTelegramUserId.get(identity.userId);
    if (existing?.code) this.codeToTelegramUserId.delete(existing.code);

    const code = String(Math.floor(100000 + Math.random() * 900000));
    this.sessionsByTelegramUserId.set(identity.userId, {
      identity,
      permissionMask: 1,
      state: 'pending',
      code,
      expiresAt: now + CODE_TTL_MS,
      createdAt: now,
      lastSeenAt: now,
    });
    this.codeToTelegramUserId.set(code, identity.userId);
    return code;
  }

  touchAuthenticated(telegramUserId: string) {
    const session = this.sessionsByTelegramUserId.get(telegramUserId);
    if (!session) return;
    session.lastSeenAt = Date.now();
    this.sessionsByTelegramUserId.set(telegramUserId, session);
  }

  terminate(telegramUserId: string) {
    const session = this.sessionsByTelegramUserId.get(telegramUserId);
    if (session?.code) this.codeToTelegramUserId.delete(session.code);
    this.sessionsByTelegramUserId.delete(telegramUserId);
  }

  getSessionByTelegramUserId(telegramUserId: string) {
    return this.sessionsByTelegramUserId.get(telegramUserId) || null;
  }

  verifyCode(code: string, verifierId: string): TelegramIdentitySnapshot {
    this.assertVerifierNotBlocked(verifierId);

    const telegramUserId = this.codeToTelegramUserId.get(code);
    if (!telegramUserId) {
      this.recordFailedAttempt(verifierId);
      throw Object.assign(new Error('Invalid verification code'), { code: 400 });
    }

    const session = this.sessionsByTelegramUserId.get(telegramUserId);
    if (!session) {
      this.codeToTelegramUserId.delete(code);
      this.recordFailedAttempt(verifierId);
      throw Object.assign(new Error('Verification session not found'), { code: 400 });
    }

    if (session.state === 'authenticated') {
      this.codeToTelegramUserId.delete(code);
      this.recordFailedAttempt(verifierId);
      throw Object.assign(new Error('Code already used'), { code: 400 });
    }

    if (!session.expiresAt || Date.now() > session.expiresAt) {
      this.terminate(telegramUserId);
      this.recordFailedAttempt(verifierId);
      throw Object.assign(new Error('Verification code has expired'), { code: 400 });
    }

    if (session.code !== code) {
      this.recordFailedAttempt(verifierId);
      throw Object.assign(new Error('Verification code mismatch'), { code: 400 });
    }

    this.failedAttemptsByVerifier.delete(verifierId);
    this.codeToTelegramUserId.delete(code);
    session.code = undefined;
    session.expiresAt = undefined;
    session.state = 'authenticated';
    session.authenticatedAt = Date.now();
    session.lastSeenAt = Date.now();
    this.sessionsByTelegramUserId.set(telegramUserId, session);
    return session.identity;
  }

  markAuthenticated(telegramUserId: string) {
    const session = this.sessionsByTelegramUserId.get(telegramUserId);
    if (!session) return;
    session.state = 'authenticated';
    session.authenticatedAt = Date.now();
    session.lastSeenAt = Date.now();
    this.sessionsByTelegramUserId.set(telegramUserId, session);
  }

  private assertVerifierNotBlocked(verifierId: string) {
    const state = this.failedAttemptsByVerifier.get(verifierId);
    if (!state?.blockedUntil) return;
    if (Date.now() > state.blockedUntil) {
      this.failedAttemptsByVerifier.delete(verifierId);
      return;
    }
    throw Object.assign(new Error('Too many invalid attempts. Try again later.'), { code: 429 });
  }

  private recordFailedAttempt(verifierId: string) {
    const now = Date.now();
    const current = this.failedAttemptsByVerifier.get(verifierId);

    if (!current || now - current.windowStart > LOCK_WINDOW_MS) {
      this.failedAttemptsByVerifier.set(verifierId, { count: 1, windowStart: now });
      return;
    }

    const count = current.count + 1;
    if (count >= MAX_FAILED_ATTEMPTS) {
      this.failedAttemptsByVerifier.set(verifierId, {
        count,
        windowStart: current.windowStart,
        blockedUntil: now + LOCK_DURATION_MS,
      });
      return;
    }

    this.failedAttemptsByVerifier.set(verifierId, {
      count,
      windowStart: current.windowStart,
    });
  }

  private cleanup() {
    const now = Date.now();
    for (const [telegramUserId, session] of this.sessionsByTelegramUserId.entries()) {
      if (session.state === 'pending' && session.expiresAt && now > session.expiresAt) {
        this.terminate(telegramUserId);
        continue;
      }
      if (session.state === 'authenticated' && now - session.lastSeenAt > AUTH_SESSION_MAX_IDLE_MS) {
        this.terminate(telegramUserId);
      }
    }

    for (const [verifierId, state] of this.failedAttemptsByVerifier.entries()) {
      if (state.blockedUntil && now > state.blockedUntil) {
        this.failedAttemptsByVerifier.delete(verifierId);
        continue;
      }
      if (!state.blockedUntil && now - state.windowStart > LOCK_WINDOW_MS) {
        this.failedAttemptsByVerifier.delete(verifierId);
      }
    }
  }

  stop() {
    clearInterval(this.cleanupHandle);
  }
}

export const telegramSessionStore = new TelegramSessionStore();
