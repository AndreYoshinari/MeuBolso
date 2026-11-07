# MeuBolso

MeuBolso is a personal finance app for Android and iOS. One person, one device, offline. The ledger is in Brazilian reais. Exchange rates are informational and never convert a transaction.

The interface is in Portuguese. Code names are in English.

## Objective

Record income and expenses in integer cents, see the month on a dashboard, set a spending limit per expense category, and read a few reports from the same local database. Quotes from Frankfurter can be consulted when the network is available. They do not change the ledger.

The product does not have accounts, transfers, sign-in, cloud sync, statement import, or a home-screen widget.

## Screenshots

There are no screen captures in this repository. The only images shipped with the app are the launcher assets:

- [`assets/icon.png`](assets/icon.png)
- [`assets/adaptive-icon.png`](assets/adaptive-icon.png)

Those are icons, not screens of the dashboard, transactions, budgets, or reports. Add real captures under `docs/screenshots/` before treating this page as a visual portfolio.

## Features

Implemented in the current source:

- **Dashboard.** Greeting by the hour, optional display name, total balance, income and expenses of the selected civil month, recent transactions, and charts fed by a series already aggregated in SQL.
- **Transactions.** Create, edit, delete, and open a transaction. Fields: description, amount, income or expense, category, civil date, optional notes. Amounts are typed as cents and shown in `pt-BR` reais. The history filters by month, type, and category, and searches the description.
- **Categories.** Thirteen default categories, plus custom ones with icon and color. A default category cannot be deleted. A category in use by a transaction or a budget cannot be deleted, and its type cannot change while it is in use. The list shows how many transactions use each category.
- **Budgets.** One monthly limit per expense category. The card shows the limit, the amount spent, what remains, a progress bar, and the percent. Spending counts only expenses of that category in that civil month. At 80 percent the status is near the limit. At 100 percent it is reached, and past the limit it is exceeded.
- **Reports.** One filter updates every chart: current month, previous month, last 3 months, last 6 months, the current calendar year, or a custom range of at most 24 months. The report has income versus expenses, expenses by category, the running balance, a comparison with the previous month when the range is a single month, and the top five spending categories. Anything past the fifth is folded into “Outras”.
- **Settings.** Display name (up to 40 characters), dark or light theme, and a fixed currency label of Real (BRL). Local notifications can be turned on, including a monthly reminder on a day from 1 to 28. Clearing local data asks for confirmation, removes transactions, budgets, quotes, and custom categories, and restores default preferences. Default categories stay.
- **Quotes.** Pick two different currencies and read a Frankfurter rate, including a historical date. The screen shows the quoted date and when the rate was fetched.

## Technologies

| Piece         | Choice                                                          |
| ------------- | --------------------------------------------------------------- |
| App           | React Native 0.88 and Expo SDK 58                               |
| Navigation    | Expo Router, file-based                                         |
| Language      | TypeScript in `strict` mode                                     |
| Server state  | TanStack Query, in memory only                                  |
| Preferences   | Zustand, hydrated from SQLite                                   |
| Forms         | React Hook Form and Zod                                         |
| Database      | Expo SQLite, file `meubolso.db`                                 |
| Charts        | React Native Gifted Charts, with the series prepared beforehand |
| Notifications | Expo Notifications, local only                                  |
| Tests         | Jest with `jest-expo` and React Native Testing Library          |
| Node.js       | 22.11 or newer                                                  |

## Architecture

Routes in `app/` compose a screen and read params. They do not run SQL or validate a form.

Each feature under `src/features/` keeps its components, hooks, Zod schema, and presentation together. Domain rules and use cases live in `src/domain/`. SQL lives in `src/database/`. Money, civil dates, and other pure calculations live in `src/lib/`.

The database client exposes `run`, `get`, `all`, and `transaction`, so tests can substitute a double. Repositories are plain async functions. After a transaction changes, the app invalidates the transaction, dashboard, budget, and chart queries. Category and budget edits invalidate the queries that show them.

Money is an integer number of cents. A percentage is an integer number of basis points, where 10000 is 100 percent. Dates of transactions are civil dates `YYYY-MM-DD`. They are not converted to UTC.

## Folder structure

```text
app/                  Expo Router screens
  (tabs)/             Home, transactions, budgets, reports
  transactions/       New, detail, edit
  categories/         List, new, edit
  budgets/            New, edit
  settings.tsx
  rates.tsx
src/
  features/           UI and hooks by feature
  components/         Shared interface components
  database/           Client, migrations, SQL sources
  domain/             Types, rules, use cases
  services/           Frankfurter, notifications, preferences
  stores/             Preferences and the in-memory session
  lib/                Pure helpers
  providers/
  theme/
docs/ci.md            What the GitHub workflow runs, and how EAS would be added
```

## Data model

SQLite uses `STRICT` tables. Migrations only move forward, through `PRAGMA user_version` (versions 1 through 5). Foreign keys use `ON DELETE RESTRICT`.

| Table            | Role                                                                                                                       |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `categories`     | `id`, `name`, `kind` (`income` or `expense`), `color`, `icon`, `is_system`                                                 |
| `transactions`   | `id`, `description`, `kind`, `amount_cents` (integer, greater than zero), `category_id`, `occurred_on`, `note`, timestamps |
| `budgets`        | One row per category and `year_month`, `limit_cents`, expense categories only                                              |
| `exchange_rates` | `base`, `quote`, `rate` stored as decimal text, `quoted_on`, `fetched_at`                                                  |
| `preferences`    | A single row, `id = 'local'`. Currency is constrained to `BRL`                                                             |

