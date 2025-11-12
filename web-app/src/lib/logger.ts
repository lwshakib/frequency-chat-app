/**
 * Centralized logging utility
 * In production, these can be replaced with proper logging service
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const isDevelopment = import.meta.env.DEV;

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug("[DEBUG]", ...args);
    }
  },
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info("[INFO]", ...args);
    }
  },
  warn: (...args: unknown[]) => {
    console.warn("[WARN]", ...args);
  },
  error: (...args: unknown[]) => {
    console.error("[ERROR]", ...args);
    // In production, you might want to send this to an error tracking service
    // e.g., Sentry, LogRocket, etc.
  },
};

