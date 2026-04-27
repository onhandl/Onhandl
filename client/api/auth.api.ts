import { apiFetch } from '@/lib/api-client';

export const authApi = {
    login: async (payload: any) => {
        return apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },
    register: async (payload: any) => {
        return apiFetch('/auth/register', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },
    verifyEmail: async (payload: any) => {
        return apiFetch('/auth/verify-email', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },
    resendVerification: async (email: string) => {
        return apiFetch('/auth/resend-verification', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    },
    forgotPassword: async (payload: any) => {
        return apiFetch('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },
    resetPassword: async (payload: any) => {
        return apiFetch('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },
    getMe: async () => {
        return apiFetch('/auth/me');
    },
    updateMe: async (payload: any) => {
        return apiFetch('/auth/me', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },
    logout: async () => {
        return apiFetch('/auth/logout', {
            method: 'POST',
            body: JSON.stringify({}),
        });
    },
    verifyTelegram: async (code: string) => {
        return apiFetch('/auth/telegram/verify', {
            method: 'POST',
            body: JSON.stringify({ code }),
        });
    },
    getTelegramPermissions: async () => {
        return apiFetch('/auth/telegram/permissions');
    },
    updateTelegramPermissions: async (payload: any) => {
        return apiFetch('/auth/telegram/permissions', {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });
    },
    getTelegramStatus: async () => {
        return apiFetch('/auth/telegram/status');
    },
    unlinkTelegram: async () => {
        return apiFetch('/auth/telegram/unlink', {
            method: 'POST',
        });
    },
};
