# Plan de Migración — TSpine ERP
### AppSheet / Google Sheets → NestJS + PostgreSQL + React

---

## Resumen Ejecutivo

| | |
|---|---|
| **Proyecto** | Migración ERP TSpine 1.0 |
| **Origen** | AppSheet + Google Sheets (~80–90 tablas) |
| **Destino** | NestJS · PostgreSQL · React |
| **Equipo** | 1 desarrollador fullstack |
| **Metodología** | Migración por módulos (Strangler Fig) |
| **Estado actual** | Fase 2 en progreso — Módulo Programaciones |

---

## Capas de trabajo por módulo

Cada módulo atraviesa **3 capas** de forma secuencial:

```
┌─────────────────────────────────────────────────────────┐
│  CAPA 1 · Datos          │  CAPA 2 · API    │  CAPA 3 · Frontend │
│  Schema · Scripts        │  NestJS Service  │  React Views       │
│  Sanitización · Validación│  Controller DTOs │  Formularios       │
└─────────────────────────────────────────────────────────┘
```

### Sub-actividades estándar por módulo

| # | Actividad | Capa |
|---|-----------|------|
| 1 | Análisis de campos AppSheet (virtuales vs almacenados) | Datos |
| 2 | Diseño del schema Prisma + migraciones | Datos |
| 3 | Script de importación CSV | Datos |
| 4 | Sanitización manual de datos en Google Sheets | Datos |
| 5 | Script de validación post-importación | Datos |
| 6 | Service NestJS (lógica de negocio) | API |
| 7 | Controller + DTOs (endpoints REST) | API |
| 8 | Frontend: pantalla de listado | Frontend |
| 9 | Frontend: detalle y formulario | Frontend |
| 10 | Testing + correcciones | Transversal |

---

## Vista general de fases

| Fase | Módulo / Alcance | Estimación | Estado |
|------|-----------------|------------|--------|
| 0 | Infraestructura Base | 4 sem | ✅ Completada |
| 1 | Entidades Core (Terceros · Catálogos · Geografía) | 5 sem | ✅ Datos listos |
| 2 | Módulo Programaciones | 5 sem | 🔄 60% |
| 3 | Módulo Remisiones | 4 sem | 🔄 35% |
| 4 | Módulo Consumos y Notas de Crédito | 5 sem | ⏳ Pendiente |
| 5 | Módulo Cotizaciones | 4 sem | ⏳ Pendiente |
| 6 | Módulo Gastos | 3 sem | ⏳ Pendiente |
| 7 | Módulo Pagos y Ejecución | 4 sem | ⏳ Pendiente |
| 8 | Módulo Inventario / Productos | 4 sem | ⏳ Pendiente |
| 9 | Módulo Facturación CFDI | 4 sem | ⏳ Pendiente |
| 10 | Módulo Comisiones / Liquidaciones | 3 sem | ⏳ Pendiente |
| 11 | Módulos restantes (análisis completo ~40–50 tablas) | 16–20 sem | ⏳ Por analizar |
| 12 | Reportes y Dashboard | 4 sem | ⏳ Pendiente |
| 13 | Configuración y Permisos | 2 sem | ⏳ Pendiente |
| 14 | QA · Cutover · Capacitación · Go-Live | 5 sem | ⏳ Pendiente |

**Total estimado del proyecto:** ~72–76 semanas (~18 meses)
**Trabajo ya realizado:** ~12–14 semanas
**Tiempo restante estimado:** ~60–62 semanas (~15 meses)

---

## Detalle por fase

---

### FASE 0 — Infraestructura Base ✅

> Duración: 4 semanas | Estado: Completada

| Sub-actividad | Estado |
|--------------|--------|
| Configuración de repositorios (back, front, DB) | ✅ |
| Setup NestJS + Prisma + PostgreSQL | ✅ |
| Setup React + estructura de carpetas | ✅ |
| Sistema de autenticación y perfiles de usuario | ✅ |
| Catálogos SAT (RegimenFiscal, UsoCFDI, FormasPago, SubTarifas) | ✅ |
| Schema base de Prisma | ✅ |
| Scripts de seed iniciales | ✅ |

---

### FASE 1 — Entidades Core ✅

> Duración: 5 semanas | Estado: Capa de datos completada · API parcial

**Tablas:** `terceros` · `cargos` · `perfiles` · `sedes` · `hospitales` · `paises` · `estados` · `ciudades` · `datos_fiscales` · `tercero_clasificaciones` · `acceso_datos` · `tercero_sedes_disponibles` · `tercero_sedes_autorizaciones`

