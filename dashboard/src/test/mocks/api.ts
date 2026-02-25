/**
 * Shared API mocks for testing.
 *
 * This module provides a centralized mock implementation of the API module
 * used across all test files to ensure consistency and reduce duplication.
 */

/**
 * Mock API error class matching the real ApiError implementation.
 */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}
