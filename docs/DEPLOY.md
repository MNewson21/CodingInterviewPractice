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
   VITE_PISTON_URL=https://piston.YOURDOMAIN.com/api/v2          # from Part C (note: /api/v2, NOT /api/v2/piston)
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

> ### Testing on the free tier first (do this before the "real" deploy)
> You never buy EC2 up front — it's **pay-as-you-go by the hour**, and you terminate
> when done. So you can validate the whole Piston setup for ~$0 first:
>
> - **Free credits:** new AWS accounts get a credit-based free plan (~$100, up to
>   $200 after setup activities, ~6 months). That easily covers this. *(Exact terms
>   change — confirm on the signup page. Older accounts may instead have the legacy
>   12-month / 750-hours-per-month micro tier.)*
> - **Use `t3.micro` (1 GB) for testing.** It's free-tier-eligible and is enough for
>   the **light language set this app uses (Python + JS + TS)** — `setup-piston.sh`'s
>   default. You only need `t3.small` (Part C1) once you add heavy compilers (C++/Java).
> - **Skip the Elastic IP while testing.** Since Feb 2024 AWS bills public IPv4
>   addresses (~$3.60/mo, ~$0.005/hr) **even when attached to a running instance**.
>   For a throwaway test just use the instance's auto-assigned public IP (it changes
>   on restart, which is fine for a one-off). Only allocate an Elastic IP for the real
>   demo, when you want a stable IP for DNS — and **release it** as soon as you're done
>   (an unattached EIP keeps billing). See Teardown below.
> - **When the test passes:** terminate the `t3.micro`, then do the real deploy
>   (`t3.small` + Elastic IP + Caddy/HTTPS + domain) following C1–C4.

### C0. Free-tier test walkthrough (no domain, no Caddy, no Elastic IP)

A throwaway run to prove Piston works on AWS before committing to the real deploy.
Code execution does **not** need Supabase or the AI features, so they can stay inert.

> **(Optional) Prove it locally first** so AWS is the only new variable:
> `docker start piston && npm run dev` → solve a problem, hit **Run**, tests pass.

1. **Create the AWS account** at aws.amazon.com → *Create an AWS Account*. A
   credit/debit card is required for verification (not charged within free credits);
   choose the **Basic (free)** support plan.

2. **Launch a `t3.micro`** (EC2 → Launch instance):
   - AMI **Ubuntu Server 24.04 LTS**, type **`t3.micro`**.
   - Create + download a **key pair** (`.pem`) for SSH.
   - **Security group** (test-only): SSH (22) from *My IP*, **Custom TCP 2000 from
     *My IP*** (temporary — the real deploy closes this and puts Caddy in front).
   - **No Elastic IP** — use the auto-assigned public IP.

3. **Install Docker + Piston** (SSH in: `ssh -i your-key.pem ubuntu@<public-ip>`):
   ```bash
   sudo apt update && sudo apt install -y docker.io jq
   sudo systemctl enable --now docker

   sudo docker run --privileged -d --name piston --restart unless-stopped \
     -p 2000:2000 -v piston-data:/piston ghcr.io/engineer-man/piston

   curl -s http://localhost:2000/api/v2/runtimes ; echo     # wait until this prints []
   ./setup-piston.sh                                         # installs Python + JS + TS
   ```
   (Copy `scripts/setup-piston.sh` onto the box, or paste its contents.)

4. **Smoke test (proves hosting works)** — on the box:
   ```bash
   curl -s http://localhost:2000/api/v2/runtimes | jq -r '.[] | "\(.language) \(.version)"'
   ```
   Seeing `python` / `javascript` / `typescript` confirms Piston runs on EC2.

5. **Full end-to-end from your app (no CORS/HTTPS needed yet).** Point the **Vite dev
   proxy** at the instance — the proxy runs server-side, so the browser never makes a
   cross-origin call. In `vite.config.ts`, temporarily change the target:
   ```ts
   '/piston': {
     target: 'http://<your-ec2-public-ip>:2000',   // was http://localhost:2000
     changeOrigin: true,
     rewrite: (path) => path.replace(/^\/piston/, ''),
   },
   ```
   Keep `.env.local` as `VITE_PISTON_URL=/piston/api/v2`, restart `npm run dev`, open a
   problem, hit **Run**. Passing tests = your app is executing code on AWS.

   > Pointing the browser *directly* at `http://<ec2-ip>:2000` would fail (cross-origin,
   > and later mixed HTTP/HTTPS). That's exactly what Caddy + a domain fix in the real
   > deploy (C3); the dev proxy sidesteps it for a test.

6. **Tear down:** EC2 → **Terminate** the instance; revert the `vite.config.ts` proxy
   change. No Elastic IP was allocated, so nothing lingers. Cost: pennies.

Once this is green, proceed to the real deploy (C1–C4) for a stable public URL.

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

sudo docker run --privileged -d --name piston --restart unless-stopped \
  -p 2000:2000 -v piston-data:/piston ghcr.io/engineer-man/piston

# --privileged (isolate sandbox) and -v piston-data:/piston (persistent data dir)
# are both required; without them the container errors on mkdir 'isolate/' / chown '/piston'.

# wait until this prints []  then install runtimes
curl -s http://localhost:2000/api/v2/runtimes ; echo
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
curl -s https://piston.YOURDOMAIN.com/api/v2/runtimes | jq length
```

### C4. Wire it up
Set `VITE_PISTON_URL=https://piston.YOURDOMAIN.com/api/v2` in Vercel and redeploy.

---

## Teardown (stop the bill)
When the demo month is over:
- EC2 -> **Terminate** the instance.
- **Release the Elastic IP** (an unattached Elastic IP is billed).
- Vercel + Supabase free tiers cost nothing to leave up.
