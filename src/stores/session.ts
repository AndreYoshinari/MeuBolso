import { create } from 'zustand';

import type { TransactionFilters } from '@/lib/transaction-filters';

// Filtros e a visibilidade do saldo duram só esta sessão. O razão continua no SQLite.

type SessionState = {
  filters: TransactionFilters | null;
  balanceVisible: boolean;
  setFilters: (filters: TransactionFilters) => void;
  clearFilters: () => void;
  setBalanceVisible: (visible: boolean) => void;
};

export const initialSessionData = {
  filters: null,
  balanceVisible: true,
};

export const useSessionStore = create<SessionState>(set => ({
  ...initialSessionData,
  setFilters(filters) {
    set({ filters });
  },
  clearFilters() {
    set({ filters: null });
  },
  setBalanceVisible(balanceVisible) {
    set({ balanceVisible });
  },
}));
