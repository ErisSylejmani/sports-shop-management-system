/** Admin ose Manager — shkrim në modulet e menaxhimit. */
export function canWriteManagement(roles: string[] | undefined): boolean {
  return !!roles?.some((r) => r === 'Admin' || r === 'Manager')
}

export const canWriteCatalog = canWriteManagement

export const canWriteKlientet = canWriteManagement

export function canCreateShitje(roles: string[] | undefined): boolean {
  return !!roles?.some((r) => r === 'Admin' || r === 'Manager' || r === 'User')
}

export const canCreateKthim = canCreateShitje

export const canMutateKthim = canWriteManagement

export const canPickPunetorForShitje = canWriteManagement

export const canMutateShitje = canWriteManagement

export const canWriteOferta = canWriteManagement

export function canAccessAdmin(roles: string[] | undefined): boolean {
  return !!roles?.includes('Admin')
}
