export type SubmitGuard = {
  current: boolean;
};

export function claimSubmit(guard: SubmitGuard): boolean {
  if (guard.current) {
    return false;
  }

  guard.current = true;
  return true;
}

export function releaseSubmit(guard: SubmitGuard): void {
  guard.current = false;
}
