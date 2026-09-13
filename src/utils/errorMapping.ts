/**
 * Centralized error message mapping utility for SolarPix application.
 */

export interface AppError {
  code: string;
  message: string;
  userFacingMessage: string;
}

export const ERROR_MESSAGES: Record<string, string> = {
  DB_INIT_FAILED: 'Failed to initialize local encrypted database.',
  DB_QUERY_FAILED: 'Database query execution failed.',
  VAULT_ENCRYPTION_FAILED: 'Failed to encrypt photo payload.',
  MEDIA_PERMISSION_DENIED: 'Media library access permission was denied.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
};

export const getErrorMessage = (errorCode: string): string => {
  return ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.UNKNOWN_ERROR;
};
