/** Restrict company queries to publicly visible rows. */
export function activeCompaniesFilter<T extends { eq: (column: string, value: boolean) => T }>(
  query: T
): T {
  return query.eq("is_active", true);
}
