import type { SqlStatement } from '@/database/client';

export type Migration = {
  version: number;
  statements: SqlStatement[];
};

const categories = `
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  kind TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
  color TEXT NOT NULL CHECK (color GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
  icon TEXT NOT NULL CHECK (length(trim(icon)) > 0),
  is_system INTEGER NOT NULL CHECK (is_system IN (0, 1))
) STRICT
`;

const transactions = `
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL CHECK (length(trim(description)) > 0),
  kind TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  occurred_on TEXT NOT NULL CHECK (occurred_on GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  note TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL CHECK (updated_at >= created_at)
) STRICT
`;

const budgets = `
CREATE TABLE budgets (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  limit_cents INTEGER NOT NULL CHECK (limit_cents > 0),
  year_month TEXT NOT NULL CHECK (year_month GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL CHECK (updated_at >= created_at),
  UNIQUE (category_id, year_month)
) STRICT
`;

const preferences = `
CREATE TABLE preferences (
  id TEXT PRIMARY KEY CHECK (id = 'local'),
  currency TEXT NOT NULL CHECK (currency = 'BRL'),
  theme TEXT NOT NULL CHECK (theme IN ('dark', 'light')),
  notifications_enabled INTEGER NOT NULL CHECK (notifications_enabled IN (0, 1)),
  onboarding_completed INTEGER NOT NULL CHECK (onboarding_completed IN (0, 1))
) STRICT
`;

const transactionKindInsert = `
CREATE TRIGGER transactions_kind_insert
BEFORE INSERT ON transactions
FOR EACH ROW
WHEN NEW.kind <> (SELECT kind FROM categories WHERE id = NEW.category_id)
BEGIN
  SELECT RAISE(ABORT, 'transaction kind mismatch');
END
`;

const transactionKindUpdate = `
CREATE TRIGGER transactions_kind_update
BEFORE UPDATE OF kind, category_id ON transactions
FOR EACH ROW
WHEN NEW.kind <> (SELECT kind FROM categories WHERE id = NEW.category_id)
BEGIN
  SELECT RAISE(ABORT, 'transaction kind mismatch');
END
`;

const budgetCategoryInsert = `
CREATE TRIGGER budgets_category_insert
BEFORE INSERT ON budgets
FOR EACH ROW
WHEN (SELECT kind FROM categories WHERE id = NEW.category_id) <> 'expense'
BEGIN
  SELECT RAISE(ABORT, 'budget requires expense category');
END
`;

const budgetCategoryUpdate = `
CREATE TRIGGER budgets_category_update
BEFORE UPDATE OF category_id ON budgets
FOR EACH ROW
WHEN (SELECT kind FROM categories WHERE id = NEW.category_id) <> 'expense'
BEGIN
  SELECT RAISE(ABORT, 'budget requires expense category');
END
`;

function category(
  id: string,
  name: string,
  kind: 'income' | 'expense',
  color: string,
  icon: string,
): SqlStatement {
  return {
    sql: `INSERT INTO categories (id, name, kind, color, icon, is_system)
          VALUES (?, ?, ?, ?, ?, 1)`,
    params: [id, name, kind, color, icon],
  };
}

