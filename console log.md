react-dom_client.js?v=6f200b40:21551 Download the React DevTools for a better development experience: https://reactjs.org/link/react-devtools
api.ts:1306 🏥 Checking backend health...
api.ts:449 🏥 Making health check request...
api.ts:1306 🏥 Checking backend health...
api.ts:449 🏥 Making health check request...
api.ts:1306 🏥 Checking backend health...
api.ts:449 🏥 Making health check request...
api.ts:460 🏥 Health check response status: 200
api.ts:467 🏥 Health check data: {status: 'OK', timestamp: '2025-10-07T18:16:37.622Z', database: 'Connected to Supabase API', api_url: 'https://ixvefxnycehbvipxcngv.supabase.co', tables_accessible: true, …}
api.ts:1308 🏥 Health response: {status: 'OK', timestamp: '2025-10-07T18:16:37.622Z', database: 'Connected to Supabase API', api_url: 'https://ixvefxnycehbvipxcngv.supabase.co', tables_accessible: true, …}
api.ts:1310 🏥 Is healthy: true
App.tsx:180 🏥 Initial backend health check result: true
api.ts:460 🏥 Health check response status: 200
api.ts:467 🏥 Health check data: {status: 'OK', timestamp: '2025-10-07T18:16:37.759Z', database: 'Connected to Supabase API', api_url: 'https://ixvefxnycehbvipxcngv.supabase.co', tables_accessible: true, …}
api.ts:1308 🏥 Health response: {status: 'OK', timestamp: '2025-10-07T18:16:37.759Z', database: 'Connected to Supabase API', api_url: 'https://ixvefxnycehbvipxcngv.supabase.co', tables_accessible: true, …}
api.ts:1310 🏥 Is healthy: true
App.tsx:180 🏥 Initial backend health check result: true
api.ts:460 🏥 Health check response status: 200
api.ts:467 🏥 Health check data: {status: 'OK', timestamp: '2025-10-07T18:16:37.904Z', database: 'Connected to Supabase API', api_url: 'https://ixvefxnycehbvipxcngv.supabase.co', tables_accessible: true, …}
api.ts:1308 🏥 Health response: {status: 'OK', timestamp: '2025-10-07T18:16:37.904Z', database: 'Connected to Supabase API', api_url: 'https://ixvefxnycehbvipxcngv.supabase.co', tables_accessible: true, …}
api.ts:1310 🏥 Is healthy: true
App.tsx:58 🏥 Backend health check result: true
TransactionsList.tsx:397 🚀 INICIANDO EXPORTACIÓN
TransactionsList.tsx:398 Config completa: {
  "dataType": "transactions",
  "format": "pdf",
  "dateRange": {
    "start": "2025-10-01",
    "end": "2025-10-07",
    "preset": "thismonth"
  },
  "filters": {},
  "fields": [
    "fecha",
    "cliente",
    "colaborador",
    "usdTotal",
    "comision",
    "status"
  ],
  "includeHeaders": true,
  "includeMetadata": true
}
TransactionsList.tsx:406 🚀 EXPORTANDO CON FILTROS DE FECHA DEL MODAL
TransactionsList.tsx:407 Fechas del modal: {start: '2025-10-01', end: '2025-10-07', preset: 'thismonth'}
TransactionsList.tsx:408 Fecha de hoy: 2025-10-07
TransactionsList.tsx:410 🔍 ANTES DE applyExportFilters - Total transacciones: 728
TransactionsList.tsx:411 🔍 ANTES DE applyExportFilters - Sept 30 en transactions: 16
TransactionsList.tsx:300 🔍 INICIO applyExportFilters - Total transacciones recibidas: 728
TransactionsList.tsx:309 🔍 DEBUG FILTRO FECHAS:
 Rango de fechas: {start: '2025-10-01', end: '2025-10-07'}
 Transacciones ANTES del filtro de fechas: 728
 🔍 Transacciones del 30/9 ANTES del filtro: 16
 🔍 DEPURACIÓN CRÍTICA DEL RANGO:
 startDateStr: 2025-10-01 tipo: string
 endDateStr: 2025-10-07 tipo: string
 Comparación 2025-09-30 >= startDateStr: false
 Comparación 2025-09-30 <= endDateStr: true
 Resultado lógico para 2025-09-30: false
 🚨 TRANSACCIÓN 30/9/2025 ENCONTRADA:
 Cliente: Lucas Martinez
 Colaborador: Anael
 Fecha completa: 2025-09-30T23:45:26.735+00:00
 Fecha extraída: 2025-09-30
 ¿Está en rango? false
 Comparación: 2025-09-30 >= 2025-10-01: false
 Comparación: 2025-09-30 <= 2025-10-07: true
 🔍 RESULTADO DEL FILTRO: EXCLUIDA
 🚨 TRANSACCIÓN 30/9/2025 ENCONTRADA:
 Cliente: Chelo Amaral
 Colaborador: Gabriel Zambrano
 Fecha completa: 2025-09-30T23:35:47.879+00:00
 Fecha extraída: 2025-09-30
 ¿Está en rango? false
 Comparación: 2025-09-30 >= 2025-10-01: false
 Comparación: 2025-09-30 <= 2025-10-07: true
 🔍 RESULTADO DEL FILTRO: EXCLUIDA
 🚨 TRANSACCIÓN 30/9/2025 ENCONTRADA:
 Cliente: Esteban Zeballos
 Colaborador: Anael
 Fecha completa: 2025-09-30T19:21:05.297+00:00
 Fecha extraída: 2025-09-30
 ¿Está en rango? false
 Comparación: 2025-09-30 >= 2025-10-01: false
 Comparación: 2025-09-30 <= 2025-10-07: true
 🔍 RESULTADO DEL FILTRO: EXCLUIDA
 🚨 TRANSACCIÓN 30/9/2025 ENCONTRADA:
 Cliente: Miguel Penayo
 Colaborador: Gabriel Zambrano
 Fecha completa: 2025-09-30T19:00:25.656+00:00
 Fecha extraída: 2025-09-30
 ¿Está en rango? false
 Comparación: 2025-09-30 >= 2025-10-01: false
 Comparación: 2025-09-30 <= 2025-10-07: true
 🔍 RESULTADO DEL FILTRO: EXCLUIDA
 🚨 TRANSACCIÓN 30/9/2025 ENCONTRADA:
 Cliente: Alvaro Torales
 Colaborador: Gabriel Zambrano
 Fecha completa: 2025-09-30T18:59:41.053+00:00
 Fecha extraída: 2025-09-30
 ¿Está en rango? false
 Comparación: 2025-09-30 >= 2025-10-01: false
 Comparación: 2025-09-30 <= 2025-10-07: true
 🔍 RESULTADO DEL FILTRO: EXCLUIDA
 🚨 TRANSACCIÓN 30/9/2025 ENCONTRADA:
 Cliente: Juan Urda
 Colaborador: Gabriel Zambrano
 Fecha completa: 2025-09-30T17:45:09.122+00:00
 Fecha extraída: 2025-09-30
 ¿Está en rango? false
 Comparación: 2025-09-30 >= 2025-10-01: false
 Comparación: 2025-09-30 <= 2025-10-07: true
 🔍 RESULTADO DEL FILTRO: EXCLUIDA
 🚨 TRANSACCIÓN 30/9/2025 ENCONTRADA:
 Cliente: Maru Amaral
 Colaborador: Gabriel Zambrano
 Fecha completa: 2025-09-30T17:31:55.814+00:00
 Fecha extraída: 2025-09-30
 ¿Está en rango? false
 Comparación: 2025-09-30 >= 2025-10-01: false
 Comparación: 2025-09-30 <= 2025-10-07: true
 🔍 RESULTADO DEL FILTRO: EXCLUIDA
 🚨 TRANSACCIÓN 30/9/2025 ENCONTRADA:
 Cliente: Nilsa Cano
 Colaborador: Gabriel Zambrano
 Fecha completa: 2025-09-30T17:18:53.676+00:00
 Fecha extraída: 2025-09-30
 ¿Está en rango? false
 Comparación: 2025-09-30 >= 2025-10-01: false
 Comparación: 2025-09-30 <= 2025-10-07: true
 🔍 RESULTADO DEL FILTRO: EXCLUIDA
 🚨 TRANSACCIÓN 30/9/2025 ENCONTRADA:
 Cliente: Bell Ibarra
 Colaborador: Gabriel Zambrano
 Fecha completa: 2025-09-30T17:04:40.856+00:00
 Fecha extraída: 2025-09-30
 ¿Está en rango? false
 Comparación: 2025-09-30 >= 2025-10-01: false
 Comparación: 2025-09-30 <= 2025-10-07: true
 🔍 RESULTADO DEL FILTRO: EXCLUIDA
 🚨 TRANSACCIÓN 30/9/2025 ENCONTRADA:
 Cliente: David Garay
 Colaborador: Anael
 Fecha completa: 2025-09-30T16:36:12.107+00:00
 Fecha extraída: 2025-09-30
 ¿Está en rango? false
 Comparación: 2025-09-30 >= 2025-10-01: false
 Comparación: 2025-09-30 <= 2025-10-07: true
 🔍 RESULTADO DEL FILTRO: EXCLUIDA
 🚨 TRANSACCIÓN 30/9/2025 ENCONTRADA:
 Cliente: Yamila Schluter
 Colaborador: Anael
 Fecha completa: 2025-09-30T16:31:43.045+00:00
 Fecha extraída: 2025-09-30
 ¿Está en rango? false
 Comparación: 2025-09-30 >= 2025-10-01: false
 Comparación: 2025-09-30 <= 2025-10-07: true
 🔍 RESULTADO DEL FILTRO: EXCLUIDA
 🚨 TRANSACCIÓN 30/9/2025 ENCONTRADA:
