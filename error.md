frontend: 

"2026-01-24T15:28:30.895Z /docker-entrypoint.sh: /docker-entrypoint.d/ is not empty, will attempt to perform configuration
2026-01-24T15:28:30.895Z /docker-entrypoint.sh: Looking for shell scripts in /docker-entrypoint.d/
2026-01-24T15:28:30.898Z /docker-entrypoint.sh: Launching /docker-entrypoint.d/10-listen-on-ipv6-by-default.sh
2026-01-24T15:28:30.908Z 10-listen-on-ipv6-by-default.sh: info: Getting the checksum of /etc/nginx/conf.d/default.conf
2026-01-24T15:28:30.943Z 10-listen-on-ipv6-by-default.sh: info: /etc/nginx/conf.d/default.conf differs from the packaged version
2026-01-24T15:28:30.943Z /docker-entrypoint.sh: Sourcing /docker-entrypoint.d/15-local-resolvers.envsh
2026-01-24T15:28:30.943Z /docker-entrypoint.sh: Launching /docker-entrypoint.d/20-envsubst-on-templates.sh
2026-01-24T15:28:30.951Z /docker-entrypoint.sh: Launching /docker-entrypoint.d/30-tune-worker-processes.sh
2026-01-24T15:28:30.953Z /docker-entrypoint.sh: Configuration complete; ready for start up
2026-01-24T15:28:30.969Z 2026/01/24 15:28:30 [notice] 1#1: using the "epoll" event method
2026-01-24T15:28:30.969Z 2026/01/24 15:28:30 [notice] 1#1: nginx/1.29.4
2026-01-24T15:28:30.969Z 2026/01/24 15:28:30 [notice] 1#1: built by gcc 15.2.0 (Alpine 15.2.0)
2026-01-24T15:28:30.969Z 2026/01/24 15:28:30 [notice] 1#1: OS: Linux 6.8.0-90-generic
2026-01-24T15:28:30.969Z 2026/01/24 15:28:30 [notice] 1#1: getrlimit(RLIMIT_NOFILE): 1024:524288
2026-01-24T15:28:30.971Z 2026/01/24 15:28:30 [notice] 1#1: start worker processes
2026-01-24T15:28:30.971Z 2026/01/24 15:28:30 [notice] 1#1: start worker process 29
2026-01-24T15:28:30.971Z 2026/01/24 15:28:30 [notice] 1#1: start worker process 30
2026-01-24T15:28:37.051Z 10.0.1.9 - - [24/Jan/2026:15:28:37 +0000] "GET /health HTTP/1.1" 200 95 "http://tiktok-cambios-compose-8ojmwa-ecebd4-76-13-161-248.traefik.me/" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.2 Safari/605.1.15" "179.43.3.20"
2026-01-24T15:28:41.958Z 10.0.1.9 - - [24/Jan/2026:15:28:41 +0000] "POST /api/auth/login HTTP/1.1" 200 596 "http://tiktok-cambios-compose-8ojmwa-ecebd4-76-13-161-248.traefik.me/" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.2 Safari/605.1.15" "179.43.3.20"
2026-01-24T15:28:43.283Z 10.0.1.9 - - [24/Jan/2026:15:28:43 +0000] "GET /health HTTP/1.1" 200 95 "http://tiktok-cambios-compose-8ojmwa-ecebd4-76-13-161-248.traefik.me/" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.2 Safari/605.1.15" "179.43.3.20"
2026-01-24T15:29:13.597Z 10.0.1.9 - - [24/Jan/2026:15:29:13 +0000] "GET /health HTTP/1.1" 200 95 "http://tiktok-cambios-compose-8ojmwa-ecebd4-76-13-161-248.traefik.me/" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.2 Safari/605.1.15" "179.43.3.20""


backend:

"2026-01-24T15:28:31.267Z > casa-cambios-api@1.0.0 start
2026-01-24T15:28:31.267Z > node server.js
2026-01-24T15:28:31.573Z 📁 Directorio de backups configurado: /app/backups
2026-01-24T15:28:31.588Z 🔧 Configurando conexión con Supabase API...
2026-01-24T15:28:31.588Z 📢 Notification system initialized
2026-01-24T15:28:31.589Z 🕐 Inicializando sistema de backups automáticos...
2026-01-24T15:28:31.589Z 🔧 Configurando endpoint de actividad reciente...
2026-01-24T15:28:31.627Z 🚀 Servidor corriendo en puerto 3001
2026-01-24T15:28:31.627Z ⭐️ Ambiente: production
2026-01-24T15:28:31.627Z 📝 Database: Configurada
2026-01-24T15:28:31.628Z ℹ️ [Server started] [object Object] {}
2026-01-24T15:28:31.674Z ✅ Conectado a Redis para rate limiting
2026-01-24T15:28:32.379Z ⏰ Backup programado: Backup Semanal - 0 1 * * 1
2026-01-24T15:28:32.386Z ✅ Conectado a Supabase API exitosamente
2026-01-24T15:28:32.560Z ⏰ Backup programado: Backup Diario Automático - 0 0 * * *
2026-01-24T15:28:32.752Z 📅 2 configuraciones de backup programadas
2026-01-24T15:28:32.756Z ✅ Sistema de backups automáticos inicializado correctamente
2026-01-24T15:28:32.757Z ℹ️ [Backup] Sistema de backups automáticos inicializado { scheduledJobs: 2 }
2026-01-24T15:28:41.582Z [AUTH] 2026-01-24T15:28:41.581Z - LOGIN_SUCCESS - User: admin - IP: null - UA: null - Success: true - Details: Login exitoso
2026-01-24T15:28:41.956Z ℹ️ Supabase user_sessions no disponible, usando fallback
2026-01-24T15:28:41.957Z [AUTH] 2026-01-24T15:28:41.956Z - login_success - User: [object Object] - IP: undefined - UA: undefined - Success: false - Details: null
2026-01-24T15:28:41.957Z ℹ️ [HTTP Request] [object Object] {}"