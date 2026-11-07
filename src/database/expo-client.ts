import type { SQLiteDatabase } from 'expo-sqlite';

import {
  toDatabaseError,
  type DatabaseClient,
  type SqlParams,
} from '@/database/client';

export function createExpoClient(database: SQLiteDatabase): DatabaseClient {
  let depth = 0;

  return {
    async run(sql, params) {
      try {
        await database.runAsync(sql, bind(params));
      } catch (error) {
        throw toDatabaseError(error);
      }
    },
    async get(sql, params) {
      try {
        return await database.getFirstAsync(sql, bind(params));
      } catch (error) {
        throw toDatabaseError(error);
      }
    },
    async all(sql, params) {
      try {
        return await database.getAllAsync(sql, bind(params));
      } catch (error) {
        throw toDatabaseError(error);
      }
    },
    async transaction(work) {
      if (depth > 0) {
        return work();
      }

      depth += 1;

      try {
        let result!: Awaited<ReturnType<typeof work>>;
        await database.withTransactionAsync(async () => {
          result = await work();
        });
        return result;
      } finally {
        depth -= 1;
      }
    },
  };
}

function bind(params?: SqlParams): (string | number | null)[] {
  return params ? [...params] : [];
}
