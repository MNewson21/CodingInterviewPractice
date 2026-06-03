# Deploying the Mock Interview IDE

The app is three independently-hosted pieces:

| Piece            | Host                | Cost        |
|------------------|---------------------|-------------|
| Frontend (Vite)  | Vercel              | Free        |
| Auth + DB + AI   | Supabase (cloud)    | Free tier   |
| Code execution   | Piston on AWS EC2   | ~$8-15/mo   |

Only the EC2 box costs money. Tear it down when the demo is over (see end).

---

## Part A — Frontend on Vercel

1. Push the repo to GitHub.
2. On vercel.com: **New Project -> import the repo**. Vercel auto-detects Vite
   (build `npm run build`, output `dist`). `vercel.json` is already included so
   client-side routes work on refresh.
3. Add Environment Variables (Project Settings -> Environment Variables):
   ```
   VITE_SUPABASE_URL=https://jdvupaqhglrbriyhcmbz.supabase.co
   VITE_SUPABASE_ANON_KEY=<your anon key>
   VITE_PISTON_URL=https://piston.YOURDOMAIN.com/api/v2/piston   # from Part C
   VITE_ENABLED_LANGUAGES=python,javascript,typescript        # match installed runtimes
   ```
4. Deploy. You get `https://your-app.vercel.app`.

> Note: locally we use a Vite dev proxy for Piston; in production `VITE_PISTON_URL`
> is the full HTTPS URL of your EC2 Piston (Part C).

---

## Part B — Supabase (already hosted)

1. **Run the migration** (if not done): SQL Editor -> paste `supabase/migrations/0001_init.sql` -> Run.
2. **Deploy the AI functions** (optional) per `docs/AI_SETUP.md`.
3. **Authentication -> URL Configuration -> Site URL** = your Vercel URL, so auth
   redirects land back on the live app.

---

## Part C — Piston on AWS EC2

### C1. Launch the instance
- EC2 -> Launch instance
- AMI: **Ubuntu Server 24.04 LTS**
- Type: **t3.small** (2 GB RAM — recommended; compiling C++/Java needs headroom).
  `t3.micro` (1 GB) is free-tier-eligible but tight — if you use it, install only
  Python + Node (edit `scripts/setup-piston.sh`).
- Key pair: create/download one for SSH.
- **Security group** inbound rules:
  - SSH (22) — from *My IP* only
  - HTTP (80) — from Anywhere
  - HTTPS (443) — from Anywhere
  - Do **NOT** open port 2000 — Caddy fronts Piston.
- (Recommended) Allocate an **Elastic IP** and associate it, so the IP is stable
  for DNS.

### C2. Install Docker + run Piston
SSH in (`ssh -i key.pem ubuntu@<elastic-ip>`), then:
```bash
sudo apt update && sudo apt install -y docker.io jq
sudo systemctl enable --now docker

sudo docker run -d --name piston --restart unless-stopped \
  -p 2000:2000 ghcr.io/engineer-man/piston

# wait until this prints []  then install runtimes
curl -s http://localhost:2000/api/v2/piston/runtimes ; echo
```
Copy `scripts/setup-piston.sh` to the box (or paste it) and run it:
```bash
./setup-piston.sh
```

### C3. HTTPS + CORS with Caddy
A live HTTPS frontend cannot call an http:// or cross-origin backend, so Caddy
gives Piston HTTPS and adds the CORS header.

1. Point DNS: an **A record** `piston.YOURDOMAIN.com -> <Elastic IP>`.
2. Install Caddy:
   ```bash
   sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
   curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
   curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
   sudo apt update && sudo apt install -y caddy
   ```
3. `/etc/caddy/Caddyfile` (replace both domains):
   ```
   piston.YOURDOMAIN.com {
       @options method OPTIONS
       handle @options {
           header Access-Control-Allow-Origin "https://your-app.vercel.app"
           header Access-Control-Allow-Methods "GET, POST, OPTIONS"
           header Access-Control-Allow-Headers "Content-Type"
           respond 204
       }
       header Access-Control-Allow-Origin "https://your-app.vercel.app"
       reverse_proxy localhost:2000
   }
   ```
4. `sudo systemctl reload caddy`. Caddy auto-provisions a TLS cert.

Test from your laptop:
```bash
curl -s https://piston.YOURDOMAIN.com/api/v2/piston/runtimes | jq length
```

### C4. Wire it up
Set `VITE_PISTON_URL=https://piston.YOURDOMAIN.com/api/v2/piston` in Vercel and redeploy.

---

## Teardown (stop the bill)
When the demo month is over:
- EC2 -> **Terminate** the instance.
- **Release the Elastic IP** (an unattached Elastic IP is billed).
- Vercel + Supabase free tiers cost nothing to leave up.
