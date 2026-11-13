/**
 * Application configuration — centralizes environment variables
 * and constants used across the frontend.
 */

export const config = {
  /** Base URL for the OfferPrep backend API */
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001",
} as const;

/**
 * Construct a full API URL from a path.
 * @example api("/interviews") => "http://localhost:5001/api/interviews"
 */
export function api(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${config.apiBaseUrl}/api${cleanPath}`;
}