| Sub-actividad | Estado |
|--------------|--------|
| Análisis campos AppSheet (virtuales, fórmulas, duplicados) | ✅ |
| Schema Prisma + migraciones | ✅ |
| Script import-terceros.ts | ✅ |
| Sanitización manual (correo duplicados, cargos hash, nombres) | ✅ |
| Script validate-terceros.ts | ✅ |
| API NestJS (terceros, sedes, hospitales) | 🔄 Parcial |
| Frontend (catálogos y administración) | ⏳ |

---

### FASE 2 — Módulo Programaciones 🔄

> Duración: 5 semanas | Estado: 60% — Capa de datos completa

**Tablas:** `programaciones` · `programacion_medicos` · `programacion_tecnicos`

| Sub-actividad | Estado |
|--------------|--------|
| Análisis campos AppSheet | ✅ |
| Schema Prisma + migraciones | ✅ |
| Script import-programaciones.ts | ✅ |
| Sanitización manual (hospitales sin ciudad, duplicados) | ✅ |
| Script validate-programaciones.ts | ✅ |
| API NestJS (service + controller + DTOs + paginación) | 🔄 Parcial |
| Frontend: listado de programaciones (4,000+ registros, paginado) | ⏳ |
| Frontend: formulario nueva programación | ⏳ |
| Frontend: detalle + médicos + técnicos | ⏳ |
| Testing + correcciones | ⏳ |

---

### FASE 3 — Módulo Remisiones 🔄

> Duración: 4 semanas | Estado: 35% — Scripts completados

**Tablas:** `remisiones`

> Nota: campos virtuales de AppSheet (MÉDICO, FECHA QX, SEDE, HOSPITAL, etc.)
> se recuperan vía JOIN a `programaciones` — no se almacenan en `remisiones`.

| Sub-actividad | Estado |
|--------------|--------|
| Análisis campos AppSheet (18 campos virtuales identificados) | ✅ |
| Schema Prisma + 3 migraciones | ✅ |
| Script import-remisiones.ts | ✅ |
| Sanitización de datos (fechas inválidas, FKs rotas) | 🔄 En proceso |
| Script validate-remisiones.ts | ⏳ |
| API NestJS (paginado con JOINs a programacion para campos virtuales) | ⏳ |
| Frontend: listado de remisiones | ⏳ |
| Frontend: formulario + detalle | ⏳ |
| Testing + correcciones | ⏳ |

---

### FASE 4 — Módulo Consumos y Notas de Crédito ⏳

> Duración estimada: 5 semanas

**Tablas:** `det_consumos` · `val_consumo` · `nota_credito` · `det_tecnicos`

| Sub-actividad | Estimación |
|--------------|-----------|
| Análisis campos AppSheet por tabla | 2 días |
| Schema Prisma + migraciones (4 tablas) | 2 días |
| Scripts de importación (4 scripts) | 5 días |
| Sanitización de datos | 2 días |
| Scripts de validación | 2 días |
| API NestJS (4 módulos) | 6 días |
| Frontend (vistas por módulo) | 8 días |
| Testing + correcciones | 3 días |

---

### FASE 5 — Módulo Cotizaciones ⏳

> Duración estimada: 4 semanas

| Sub-actividad | Estimación |
|--------------|-----------|
| Análisis campos AppSheet | 1 día |
| Schema Prisma + migraciones | 1 día |
| Script de importación | 3 días |
| Sanitización manual | 2 días |
| Script de validación | 1 día |
| API NestJS | 4 días |
| Frontend: listado + formulario + PDF | 8 días |
| Testing + correcciones | 2 días |

---

### FASE 6 — Módulo Gastos ⏳

> Duración estimada: 3 semanas

| Sub-actividad | Estimación |
|--------------|-----------|
| Análisis + schema | 2 días |
| Script importación + validación | 3 días |
| Sanitización | 1 día |
| API NestJS | 3 días |
| Frontend | 5 días |
| Testing | 1 día |

---

### FASE 7 — Módulo Pagos y Ejecución ⏳

> Duración estimada: 4 semanas

| Sub-actividad | Estimación |
|--------------|-----------|
| Análisis campos + relaciones con otras tablas | 2 días |
| Schema Prisma | 1 día |
| Scripts importación + validación | 4 días |
| Sanitización | 2 días |
| API NestJS | 5 días |
| Frontend: flujo de pagos | 7 días |
| Testing | 3 días |

