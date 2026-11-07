import type { DatabaseClient } from '@/database/client';
import type { CategoryRow } from '@/database/mappers';

const columns = 'id, name, kind, color, icon, is_system';

export function createCategorySource(client: DatabaseClient) {
  return {
    list(): Promise<CategoryRow[]> {
      return client.all<CategoryRow>(
        `SELECT ${columns} FROM categories ORDER BY name`,
      );
    },
    findById(id: string): Promise<CategoryRow | null> {
      return client.get<CategoryRow>(
        `SELECT ${columns} FROM categories WHERE id = ?`,
        [id],
      );
    },
    save(row: CategoryRow): Promise<void> {
      return client.run(
        `INSERT INTO categories (id, name, kind, color, icon, is_system)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           kind = excluded.kind,
           color = excluded.color,
           icon = excluded.icon,
           is_system = excluded.is_system`,
        [row.id, row.name, row.kind, row.color, row.icon, row.is_system],
      );
    },
    remove(id: string): Promise<void> {
      return client.run('DELETE FROM categories WHERE id = ?', [id]);
    },
  };
}
