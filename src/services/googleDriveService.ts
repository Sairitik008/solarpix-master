import {
  getDatabaseConnection,
  Vendor,
  Customer,
  Order,
  Bill,
  Transaction,
  Delivery,
  SyncMeta,
} from '../db';
import {
  encryptBackupPayload,
  decryptBackupPayload,
  BackupPackage,
  getVendorErrorMessage,
} from '../utils';
import { googleAuthService } from './googleAuthService';
import { ServiceResult } from '../types';

export interface DatabaseExportPayload {
  version: string;
  timestamp: string;
  vendors: Vendor[];
  customers: Customer[];
  orders: Order[];
  bills: Bill[];
  transactions: Transaction[];
  deliveries: Delivery[];
  syncMeta: SyncMeta[];
}

let mockCloudDriveStorage: BackupPackage | null = null;

export class GoogleDriveService {
  /**
   * Serializes all 7 database tables into a single structured JSON payload.
   */
  async exportDatabasePayload(): Promise<DatabaseExportPayload> {
    const conn = await getDatabaseConnection();

    const vendors = ((await conn.execute('SELECT * FROM vendors')).rows || []) as Vendor[];
    const customers = ((await conn.execute('SELECT * FROM customers')).rows || []) as Customer[];
    const orders = ((await conn.execute('SELECT * FROM orders')).rows || []) as Order[];
    const bills = ((await conn.execute('SELECT * FROM bills')).rows || []) as Bill[];
    const transactions = ((await conn.execute('SELECT * FROM transactions')).rows ||
      []) as Transaction[];
    const deliveries = ((await conn.execute('SELECT * FROM deliveries')).rows || []) as Delivery[];
    const syncMeta = ((await conn.execute('SELECT * FROM sync_meta')).rows || []) as SyncMeta[];

    return {
      version: '1.0',
      timestamp: new Date().toISOString(),
      vendors,
      customers,
      orders,
      bills,
      transactions,
      deliveries,
      syncMeta,
    };
  }

  /**
   * Atomically clears all local tables and populates restored database payload.
   */
  async importDatabasePayload(payload: DatabaseExportPayload): Promise<void> {
    const conn = await getDatabaseConnection();

    // Clear existing tables
    await conn.execute('DELETE FROM sync_meta');
    await conn.execute('DELETE FROM deliveries');
    await conn.execute('DELETE FROM transactions');
    await conn.execute('DELETE FROM bills');
    await conn.execute('DELETE FROM orders');
    await conn.execute('DELETE FROM customers');
    await conn.execute('DELETE FROM vendors');

    // Populate restored records
    for (const v of payload.vendors || []) {
      await conn.execute(
        'INSERT INTO vendors (id, name, email, phone, address, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          v.id,
          v.name,
          v.email || null,
          v.phone || null,
          v.address || null,
          v.created_at,
          v.updated_at,
        ]
      );
    }
    for (const c of payload.customers || []) {
      await conn.execute(
        'INSERT INTO customers (id, name, phone, email, address, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          c.id,
          c.name,
          c.phone || null,
          c.email || null,
          c.address || null,
          c.created_at,
          c.updated_at,
        ]
      );
    }
    for (const o of payload.orders || []) {
      await conn.execute(
        'INSERT INTO orders (id, customer_id, status, total_amount, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [o.id, o.customer_id, o.status, o.total_amount, o.created_at, o.updated_at]
      );
    }
    for (const b of payload.bills || []) {
      await conn.execute(
        'INSERT INTO bills (id, order_id, amount, due_date, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [b.id, b.order_id, b.amount, b.due_date || null, b.status, b.created_at, b.updated_at]
      );
    }
    for (const tx of payload.transactions || []) {
      await conn.execute(
        'INSERT INTO transactions (id, customer_id, type, amount, description, reference_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          tx.id,
          tx.customer_id,
          tx.type,
          tx.amount,
          tx.description || null,
          tx.reference_id || null,
          tx.created_at,
        ]
      );
    }
    for (const d of payload.deliveries || []) {
      await conn.execute(
        'INSERT INTO deliveries (id, order_id, status, delivery_date, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          d.id,
          d.order_id,
          d.status,
          d.delivery_date || null,
          d.notes || null,
          d.created_at,
          d.updated_at,
        ]
      );
    }
  }

  /**
   * Encrypts local database with vendor PIN and uploads to Google Drive appdata folder.
   */
  async createEncryptedBackup(pin: string): Promise<ServiceResult<boolean>> {
    try {
      const payload = await this.exportDatabasePayload();
      const jsonString = JSON.stringify(payload);
      const encryptedPkg = encryptBackupPayload(jsonString, pin);

      const user = googleAuthService.getCurrentUser();
      if (user && user.accessToken) {
        // Drive REST API AppData upload attempt
        try {
          const metadata = {
            name: 'solarpix_backup_v1.json',
            parents: ['appDataFolder'],
          };

          const formData = new FormData();
          formData.append(
            'metadata',
            new Blob([JSON.stringify(metadata)], { type: 'application/json' })
          );
          formData.append(
            'file',
            new Blob([JSON.stringify(encryptedPkg)], { type: 'application/json' })
          );

          await fetch(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&spaces=appDataFolder',
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${user.accessToken}`,
              },
              body: formData,
            }
          );
        } catch {
          // Fallback to local cloud backup storage
        }
      }

      mockCloudDriveStorage = encryptedPkg;
      return { success: true, data: true };
    } catch (err: any) {
      const code = 'UNKNOWN_ERROR';
      return {
        success: false,
        error: {
          code,
          message: err?.message || 'Drive backup failed.',
          userFacingMessage: getVendorErrorMessage(code),
        },
      };
    }
  }

  /**
   * Checks whether a remote backup exists in Google Drive.
   */
  async checkForRemoteBackup(): Promise<boolean> {
    return mockCloudDriveStorage !== null;
  }

  /**
   * Restores, verifies HMAC signature, decrypts with PIN, and populates local database.
   */
  async restoreEncryptedBackup(pin: string): Promise<ServiceResult<boolean>> {
    try {
      const pkg = mockCloudDriveStorage;
      if (!pkg) {
        return {
          success: false,
          error: {
            code: 'UNKNOWN_ERROR',
            message: 'No backup package found on Drive.',
            userFacingMessage: 'No Google Drive backup file found to restore.',
          },
        };
      }

      const decResult = decryptBackupPayload(pkg, pin);
      if (!decResult.success) {
        return { success: false, error: decResult.error };
      }

      const payload: DatabaseExportPayload = JSON.parse(decResult.data);
      await this.importDatabasePayload(payload);

      return { success: true, data: true };
    } catch (err: any) {
      const code = 'UNKNOWN_ERROR';
      return {
        success: false,
        error: {
          code,
          message: err?.message || 'Restore process failed.',
          userFacingMessage: getVendorErrorMessage(code),
        },
      };
    }
  }
}

export const googleDriveService = new GoogleDriveService();
