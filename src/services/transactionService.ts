import { getDatabaseConnection, TransactionRepository, Transaction, TransactionType } from '../db';
import { ServiceResult } from '../types';
import { getVendorErrorMessage } from '../utils';

export class TransactionService {
  private async getRepo(): Promise<TransactionRepository> {
    const conn = await getDatabaseConnection();
    return new TransactionRepository(conn);
  }

  async recordTransaction(data: {
    customer_id: string;
    type: TransactionType;
    amount: number;
    description?: string;
    reference_id?: string;
  }): Promise<ServiceResult<Transaction>> {
    try {
      if (!data.customer_id) {
        const code = 'INVALID_CUSTOMER_ID';
        return {
          success: false,
          error: {
            code,
            message: 'Customer ID required.',
            userFacingMessage: getVendorErrorMessage(code),
          },
        };
      }

      if (data.amount <= 0) {
        const code = 'TRANSACTION_AMOUNT_INVALID';
        return {
          success: false,
          error: {
            code,
            message: 'Amount must be greater than zero.',
            userFacingMessage: getVendorErrorMessage(code),
          },
        };
      }

      if (data.type !== 'CREDIT' && data.type !== 'DEBIT') {
        const code = 'TRANSACTION_TYPE_INVALID';
        return {
          success: false,
          error: {
            code,
            message: 'Invalid transaction type.',
            userFacingMessage: getVendorErrorMessage(code),
          },
        };
      }

      const repo = await this.getRepo();
      const transaction: Transaction = {
        id: `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        customer_id: data.customer_id,
        type: data.type,
        amount: data.amount,
        description: data.description?.trim(),
        reference_id: data.reference_id?.trim(),
        created_at: new Date().toISOString(),
      };

      await repo.insert(transaction);
      return { success: true, data: transaction };
    } catch (err: any) {
      const code = 'TRANSACTION_FAILED';
      return {
        success: false,
        error: {
          code,
          message: err?.message || 'Failed to record ledger transaction.',
          userFacingMessage: getVendorErrorMessage(code),
        },
      };
    }
  }

  async getCustomerTransactions(customerId: string): Promise<ServiceResult<Transaction[]>> {
    try {
      const repo = await this.getRepo();
      const txs = await repo.getByCustomerId(customerId);
      return { success: true, data: txs };
    } catch (err: any) {
      const code = 'DB_QUERY_FAILED';
      return {
        success: false,
        error: {
          code,
          message: err?.message || 'Failed to fetch customer transactions.',
          userFacingMessage: getVendorErrorMessage(code),
        },
      };
    }
  }

  async getCustomerBalance(customerId: string): Promise<ServiceResult<number>> {
    try {
      const repo = await this.getRepo();
      const balance = await repo.calculateCustomerBalance(customerId);
      return { success: true, data: balance };
    } catch (err: any) {
      const code = 'DB_QUERY_FAILED';
      return {
        success: false,
        error: {
          code,
          message: err?.message || 'Failed to compute balance.',
          userFacingMessage: getVendorErrorMessage(code),
        },
      };
    }
  }
}

export const transactionService = new TransactionService();
