import { z } from 'zod';

/*
 * The same rules as the API's Joi validation (bugtrail-api src/validations), checked in the browser
 * first so people see mistakes before a round trip. The API still validates everything.
 */

export const email = z
  .string()
  .trim()
  .min(1, 'Enter your email.')
  .email('Enter a valid email, like name@invennico.com.');

export const newPassword = z
  .string()
  .min(8, 'Use at least 8 characters.')
  .regex(/[a-zA-Z]/, 'Include at least one letter.')
  .regex(/\d/, 'Include at least one number.');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password.'),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name.').max(100, 'Keep it under 100 characters.'),
  email,
  password: newPassword,
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    password: newPassword,
    confirm: z.string().min(1, 'Type the password again.'),
  })
  .refine((values) => values.password === values.confirm, {
    path: ['confirm'],
    message: "The passwords don't match.",
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.'),
    newPassword,
    confirm: z.string().min(1, 'Type the new password again.'),
  })
  .refine((values) => values.newPassword === values.confirm, {
    path: ['confirm'],
    message: "The passwords don't match.",
  })
  // The API refuses this too; saying it here saves a round trip.
  .refine((values) => values.newPassword !== values.currentPassword, {
    path: ['newPassword'],
    message: 'Choose a password different from your current one.',
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
