import { DatabaseConnection } from '../connection';

export type TransactionType = 'CREDIT' | 'DEBIT';

export interface Transaction {
  id: string;
  customer_id: string;
  type: TransactionType;
  amount: number;
  description?: string;
  reference_id?: string;
  created_at: string;
}

export class TransactionRepository {
  private db: DatabaseConnection;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  /**
   * Inserts an immutable ledger entry.
   * Ledger entries are never directly updated to maintain financial audit integrity.
   */
  async insert(transaction: Transaction): Promise<void> {
    await this.db.execute(
      `INSERT INTO transactions (id, customer_id, type, amount, description, reference_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        transaction.id,
        transaction.customer_id,
        transaction.type,
        transaction.amount,
        transaction.description || null,
        transaction.reference_id || null,
        transaction.created_at,
      ]
    );
  }

  async getById(id: string): Promise<Transaction | null> {
    const res = await this.db.execute(`SELECT * FROM transactions WHERE id = ? LIMIT 1`, [id]);
    return res.rows && res.rows.length > 0 ? (res.rows[0] as Transaction) : null;
  }

  async getByCustomerId(customerId: string): Promise<Transaction[]> {
    const res = await this.db.execute(
      `SELECT * FROM transactions WHERE customer_id = ? ORDER BY created_at DESC`,
      [customerId]
    );
    return (res.rows as Transaction[]) || [];
  }

  /**
   * Dynamically computes customer balance from immutable ledger rows.
   * Net Balance = SUM(CREDIT) - SUM(DEBIT)
   */
  async calculateCustomerBalance(customerId: string): Promise<number> {
    const txs = await this.getByCustomerId(customerId);
    return txs.reduce((acc, tx) => {
      return tx.type === 'CREDIT' ? acc + tx.amount : acc - tx.amount;
    }, 0);
  }
}
