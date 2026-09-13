import { DatabaseConnection } from '../connection';

export type SyncStatus = 'PENDING' | 'SYNCED' | 'CONFLICT';

export interface SyncMeta {
  table_name: string;
  record_id: string;
  version: number;
  sync_status: SyncStatus;
  updated_at: string;
}

export interface ConflictLog {
  id: string;
  table_name: string;
  record_id: string;
  local_payload: string;
  remote_payload: string;
  resolved: boolean;
  created_at: string;
}

export class SyncRepository {
  private db: DatabaseConnection;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  // --- Sync Meta Operations ---

  async upsertSyncMeta(meta: SyncMeta): Promise<void> {
    await this.db.execute(
      `INSERT INTO sync_meta (table_name, record_id, version, sync_status, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(table_name, record_id) DO UPDATE SET
         version = excluded.version,
         sync_status = excluded.sync_status,
         updated_at = excluded.updated_at`,
      [meta.table_name, meta.record_id, meta.version, meta.sync_status, meta.updated_at]
    );
  }

  async getSyncMeta(tableName: string, recordId: string): Promise<SyncMeta | null> {
    const res = await this.db.execute(
      `SELECT * FROM sync_meta WHERE table_name = ? AND record_id = ? LIMIT 1`,
      [tableName, recordId]
    );
    return res.rows && res.rows.length > 0 ? (res.rows[0] as SyncMeta) : null;
  }

  async getPendingSyncRecords(): Promise<SyncMeta[]> {
    const res = await this.db.execute(`SELECT * FROM sync_meta WHERE sync_status = 'PENDING'`);
    return (res.rows as SyncMeta[]) || [];
  }

  // --- Conflict Log Operations ---

  async insertConflictLog(conflict: ConflictLog): Promise<void> {
    await this.db.execute(
      `INSERT INTO conflict_log (id, table_name, record_id, local_payload, remote_payload, resolved, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        conflict.id,
        conflict.table_name,
        conflict.record_id,
        conflict.local_payload,
        conflict.remote_payload,
        conflict.resolved ? 1 : 0,
        conflict.created_at,
      ]
    );
  }

  async getUnresolvedConflicts(): Promise<ConflictLog[]> {
    const res = await this.db.execute(
      `SELECT * FROM conflict_log WHERE resolved = 0 ORDER BY created_at DESC`
    );
    return (res.rows as ConflictLog[]) || [];
  }

  async resolveConflict(id: string): Promise<void> {
    await this.db.execute(`UPDATE conflict_log SET resolved = 1 WHERE id = ?`, [id]);
  }
}
