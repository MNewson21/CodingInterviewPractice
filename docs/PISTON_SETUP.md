# Code Execution - Self-Hosted Piston

The app runs user code through [Piston](https://github.com/engineer-man/piston).
The **public `emkc.org` endpoint became whitelist-only on 2026-02-15**, so we
self-host. The client targets whatever `VITE_PISTON_URL` points at.

## 1. Run Piston

```bash
docker run --privileged -d --name piston -p 2000:2000 \
  -v piston-data:/piston ghcr.io/engineer-man/piston
```

This starts the API on `http://localhost:2000`. **It has no languages yet.**

Both flags are required:
- `--privileged` - Piston uses `isolate` for sandboxing; without it you get
  `mkdir: cannot create directory 'isolate/'`.
- `-v piston-data:/piston` - a persistent data volume; without it you get
  `chown: cannot access '/piston'`, and installed runtimes would not survive a
  restart. Day-to-day you then just `docker start piston` (runtimes persist).

## 2. Install the language runtimes

The container ships empty - install the runtimes via the package API:

```bash
./scripts/setup-piston.sh
# or, against a remote instance:
./scripts/setup-piston.sh https://piston.example.com/api/v2
```

Installs a LIGHT default set: Python, Node (JavaScript), TypeScript - low memory,
fine on a small box (e.g. AWS t3.micro). To add the heavy compilers on a larger
instance:

```bash
PISTON_PACKAGES="python node typescript java gcc" ./scripts/setup-piston.sh
```

## 3. Point the app at it

In `.env.local`:

```
VITE_PISTON_URL=http://localhost:2000/api/v2
```

> The self-hosted image serves at **`/api/v2`** - *not* `/api/v2/piston`. That extra
> `/piston` segment only exists on the public emkc.org host. (In dev you normally use
> the Vite proxy path below instead of this direct URL.)

Restart `npm run dev`. The Run panel now executes against your Piston instance.

## Notes
- First run of `setup-piston.sh` downloads runtimes and can take a few minutes.
- The public endpoint default is kept only for users who get whitelisted; for
  everyone else, `VITE_PISTON_URL` is required.
- Hosting for a live portfolio demo: run Piston on a small VPS (or Fly.io /
  Railway) and set `VITE_PISTON_URL` to that host.

## Dev: avoiding CORS (Vite proxy)
In development the app calls a same-origin path and Vite proxies it to Piston, so
the browser never makes a cross-origin request:

- `vite.config.ts` proxies `/piston/*` -> `http://localhost:2000/*`
- `.env.local` sets `VITE_PISTON_URL=/piston/api/v2`

If you later host Piston publicly, set `VITE_PISTON_URL` to its full URL instead,
and make sure that host returns CORS headers (or sits behind your own proxy).

## Hardening for launch (public box)

The browser calls Piston directly, so a public box runs **arbitrary user code on
request from anyone who finds the URL**. Before pointing a domain at it, apply all
three layers below. The client also sends per-request limits (`run_timeout`,
`run_memory_limit`, …) as defence-in-depth, but never rely on the client - these
server-side controls are the real boundary.

### 1. Constrain the container + Piston runtime

```bash
docker run --privileged -d --name piston \
  --restart unless-stopped \
  --memory 900m --memory-swap 900m \
  --cpus 1 \
  --pids-limit 256 \
  -p 127.0.0.1:2000:2000 \                # bind to localhost ONLY - proxy faces the world
  -e PISTON_RUN_TIMEOUT=5000 \            # ms per run
  -e PISTON_COMPILE_TIMEOUT=10000 \
  -e PISTON_RUN_MEMORY_LIMIT=256000000 \  # 256 MB per run (default is unlimited!)
  -e PISTON_COMPILE_MEMORY_LIMIT=256000000 \
  -e PISTON_MAX_CONCURRENT_JOBS=8 \       # default 64 is too high for a small box
  -e PISTON_OUTPUT_MAX_SIZE=65536 \       # cap stdout/stderr bytes
  -e PISTON_DISABLE_NETWORKING=true \     # default true; keep it - no egress from sandboxes
  -v piston-data:/piston ghcr.io/engineer-man/piston
```

Key points:
- `-p 127.0.0.1:2000:2000` - the raw API must **not** be reachable from the internet;
  only the reverse proxy talks to it.
- `PISTON_RUN_MEMORY_LIMIT` defaults to **unlimited** - set it or one submission can
  OOM the box.
- `--memory` / `--cpus` / `--pids-limit` cap the whole container as a backstop.

### 2. Put the reverse proxy in front (rate limiting + TLS + CORS)

Use [`deploy/nginx-piston.conf`](../deploy/nginx-piston.conf): it rate-limits per IP
(5 r/s + burst, max 4 concurrent executions), caps the request body at 64k, allows
only `GET /api/v2/runtimes` and `POST /api/v2/execute`, terminates TLS, and restricts
CORS to the app origin.

```bash
sudo cp deploy/nginx-piston.conf /etc/nginx/sites-available/piston.conf
sudo ln -s /etc/nginx/sites-available/piston.conf /etc/nginx/sites-enabled/
# Edit server_name + the CORS origins, then issue a cert:
sudo certbot --nginx -d piston.codinginterviewpractice.dev
sudo nginx -t && sudo systemctl reload nginx
```

Then point the app at the proxy (HTTPS), not the box:
`VITE_PISTON_URL=https://piston.codinginterviewpractice.dev/api/v2`

### 3. Lock down the AWS security group

- **443** (HTTPS): open to `0.0.0.0/0`.
- **22** (SSH): your IP only.
- **2000** (Piston): **closed** to the internet - it's localhost-only now.
- **80**: open only if using HTTP→HTTPS redirect / certbot.

### Verify

```bash
curl -i https://piston.<domain>/api/v2/runtimes        # 200
curl -i http://<public-ip>:2000/api/v2/runtimes         # should TIME OUT / refuse
for i in $(seq 1 30); do curl -s -o /dev/null -w "%{http_code} " \
  -X POST https://piston.<domain>/api/v2/execute -d '{}'; done   # expect 429s to appear
```
