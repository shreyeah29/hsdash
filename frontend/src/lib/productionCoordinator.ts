export function productionCoordinatorEmail(): string {
  const raw = import.meta.env.VITE_CALENDAR_COORDINATOR_EMAIL as string | undefined;
  return (raw?.trim().toLowerCase() ?? "emmanuel@wedding.local").toLowerCase();
}

export function isProductionCoordinatorUser(email: string | undefined | null): boolean {
  if (!email?.trim()) return false;
  return email.trim().toLowerCase() === productionCoordinatorEmail();
}
