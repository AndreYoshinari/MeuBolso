import type { DatabaseClient } from '@/database/client';
import type { BudgetRow } from '@/database/mappers';

const columns =
  'id, category_id, limit_cents, year_month, created_at, updated_at';

export function createBudgetSource(client: DatabaseClient) {
  return {
    list(): Promise<BudgetRow[]> {
      return client.all<BudgetRow>(
        `SELECT ${columns} FROM budgets ORDER BY year_month, category_id`,
      );
    },
    findById(id: string): Promise<BudgetRow | null> {
      return client.get<BudgetRow>(
        `SELECT ${columns} FROM budgets WHERE id = ?`,
        [id],
      );
    },
    listByPeriod(yearMonth: string): Promise<BudgetRow[]> {
      return client.all<BudgetRow>(
        `SELECT ${columns} FROM budgets WHERE year_month = ? ORDER BY category_id`,
        [yearMonth],
      );
    },
    save(row: BudgetRow): Promise<void> {
      return client.run(
        `INSERT INTO budgets (
           id, category_id, limit_cents, year_month, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           category_id = excluded.category_id,
           limit_cents = excluded.limit_cents,
           year_month = excluded.year_month,
           updated_at = excluded.updated_at`,
        [
          row.id,
          row.category_id,
          row.limit_cents,
          row.year_month,
          row.created_at,
          row.updated_at,
        ],
      );
    },
    remove(id: string): Promise<void> {
      return client.run('DELETE FROM budgets WHERE id = ?', [id]);
    },
  };
}