Identifiers come from `crypto.randomUUID()`. Triggers keep a transaction’s kind equal to its category, block deleting a default category, and block changing the kind of a category that still has transactions or budgets.

Default categories:

- Income: Salário, Investimentos, Freelance, Outros ganhos
- Expense: Alimentação, Moradia, Transporte, Saúde, Educação, Lazer, Compras, Contas, Outros gastos

## Frankfurter

Quotes are loaded from `https://api.frankfurter.dev`, or from `EXPO_PUBLIC_EXCHANGE_API_URL` when that variable is set. The response is parsed as `unknown` and checked with Zod before it is stored.

The request times out after 8 seconds. A successful quote is stored as decimal text, not as a floating-point number. The query is considered fresh for 6 hours. The screen always shows the date the rate refers to. A same-currency pair is rejected. A missing pair or date returns a fixed Portuguese message. The ledger is not converted.

## Offline behavior

SQLite is the source of truth. Dashboard, history, filters, categories, budgets, and reports do not call the network. TanStack Query uses `networkMode: 'always'`, so those reads are not paused when the device is offline.

If a quote request fails and a stored rate exists for the same pair and the same requested date, the app shows that stored rate. The title says there is no connection, and the text says it is not a live quote. A stored rate from another day is not reused. If nothing is stored, the screen says there is no saved quote. A 404 stays “quote unavailable”; it is not labeled as offline.

Closing and reopening the database keeps transactions and budgets. A failed write does not erase the rows already stored. There is no sync with a server, and the app does not describe local data as synchronized.

## Tests

Tests use Jest and React Native Testing Library. Persistence tests use Node’s built-in SQLite (`node:sqlite`) through `--experimental-sqlite`. They do not open the native Expo database.

The suite currently has 149 `test()` cases in 49 files. They cover cent calculations, budget progress, transaction and category validation, use cases, the SQLite migration path, offline reopen, dashboard and report models, form schemas, filters, and loading or error states of the main screens. External calls to Frankfurter are mocked.

Run them from the repository root:

```sh
npm test
```

This README does not record a coverage percentage. Run the command to see the current result.

`npm run typecheck` runs `tsc --noEmit`. `npm run lint` runs Expo ESLint, which includes Prettier. `npm run format:check` checks formatting only.

On GitHub, `.github/workflows/ci.yml` runs install, typecheck, lint, format, and tests for pushes to `main` and `develop`, and for pull requests into those branches.

## Run locally

Requirements: Node.js 22.11 or newer, npm, and a local Android or iOS toolchain if you want a device build. iOS builds need a Mac.

```sh
npm ci
cp .env.example .env
npm start
```

Then open the project in Expo Go or a development build. From the same directory:

```sh
npm run android
npm run ios
```

`npm run ios` is for macOS.

## Configuration

Copy `.env.example` to `.env`. Both values are public. Neither is a secret.

```text
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_EXCHANGE_API_URL=https://api.frankfurter.dev
```

If `EXPO_PUBLIC_EXCHANGE_API_URL` is empty, the quote client still uses `https://api.frankfurter.dev`. Preferences are not secrets and stay in SQLite. Expo SecureStore is reserved for a real secret, such as an optional API token, and the current app does not store one.

The CI workflow sets the same two public variables itself. It does not read a `.env` file and it does not contain tokens.

## Builds

A development build on a machine that already has the native SDK:

```sh
npm run android
npm run ios
```

On Windows, `npm run android` can fail while compiling `react-native-worklets` if Git and the system still enforce the 260-character path limit. Enabling long paths, or building from a shorter directory, is a machine setup step. It is not configured in this repository.

There is no `eas.json` and no Expo project id. The GitHub workflow does not compile or publish a binary. The steps to add EAS later, without putting a token in the YAML, are in [`docs/ci.md`](docs/ci.md). The Expo access token, the Android keystore, and the Apple certificate stay outside the repository.

## Known limitations

- The ledger is Brazilian reais only. A quote never converts a stored amount.
- The database file is not encrypted. Android sets `allowBackup` to false. On iOS, the app marks the `Documents/SQLite` directory and the database files as excluded from backup when it launches and when it enters the background.
- Transaction, budget, and category lists render the current month in a scroll view. They are not virtualized.
- The design-system screen is registered only in development. In a production bundle that route redirects home.
- The npm package version in `package.json` is `0.0.1`. The version shown in Settings comes from `app.config.ts` and is `1.0.0`.
- Screen captures are not in the repository. See [Screenshots](#screenshots).
- Native release binaries are not produced by CI. See [Builds](#builds).

## Roadmap

Nothing below is scheduled. The current scope stays one person, one device, and an offline ledger.

Not part of this app, and not started: multiple accounts, transfers between accounts, sign-in, cloud backup as a product feature, statement import, and a home-screen widget.

The next concrete gaps already visible in the repository are: choose a license, add real screen captures, and connect EAS only after an Expo account and the platform credentials exist.

## License

This repository does not include a license file. Until one is added, no open-source license is granted.