---

### FASE 8 — Módulo Inventario / Productos ⏳

> Duración estimada: 4 semanas

Incluye catálogo de productos, categorías, precios y stock si aplica.

---

### FASE 9 — Módulo Facturación CFDI ⏳

> Duración estimada: 4 semanas

Integración con PAC (timbrado), generación de XML/PDF, estatus SAT.

---

### FASE 10 — Módulo Comisiones / Liquidaciones ⏳

> Duración estimada: 3 semanas

Cálculo y pago de comisiones a médicos y técnicos por programación.

---

### FASE 11 — Módulos Restantes ⏳

> Duración estimada: 16–20 semanas

Las ~40–50 tablas restantes se identificarán en un análisis completo del Google Sheets. Incluyen:
- Módulos de configuración y catálogos secundarios
- Históricos y logs
- Módulos de soporte operativo

> **Nota:** Requiere sesión de levantamiento con el equipo para mapear y priorizar.

---

### FASE 12 — Reportes y Dashboard ⏳

> Duración estimada: 4 semanas

| Reporte | Descripción |
|---------|------------|
| Dashboard principal | KPIs de programaciones, remisiones, consumos |
| Reporte de comisiones | Por médico / técnico / período |
| Reporte de facturación | Facturas emitidas, pendientes, vencidas |
| Reporte de consumos | Por sede, hospital, período |
| Exportación Excel/PDF | En principales módulos |

---

### FASE 13 — Configuración y Permisos ⏳

> Duración estimada: 2 semanas

| Sub-actividad | Descripción |
|--------------|-------------|
| Gestión de perfiles y vistas | CRUD de perfiles con reglas CRUD por módulo |
| Acceso a datos por sede | Control de visibilidad por sede/usuario |
| Panel de administración | Catálogos editables desde el front |

---

### FASE 14 — QA · Cutover · Capacitación · Go-Live ⏳

> Duración estimada: 5 semanas

| Sub-actividad | Estimación |
|--------------|-----------|
| Pruebas de integración end-to-end | 1 semana |
| Corrección de datos en ambiente productivo | 1 semana |
| Migración final desde Google Sheets activo (cutover) | 3 días |
| Capacitación de usuarios | 3 días |
| Período de soporte post go-live | 1 semana |
| Apagado de AppSheet | Al finalizar soporte |

---

## Resumen de tiempos

| Bloque | Semanas | Estado |
|--------|---------|--------|
| Fases 0–1 (Infraestructura + Core) | 9 sem | ✅ Completado |
| Fases 2–3 (Programaciones + Remisiones) | 9 sem | 🔄 En progreso (~55% avance) |
| Fases 4–7 (Consumos, Cotizaciones, Gastos, Pagos) | 16 sem | ⏳ |
| Fases 8–10 (Inventario, CFDI, Comisiones) | 11 sem | ⏳ |
| Fase 11 (Módulos restantes ~40–50 tablas) | 18 sem | ⏳ |
| Fases 12–13 (Reportes + Configuración) | 6 sem | ⏳ |
| Fase 14 (QA + Cutover + Go-Live) | 5 sem | ⏳ |
| **TOTAL PROYECTO** | **~74 sem (~18 meses)** | |
| **Avance actual** | **~12 sem completadas** | |
| **Tiempo restante estimado** | **~62 sem (~15 meses)** | |

> Las estimaciones son para **1 desarrollador fullstack** trabajando tiempo completo en el proyecto.
> Incorporar un desarrollador frontend dedicado reduciría el tiempo restante en aproximadamente **30–35%**.

---

## Riesgos identificados

| Riesgo | Impacto | Mitigación |
|--------|---------|-----------|
| Campos virtuales de AppSheet no documentados | Alto | Análisis tabla por tabla antes de migrar |
| Datos sucios en Google Sheets (duplicados, nulos, formatos) | Alto | Scripts de validación + sanitización manual previa |
| Módulos adicionales no mapeados aún (~40–50 tablas) | Medio | Levantamiento completo de hojas antes de Fase 11 |
| Cambios en Google Sheets durante la migración | Medio | Freeze de datos en fases críticas (cutover) |
| Integración CFDI con PAC externo | Medio | Selección y prueba de PAC en Fase 9 con buffer de tiempo |

---

*Documento generado: Julio 2026 — TSpine ERP Migration Plan v1.0*
