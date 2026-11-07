export const routes = {
  home: '/',
  transactions: '/transactions',
  budgets: '/budgets',
  reports: '/reports',
  newTransaction: '/transactions/new',
  categories: '/categories',
  settings: '/settings',
  rates: '/rates',
  designSystem: '/design-system',
} as const;

export function newTransactionHref(type: 'income' | 'expense') {
  return {
    pathname: '/transactions/new' as const,
    params: { type },
  };
}

export function transactionHref(id: string) {
  return {
    pathname: '/transactions/[id]' as const,
    params: { id },
  };
}

export function newBudgetHref(period: string) {
  return {
    pathname: '/budgets/new' as const,
    params: { period },
  };
}

export function editBudgetHref(id: string, period: string) {
  return {
    pathname: '/budgets/[id]' as const,
    params: { id, period },
  };
}

export function newCategoryHref() {
  return {
    pathname: '/categories/new' as const,
  };
}

export function editCategoryHref(id: string) {
  return {
    pathname: '/categories/[id]' as const,
    params: { id },
  };
}

export function editTransactionHref(id: string) {
  return {
    pathname: '/transactions/[id]/edit' as const,
    params: { id },
  };
}

export const TAB_CONTENT_INSET = 96;
