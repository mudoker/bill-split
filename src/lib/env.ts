/**
 * Application environment configuration.
 * Default is 'PROD'. Only set to 'DEV' when explicitly configured in .env.local or environment.
 */
const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as unknown as { env?: Record<string, string | undefined> }).env : undefined;
const globalEnv = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env;

const rawEnv = (
  process.env.NEXT_PUBLIC_APP_ENV ||
  process.env.VITE_APP_ENV ||
  process.env.APP_ENV ||
  metaEnv?.VITE_APP_ENV ||
  metaEnv?.VITE_ENV ||
  globalEnv?.NEXT_PUBLIC_APP_ENV ||
  globalEnv?.VITE_APP_ENV ||
  globalEnv?.APP_ENV ||
  ''
).trim().toUpperCase();

export const APP_ENV: 'DEV' | 'PROD' = rawEnv === 'DEV' ? 'DEV' : 'PROD';
export const IS_DEV = APP_ENV === 'DEV';
export const IS_PROD = APP_ENV === 'PROD';
