import { DatabaseConnection } from '../connection';

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';

export interface Order {
  id: string;
  customer_id: string;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export class OrderRepository {
  private db: DatabaseConnection;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  async insert(order: Order): Promise<void> {
    await this.db.execute(
      `INSERT INTO orders (id, customer_id, status, total_amount, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        order.id,
        order.customer_id,
        order.status,
        order.total_amount,
        order.created_at,
        order.updated_at,
      ]
    );
  }

  async getById(id: string): Promise<Order | null> {
    const res = await this.db.execute(`SELECT * FROM orders WHERE id = ? LIMIT 1`, [id]);
    return res.rows && res.rows.length > 0 ? (res.rows[0] as Order) : null;
  }

  async getByCustomerId(customerId: string): Promise<Order[]> {
    const res = await this.db.execute(
      `SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC`,
      [customerId]
    );
    return (res.rows as Order[]) || [];
  }

  async updateStatus(id: string, status: OrderStatus, updatedAt: string): Promise<void> {
    await this.db.execute(`UPDATE orders SET status = ?, updated_at = ? WHERE id = ?`, [
      status,
      updatedAt,
      id,
    ]);
  }

  async delete(id: string): Promise<void> {
    await this.db.execute(`DELETE FROM orders WHERE id = ?`, [id]);
  }
}
