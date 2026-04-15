import { z } from 'zod';

export const UserValidation = {
    updateProfile: z.object({
        name: z.string().optional(),
        bio: z.string().optional(),
    })
};
