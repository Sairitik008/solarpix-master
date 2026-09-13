/**
 * SolarPix SQLite Database Schema & Migrations DDL
 */

export const SCHEMA_V1_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS vendors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED')),
    total_amount REAL NOT NULL DEFAULT 0.0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS bills (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    amount REAL NOT NULL,
    due_date TEXT,
    status TEXT NOT NULL CHECK(status IN ('UNPAID', 'PARTIAL', 'PAID', 'OVERDUE')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('CREDIT', 'DEBIT')),
    amount REAL NOT NULL,
    description TEXT,
    reference_id TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS deliveries (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('SCHEDULED', 'IN_TRANSIT', 'DELIVERED', 'FAILED')),
    delivery_date TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS sync_meta (
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    sync_status TEXT NOT NULL CHECK(sync_status IN ('PENDING', 'SYNCED', 'CONFLICT')),
    updated_at TEXT NOT NULL,
    PRIMARY KEY (table_name, record_id)
  );`,

  `CREATE TABLE IF NOT EXISTS conflict_log (
    id TEXT PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    local_payload TEXT NOT NULL,
    remote_payload TEXT NOT NULL,
    resolved INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );`,

  // Index performance optimizations for frequent queries
  `CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);`,
  `CREATE INDEX IF NOT EXISTS idx_bills_order ON bills(order_id);`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_id);`,
  `CREATE INDEX IF NOT EXISTS idx_deliveries_order ON deliveries(order_id);`,
  `CREATE INDEX IF NOT EXISTS idx_sync_meta_status ON sync_meta(sync_status);`,
];
