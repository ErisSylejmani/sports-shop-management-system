/**
 * Pas login, ku të shkojë përdoruesi sipas rolit.
 * F1: të gjithë (Admin, Manager, Staf) → dashboard `/`.
 */
export function getHomePath(_roles: string[], _isStaff?: boolean): string {
  return '/'
}