// Versões só aumentam. Atualizar o aplicativo aplica o que falta e preserva os dados já gravados.
export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    statements: [
      { sql: categories },
      { sql: transactions },
      { sql: budgets },
      { sql: preferences },
      {
        sql: 'CREATE INDEX idx_transactions_occurred_on ON transactions (occurred_on)',
      },
      {
        sql: 'CREATE INDEX idx_transactions_category_id ON transactions (category_id)',
      },
      {
        sql: 'CREATE INDEX idx_transactions_kind_occurred_on ON transactions (kind, occurred_on)',
      },
      { sql: 'CREATE INDEX idx_budgets_year_month ON budgets (year_month)' },
      { sql: transactionKindInsert },
      { sql: transactionKindUpdate },
      { sql: budgetCategoryInsert },
      { sql: budgetCategoryUpdate },
      category('default-salary', 'Salário', 'income', '#3DDC97', 'income'),
      category(
        'default-extra-income',
        'Outras receitas',
        'income',
        '#2BB673',
        'income',
      ),
      category('default-food', 'Alimentação', 'expense', '#FF6B7A', 'expense'),
      category('default-housing', 'Moradia', 'expense', '#7C6AF7', 'home'),
      category(
        'default-transport',
        'Transporte',
        'expense',
        '#4C8DFF',
        'wallet',
      ),
      category('default-health', 'Saúde', 'expense', '#3DDC97', 'expense'),
      category('default-leisure', 'Lazer', 'expense', '#F0A202', 'expense'),
      category('default-bills', 'Contas', 'expense', '#FF8A5B', 'wallet'),
      category('default-other', 'Outros', 'expense', '#A8B0BB', 'expense'),
      {
        sql: `INSERT INTO preferences (
                id, currency, theme, notifications_enabled, onboarding_completed
              ) VALUES ('local', 'BRL', 'dark', 0, 0)`,
      },
    ],
  },
  {
    version: 2,
    statements: [
      {
        sql: `CREATE TABLE exchange_rates (
                base TEXT NOT NULL CHECK (length(base) = 3),
                quote TEXT NOT NULL CHECK (length(quote) = 3),
                rate TEXT NOT NULL CHECK (length(rate) > 0),
                fetched_at TEXT NOT NULL CHECK (length(fetched_at) > 0),
                PRIMARY KEY (base, quote)
              ) STRICT`,
      },
    ],
  },
  {
    version: 3,
    statements: [
      {
        sql: "ALTER TABLE exchange_rates ADD COLUMN quoted_on TEXT NOT NULL DEFAULT ''",
      },
    ],
  },
  {
    version: 4,
    statements: [
      {
        sql: `UPDATE categories
              SET name = 'Outros ganhos'
              WHERE id = 'default-extra-income' AND name = 'Outras receitas'`,
      },
      {
        sql: `UPDATE categories
              SET name = 'Outros gastos'
              WHERE id = 'default-other' AND name = 'Outros'`,
      },
      {
        sql: `INSERT OR IGNORE INTO categories (id, name, kind, color, icon, is_system)
              VALUES
                ('default-investments', 'Investimentos', 'income', '#14B8A6', 'trending', 1),
                ('default-freelance', 'Freelance', 'income', '#4C8DFF', 'briefcase', 1),
                ('default-education', 'Educação', 'expense', '#5436E0', 'school', 1),
                ('default-shopping', 'Compras', 'expense', '#FF8A5B', 'cart', 1)`,
      },
      { sql: 'DROP TRIGGER IF EXISTS categories_system_delete' },
      {
        sql: `CREATE TRIGGER categories_system_delete
              BEFORE DELETE ON categories
              FOR EACH ROW
              WHEN OLD.is_system = 1
              BEGIN
                SELECT RAISE(ABORT, 'default category');
              END`,
      },
      { sql: 'DROP TRIGGER IF EXISTS categories_kind_update' },
      {
        sql: `CREATE TRIGGER categories_kind_update
              BEFORE UPDATE OF kind ON categories
              FOR EACH ROW
              WHEN NEW.kind <> OLD.kind
                AND (
                  EXISTS (
                    SELECT 1 FROM transactions WHERE category_id = OLD.id
                  )
                  OR EXISTS (
                    SELECT 1 FROM budgets WHERE category_id = OLD.id
                  )
                )
              BEGIN
                SELECT RAISE(ABORT, 'category in use');
              END`,
      },
    ],
  },
  {
    version: 5,
    statements: [
      {
        sql: "ALTER TABLE preferences ADD COLUMN display_name TEXT NOT NULL DEFAULT ''",
      },
      {
        sql: 'ALTER TABLE preferences ADD COLUMN reminder_day INTEGER NOT NULL DEFAULT 1',
      },
      {
        sql: 'ALTER TABLE preferences ADD COLUMN reminder_hour INTEGER NOT NULL DEFAULT 9',
      },
    ],
  },
];
