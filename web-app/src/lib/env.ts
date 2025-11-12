/**
 * Environment variable validation and access
 */

const requiredEnvVars = ["VITE_CLERK_PUBLISHABLE_KEY", "VITE_API_URL"] as const;

type EnvVar = (typeof requiredEnvVars)[number];

/**
 * Validates that all required environment variables are present
 */
export function validateEnv(): void {
  const missing: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!import.meta.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}

/**
 * Gets an environment variable with optional default value
 */
export function getEnv(key: EnvVar, defaultValue?: string): string {
  const value = import.meta.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value || defaultValue || "";
}

/**
 * Gets the API URL from environment variables
 */
export function getApiUrl(): string {
  return getEnv("VITE_API_URL");
}

/**
 * Gets the Clerk publishable key from environment variables
 */
export function getClerkPublishableKey(): string {
  return getEnv("VITE_CLERK_PUBLISHABLE_KEY");
}

