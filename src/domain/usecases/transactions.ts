import type {
  CategoryRepository,
  TransactionRepository,
} from '@/domain/repositories';
import type { Transaction } from '@/domain/types';
import { requirePeriod, unwrap, unwrapFound } from '@/domain/usecases/guard';
import { validateTransaction } from '@/domain/rules';

export type TransactionDeps = {
  transactions: TransactionRepository;
  categories: CategoryRepository;
  ids: () => string;
  now: () => string;
};

export async function createTransaction(
  deps: TransactionDeps,
  input: unknown,
): Promise<Transaction> {
  const transaction = unwrap(
    validateTransaction(
      withIdentity(input, deps),
      await deps.categories.list(),
    ),
  );

  await deps.transactions.save(transaction);

  return transaction;
}

export async function updateTransaction(
  deps: TransactionDeps,
  id: string,
  input: unknown,
): Promise<Transaction> {
  const current = unwrapFound(
    await deps.transactions.findById(id),
    'Lançamento não encontrado.',
  );
  const transaction = unwrap(
    validateTransaction(
      {
        ...asFields(input),
        id: current.id,
        createdAt: current.createdAt,
        updatedAt: deps.now(),
      },
      await deps.categories.list(),
    ),
  );

  await deps.transactions.save(transaction);

  return transaction;
}

export async function deleteTransaction(
  deps: TransactionDeps,
  id: string,
): Promise<void> {
  unwrapFound(
    await deps.transactions.findById(id),
    'Lançamento não encontrado.',
  );
  await deps.transactions.remove(id);
}

export async function getTransactions(
  deps: TransactionDeps,
): Promise<Transaction[]> {
  const transactions = await deps.transactions.list();

  return transactions.sort(byRecentDate);
}

export async function getTransactionById(
  deps: TransactionDeps,
  id: string,
): Promise<Transaction> {
  return unwrapFound(
    await deps.transactions.findById(id),
    'Lançamento não encontrado.',
  );
}

export async function getTransactionsByPeriod(
  deps: TransactionDeps,
  period: unknown,
): Promise<Transaction[]> {
  const transactions = await deps.transactions.listByPeriod(
    requirePeriod(period),
  );

  return transactions.sort(byRecentDate);
}

function withIdentity(input: unknown, deps: TransactionDeps): unknown {
  return {
    ...asFields(input),
    id: deps.ids(),
    createdAt: deps.now(),
    updatedAt: deps.now(),
  };
}

function asFields(input: unknown): Record<string, unknown> {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return {};
  }

  return input as Record<string, unknown>;
}

function byRecentDate(left: Transaction, right: Transaction): number {
  if (left.date !== right.date) {
    return right.date.localeCompare(left.date);
  }

  return right.id.localeCompare(left.id);
}
