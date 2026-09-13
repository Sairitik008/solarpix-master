import { DatabaseConnection } from '../connection';

export type BillStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE';

export interface Bill {
  id: string;
  order_id: string;
  amount: number;
  due_date?: string;
  status: BillStatus;
  created_at: string;
  updated_at: string;
}

export class BillRepository {
  private db: DatabaseConnection;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  async insert(bill: Bill): Promise<void> {
    await this.db.execute(
      `INSERT INTO bills (id, order_id, amount, due_date, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        bill.id,
        bill.order_id,
        bill.amount,
        bill.due_date || null,
        bill.status,
        bill.created_at,
        bill.updated_at,
      ]
    );
  }

  async getById(id: string): Promise<Bill | null> {
    const res = await this.db.execute(`SELECT * FROM bills WHERE id = ? LIMIT 1`, [id]);
    return res.rows && res.rows.length > 0 ? (res.rows[0] as Bill) : null;
  }

  async getByOrderId(orderId: string): Promise<Bill[]> {
    const res = await this.db.execute(
      `SELECT * FROM bills WHERE order_id = ? ORDER BY created_at DESC`,
      [orderId]
    );
    return (res.rows as Bill[]) || [];
  }

  async updateStatus(id: string, status: BillStatus, updatedAt: string): Promise<void> {
    await this.db.execute(`UPDATE bills SET status = ?, updated_at = ? WHERE id = ?`, [
      status,
      updatedAt,
      id,
    ]);
  }

  async delete(id: string): Promise<void> {
    await this.db.execute(`DELETE FROM bills WHERE id = ?`, [id]);
  }
}
