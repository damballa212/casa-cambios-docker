esto dice frontend:
"2026-01-23T22:20:18.953Z /docker-entrypoint.sh: /docker-entrypoint.d/ is not empty, will attempt to perform configuration
2026-01-23T22:20:18.953Z /docker-entrypoint.sh: Looking for shell scripts in /docker-entrypoint.d/
2026-01-23T22:20:18.955Z /docker-entrypoint.sh: Launching /docker-entrypoint.d/10-listen-on-ipv6-by-default.sh
2026-01-23T22:20:18.961Z 10-listen-on-ipv6-by-default.sh: info: Getting the checksum of /etc/nginx/conf.d/default.conf
2026-01-23T22:20:18.995Z 10-listen-on-ipv6-by-default.sh: info: /etc/nginx/conf.d/default.conf differs from the packaged version
2026-01-23T22:20:18.996Z /docker-entrypoint.sh: Sourcing /docker-entrypoint.d/15-local-resolvers.envsh
2026-01-23T22:20:18.996Z /docker-entrypoint.sh: Launching /docker-entrypoint.d/20-envsubst-on-templates.sh
2026-01-23T22:20:19.003Z /docker-entrypoint.sh: Launching /docker-entrypoint.d/30-tune-worker-processes.sh
2026-01-23T22:20:19.010Z /docker-entrypoint.sh: Configuration complete; ready for start up
2026-01-23T22:20:19.025Z 2026/01/23 22:20:19 [notice] 1#1: using the "epoll" event method
2026-01-23T22:20:19.025Z 2026/01/23 22:20:19 [notice] 1#1: nginx/1.29.4
2026-01-23T22:20:19.025Z 2026/01/23 22:20:19 [notice] 1#1: built by gcc 15.2.0 (Alpine 15.2.0)
2026-01-23T22:20:19.025Z 2026/01/23 22:20:19 [notice] 1#1: OS: Linux 6.8.0-90-generic
2026-01-23T22:20:19.025Z 2026/01/23 22:20:19 [notice] 1#1: getrlimit(RLIMIT_NOFILE): 1024:524288
2026-01-23T22:20:19.025Z 2026/01/23 22:20:19 [notice] 1#1: start worker processes
2026-01-23T22:20:19.025Z 2026/01/23 22:20:19 [notice] 1#1: start worker process 29
2026-01-23T22:20:19.025Z 2026/01/23 22:20:19 [notice] 1#1: start worker process 30"


backend dice esto: 
"2026-01-23T22:20:19.017Z > casa-cambios-api@1.0.0 start
2026-01-23T22:20:19.017Z > node server.js
2026-01-23T22:20:19.332Z 📁 Directorio de backups configurado: /app/backups
2026-01-23T22:20:19.356Z 🔧 Configurando conexión con Supabase API...
2026-01-23T22:20:19.357Z 📢 Notification system initialized
2026-01-23T22:20:19.357Z 🕐 Inicializando sistema de backups automáticos...
2026-01-23T22:20:19.361Z 🔧 Configurando endpoint de actividad reciente...
2026-01-23T22:20:19.403Z 🚀 Servidor corriendo en puerto 3001
2026-01-23T22:20:19.403Z ⭐️ Ambiente: production
2026-01-23T22:20:19.403Z 📝 Database: Configurada
2026-01-23T22:20:19.404Z ℹ️ [Server started] [object Object] {}
2026-01-23T22:20:19.410Z ✅ Conectado a Redis para rate limiting
2026-01-23T22:20:19.621Z ✅ Conectado a Supabase API exitosamente
2026-01-23T22:20:19.852Z ⏰ Backup programado: Backup Semanal - 0 1 * * 1
2026-01-23T22:20:20.055Z ⏰ Backup programado: Backup Diario Automático - 0 0 * * *
2026-01-23T22:20:20.275Z 📅 2 configuraciones de backup programadas
2026-01-23T22:20:20.279Z ✅ Sistema de backups automáticos inicializado correctamente
2026-01-23T22:20:20.279Z ℹ️ [Backup] Sistema de backups automáticos inicializado { scheduledJobs: 2 }"


