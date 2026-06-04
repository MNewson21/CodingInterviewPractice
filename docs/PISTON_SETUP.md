# Code Execution — Self-Hosted Piston

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
- `--privileged` — Piston uses `isolate` for sandboxing; without it you get
  `mkdir: cannot create directory 'isolate/'`.
- `-v piston-data:/piston` — a persistent data volume; without it you get
  `chown: cannot access '/piston'`, and installed runtimes would not survive a
  restart. Day-to-day you then just `docker start piston` (runtimes persist).

## 2. Install the language runtimes

The container ships empty — install the runtimes via the package API:

```bash
./scripts/setup-piston.sh
# or, against a remote instance:
./scripts/setup-piston.sh https://piston.example.com/api/v2
```

Installs a LIGHT default set: Python, Node (JavaScript), TypeScript — low memory,
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

> The self-hosted image serves at **`/api/v2`** — *not* `/api/v2/piston`. That extra
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
