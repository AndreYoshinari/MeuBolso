import { DatabaseSync } from 'node:sqlite';

import {
  toDatabaseError,
  type DatabaseClient,
  type SqlParams,
  type SqlValue,
} from '@/database/client';

export function createNodeDatabaseClient(
  filename = ':memory:',
): DatabaseClient & { close: () => void } {
  const database = new DatabaseSync(filename);
  let depth = 0;
  let closed = false;

  return {
    async run(sql, params = []) {
      execute(database, sql, params);
    },
    async get<T extends Record<string, SqlValue>>(
      sql: string,
      params: SqlParams = [],
    ) {
      try {
        const row = database.prepare(sql).get(...params) as
          Record<string, string | number | null | bigint> | undefined;

        return (row ? normalizeRow(row) : null) as T | null;
      } catch (error) {
        throw toDatabaseError(error);
      }
    },
    async all<T extends Record<string, SqlValue>>(
      sql: string,
      params: SqlParams = [],
    ) {
      try {
        const rows = database.prepare(sql).all(...params) as Record<
          string,
          string | number | null | bigint
        >[];

        return rows.map(normalizeRow) as T[];
      } catch (error) {
        throw toDatabaseError(error);
      }
    },
    close() {
      if (closed) {
        return;
      }

      closed = true;
      database.close();
    },
    async transaction(work) {
      if (depth > 0) {
        return work();
      }

      depth += 1;

      try {
        database.exec('BEGIN');
        const result = await work();
        database.exec('COMMIT');
        return result;
      } catch (error) {
        database.exec('ROLLBACK');
        throw error;
      } finally {
        depth -= 1;
      }
    },
  };
}

function execute(database: DatabaseSync, sql: string, params: SqlParams) {
  try {
    if (params.length === 0) {
      database.exec(sql);
      return;
    }

    database.prepare(sql).run(...params);
  } catch (error) {
    throw toDatabaseError(error);
  }
}

function normalizeRow<
  T extends Record<string, string | number | null | bigint>,
>(row: T): { [K in keyof T]: string | number | null } {
  const normalized: Record<string, string | number | null> = {};

  for (const [key, value] of Object.entries(row)) {
    normalized[key] = typeof value === 'bigint' ? Number(value) : value;
  }

  return normalized as { [K in keyof T]: string | number | null };
}