redis dice esto:

"2026-01-23T21:56:12.555Z 1:C 23 Jan 2026 21:56:12.555 # WARNING Memory overcommit must be enabled! Without it, a background save or replication may fail under low memory condition. Being disabled, it can also cause failures without low memory condition, see https://github.com/jemalloc/jemalloc/issues/1328. To fix this issue add 'vm.overcommit_memory = 1' to /etc/sysctl.conf and then reboot or run the command 'sysctl vm.overcommit_memory=1' for this to take effect.
2026-01-23T21:56:12.555Z 1:C 23 Jan 2026 21:56:12.555 * oO0OoO0OoO0Oo Redis is starting oO0OoO0OoO0Oo
2026-01-23T21:56:12.555Z 1:C 23 Jan 2026 21:56:12.555 * Redis version=7.4.7, bits=64, commit=00000000, modified=0, pid=1, just started
2026-01-23T21:56:12.555Z 1:C 23 Jan 2026 21:56:12.555 * Configuration loaded
2026-01-23T21:56:12.577Z 1:M 23 Jan 2026 21:56:12.556 * Increased maximum number of open files to 10032 (it was originally set to 1024).
2026-01-23T21:56:12.577Z 1:M 23 Jan 2026 21:56:12.556 * monotonic clock: POSIX clock_gettime
2026-01-23T21:56:12.577Z 1:M 23 Jan 2026 21:56:12.557 * Running mode=standalone, port=6379.
2026-01-23T21:56:12.577Z 1:M 23 Jan 2026 21:56:12.557 * Server initialized
2026-01-23T21:56:12.577Z 1:M 23 Jan 2026 21:56:12.557 * Reading RDB base file on AOF loading...
2026-01-23T21:56:12.577Z 1:M 23 Jan 2026 21:56:12.557 * Loading RDB produced by version 7.4.7
2026-01-23T21:56:12.577Z 1:M 23 Jan 2026 21:56:12.557 * RDB age 1064 seconds
2026-01-23T21:56:12.577Z 1:M 23 Jan 2026 21:56:12.557 * RDB memory usage when created 0.90 Mb
2026-01-23T21:56:12.577Z 1:M 23 Jan 2026 21:56:12.557 * RDB is base AOF
2026-01-23T21:56:12.577Z 1:M 23 Jan 2026 21:56:12.557 * Done loading RDB, keys loaded: 0, keys expired: 0.
2026-01-23T21:56:12.577Z 1:M 23 Jan 2026 21:56:12.557 * DB loaded from base file appendonly.aof.1.base.rdb: 0.000 seconds
2026-01-23T21:56:12.577Z 1:M 23 Jan 2026 21:56:12.557 * DB loaded from append only file: 0.000 seconds
2026-01-23T21:56:12.577Z 1:M 23 Jan 2026 21:56:12.557 * Opening AOF incr file appendonly.aof.1.incr.aof on server start
2026-01-23T21:56:12.577Z 1:M 23 Jan 2026 21:56:12.557 * Ready to accept connections tcp"

y el deploy dijo esto:

