import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  ADMIN_SEED_USERNAME: z.string().default('admin'),
  ADMIN_SEED_PASSWORD: z.string().min(6, 'ADMIN_SEED_PASSWORD must be at least 6 characters').default('AdminPassword@123'),
  CORS_ORIGIN: z.string().optional(),
  SERVE_STATIC_WEB: z
    .string()
    .optional()
    .default('false')
    .transform((val) => val === 'true' || val === '1'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(_env.error.format());
  process.exit(1);
}

export const env = _env.data;
