// Única fuente de verdad de qué submódulos existen y a qué prefijos de la API de cada uno dan
// acceso. La usan el guard de permisos por perfil (perfil-access.guard.ts) y el catálogo que
// alimenta el checklist de "Administración > Perfiles" en el frontend.
//
// Administración queda fuera a propósito: sigue controlada solo por @SuperAdminOnly(), no tiene
// sentido asignarla a un perfil normal.
//
// OJO: el frontend mantiene su propia tabla de prefijos de RUTA (src/lib/submoduleRoutePrefixes.ts)
// porque algunas rutas del front no coinciden 1:1 con el prefijo del controller de acá (ej.
// /operacion/remision en el front vs. operacion/remisiones en el back, que además sirve varias
// rutas de detalle). Si agregas o cambias un submódulo acá, revisa también ese archivo.
export interface SubmoduleDef {
  /** = PerfilVista.vistaNombre = el path de ruta del frontend, ej. '/operacion/cotizaciones'. */
  id: string;
  modulo: string;
  moduloLabel: string;
  label: string;
  /** Prefijos de ruta del backend (sin barra inicial) que esta vista autoriza. */
  apiPrefixes: string[];
}

export const SUBMODULE_REGISTRY: SubmoduleDef[] = [
  { id: '/operacion/programaciones', modulo: 'operacion', moduloLabel: 'Operación', label: 'Programación', apiPrefixes: ['operacion/programaciones'] },
  { id: '/operacion/cotizaciones', modulo: 'operacion', moduloLabel: 'Operación', label: 'Cotizaciones', apiPrefixes: ['operacion/cotizaciones'] },
  { id: '/operacion/remision', modulo: 'operacion', moduloLabel: 'Operación', label: 'Remisión', apiPrefixes: ['operacion/remisiones'] },
  { id: '/operacion/autorizacion-consumos', modulo: 'operacion', moduloLabel: 'Operación', label: 'Autorización de consumos', apiPrefixes: ['operacion/autorizacion-consumos'] },
  // Calendario no tiene controller propio — reusa la API de Programación (ver CalendarPage.tsx),
  // así que otorgarle esta vista implica acceso de lectura/escritura a Programación también.
  { id: '/operacion/calendario', modulo: 'operacion', moduloLabel: 'Operación', label: 'Calendario de programación', apiPrefixes: ['operacion/programaciones'] },
  { id: '/operacion/listas-precio', modulo: 'operacion', moduloLabel: 'Operación', label: 'Listas de precio', apiPrefixes: ['operacion/listas-precio'] },
  { id: '/operacion/precios-especiales', modulo: 'operacion', moduloLabel: 'Operación', label: 'Precios especiales', apiPrefixes: ['operacion/precios-especiales'] },
  { id: '/vehicular/catalogo', modulo: 'vehicular', moduloLabel: 'Gestión Vehicular', label: 'Catálogo Vehicular', apiPrefixes: ['vehicular/catalogo'] },
  { id: '/vehicular/control-viajes', modulo: 'vehicular', moduloLabel: 'Gestión Vehicular', label: 'Control de Viajes', apiPrefixes: ['vehicular/viajes'] },
];

// Prefijos de primer segmento que cualquier usuario autenticado necesita sin importar su perfil —
// utilitarios transversales, no "módulos" propiamente. "integraciones" (Google Chat: directorio,
// envío de PDFs) lo usan tanto Programación como Cotizaciones — el botón para llegar ahí ya está
// detrás del acceso al submódulo correspondiente, así que no hace falta restringirlo de nuevo acá.
export const ALWAYS_ALLOWED_PREFIXES = ['auth', 'notificaciones', 'busqueda-global', 'integraciones'];
