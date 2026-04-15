import { z } from 'zod';

export const AuthValidation = {
    register: z.object({
        username: z.string().min(3),
        email: z.string().email(),
        password: z.string().min(6),
    }),
    login: z.object({
        email: z.string().email(),
        password: z.string(),
    }),
};
