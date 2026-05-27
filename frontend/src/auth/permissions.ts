/** Admin ose Manager — shkrim në modulet e menaxhimit. */
export function canWriteManagement(roles: string[] | undefined): boolean {
  return !!roles?.some((r) => r === 'Admin' || r === 'Manager')
}

/** Alias për qartësi semantike në faqet e katalogut. */
export const canWriteCatalog = canWriteManagement

/** Klientët: Admin/Manager shkrim, stafi vetëm lexim. */
export const canWriteKlientet = canWriteManagement
