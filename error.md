Home
v2.21.0


ES
Panel
"Acciones"
Monitor
Dominios
Ajustes
Documentación
Discord
Comentarios
Registro de cambios
Comprar licencia

Búsqueda rápida
⌘ K

157.173.212.225
Modo oscuro


Cerrar sesión

Actualización disponible
Servicios
cani_pos
/

dashboard

compose
CPU 0.4%
Memoria 64.3 MB
E/S de red 31.6 KB / 6.1 KB
Se encontraron algunos problemas en su configuración de Docker Compose
Historial de implementaciones

Deploy service: fix: Replace npm ci with npm install in Dockerfile.frontend for better EasyPanel compatibility
20 segundos
/
hace 35 segundos
Deploy service: Date: Mon Sep 1 15:16:49 2025 -0400
3 segundos
/
hace 7 minutos
Deploy service: Date: Mon Sep 1 15:16:49 2025 -0400
2 segundos
/
hace 8 minutos
Deploy service: Date: Mon Sep 1 15:16:49 2025 -0400
4 segundos
/
hace 11 minutos
Deploy service: Date: Mon Sep 1 15:02:31 2025 -0400
2 minutos
/
hace 24 minutos
Deploy service: Add direct port access: expose frontend on port 8081 for immediate access
2 segundos
/
hace 2 días
Deploy service: Fix frontend health check: use 127.0.0.1 instead of localhost for IPv4 compatibility
2 segundos
/
hace 2 días
Deploy service: Add Traefik labels to frontend for EasyPanel domain configuration
1 segundo
/
hace 2 días
Deploy service: Add Traefik labels to frontend for EasyPanel domain configuration
1 segundo
/
hace 2 días
Deploy service: Enable Redis with correct service name for EasyPanel connection
1 segundo
/
hace 2 días
Activación de implementación

Hacer una solicitud a esta URL activará una implementación para este servicio. Puedes usarla para integrar servicios externos con Easypanel.

"Acción"
##########################################
### Pulling data from origin/main
### Mon, 01 Sep 2025 19:29:14 GMT
##########################################

Commit: fix: Replace npm ci with npm install in Dockerfile.frontend for better EasyPanel compatibility 
 Service backend  Building
#0 building with "default" instance using docker driver

#1 [backend internal] load build definition from Dockerfile.backend
#1 transferring dockerfile: 980B done
#1 DONE 0.0s

#2 [backend internal] load metadata for docker.io/library/node:18-alpine
#2 DONE 0.2s
 Service backend  Built
 Service frontend  Building

#3 [backend internal] load .dockerignore
#3 transferring context: 707B done
#3 DONE 0.0s

#4 [backend 1/9] FROM docker.io/library/node:18-alpine@sha256:8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e
#4 DONE 0.0s

#5 [backend internal] load build context
#5 transferring context: 925B done
#5 DONE 0.0s

#6 [backend 7/9] RUN addgroup -g 1001 -S nodejs
#6 CACHED

#7 [backend 8/9] RUN adduser -S nodejs -u 1001
#7 CACHED

#8 [backend 2/9] RUN apk add --no-cache     chromium     nss     freetype     freetype-dev     harfbuzz     ca-certificates     ttf-freefont
#8 CACHED

#9 [backend 6/9] COPY server/ .
#9 CACHED

#10 [backend 4/9] COPY server/package*.json ./
#10 CACHED

#11 [backend 3/9] WORKDIR /app
#11 CACHED

#12 [backend 5/9] RUN npm ci --only=production
#12 CACHED

#13 [backend 9/9] RUN chown -R nodejs:nodejs /app
#13 CACHED

#14 [backend] exporting to image
#14 exporting layers done
#14 writing image sha256:893095ef6dca47182927a7d52bf0fe4651240a38875ff6ad57e52c0070961908 done
#14 naming to docker.io/library/cani_pos_dashboard-backend done
#14 DONE 0.0s

#15 [backend] resolving provenance for metadata file
#15 DONE 0.0s

#16 [frontend internal] load build definition from Dockerfile.frontend
#16 transferring dockerfile: 786B done
#16 DONE 0.0s

#2 [frontend internal] load metadata for docker.io/library/node:18-alpine
#2 DONE 0.3s

#17 [frontend internal] load metadata for docker.io/library/nginx:alpine
#17 DONE 0.1s

#18 [frontend internal] load .dockerignore
#18 transferring context: 707B done
#18 DONE 0.0s

#4 [frontend builder 1/6] FROM docker.io/library/node:18-alpine@sha256:8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e
#4 DONE 0.0s

#19 [frontend stage-1 1/3] FROM docker.io/library/nginx:alpine@sha256:42a516af16b852e33b7682d5ef8acbd5d13fe08fecadc7ed98605ba5e3b26ab8
#19 DONE 0.0s

#20 [frontend internal] load build context
#20 transferring context: 816.49kB 0.0s done
#20 DONE 0.0s

#21 [frontend builder 2/6] WORKDIR /app
#21 CACHED

#22 [frontend builder 3/6] COPY package*.json ./
#22 DONE 0.0s

#23 [frontend builder 4/6] RUN npm install && npm cache clean --force
#23 9.189 
#23 9.189 added 292 packages, and audited 293 packages in 9s
#23 9.189 
#23 9.190 66 packages are looking for funding
#23 9.190   run `npm fund` for details
#23 9.207 
#23 9.207 8 vulnerabilities (2 low, 4 moderate, 2 high)
#23 9.207 
#23 9.207 To address all issues, run:
#23 9.207   npm audit fix
#23 9.207 
#23 9.207 Run `npm audit` for details.
#23 9.208 npm notice
#23 9.208 npm notice New major version of npm available! 10.8.2 -> 11.5.2
#23 9.208 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.5.2
#23 9.208 npm notice To update run: npm install -g npm@11.5.2
#23 9.208 npm notice
#23 9.403 npm warn using --force Recommended protections disabled.
#23 DONE 10.2s

