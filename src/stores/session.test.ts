import { initialSessionData, useSessionStore } from '@/stores/session';

beforeEach(() => {
  useSessionStore.setState(initialSessionData);
});

test('keeps filters and temporary visibility out of the ledger', () => {
  useSessionStore.getState().setFilters({
    type: 'expense',
    from: '2026-03-01',
    to: '2026-03-31',
  });
  useSessionStore.getState().setBalanceVisible(false);

  expect(useSessionStore.getState().filters).toEqual({
    type: 'expense',
    from: '2026-03-01',
    to: '2026-03-31',
  });
  expect(useSessionStore.getState().balanceVisible).toBe(false);

  useSessionStore.getState().clearFilters();

  expect(useSessionStore.getState().filters).toBeNull();
});
