import type { DatabaseClient } from '@/database/client';
import type { TransactionRow } from '@/database/mappers';

const columns =
  'id, description, kind, amount_cents, category_id, occurred_on, note, created_at, updated_at';

export function createTransactionSource(client: DatabaseClient) {
  return {
    list(): Promise<TransactionRow[]> {
      return client.all<TransactionRow>(
        `SELECT ${columns} FROM transactions ORDER BY occurred_on DESC, id DESC`,
      );
    },
    findById(id: string): Promise<TransactionRow | null> {
      return client.get<TransactionRow>(
        `SELECT ${columns} FROM transactions WHERE id = ?`,
        [id],
      );
    },
    listByPeriod(from: string, to: string): Promise<TransactionRow[]> {
      return client.all<TransactionRow>(
        `SELECT ${columns}
         FROM transactions
         WHERE occurred_on >= ? AND occurred_on < ?
         ORDER BY occurred_on DESC, id DESC`,
        [from, to],
      );
    },
    countByCategory(): Promise<{ category_id: string; total: number }[]> {
      return client.all<{ category_id: string; total: number }>(
        `SELECT category_id, COUNT(*) AS total
         FROM transactions
         GROUP BY category_id`,
      );
    },
    save(row: TransactionRow): Promise<void> {
      return client.run(
        `INSERT INTO transactions (
           id, description, kind, amount_cents, category_id, occurred_on, note, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           description = excluded.description,
           kind = excluded.kind,
           amount_cents = excluded.amount_cents,
           category_id = excluded.category_id,
           occurred_on = excluded.occurred_on,
           note = excluded.note,
           updated_at = excluded.updated_at`,
        [
          row.id,
          row.description,
          row.kind,
          row.amount_cents,
          row.category_id,
          row.occurred_on,
          row.note,
          row.created_at,
          row.updated_at,
        ],
      );
    },
    remove(id: string): Promise<void> {
      return client.run('DELETE FROM transactions WHERE id = ?', [id]);
    },
  };
}
