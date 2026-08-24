export const PERFIL_SUPER_ADMIN = 'SA';

// perfilId === 'SA' es el marcador de super-admin del seed de desarrollo (admin/qatester);
// perfil.nombre === 'SA' cubre además un PERFIL real importado de AppSheet con ese nombre literal.
export function esSuperAdminPerfil(
  usuario: { perfilId?: string | null; perfil?: { nombre?: string | null } | null } | null | undefined,
): boolean {
  if (!usuario) return false;
  return usuario.perfilId === PERFIL_SUPER_ADMIN || usuario.perfil?.nombre?.toUpperCase() === PERFIL_SUPER_ADMIN;
}
