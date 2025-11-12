import { toast } from "sonner";
import { logger } from "./logger";
import type { AxiosError } from "axios";

export interface ApiError {
  message: string;
  statusCode?: number;
  details?: unknown;
}

/**
 * Extracts a user-friendly error message from an error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (typeof error === "object" && error !== null) {
    const err = error as Record<string, unknown>;
    if (typeof err.message === "string") {
      return err.message;
    }
    if (typeof err.error === "string") {
      return err.error;
    }
  }
  return "An unexpected error occurred";
}

/**
 * Handles API errors and shows user-friendly toast messages
 */
export function handleApiError(
  error: unknown,
  defaultMessage = "Something went wrong. Please try again."
): void {
  logger.error("API Error:", error);

  let message = defaultMessage;
  let statusCode: number | undefined;

  if (typeof error === "object" && error !== null) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>;
    if (axiosError.response) {
      statusCode = axiosError.response.status;
      const data = axiosError.response.data;
      message =
        data?.message || data?.error || getErrorMessage(error) || defaultMessage;

      // Handle specific status codes
      if (statusCode === 401) {
        message = "You are not authorized. Please sign in again.";
      } else if (statusCode === 403) {
        message = "You don't have permission to perform this action.";
      } else if (statusCode === 404) {
        message = "The requested resource was not found.";
      } else if (statusCode === 429) {
        message = "Too many requests. Please try again later.";
      } else if (statusCode >= 500) {
        message = "Server error. Please try again later.";
      }
    } else if (axiosError.request) {
      message = "Network error. Please check your connection.";
    } else {
      message = getErrorMessage(error) || defaultMessage;
    }
  } else {
    message = getErrorMessage(error) || defaultMessage;
  }

  toast.error(message);
}

/**
 * Wraps an async function with error handling
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  errorMessage?: string
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    handleApiError(error, errorMessage);
    return null;
  }
}