TransactionsList.tsx:335 Cliente: Sin Nombre
TransactionsList.tsx:336 Colaborador: Patty
TransactionsList.tsx:337 Fecha completa: 2025-09-30T15:59:21.224+00:00
TransactionsList.tsx:338 Fecha extraída: 2025-09-30
TransactionsList.tsx:339 ¿Está en rango? false
TransactionsList.tsx:340 Comparación: 2025-09-30 >= 2025-10-01: false
TransactionsList.tsx:341 Comparación: 2025-09-30 <= 2025-10-07: true
TransactionsList.tsx:342 🔍 RESULTADO DEL FILTRO: EXCLUIDA
TransactionsList.tsx:334 🚨 TRANSACCIÓN 30/9/2025 ENCONTRADA:
TransactionsList.tsx:335 Cliente: Sin Nombre
TransactionsList.tsx:336 Colaborador: Patty
TransactionsList.tsx:337 Fecha completa: 2025-09-30T15:53:12.735+00:00
TransactionsList.tsx:338 Fecha extraída: 2025-09-30
TransactionsList.tsx:339 ¿Está en rango? false
TransactionsList.tsx:340 Comparación: 2025-09-30 >= 2025-10-01: false
TransactionsList.tsx:341 Comparación: 2025-09-30 <= 2025-10-07: true
TransactionsList.tsx:342 🔍 RESULTADO DEL FILTRO: EXCLUIDA
TransactionsList.tsx:334 🚨 TRANSACCIÓN 30/9/2025 ENCONTRADA:
TransactionsList.tsx:335 Cliente: Elizabeth Avalos
TransactionsList.tsx:336 Colaborador: Patty
TransactionsList.tsx:337 Fecha completa: 2025-09-30T15:51:26.197+00:00
TransactionsList.tsx:338 Fecha extraída: 2025-09-30
TransactionsList.tsx:339 ¿Está en rango? false
TransactionsList.tsx:340 Comparación: 2025-09-30 >= 2025-10-01: false
TransactionsList.tsx:341 Comparación: 2025-09-30 <= 2025-10-07: true
TransactionsList.tsx:342 🔍 RESULTADO DEL FILTRO: EXCLUIDA
TransactionsList.tsx:334 🚨 TRANSACCIÓN 30/9/2025 ENCONTRADA:
TransactionsList.tsx:335 Cliente: Malu Rivarola
TransactionsList.tsx:336 Colaborador: Gabriel Zambrano
TransactionsList.tsx:337 Fecha completa: 2025-09-30T00:43:02.721+00:00
TransactionsList.tsx:338 Fecha extraída: 2025-09-30
TransactionsList.tsx:339 ¿Está en rango? false
TransactionsList.tsx:340 Comparación: 2025-09-30 >= 2025-10-01: false
TransactionsList.tsx:341 Comparación: 2025-09-30 <= 2025-10-07: true
TransactionsList.tsx:342 🔍 RESULTADO DEL FILTRO: EXCLUIDA
TransactionsList.tsx:334 🚨 TRANSACCIÓN 30/9/2025 ENCONTRADA:
TransactionsList.tsx:335 Cliente: Alexandro Ferrer
TransactionsList.tsx:336 Colaborador: Anael
TransactionsList.tsx:337 Fecha completa: 2025-09-30T00:06:19.568+00:00
TransactionsList.tsx:338 Fecha extraída: 2025-09-30
TransactionsList.tsx:339 ¿Está en rango? false
TransactionsList.tsx:340 Comparación: 2025-09-30 >= 2025-10-01: false
TransactionsList.tsx:341 Comparación: 2025-09-30 <= 2025-10-07: true
TransactionsList.tsx:342 🔍 RESULTADO DEL FILTRO: EXCLUIDA
TransactionsList.tsx:352 🔍 Transacciones del 30/9 DESPUÉS del filtro: 0
TransactionsList.tsx:353 Total transacciones después del filtro de fechas: 112
TransactionsList.tsx:362 ✅ CORRECTO: Las transacciones del 30/9 fueron filtradas correctamente
TransactionsList.tsx:415 🔍 DESPUÉS DE applyExportFilters - Total dataToExport: 112
TransactionsList.tsx:416 🔍 DESPUÉS DE applyExportFilters - Sept 30 en dataToExport: 0
TransactionsList.tsx:423 Total transacciones originales: 728
TransactionsList.tsx:424 Total transacciones filtradas en tabla: 728
TransactionsList.tsx:425 Total después de applyExportFilters: 112
TransactionsList.tsx:426 Config de exportación: {dataType: 'transactions', format: 'pdf', dateRange: {…}, filters: {…}, fields: Array(6), …}
TransactionsList.tsx:436 ✅ Correcto: No hay transacciones del 30/9 en datos finales
TransactionsList.tsx:472 🔍 ANTES DE GENERAR PDF - Verificando datos finales:
TransactionsList.tsx:473 Total de transacciones: 112
TransactionsList.tsx:479 ✅ CORRECTO: No hay transacciones del 30/9 en datos finales para PDF
TransactionsList.tsx:925 🔍 generatePDF - Datos recibidos: 112
TransactionsList.tsx:926 🔍 generatePDF - Primeras 3 transacciones: (3) [{…}, {…}, {…}]
 ✅ generatePDF - Correcto: No hay transacciones del 30/9
 📄 PDF CONTENT LOGGING - INICIO
 📄 Total de transacciones que se escribirán al PDF: 112
 📄 Todas las fechas que se escribirán al PDF: (112) ['2025-10-07T18:14:22.605+00:00', '2025-10-07T18:10:55.747+00:00', '2025-10-07T17:24:05.101+00:00', '2025-10-07T17:22:22.839+00:00', '2025-10-07T17:04:14.579+00:00', '2025-10-07T17:03:20.325+00:00', '2025-10-07T15:29:51.47+00:00', '2025-10-07T01:09:11.631+00:00', '2025-10-06T22:20:52.783+00:00', '2025-10-06T21:20:58.042+00:00', '2025-10-06T21:08:59.759+00:00', '2025-10-06T20:37:04.235+00:00', '2025-10-06T20:35:30.766+00:00', '2025-10-06T20:32:16.009+00:00', '2025-10-06T20:26:49.848+00:00', '2025-10-06T20:09:18.439+00:00', '2025-10-06T20:06:07.258+00:00', '2025-10-06T20:01:27.315+00:00', '2025-10-06T19:58:42.812+00:00', '2025-10-06T19:19:33.556+00:00', '2025-10-06T18:43:46.334+00:00', '2025-10-06T18:02:26.693+00:00', '2025-10-06T18:01:45.351+00:00', '2025-10-06T17:50:30.962+00:00', '2025-10-06T17:47:15.88+00:00', '2025-10-06T17:46:52.138+00:00', '2025-10-06T17:36:44.132+00:00', '2025-10-06T17:31:20.096+00:00', '2025-10-06T17:30:18.653+00:00', '2025-10-06T17:10:54.046+00:00', '2025-10-06T17:07:59.671+00:00', '2025-10-06T16:59:45.142+00:00', '2025-10-06T16:55:00.621+00:00', '2025-10-06T16:52:05.208+00:00', '2025-10-06T16:45:09.88+00:00', '2025-10-06T16:42:54.987+00:00', '2025-10-06T16:37:43.642+00:00', '2025-10-06T16:36:12.092+00:00', '2025-10-06T16:34:10.049+00:00', '2025-10-06T16:06:27.849+00:00', '2025-10-06T15:52:56.351+00:00', '2025-10-06T15:48:48.035+00:00', '2025-10-06T15:37:47.06+00:00', '2025-10-06T15:17:19.566+00:00', '2025-10-06T14:21:17.169+00:00', '2025-10-06T13:08:43.496+00:00', '2025-10-06T12:55:11.135+00:00', '2025-10-06T02:09:56.801+00:00', '2025-10-06T00:17:23.011+00:00', '2025-10-06T00:08:52.08+00:00', '2025-10-05T23:54:19.46+00:00', '2025-10-04T22:13:52.688+00:00', '2025-10-04T21:37:49.513+00:00', '2025-10-04T21:03:27.921+00:00', '2025-10-04T19:28:31.059+00:00', '2025-10-04T19:27:56.958+00:00', '2025-10-04T18:50:15.355+00:00', '2025-10-04T18:37:01.125+00:00', '2025-10-04T18:32:35.792+00:00', '2025-10-04T18:27:47.032+00:00', '2025-10-04T17:35:54.822+00:00', '2025-10-04T17:28:00.562+00:00', '2025-10-04T17:23:52.42+00:00', '2025-10-04T16:56:16.515+00:00', '2025-10-04T16:23:32.904+00:00', '2025-10-04T15:52:35.387+00:00', '2025-10-04T15:02:28.578+00:00', '2025-10-04T14:17:10.609+00:00', '2025-10-04T14:15:43.923+00:00', '2025-10-03T23:53:08.348+00:00', '2025-10-03T23:08:02.666+00:00', '2025-10-03T21:35:15.616+00:00', '2025-10-03T21:11:15.776+00:00', '2025-10-03T21:07:02.865+00:00', '2025-10-03T19:39:23.969+00:00', '2025-10-03T17:39:12.184+00:00', '2025-10-03T17:08:59.997+00:00', '2025-10-03T16:55:18.413+00:00', '2025-10-03T16:49:10.137+00:00', '2025-10-03T16:11:43.914+00:00', '2025-10-03T15:42:55.38+00:00', '2025-10-03T15:31:28.7+00:00', '2025-10-03T15:28:35.307+00:00', '2025-10-03T15:19:24.884+00:00', '2025-10-03T14:05:09.526+00:00', '2025-10-02T21:32:50.383+00:00', '2025-10-02T21:23:48.737+00:00', '2025-10-02T18:14:15.146+00:00', '2025-10-02T18:12:44.324+00:00', '2025-10-02T16:51:13.454+00:00', '2025-10-02T15:27:15.317+00:00', '2025-10-02T03:42:00.931+00:00', '2025-10-02T03:23:43.159+00:00', '2025-10-01T23:28:49.757+00:00', '2025-10-01T22:35:51.242+00:00', '2025-10-01T20:58:33.626+00:00', '2025-10-01T20:45:46.01+00:00', '2025-10-01T19:58:52.51+00:00', '2025-10-01T19:58:42.646+00:00', '2025-10-01T19:57:47.824+00:00', …]
 📄 Fechas únicas en el PDF: (7) ['2025-10-07', '2025-10-06', '2025-10-05', '2025-10-04', '2025-10-03', '2025-10-02', '2025-10-01']
 📄 Verificación final - Transacciones del 30/9 en data: 0
 📄 FILA 1/112 - Cliente: Angela Torres, Fecha: 2025-10-07
 📄 FILA 2/112 - Cliente: Sin Nombre, Fecha: 2025-10-07
 📄 FILA 3/112 - Cliente: Alan Ocampos, Fecha: 2025-10-07
 📄 FILA 4/112 - Cliente: Vision Gitana, Fecha: 2025-10-07
 📄 FILA 5/112 - Cliente: Marcos Rojas, Fecha: 2025-10-07
 📄 FILA 6/112 - Cliente: Sin Nombre, Fecha: 2025-10-07
 📄 FILA 7/112 - Cliente: Andy Ramos, Fecha: 2025-10-07
 📄 FILA 8/112 - Cliente: Christian Romero, Fecha: 2025-10-07
 📄 FILA 9/112 - Cliente: Rafael Yegros, Fecha: 2025-10-06
 📄 FILA 10/112 - Cliente: Matteo Zarate, Fecha: 2025-10-06
 📄 FILA 11/112 - Cliente: Sin Nombre, Fecha: 2025-10-06
 📄 FILA 12/112 - Cliente: Lujan Sanchez, Fecha: 2025-10-06
 📄 FILA 13/112 - Cliente: Sin Nombre, Fecha: 2025-10-06
 📄 FILA 14/112 - Cliente: Noelia Arguello, Fecha: 2025-10-06
 📄 FILA 15/112 - Cliente: Bianca Vera, Fecha: 2025-10-06
 📄 FILA 16/112 - Cliente: Sin Nombre, Fecha: 2025-10-06
 📄 FILA 17/112 - Cliente: Sin Nombre, Fecha: 2025-10-06
 📄 FILA 18/112 - Cliente: Pablo Pinto, Fecha: 2025-10-06
 📄 FILA 19/112 - Cliente: Yohana, Fecha: 2025-10-06
 📄 FILA 20/112 - Cliente: Sin Nombre, Fecha: 2025-10-06
 📄 FILA 21/112 - Cliente: Mary Vazquez, Fecha: 2025-10-06
 📄 FILA 22/112 - Cliente: Ramoncito, Fecha: 2025-10-06
 📄 FILA 23/112 - Cliente: Rodrigo Colman, Fecha: 2025-10-06
 📄 FILA 24/112 - Cliente: Alexandro Ferrer, Fecha: 2025-10-06
 📄 FILA 25/112 - Cliente: Paola Rivas, Fecha: 2025-10-06
 📄 FILA 26/112 - Cliente: Liz Amarilla, Fecha: 2025-10-06
 📄 FILA 27/112 - Cliente: Agus Stanley, Fecha: 2025-10-06
 📄 FILA 28/112 - Cliente: Ramoncito, Fecha: 2025-10-06
 📄 FILA 29/112 - Cliente: Diego Merlo, Fecha: 2025-10-06
 📄 FILA 30/112 - Cliente: Sin Nombre, Fecha: 2025-10-06
 📄 FILA 31/112 - Cliente: Bell Ibarra, Fecha: 2025-10-06
 📄 FILA 32/112 - Cliente: Lorena Castillo, Fecha: 2025-10-06
 📄 FILA 33/112 - Cliente: Andresa Salinas, Fecha: 2025-10-06
 📄 FILA 34/112 - Cliente: Presi, Fecha: 2025-10-06
 📄 FILA 35/112 - Cliente: Sin Nombre, Fecha: 2025-10-06
 📄 FILA 36/112 - Cliente: Alexandro Ferrer, Fecha: 2025-10-06
 📄 FILA 37/112 - Cliente: Abuelita, Fecha: 2025-10-06
 📄 FILA 38/112 - Cliente: Abuelita, Fecha: 2025-10-06
 📄 FILA 39/112 - Cliente: Alexandro Ferrer, Fecha: 2025-10-06
 📄 FILA 40/112 - Cliente: Imara Cortes, Fecha: 2025-10-06
 📄 FILA 41/112 - Cliente: Luis Insfran, Fecha: 2025-10-06
 📄 FILA 42/112 - Cliente: Hugo Bazan, Fecha: 2025-10-06
 📄 FILA 43/112 - Cliente: Brisa Sander, Fecha: 2025-10-06
 📄 FILA 44/112 - Cliente: Carlos Candia, Fecha: 2025-10-06
 📄 FILA 45/112 - Cliente: Mizhael Pinanez, Fecha: 2025-10-06
 📄 FILA 46/112 - Cliente: Nilda Gonzalez, Fecha: 2025-10-06
 📄 FILA 47/112 - Cliente: Carolina Candia, Fecha: 2025-10-06
 📄 FILA 48/112 - Cliente: Carolina Prieto, Fecha: 2025-10-06
 📄 FILA 49/112 - Cliente: Marcos Vazquez, Fecha: 2025-10-06
 📄 FILA 50/112 - Cliente: Nilda Gonzalez, Fecha: 2025-10-06
 📄 FILA 51/112 - Cliente: Mizhael Pinanez, Fecha: 2025-10-05
 📄 FILA 52/112 - Cliente: Alexandro Ferrer, Fecha: 2025-10-04
 📄 FILA 53/112 - Cliente: Alexandro Ferrer, Fecha: 2025-10-04
 📄 FILA 54/112 - Cliente: Andy, Fecha: 2025-10-04
 📄 FILA 55/112 - Cliente: Ramoncito, Fecha: 2025-10-04
 📄 FILA 56/112 - Cliente: Sin Nombre, Fecha: 2025-10-04
 📄 FILA 57/112 - Cliente: Abuelita, Fecha: 2025-10-04
 📄 FILA 58/112 - Cliente: Tatiana Machuca, Fecha: 2025-10-04