#24 [frontend builder 5/6] COPY . .
#24 DONE 0.0s

#25 [frontend builder 6/6] RUN npm run build
#25 0.365 
#25 0.365 > casa-cambios-dashboard@2.1.0 build
#25 0.365 > tsc -b && vite build
#25 0.365 
#25 7.344 src/components/AdvancedFilters.tsx(1,27): error TS6133: 'useEffect' is declared but its value is never read.
#25 7.344 src/components/AdvancedFilters.tsx(7,3): error TS6133: 'DollarSign' is declared but its value is never read.
#25 7.344 src/components/AdvancedFilters.tsx(10,3): error TS6133: 'Clock' is declared but its value is never read.
#25 7.344 src/components/AdvancedFilters.tsx(11,3): error TS6133: 'XCircle' is declared but its value is never read.
#25 7.344 src/components/ClientManagement.tsx(2,60): error TS6133: 'Mail' is declared but its value is never read.
#25 7.344 src/components/ClientManagement.tsx(2,92): error TS6133: 'Eye' is declared but its value is never read.
#25 7.344 src/components/ExportModal.tsx(8,3): error TS6133: 'Calendar' is declared but its value is never read.
#25 7.344 src/components/ExportModal.tsx(9,3): error TS6133: 'Filter' is declared but its value is never read.
#25 7.344 src/components/ExportModal.tsx(10,3): error TS6133: 'Settings' is declared but its value is never read.
#25 7.344 src/components/ExportModal.tsx(12,3): error TS6133: 'AlertCircle' is declared but its value is never read.
#25 7.345 src/components/ExportModal.tsx(17,3): error TS6133: 'Edit3' is declared but its value is never read.
#25 7.346 src/components/ReportsAnalytics.tsx(2,31): error TS6133: 'Calendar' is declared but its value is never read.
#25 7.346 src/components/ReportsAnalytics.tsx(53,10): error TS6133: 'reportType' is declared but its value is never read.
#25 7.346 src/components/ReportsAnalytics.tsx(53,22): error TS6133: 'setReportType' is declared but its value is never read.
#25 7.346 src/components/ReportsAnalytics.tsx(485,13): error TS6133: 'endAngle' is declared but its value is never read.
#25 7.346 src/components/ReportsAnalytics.tsx(608,97): error TS6133: 'margin' is declared but its value is never read.
#25 7.346 src/components/ReportsAnalytics.tsx(634,11): error TS6133: 'errorColor' is declared but its value is never read.
#25 7.346 src/components/SystemLogs.tsx(2,59): error TS6133: 'Info' is declared but its value is never read.
#25 7.346 src/components/TransactionDetailModal.tsx(6,3): error TS6133: 'Calendar' is declared but its value is never read.
#25 7.346 src/components/TransactionDetailModal.tsx(8,3): error TS6133: 'Percent' is declared but its value is never read.
#25 7.346 src/components/TransactionDetailModal.tsx(9,3): error TS6133: 'TrendingUp' is declared but its value is never read.
#25 7.346 src/components/TransactionDetailModal.tsx(10,3): error TS6133: 'MessageSquare' is declared but its value is never read.
#25 7.346 src/components/TransactionDetailModal.tsx(104,11): error TS6133: 'singleTransactionData' is declared but its value is never read.
#25 7.346 src/components/UserModal.tsx(5,3): error TS6133: 'Mail' is declared but its value is never read.
#25 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 2
------
 > [frontend builder 6/6] RUN npm run build:
7.346 src/components/ReportsAnalytics.tsx(485,13): error TS6133: 'endAngle' is declared but its value is never read.
7.346 src/components/ReportsAnalytics.tsx(608,97): error TS6133: 'margin' is declared but its value is never read.
7.346 src/components/ReportsAnalytics.tsx(634,11): error TS6133: 'errorColor' is declared but its value is never read.
7.346 src/components/SystemLogs.tsx(2,59): error TS6133: 'Info' is declared but its value is never read.
7.346 src/components/TransactionDetailModal.tsx(6,3): error TS6133: 'Calendar' is declared but its value is never read.
7.346 src/components/TransactionDetailModal.tsx(8,3): error TS6133: 'Percent' is declared but its value is never read.
7.346 src/components/TransactionDetailModal.tsx(9,3): error TS6133: 'TrendingUp' is declared but its value is never read.
7.346 src/components/TransactionDetailModal.tsx(10,3): error TS6133: 'MessageSquare' is declared but its value is never read.
7.346 src/components/TransactionDetailModal.tsx(104,11): error TS6133: 'singleTransactionData' is declared but its value is never read.
7.346 src/components/UserModal.tsx(5,3): error TS6133: 'Mail' is declared but its value is never read.
------
failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 2
##########################################
### Error
### Mon, 01 Sep 2025 19:29:33 GMT
##########################################

Command failed with exit code 17: docker compose -f /etc/easypanel/projects/cani_pos/dashboard/code/docker-compose.easypanel.yml -f /etc/easypanel/projects/cani_pos/dashboard/code/docker-compose.override.yml -p cani_pos_dashboard up --build -d