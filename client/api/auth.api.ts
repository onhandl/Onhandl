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
};
