import { DatabaseConnection } from '../connection';

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export class CustomerRepository {
  private db: DatabaseConnection;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  async insert(customer: Customer): Promise<void> {
    await this.db.execute(
      `INSERT INTO customers (id, name, phone, email, address, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        customer.id,
        customer.name,
        customer.phone || null,
        customer.email || null,
        customer.address || null,
        customer.created_at,
        customer.updated_at,
      ]
    );
  }

  async getById(id: string): Promise<Customer | null> {
    const res = await this.db.execute(`SELECT * FROM customers WHERE id = ? LIMIT 1`, [id]);
    return res.rows && res.rows.length > 0 ? (res.rows[0] as Customer) : null;
  }

  async getAll(): Promise<Customer[]> {
    const res = await this.db.execute(`SELECT * FROM customers ORDER BY name ASC`);
    return (res.rows as Customer[]) || [];
  }

  async update(customer: Customer): Promise<void> {
    await this.db.execute(
      `UPDATE customers SET name = ?, phone = ?, email = ?, address = ?, updated_at = ? WHERE id = ?`,
      [
        customer.name,
        customer.phone || null,
        customer.email || null,
        customer.address || null,
        customer.updated_at,
        customer.id,
      ]
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.execute(`DELETE FROM customers WHERE id = ?`, [id]);
  }
}
