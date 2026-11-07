import type { DatabaseClient } from '@/database/client';
import type { ExchangeRateRow } from '@/database/mappers';

const columns = 'base, quote, rate, quoted_on, fetched_at';

export function createRateSource(client: DatabaseClient) {
  return {
    list(): Promise<ExchangeRateRow[]> {
      return client.all<ExchangeRateRow>(
        `SELECT ${columns} FROM exchange_rates ORDER BY base, quote`,
      );
    },
    save(row: ExchangeRateRow): Promise<void> {
      return client.run(
        `INSERT INTO exchange_rates (base, quote, rate, quoted_on, fetched_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(base, quote) DO UPDATE SET
           rate = excluded.rate,
           quoted_on = excluded.quoted_on,
           fetched_at = excluded.fetched_at`,
        [row.base, row.quote, row.rate, row.quoted_on, row.fetched_at],
      );
    },
  };
}
