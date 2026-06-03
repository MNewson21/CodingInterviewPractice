# Code Execution — Self-Hosted Piston

The app runs user code through [Piston](https://github.com/engineer-man/piston).
The **public `emkc.org` endpoint became whitelist-only on 2026-02-15**, so we
self-host. The client targets whatever `VITE_PISTON_URL` points at.

## 1. Run Piston

```bash
docker run -d --name piston -p 2000:2000 ghcr.io/engineer-man/piston
```

This starts the API on `http://localhost:2000`. **It has no languages yet.**

## 2. Install the language runtimes

The container ships empty — install the runtimes via the package API:

```bash
./scripts/setup-piston.sh
# or, against a remote instance:
./scripts/setup-piston.sh https://piston.example.com/api/v2/piston
```

Installs: Python, Node (JavaScript), TypeScript, Java, GCC (C/C++).

## 3. Point the app at it

In `.env.local`:

```
VITE_PISTON_URL=http://localhost:2000/api/v2/piston
```

Restart `npm run dev`. The Run panel now executes against your Piston instance.

## Notes
- First run of `setup-piston.sh` downloads runtimes and can take a few minutes.
- The public endpoint default is kept only for users who get whitelisted; for
  everyone else, `VITE_PISTON_URL` is required.
- Hosting for a live portfolio demo: run Piston on a small VPS (or Fly.io /
  Railway) and set `VITE_PISTON_URL` to that host.
