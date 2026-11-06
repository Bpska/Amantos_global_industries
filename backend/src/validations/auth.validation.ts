import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    username: z.string().trim().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const changePasswordSchema = z.object({
  body: z
    .object({
      oldPassword: z.string().optional(),
      currentPassword: z.string().optional(),
      newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
    })
    .refine((data) => !!(data.oldPassword || data.currentPassword), {
      message: 'Current password is required (as oldPassword or currentPassword)',
      path: ['oldPassword'],
    }),
});

export type LoginInput = z.infer<typeof loginSchema>['body'];
export type ChangePasswordInput = {
  oldPassword: string;
  newPassword: string;
};
