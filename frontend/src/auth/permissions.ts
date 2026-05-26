/** Admin ose Manager — shkrim në katalog (kategori, produkte). */
export function canWriteCatalog(roles: string[] | undefined): boolean {
  return !!roles?.some((r) => r === 'Admin' || r === 'Manager')
}
