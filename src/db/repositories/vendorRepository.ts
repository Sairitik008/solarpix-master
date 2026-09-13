import { DatabaseConnection } from '../connection';

export interface Vendor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export class VendorRepository {
  private db: DatabaseConnection;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  async insert(vendor: Vendor): Promise<void> {
    await this.db.execute(
      `INSERT INTO vendors (id, name, email, phone, address, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        vendor.id,
        vendor.name,
        vendor.email || null,
        vendor.phone || null,
        vendor.address || null,
        vendor.created_at,
        vendor.updated_at,
      ]
    );
  }

  async getById(id: string): Promise<Vendor | null> {
    const res = await this.db.execute(`SELECT * FROM vendors WHERE id = ? LIMIT 1`, [id]);
    return res.rows && res.rows.length > 0 ? (res.rows[0] as Vendor) : null;
  }

  async getAll(): Promise<Vendor[]> {
    const res = await this.db.execute(`SELECT * FROM vendors ORDER BY name ASC`);
    return (res.rows as Vendor[]) || [];
  }

  async update(vendor: Vendor): Promise<void> {
    await this.db.execute(
      `UPDATE vendors SET name = ?, email = ?, phone = ?, address = ?, updated_at = ? WHERE id = ?`,
      [
        vendor.name,
        vendor.email || null,
        vendor.phone || null,
        vendor.address || null,
        vendor.updated_at,
        vendor.id,
      ]
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.execute(`DELETE FROM vendors WHERE id = ?`, [id]);
  }
}