TransactionsList.tsx:1075 📄 FILA 59/112 - Cliente: Sin Nombre, Fecha: 2025-10-04
TransactionsList.tsx:1075 📄 FILA 60/112 - Cliente: Sin Nombre, Fecha: 2025-10-04
TransactionsList.tsx:1075 📄 FILA 61/112 - Cliente: Cliente, Fecha: 2025-10-04
TransactionsList.tsx:1075 📄 FILA 62/112 - Cliente: Alvaro Torales, Fecha: 2025-10-04
TransactionsList.tsx:1075 📄 FILA 63/112 - Cliente: Carlos Ocampos, Fecha: 2025-10-04
TransactionsList.tsx:1075 📄 FILA 64/112 - Cliente: Natasha Cena, Fecha: 2025-10-04
TransactionsList.tsx:1075 📄 FILA 65/112 - Cliente: Daniel Santacruz, Fecha: 2025-10-04
TransactionsList.tsx:1075 📄 FILA 66/112 - Cliente: Micaela Cena, Fecha: 2025-10-04
TransactionsList.tsx:1075 📄 FILA 67/112 - Cliente: Malu Rivarola, Fecha: 2025-10-04
TransactionsList.tsx:1075 📄 FILA 68/112 - Cliente: Gracia, Fecha: 2025-10-04
TransactionsList.tsx:1075 📄 FILA 69/112 - Cliente: Gracia, Fecha: 2025-10-04
TransactionsList.tsx:1075 📄 FILA 70/112 - Cliente: Angy, Fecha: 2025-10-03
TransactionsList.tsx:1075 📄 FILA 71/112 - Cliente: Alexandro Ferrer, Fecha: 2025-10-03
TransactionsList.tsx:1075 📄 FILA 72/112 - Cliente: Miguel Penayo, Fecha: 2025-10-03
TransactionsList.tsx:1075 📄 FILA 73/112 - Cliente: Sin Nombre, Fecha: 2025-10-03
TransactionsList.tsx:1075 📄 FILA 74/112 - Cliente: Sin Nombre, Fecha: 2025-10-03
TransactionsList.tsx:1075 📄 FILA 75/112 - Cliente: Daisy Joana, Fecha: 2025-10-03
TransactionsList.tsx:1075 📄 FILA 76/112 - Cliente: Rafael Ramirez, Fecha: 2025-10-03
TransactionsList.tsx:1075 📄 FILA 77/112 - Cliente: Sin Nombre, Fecha: 2025-10-03
TransactionsList.tsx:1075 📄 FILA 78/112 - Cliente: Miguel Penayo, Fecha: 2025-10-03
TransactionsList.tsx:1075 📄 FILA 79/112 - Cliente: Miguel Penayo, Fecha: 2025-10-03
TransactionsList.tsx:1075 📄 FILA 80/112 - Cliente: Bell Ibarra, Fecha: 2025-10-03
TransactionsList.tsx:1075 📄 FILA 81/112 - Cliente: Jessica Baez, Fecha: 2025-10-03
TransactionsList.tsx:1075 📄 FILA 82/112 - Cliente: Yamila Schluter, Fecha: 2025-10-03
TransactionsList.tsx:1075 📄 FILA 83/112 - Cliente: Iris Ocampos, Fecha: 2025-10-03
TransactionsList.tsx:1075 📄 FILA 84/112 - Cliente: Mizhael Pinanez, Fecha: 2025-10-03
TransactionsList.tsx:1075 📄 FILA 85/112 - Cliente: Maria Silvero, Fecha: 2025-10-03
TransactionsList.tsx:1075 📄 FILA 86/112 - Cliente: Fatima Ortiz, Fecha: 2025-10-02
TransactionsList.tsx:1075 📄 FILA 87/112 - Cliente: Bell Ibarra, Fecha: 2025-10-02
TransactionsList.tsx:1075 📄 FILA 88/112 - Cliente: Yeny Vargas, Fecha: 2025-10-02
TransactionsList.tsx:1075 📄 FILA 89/112 - Cliente: Cinthia Fernandez, Fecha: 2025-10-02
TransactionsList.tsx:1075 📄 FILA 90/112 - Cliente: Dahiana Cena, Fecha: 2025-10-02
TransactionsList.tsx:1075 📄 FILA 91/112 - Cliente: Presi, Fecha: 2025-10-02
TransactionsList.tsx:1075 📄 FILA 92/112 - Cliente: Sin Nombre, Fecha: 2025-10-02
TransactionsList.tsx:1075 📄 FILA 93/112 - Cliente: Sin Nombre, Fecha: 2025-10-02
TransactionsList.tsx:1075 📄 FILA 94/112 - Cliente: Alexandro Ferrer, Fecha: 2025-10-01
TransactionsList.tsx:1075 📄 FILA 95/112 - Cliente: Shir, Fecha: 2025-10-01
TransactionsList.tsx:1075 📄 FILA 96/112 - Cliente: Maru Amaral, Fecha: 2025-10-01
TransactionsList.tsx:1075 📄 FILA 97/112 - Cliente: Edilberto Candia, Fecha: 2025-10-01
TransactionsList.tsx:1075 📄 FILA 98/112 - Cliente: Yanina Montiel, Fecha: 2025-10-01
TransactionsList.tsx:1075 📄 FILA 99/112 - Cliente: Tatiana Machuca, Fecha: 2025-10-01
TransactionsList.tsx:1075 📄 FILA 100/112 - Cliente: Andy, Fecha: 2025-10-01
TransactionsList.tsx:1075 📄 FILA 101/112 - Cliente: Mizhael Pinanez, Fecha: 2025-10-01
TransactionsList.tsx:1075 📄 FILA 102/112 - Cliente: Vaneza Ortiz, Fecha: 2025-10-01
TransactionsList.tsx:1075 📄 FILA 103/112 - Cliente: Jesus Vera, Fecha: 2025-10-01
TransactionsList.tsx:1075 📄 FILA 104/112 - Cliente: Vision Gitana, Fecha: 2025-10-01
TransactionsList.tsx:1075 📄 FILA 105/112 - Cliente: Luis Duarte, Fecha: 2025-10-01
TransactionsList.tsx:1075 📄 FILA 106/112 - Cliente: Sin Nombre, Fecha: 2025-10-01
TransactionsList.tsx:1075 📄 FILA 107/112 - Cliente: Cliente, Fecha: 2025-10-01
TransactionsList.tsx:1075 📄 FILA 108/112 - Cliente: Elizabeth avalos, Fecha: 2025-10-01
TransactionsList.tsx:1075 📄 FILA 109/112 - Cliente: Noelia Arguello, Fecha: 2025-10-01
TransactionsList.tsx:1075 📄 FILA 110/112 - Cliente: Marcos Vazquez, Fecha: 2025-10-01
TransactionsList.tsx:1075 📄 FILA 111/112 - Cliente: Pablo Pinto, Fecha: 2025-10-01
TransactionsList.tsx:1075 📄 FILA 112/112 - Cliente: Alexandro Ferrer, Fecha: 2025-10-01
api.ts:1306 🏥 Checking backend health...
api.ts:449 🏥 Making health check request...
api.ts:460 🏥 Health check response status: 200
api.ts:467 🏥 Health check data: {status: 'OK', timestamp: '2025-10-07T18:17:07.942Z', database: 'Connected to Supabase API', api_url: 'https://ixvefxnycehbvipxcngv.supabase.co', tables_accessible: true, …}
api.ts:1308 🏥 Health response: {status: 'OK', timestamp: '2025-10-07T18:17:07.942Z', database: 'Connected to Supabase API', api_url: 'https://ixvefxnycehbvipxcngv.supabase.co', tables_accessible: true, …}
api.ts:1310 🏥 Is healthy: true
App.tsx:58 🏥 Backend health check result: true
