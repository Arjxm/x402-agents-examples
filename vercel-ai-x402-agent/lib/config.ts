/**
 * Configuration utilities for environment-specific settings
 */

/**
 * Get the base API URL for the current environment
 * - Development: http://localhost:3000
 * - Production: Uses NEXT_PUBLIC_API_URL or falls back to Vercel URL
 */
export function getBaseApiUrl(): string {
  // If explicitly set, use that
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // In production on Vercel, use VERCEL_URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Fallback to localhost for development
  return 'http://localhost:3000';
}
