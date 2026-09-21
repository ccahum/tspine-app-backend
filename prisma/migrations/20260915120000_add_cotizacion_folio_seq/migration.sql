-- Contador dedicado para el folio de cotizaciones (CT-00000001, CT-00000002, ...), independiente
-- de los IDs de texto ya existentes. Antes el "siguiente número" se calculaba parseando el ID más
-- alto que hiciera match con '^CT-[0-9]{8}$' — pero algunos IDs viejos migrados de AppSheet son
-- hexadecimal aleatorio (ej. "CT-05f3a1b2") y por azar caen en puros dígitos (ej. "CT-98365894"),
-- así que esa detección los confundía con folios nuevos reales y arrancaba desde ahí. Con esta
-- sequence, el folio siempre arranca limpio en 1 sin importar qué IDs viejos existan.
CREATE SEQUENCE IF NOT EXISTS "cotizacion_folio_seq" START 1;
