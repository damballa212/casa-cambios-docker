# Propuesta Técnica: Paginación de Transacciones y Exportación en Backend

## Objetivo
- Implementar paginación real en la página de Transacciones para evitar cargas masivas (hasta 1000 registros) y mejorar rendimiento.
- Mover la exportación de transacciones a un endpoint de backend capaz de manejar períodos extensos (meses/años) sin pérdida de datos ni saturar el navegador.
- Mantener compatibilidad total con los cálculos y UI actuales, corrigiendo limitaciones identificadas.

## Estado Actual (Código Referencias)
- Frontend carga todas las transacciones en un solo fetch sin paginación y filtra en memoria:
  - Carga inicial: [TransactionsList.tsx:L139-L165](file:///Users/marlon/Downloads/project/src/components/TransactionsList.tsx#L139-L165)
  - Filtros locales: [TransactionsList.tsx:L167-L270](file:///Users/marlon/Downloads/project/src/components/TransactionsList.tsx#L167-L270)
  - Exportación:
    - Con rango de fechas: consulta al servidor [TransactionsList.tsx:L404-L418](file:///Users/marlon/Downloads/project/src/components/TransactionsList.tsx#L404-L418)
    - Sin rango de fechas: usa datos en memoria [TransactionsList.tsx:L430-L433](file:///Users/marlon/Downloads/project/src/components/TransactionsList.tsx#L430-L433)
  - Métricas locales (Total, Volumen, Comisiones, Promedio) calculadas sobre filteredTransactions: [TransactionsList.tsx:L1623-L1669](file:///Users/marlon/Downloads/project/src/components/TransactionsList.tsx#L1623-L1669)

- Servicio API frontend no contempla paginación (limit/page) ni devuelve count:
  - Firma y QS builder: [api.ts:L283-L312](file:///Users/marlon/Downloads/project/src/services/api.ts#L283-L312)

- Backend /api/transactions aplica .limit si llega en query, pero no offset/.range ni count:
  - Filtros y mapeo: [server.js:L812-L879](file:///Users/marlon/Downloads/project/server/server.js#L812-L879)
  - Mapeo de campos a camelCase: [server.js:L853-L872](file:///Users/marlon/Downloads/project/server/server.js#L853-L872)

- Límite efectivo: sin paginación, PostgREST/Supabase devuelve por defecto hasta 1000 filas.

## Problemas Detectados
- Carga masiva en memoria/DOM de hasta 1000 transacciones — impacto en rendimiento y UX.
- Exportaciones de períodos largos (p. ej. un año) pueden quedar truncadas a 1000 filas.
- Métricas locales de la vista se basan en datos parciales si se introduce paginación (filteredTransactions ≠ universo completo).
- Ambigüedad entre columnas `created_at` vs `fecha` en filtros de tiempo.

## Propuesta: Paginación sin romper integraciones

### Backend (/api/transactions)
- Parámetros soportados (GET):
  - `page`: número de página (default 1)
  - `limit`: tamaño de página (default 50, máx. 200)
  - `start`, `end`: rango de fechas (YYYY-MM-DD) — aplicar sobre `fecha` y `created_at` en rango del día local
  - `collaborator`, `client`, `status`
  - `minUsd`, `maxUsd`
  - `orderBy` (default `created_at`), `orderDir` (default `desc`)
- Implementación:
  - Calcular `offset = (page - 1) * limit`
  - Usar `.range(offset, offset + limit - 1)` en PostgREST para paginar correctamente
  - Obtener `count` con `.select('...', { count: 'exact' })`
  - Aplicar filtro de fecha inclusivo por zona horaria local usando utilidades existentes:
    - Helpers TZ: [server.js:L53-L107](file:///Users/marlon/Downloads/project/server/server.js#L53-L107)
    - Para períodos, usar `gte(fecha, startUtcIso)` + `lt(fecha, endUtcIso)` y mismo criterio en `created_at`
  - Mantener mapeo actual de campos para no romper el frontend
- Respuesta JSON:
  ```json
  {
    "data": [ /* transacciones mapeadas */ ],
    "count": 12345,
    "page": 1,
    "limit": 50,
    "hasNextPage": true,
    "hasPrevPage": false
  }
  ```
- Índices recomendados (migración DB):
  - `CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions (created_at DESC);`
  - `CREATE INDEX IF NOT EXISTS idx_transactions_fecha ON transactions (fecha DESC);`
  - `CREATE INDEX IF NOT EXISTS idx_transactions_colaborador ON transactions (colaborador);`
  - `CREATE INDEX IF NOT EXISTS idx_transactions_cliente ON transactions (cliente);`

### Frontend (servicio API)
- Añadir método nuevo para no romper usos existentes:
  - `getTransactionsPaged(params): Promise<{ data: Transaction[], count: number, page: number, limit: number }>`
  - Mantener `getTransactions` actual para compatibilidad (seguirá útil en vistas que no requieran paginación)

### Frontend (UI TransactionsList)
- Estado: `page`, `pageSize`, `totalCount`, `pageData`
- Fetch inicial: `getTransactionsPaged({ page: 1, limit: pageSize, ...filtros })`
- Al cambiar filtros/presets, resetear a `page=1` y recargar
- Estadísticas superiores:
  - `Total Transacciones`: usar `totalCount` del backend
  - `Volumen USD/Comisiones`: para el universo filtrado completo, consumir `/api/reports/summary` con el mismo rango/filtros
    - Endpoint actual: [server.js:L599-L742](file:///Users/marlon/Downloads/project/server/server.js#L599-L742)
    - Ajuste recomendado: considerar `fecha` y `created_at` con zona horaria (ver sección Cálculos)
- Renderizar solo `pageData` en la tabla; mantener exportación sin cambios visibles para el usuario.

## Propuesta: Exportación en Backend

### Endpoint
- `GET /api/transactions/export`
- Parámetros: `start`, `end`, `collaborator`, `client`, `status`, `minUsd`, `maxUsd`, `fields[]`, `format` (`csv` | `excel` | `json` | `pdf`), `timezone`
- Autenticación: `authenticateToken` + roles `admin|owner` (como métricas admin): [server.js:L774](file:///Users/marlon/Downloads/project/server/server.js#L774)

### CSV (prioritario para grandes volúmenes)
- Streaming de texto:
  - `Content-Type: text/csv`
  - `Content-Disposition: attachment; filename="transacciones_YYYY-MM-DD_a_YYYY-MM-DD.csv"`
  - Iterar en chunks paginados con `.range(...)` y `limit=1000` hasta cubrir `count`
  - Escribir headers según `fields[]`; cada fila en formato CSV escapando comas

### Excel
- Requiere añadir dependencia `exceljs` al backend
- Usar `WorkbookWriter` para escribir en modo streaming (bajo consumo de memoria)
- Misma lógica de chunks; mapear formatos (números, fechas) como en el frontend actual

### JSON
- Opción NDJSON (una fila por línea) o stream de un array grande (solo si el tamaño es razonable)

### PDF
- No recomendado para volúmenes muy grandes; mantener PDF en frontend para conjuntos pequeños

### Seguridad y Performance
- Rate limiting (ya hay rateLimiter en backend): [rateLimiter.js](file:///Users/marlon/Downloads/project/server/rateLimiter.js)
- Validación de parámetros y límites máximos
- Logs y auditoría de descargas (ya existe logger): [logger.js](file:///Users/marlon/Downloads/project/server/logger.js)

## Revisión de Cálculos (Precisión)

### Dashboard diario
- Lógica actual usa rango local con TZ y `created_at`; se añadió fallback combinando `fecha` + `created_at`: [server.js:L814-L836](file:///Users/marlon/Downloads/project/server/server.js#L814-L836), [server.js:L837-L853](file:///Users/marlon/Downloads/project/server/server.js#L837-L853)
- Recomendación:
  - Filtrar por `status='completed'` para evitar procesar registros incompletos
  - Consolidar el uso de `fecha` como “fecha de negocio” y `created_at` como “fecha de inserción”; contabilizar si cualquiera cae en el día local

### Reportes agregados
- Endpoint `/api/reports/summary` hoy filtra solo por `created_at`: [server.js:L602-L611](file:///Users/marlon/Downloads/project/server/server.js#L602-L611)
- Recomendación:
  - Aplicar filtros de rango por zona horaria y considerar `fecha` y `created_at` (similar al dashboard)
  - Mantener agregaciones (total USD, comisiones, promedio) como actualmente, pero sobre el universo server-side

### Métricas en vista de Transacciones
- Actualmente se calculan sobre `filteredTransactions` locales: [TransactionsList.tsx:L1623-L1669](file:///Users/marlon/Downloads/project/src/components/TransactionsList.tsx#L1623-L1669)
- Con paginación, estas métricas deben alimentarse de:
  - `totalCount` para total de transacciones
  - Agregados de `/api/reports/summary` para volumen y comisiones del universo filtrado

## Plan de Implementación (Etapas)

1) Backend – Paginación /api/transactions
- Añadir soporte `page`, `limit`, `count` y `.range(...)`
- Aplicar filtros en `fecha` y `created_at` con TZ local
- Mantener mapeo de campos actual

2) Frontend – Servicio
- Crear `getTransactionsPaged(params)` (no romper `getTransactions`)
- Tipar respuesta con `{ data, count, page, limit }`

3) Frontend – UI
- Añadir estados de paginación y controles (prev/next, selector pageSize)
- Reemplazar fetch inicial y recargas por `getTransactionsPaged`
- Ajustar métricas para usar `totalCount` y `/api/reports/summary`

4) Backend – Exportación
- Implementar CSV streaming
- Añadir Excel streaming si procede (exceljs)
- Autenticación y validación

5) Frontend – Modal Exportación
- Si hay `dateRange`: llamar endpoint `/api/transactions/export` y descargar
- Si NO hay `dateRange`: exportar página visible (comportamiento actual), con tooltip aclaratorio

## Validación y Pruebas
- Pruebas de paginación: verificar count y páginas con rangos y filtros variados
- Pruebas de exportación: comparar totales en CSV/Excel vs `/api/reports/summary`
- Pruebas de TZ: validar días en `America/Asuncion` (día local vs UTC)
- Pruebas de rendimiento: medir tiempo de descarga para 10k/50k filas en CSV streaming

## Riesgos y Mitigación
- Volúmenes muy grandes → usar streaming y límites de chunk
- Desfase de fechas → unificar criterio `fecha` + `created_at` con TZ
- Compatibilidad de UI → introducir nuevos métodos sin eliminar los existentes

## Contratos de API (Propuestos)

### GET /api/transactions (paginado)
Query:
```
page=1&limit=50&start=2025-01-01&end=2025-12-31&collaborator=Patty&client=Fabiola&status=completed&minUsd=10&maxUsd=500&orderBy=created_at&orderDir=desc
```
Response:
```json
{
  "data": [{ "id": "2464", "fecha": "2026-01-27T12:37:26.000Z", "cliente": "...", "colaborador": "...", "usdTotal": 353.85, "comision": 15, "usdNeto": 300, "montoGs": 1955021, "tasaUsada": 6500, "status": "completed" }],
  "count": 1234,
  "page": 1,
  "limit": 50,
  "hasNextPage": true,
  "hasPrevPage": false
}
```

### GET /api/transactions/export (stream)
Query (ejemplo CSV):
```
format=csv&start=2025-01-01&end=2025-12-31&collaborator=&client=&status=completed&fields[]=id&fields[]=fecha&fields[]=cliente&fields[]=colaborador&fields[]=usdTotal&fields[]=comision
```
Headers:
```
Content-Type: text/csv
Content-Disposition: attachment; filename="transacciones_2025-01-01_a_2025-12-31.csv"
```

## Cambios No Disruptivos
- No se elimina `getTransactions` ni la exportación local; se añade `getTransactionsPaged` y el endpoint de exportación.
- Las tarjetas de métricas en la vista de Transacciones seguirán visibles, pero con fuente de datos precisa (server-side) al activar paginación.

## Observaciones Finales
- Con esta arquitectura, exportar un año completo será preciso y escalable.
- La paginación mejora UX y reduce consumo de memoria.
- Se mantienen nombres de campos y rutas para máxima compatibilidad.

