import { DatabaseConnection } from '../connection';

export type DeliveryStatus = 'SCHEDULED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';

export interface Delivery {
  id: string;
  order_id: string;
  status: DeliveryStatus;
  delivery_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export class DeliveryRepository {
  private db: DatabaseConnection;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  async insert(delivery: Delivery): Promise<void> {
    await this.db.execute(
      `INSERT INTO deliveries (id, order_id, status, delivery_date, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        delivery.id,
        delivery.order_id,
        delivery.status,
        delivery.delivery_date || null,
        delivery.notes || null,
        delivery.created_at,
        delivery.updated_at,
      ]
    );
  }

  async getById(id: string): Promise<Delivery | null> {
    const res = await this.db.execute(`SELECT * FROM deliveries WHERE id = ? LIMIT 1`, [id]);
    return res.rows && res.rows.length > 0 ? (res.rows[0] as Delivery) : null;
  }

  async getByOrderId(orderId: string): Promise<Delivery[]> {
    const res = await this.db.execute(
      `SELECT * FROM deliveries WHERE order_id = ? ORDER BY created_at DESC`,
      [orderId]
    );
    return (res.rows as Delivery[]) || [];
  }

  async updateStatus(id: string, status: DeliveryStatus, updatedAt: string): Promise<void> {
    await this.db.execute(`UPDATE deliveries SET status = ?, updated_at = ? WHERE id = ?`, [
      status,
      updatedAt,
      id,
    ]);
  }

  async delete(id: string): Promise<void> {
    await this.db.execute(`DELETE FROM deliveries WHERE id = ?`, [id]);
  }
}