"Initializing deployment
Cloning Repo github.com/damballa212/casa-cambios-docker.git to /etc/dokploy/compose/tiktok-cambios-compose-8ojmwa/code: ✅
Cloning into '/etc/dokploy/compose/tiktok-cambios-compose-8ojmwa/code'...
remote: Enumerating objects: 82, done.
remote: Counting objects:   1% (1/82)        
remote: Counting objects:   2% (2/82)        
remote: Counting objects:   3% (3/82)        
remote: Counting objects:   4% (4/82)        
remote: Counting objects:   6% (5/82)        
remote: Counting objects:   7% (6/82)        
remote: Counting objects:   8% (7/82)        
remote: Counting objects:   9% (8/82)        
remote: Counting objects:  10% (9/82)        
remote: Counting objects:  12% (10/82)        
remote: Counting objects:  13% (11/82)        
remote: Counting objects:  14% (12/82)        
remote: Counting objects:  15% (13/82)        
remote: Counting objects:  17% (14/82)        
remote: Counting objects:  18% (15/82)        
remote: Counting objects:  19% (16/82)        
remote: Counting objects:  20% (17/82)        
remote: Counting objects:  21% (18/82)        
remote: Counting objects:  23% (19/82)        
remote: Counting objects:  24% (20/82)        
remote: Counting objects:  25% (21/82)        
remote: Counting objects:  26% (22/82)        
remote: Counting objects:  28% (23/82)        
remote: Counting objects:  29% (24/82)        
remote: Counting objects:  30% (25/82)        
remote: Counting objects:  31% (26/82)        
remote: Counting objects:  32% (27/82)        
remote: Counting objects:  34% (28/82)        
remote: Counting objects:  35% (29/82)        
remote: Counting objects:  36% (30/82)        
remote: Counting objects:  37% (31/82)        
remote: Counting objects:  39% (32/82)        
remote: Counting objects:  40% (33/82)        
remote: Counting objects:  41% (34/82)        
remote: Counting objects:  42% (35/82)        
remote: Counting objects:  43% (36/82)        
remote: Counting objects:  45% (37/82)        
remote: Counting objects:  46% (38/82)        
remote: Counting objects:  47% (39/82)        
remote: Counting objects:  48% (40/82)        
remote: Counting objects:  50% (41/82)        
remote: Counting objects:  51% (42/82)        
remote: Counting objects:  52% (43/82)        
remote: Counting objects:  53% (44/82)        
remote: Counting objects:  54% (45/82)        
remote: Counting objects:  56% (46/82)        
remote: Counting objects:  57% (47/82)        
remote: Counting objects:  58% (48/82)        
remote: Counting objects:  59% (49/82)        
remote: Counting objects:  60% (50/82)        
remote: Counting objects:  62% (51/82)        
remote: Counting objects:  63% (52/82)        
remote: Counting objects:  64% (53/82)        
remote: Counting objects:  65% (54/82)        
remote: Counting objects:  67% (55/82)        
remote: Counting objects:  68% (56/82)        
remote: Counting objects:  69% (57/82)        
remote: Counting objects:  70% (58/82)        
remote: Counting objects:  71% (59/82)        
remote: Counting objects:  73% (60/82)        
remote: Counting objects:  74% (61/82)        
remote: Counting objects:  75% (62/82)        
remote: Counting objects:  76% (63/82)        
remote: Counting objects:  78% (64/82)        
remote: Counting objects:  79% (65/82)        
remote: Counting objects:  80% (66/82)        
remote: Counting objects:  81% (67/82)        
remote: Counting objects:  82% (68/82)        
remote: Counting objects:  84% (69/82)        
remote: Counting objects:  85% (70/82)        
remote: Counting objects:  86% (71/82)        
remote: Counting objects:  87% (72/82)        
remote: Counting objects:  89% (73/82)        
remote: Counting objects:  90% (74/82)        
remote: Counting objects:  91% (75/82)        
remote: Counting objects:  92% (76/82)        
remote: Counting objects:  93% (77/82)        
remote: Counting objects:  95% (78/82)        
remote: Counting objects:  96% (79/82)        
remote: Counting objects:  97% (80/82)        
remote: Counting objects:  98% (81/82)        
remote: Counting objects: 100% (82/82)        
remote: Counting objects: 100% (82/82), done.
remote: Compressing objects:   1% (1/69)        
remote: Compressing objects:   2% (2/69)        
remote: Compressing objects:   4% (3/69)        
remote: Compressing objects:   5% (4/69)        
remote: Compressing objects:   7% (5/69)        
remote: Compressing objects:   8% (6/69)        
remote: Compressing objects:  10% (7/69)        
remote: Compressing objects:  11% (8/69)        
remote: Compressing objects:  13% (9/69)        
remote: Compressing objects:  14% (10/69)        
remote: Compressing objects:  15% (11/69)        
remote: Compressing objects:  17% (12/69)        
remote: Compressing objects:  18% (13/69)        
remote: Compressing objects:  20% (14/69)        
remote: Compressing objects:  21% (15/69)        
remote: Compressing objects:  23% (16/69)        
remote: Compressing objects:  24% (17/69)        
remote: Compressing objects:  26% (18/69)        
remote: Compressing objects:  27% (19/69)        
remote: Compressing objects:  28% (20/69)        
remote: Compressing objects:  30% (21/69)        
remote: Compressing objects:  31% (22/69)        
remote: Compressing objects:  33% (23/69)        
remote: Compressing objects:  34% (24/69)        
remote: Compressing objects:  36% (25/69)        
remote: Compressing objects:  37% (26/69)        
remote: Compressing objects:  39% (27/69)        
remote: Compressing objects:  40% (28/69)        
remote: Compressing objects:  42% (29/69)        
remote: Compressing objects:  43% (30/69)        
remote: Compressing objects:  44% (31/69)        
remote: Compressing objects:  46% (32/69)        
remote: Compressing objects:  47% (33/69)        
remote: Compressing objects:  49% (34/69)        
remote: Compressing objects:  50% (35/69)        
remote: Compressing objects:  52% (36/69)        
remote: Compressing objects:  53% (37/69)        
remote: Compressing objects:  55% (38/69)        
remote: Compressing objects:  56% (39/69)        
remote: Compressing objects:  57% (40/69)        
remote: Compressing objects:  59% (41/69)        
remote: Compressing objects:  60% (42/69)        
remote: Compressing objects:  62% (43/69)        
remote: Compressing objects:  63% (44/69)        
remote: Compressing objects:  65% (45/69)        
remote: Compressing objects:  66% (46/69)        
remote: Compressing objects:  68% (47/69)        
remote: Compressing objects:  69% (48/69)        
remote: Compressing objects:  71% (49/69)        
remote: Compressing objects:  72% (50/69)        
remote: Compressing objects:  73% (51/69)        
remote: Compressing objects:  75% (52/69)        
remote: Compressing objects:  76% (53/69)        
remote: Compressing objects:  78% (54/69)        
remote: Compressing objects:  79% (55/69)        
remote: Compressing objects:  81% (56/69)        
remote: Compressing objects:  82% (57/69)        
remote: Compressing objects:  84% (58/69)        
remote: Compressing objects:  85% (59/69)        
remote: Compressing objects:  86% (60/69)        
remote: Compressing objects:  88% (61/69)        
remote: Compressing objects:  89% (62/69)        
remote: Compressing objects:  91% (63/69)        
remote: Compressing objects:  92% (64/69)        
remote: Compressing objects:  94% (65/69)        
remote: Compressing objects:  95% (66/69)        
remote: Compressing objects:  97% (67/69)        
remote: Compressing objects:  98% (68/69)        
remote: Compressing objects: 100% (69/69)        
remote: Compressing objects: 100% (69/69), done.
Receiving objects:   1% (1/82)
Receiving objects:   2% (2/82)
Receiving objects:   3% (3/82)
Receiving objects:   4% (4/82)
Receiving objects:   6% (5/82)
Receiving objects:   7% (6/82)
Receiving objects:   8% (7/82)
Receiving objects:   9% (8/82)
Receiving objects:  10% (9/82)
Receiving objects:  12% (10/82)
Receiving objects:  13% (11/82)
Receiving objects:  14% (12/82)
Receiving objects:  15% (13/82)
Receiving objects:  17% (14/82)
Receiving objects:  18% (15/82)
Receiving objects:  19% (16/82)
Receiving objects:  20% (17/82)
Receiving objects:  21% (18/82)
Receiving objects:  23% (19/82)
Receiving objects:  24% (20/82)
Receiving objects:  25% (21/82)
Receiving objects:  26% (22/82)
Receiving objects:  28% (23/82)
Receiving objects:  29% (24/82)
Receiving objects:  30% (25/82)
Receiving objects:  31% (26/82)
Receiving objects:  32% (27/82)
Receiving objects:  34% (28/82)
Receiving objects:  35% (29/82)
Receiving objects:  36% (30/82)
Receiving objects:  37% (31/82)
Receiving objects:  39% (32/82)
Receiving objects:  40% (33/82)
Receiving objects:  41% (34/82)
Receiving objects:  42% (35/82)
Receiving objects:  43% (36/82)
Receiving objects:  45% (37/82)
Receiving objects:  46% (38/82)
Receiving objects:  47% (39/82)
Receiving objects:  48% (40/82)
Receiving objects:  50% (41/82)
Receiving objects:  51% (42/82)
Receiving objects:  52% (43/82)
Receiving objects:  53% (44/82)
Receiving objects:  54% (45/82)
Receiving objects:  56% (46/82)
Receiving objects:  57% (47/82)
Receiving objects:  58% (48/82)
Receiving objects:  59% (49/82)
Receiving objects:  60% (50/82)
Receiving objects:  62% (51/82)
Receiving objects:  63% (52/82)
Receiving objects:  64% (53/82)
Receiving objects:  65% (54/82)
Receiving objects:  67% (55/82)
Receiving objects:  68% (56/82)
Receiving objects:  69% (57/82)
Receiving objects:  70% (58/82)
Receiving objects:  71% (59/82)
Receiving objects:  73% (60/82)
Receiving objects:  74% (61/82)
Receiving objects:  75% (62/82)
Receiving objects:  76% (63/82)
Receiving objects:  78% (64/82)
Receiving objects:  79% (65/82)
Receiving objects:  80% (66/82)
Receiving objects:  81% (67/82)
Receiving objects:  82% (68/82)
Receiving objects:  84% (69/82)
Receiving objects:  85% (70/82)
remote: Total 82 (delta 16), reused 43 (delta 11), pack-reused 0 (from 0)
Receiving objects:  86% (71/82)
Receiving objects:  87% (72/82)
Receiving objects:  89% (73/82)
Receiving objects:  90% (74/82)
Receiving objects:  91% (75/82)
Receiving objects:  92% (76/82)
Receiving objects:  93% (77/82)
Receiving objects:  95% (78/82)
Receiving objects:  96% (79/82)
Receiving objects:  97% (80/82)
Receiving objects:  98% (81/82)
Receiving objects: 100% (82/82)
Receiving objects: 100% (82/82), 242.98 KiB | 12.79 MiB/s, done.
Resolving deltas:   0% (0/16)
Resolving deltas:   6% (1/16)
Resolving deltas:  12% (2/16)
Resolving deltas:  18% (3/16)
Resolving deltas:  25% (4/16)
Resolving deltas:  31% (5/16)
Resolving deltas:  37% (6/16)
Resolving deltas:  43% (7/16)
Resolving deltas:  50% (8/16)
Resolving deltas:  56% (9/16)
Resolving deltas:  62% (10/16)
Resolving deltas:  68% (11/16)
Resolving deltas:  75% (12/16)
Resolving deltas:  81% (13/16)
Resolving deltas:  87% (14/16)
Resolving deltas:  93% (15/16)
Resolving deltas: 100% (16/16)
Resolving deltas: 100% (16/16), done.
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║ App Name: tiktok-cambios-compose-8ojmwa                                      ║
║ Build Compose 🐳                                                             ║
║ Detected: 0 mounts 📂                                                        ║
║ Command: docker compose -p tiktok-cambios-compose-8ojmwa -f                  ║
║ ./docker-compose.yml up -d --build --remove-orphans                          ║
║ Source Type: docker github ✅                                                ║
║ Compose Type: docker-compose ✅                                              ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
time="2026-01-23T22:19:57Z" level=warning msg="/etc/dokploy/compose/tiktok-cambios-compose-8ojmwa/code/docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion"
Image tiktok-cambios-compose-8ojmwa-backend Building
Image tiktok-cambios-compose-8ojmwa-frontend Building
#1 [internal] load local bake definitions
#1 reading from stdin 1.15kB done
#1 DONE 0.0s
#2 [backend internal] load build definition from Dockerfile.backend
#2 transferring dockerfile: 1.16kB done
#2 DONE 0.0s
#3 [frontend internal] load build definition from Dockerfile.frontend
#3 transferring dockerfile: 897B done
#3 DONE 0.0s
#4 [frontend internal] load metadata for docker.io/library/node:20-alpine
#4 DONE 0.5s
#5 [frontend internal] load .dockerignore
#5 transferring context: 707B done
#5 DONE 0.0s
#6 [frontend internal] load metadata for docker.io/library/nginx:alpine
#6 DONE 0.5s
#7 [backend  1/10] FROM docker.io/library/node:20-alpine@sha256:3960ed74dfe320a67bf8da9555b6bade25ebda2b22b6081d2f60fd7d5d430e9c
#7 resolve docker.io/library/node:20-alpine@sha256:3960ed74dfe320a67bf8da9555b6bade25ebda2b22b6081d2f60fd7d5d430e9c 0.0s done
#7 DONE 0.0s
#8 [frontend stage-1 1/3] FROM docker.io/library/nginx:alpine@sha256:b0f7830b6bfaa1258f45d94c240ab668ced1b3651c8a222aefe6683447c7bf55
#8 resolve docker.io/library/nginx:alpine@sha256:b0f7830b6bfaa1258f45d94c240ab668ced1b3651c8a222aefe6683447c7bf55 0.0s done
#8 DONE 0.0s
#9 [frontend internal] load build context
#9 transferring context: 1.17MB 0.0s done
#9 DONE 0.0s
#10 [frontend builder 2/6] WORKDIR /app
#10 CACHED
#11 [frontend builder 3/6] COPY package*.json ./
#11 CACHED
#12 [frontend builder 4/6] RUN rm -rf node_modules package-lock.json && npm install && npm cache clean --force
#12 CACHED
#13 [backend internal] load build context
#13 transferring context: 279.97kB 0.0s done
#13 DONE 0.0s
#14 [backend  2/10] RUN apk add --no-cache     chromium     nss     freetype     freetype-dev     harfbuzz     ca-certificates     ttf-freefont
#14 CACHED
#15 [backend  4/10] COPY server/package*.json ./
#15 CACHED
#16 [backend  3/10] WORKDIR /app
#16 CACHED
#17 [backend  5/10] RUN npm ci --only=production
#17 CACHED
#18 [frontend builder 5/6] COPY . .
#18 DONE 0.0s
#19 [backend  6/10] COPY server/ .
#19 DONE 0.0s
#20 [backend  7/10] RUN mkdir -p /app/backups
#20 DONE 0.2s
#21 [frontend builder 6/6] RUN npm run build
#21 0.339
#21 0.339 > casa-cambios-dashboard@2.1.0 build
#21 0.339 > tsc -b && vite build
#21 0.339
#21 ...
#22 [backend  8/10] RUN addgroup -g 1001 -S nodejs
#22 DONE 0.2s
#23 [backend  9/10] RUN adduser -S nodejs -u 1001
#23 DONE 0.2s
#21 [frontend builder 6/6] RUN npm run build
#21 ...
#24 [backend 10/10] RUN chown -R nodejs:nodejs /app
#24 ...
#21 [frontend builder 6/6] RUN npm run build
#21 6.798 vite v5.4.21 building for production...
#21 7.136 transforming...
#21 ...
#24 [backend 10/10] RUN chown -R nodejs:nodejs /app
#24 DONE 11.4s
#25 [backend] exporting to image
#25 exporting layers
#25 exporting layers 3.3s done
#25 exporting manifest sha256:c4e08f3b60c81372f64f2d25dc0849b6238023df72017a9df2b8c24f0be654a6 done
#25 exporting config sha256:3cf08f896202f46fb18c0fbf0da1ca6d8be85b902e1bd2389c293851772c5a6b done
#25 exporting attestation manifest sha256:6c1e4422c26d6f9348c66e3d3b09f2a12f191e0b7d6377d492ce093dad732ec1 done
#25 exporting manifest list sha256:ddb02a2459c8529ba6f0d660ef50b6b36b64771a865e505b60247b6670620ff6 done
#25 naming to docker.io/library/tiktok-cambios-compose-8ojmwa-backend:latest done
#25 unpacking to docker.io/library/tiktok-cambios-compose-8ojmwa-backend:latest
#25 unpacking to docker.io/library/tiktok-cambios-compose-8ojmwa-backend:latest 1.9s done
#25 DONE 5.2s
#26 [backend] resolving provenance for metadata file
#26 DONE 0.0s
#21 [frontend builder 6/6] RUN npm run build
#21 17.60 ✓ 1972 modules transformed.
#21 17.99 rendering chunks...
#21 18.39 computing gzip size...
#21 18.43 dist/index.html                              0.48 kB │ gzip:   0.31 kB
#21 18.43 dist/assets/index-By-MBKzc.css              49.46 kB │ gzip:   7.94 kB
#21 18.43 dist/assets/purify.es-B9ZVCkUG.js           22.64 kB │ gzip:   8.75 kB
#21 18.43 dist/assets/index.es-DKiYDWcK.js           150.47 kB │ gzip:  51.44 kB
#21 18.43 dist/assets/html2canvas.esm-CBrSDip1.js    201.42 kB │ gzip:  48.03 kB
#21 18.43 dist/assets/index-Cto-m7Uj.js            1,792.63 kB │ gzip: 505.71 kB
#21 18.43
#21 18.43 (!) Some chunks are larger than 500 kB after minification. Consider:
#21 18.43 - Using dynamic import() to code-split the application
#21 18.43 - Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
#21 18.43 - Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
#21 18.43 ✓ built in 11.60s
#21 DONE 18.7s
#27 [frontend stage-1 2/3] COPY --from=builder /app/dist /usr/share/nginx/html
#27 CACHED
#28 [frontend stage-1 3/3] COPY nginx.conf /etc/nginx/conf.d/default.conf
#28 CACHED
#29 [frontend] exporting to image
#29 exporting layers done
#29 exporting manifest sha256:693e7d96f415d9bd1782da48b2e98b048c04238148f9f6e56dcc18d77c7c4b02 done
#29 exporting config sha256:195981706721778614eaa678f5c333488a86b18cfa910317b866c8fe86b44d83 done
#29 exporting attestation manifest sha256:45b37d60ac6ba69b580949e9ad34b21473df3415cb1dda622732a48aafe4d38e done
#29 exporting manifest list sha256:957a876d7d8abc982456f21b7164972fbdb64770d0fca55b0802c74c87f66945 done
#29 naming to docker.io/library/tiktok-cambios-compose-8ojmwa-frontend:latest done
#29 unpacking to docker.io/library/tiktok-cambios-compose-8ojmwa-frontend:latest done
#29 DONE 0.0s
#30 [frontend] resolving provenance for metadata file
#30 DONE 0.0s
Image tiktok-cambios-compose-8ojmwa-backend Built
Image tiktok-cambios-compose-8ojmwa-frontend Built
Container tiktok-cambios-compose-8ojmwa-redis-1 Running
Container tiktok-cambios-compose-8ojmwa-backend-1 Recreate
Container tiktok-cambios-compose-8ojmwa-backend-1 Recreated
Container tiktok-cambios-compose-8ojmwa-frontend-1 Recreate
Container tiktok-cambios-compose-8ojmwa-frontend-1 Recreated
Container tiktok-cambios-compose-8ojmwa-backend-1 Starting
Container tiktok-cambios-compose-8ojmwa-backend-1 Started
Container tiktok-cambios-compose-8ojmwa-frontend-1 Starting
Container tiktok-cambios-compose-8ojmwa-frontend-1 Started
Docker Compose Deployed: ✅"


y este es el dominio configurado:

"Domain
In this section you can edit a domain
Whenever you make changes to domains, remember to redeploy your compose to apply the changes.
Service Name

frontend

Note: traefik.me is a public HTTP service and does not support SSL/HTTPS. HTTPS and certificate options will not have any effect.
Host

Path

Internal Path
The path where your application expects to receive requests internally (defaults to "/")

Strip Path
Remove the external path from the request before forwarding to the application


Container Port
The port where your application is running inside the container (e.g., 3000 for Node.js, 80 for Nginx, 8080 for Java)

HTTPS
Automatically provision SSL Certificate.


"