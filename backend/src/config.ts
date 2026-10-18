import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV ?? 'development';

if (nodeEnv === 'production' && !process.env.JWT_SECRET) {
  // Fail fast: a predictable secret in production would make tokens forgeable.
  // eslint-disable-next-line no-console
  console.error('FATAL: JWT_SECRET must be set in production');
  process.exit(1);
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv,
  isProduction: nodeEnv === 'production',
  jwtSecret: process.env.JWT_SECRET ?? 'vibecity-dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '24h',
};
