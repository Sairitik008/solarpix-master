/**
 * Centralized mapping from internal error codes to vendor-friendly display text.
 */

export const VENDOR_ERROR_MESSAGES: Record<string, string> = {
  // Customer Errors
  CUSTOMER_NAME_REQUIRED: 'Customer name is required. Please enter a valid name.',
  CUSTOMER_NOT_FOUND: 'Customer record could not be found.',
  CUSTOMER_EXISTS: 'A customer with this information already exists.',
  INVALID_CUSTOMER_ID: 'Invalid customer identifier provided.',

  // Order Errors
  ORDER_NOT_FOUND: 'Order record could not be found.',
  ORDER_INVALID_AMOUNT: 'Order total amount must be a positive number.',
  ORDER_CUSTOMER_REQUIRED: 'Customer selection is required for creating an order.',

  // Bill Errors
  BILL_NOT_FOUND: 'Billing record could not be found.',
  BILL_INVALID_AMOUNT: 'Bill amount must be greater than zero.',

  // Transaction Ledger Errors
  TRANSACTION_FAILED: 'Unable to record ledger transaction. Please try again.',
  TRANSACTION_AMOUNT_INVALID: 'Transaction amount must be greater than zero.',
  TRANSACTION_TYPE_INVALID: 'Invalid transaction type specified.',

  // Delivery Errors
  DELIVERY_NOT_FOUND: 'Delivery record could not be found.',
  DELIVERY_DATE_REQUIRED: 'Delivery date must be specified.',

  // Database & System Errors
  DB_INIT_FAILED: 'Failed to initialize local encrypted database.',
  DB_QUERY_FAILED: 'Database operation failed. Please try again.',
  NETWORK_SYNC_FAILED: 'Failed to synchronize records with remote server.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
};

/**
 * Returns a vendor-friendly display message for a given internal error code.
 */
export const getVendorErrorMessage = (code: string, fallbackMessage?: string): string => {
  if (VENDOR_ERROR_MESSAGES[code]) {
    return VENDOR_ERROR_MESSAGES[code];
  }
  return fallbackMessage || VENDOR_ERROR_MESSAGES.UNKNOWN_ERROR;
};
