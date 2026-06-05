# DEPLOY-LIVE — Public Production Runbook

> One-sitting checklist to take the Mock Interview IDE from the §C0 free-tier test
> (`docs/AWS-C0-PROGRESS.md`) to a live public site on a domain you own.
> Full reference/rationale lives in `docs/DEPLOY.md` (§A, §B, §C1–C4); this file is
> the condensed, ordered "do it now" version. Replace `YOURDOMAIN.com` throughout.

## The shape of it

| Piece            | Host              | URL                              | Cost        |
|------------------|-------------------|----------------------------------|-------------|
| Frontend (Vite)  | Vercel            | `https://YOURDOMAIN.com`         | Free        |
| Auth + DB + AI   | Supabase (cloud)  | (api only)                       | Free tier   |
| Code execution   | Piston on EC2     | `https://piston.YOURDOMAIN.com`  | ~$13–19/mo  |

**Why this is more than the test:** the §C0 test used your laptop's Vite dev proxy to
reach Piston, which hid HTTPS/CORS. In production the browser loads from HTTPS Vercel and
calls Piston **directly**, so Piston needs its own HTTPS domain + a CORS header — that's
the entire reason for the Elastic IP + DNS + Caddy below.

**Order matters:** Domain → Vercel → Supabase → Piston box. Do the Piston DNS record as
soon as you have the Elastic IP (Phase 4) so its TLS cert has time to provision.

---

## Phase 1 — Domain

1. **Buy `YOURDOMAIN.com`** from a registrar (see recommendation at bottom — Cloudflare).
2. **Use Cloudflare for DNS** (free). You'll create these records later:
   - Frontend: records Vercel gives you (apex `@` + `www`) — set **DNS-only / grey cloud**.
   - Piston: `piston` → A record → `<Elastic IP>` (Phase 4) — **DNS-only / grey cloud**.

> ⚠️ **Cloudflare gotcha:** keep the `piston` subdomain **DNS-only (grey cloud, NOT
> proxied/orange)**. Caddy provisions a Let's Encrypt cert via an HTTP-01 challenge on
> port 80; the orange-cloud proxy intercepts it and the cert fails. Grey cloud = Caddy
> sees real traffic and TLS "just works."

---

## Phase 2 — Frontend on Vercel (free)

1. Push the repo to GitHub (`git push`), if not already there.
2. **vercel.com → Add New → Project → import the repo.** Vercel auto-detects Vite
   (build `npm run build`, output `dist`). `vercel.json` is already in the repo so
   client-side routes survive a hard refresh.
3. **Project Settings → Environment Variables** (all environments):
   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
   VITE_SUPABASE_ANON_KEY=<your anon key>
   VITE_PISTON_URL=https://piston.YOURDOMAIN.com/api/v2     # note: /api/v2  (NOT /api/v2/piston)
   VITE_ENABLED_LANGUAGES=python,javascript,typescript      # must match installed runtimes
   ```
4. **Deploy.** You get `https://your-app.vercel.app` — confirm it loads.
5. **Add your domain:** Project Settings → Domains → add `YOURDOMAIN.com` and `www`.
   Vercel shows the exact DNS records — add them in Cloudflare (DNS-only). Wait for
   "Valid Configuration."

---

## Phase 3 — Supabase (free tier)

1. **Run the migration** (if not already): SQL Editor → paste
   `supabase/migrations/0001_init.sql` → Run.
2. **(Optional) Deploy the AI Edge Functions** per `docs/AI_SETUP.md` — only if you want
   the AI features live. Code execution does not need them.
3. **Authentication → URL Configuration → Site URL** = `https://YOURDOMAIN.com` so login
   redirects land back on the live site (add the Vercel preview URL as an extra Redirect
   URL if you want previews to work too).

---

## Phase 4 — The real Piston box (replaces the §C0 test instance)

### 4a. Launch the instance
- EC2 → Launch instance, region **eu-west-2 (London)** (keep everything in one region).
- AMI: **Ubuntu Server LTS**. Type: **t3.small** (2 GB — recommended headroom) or
  **t3.micro** (1 GB — fine for Python/JS/TS only).
- Key pair: reuse `~/.ssh/MainKey.pem` or create a new one.
- **Allocate an Elastic IP** (EC2 → Elastic IPs → Allocate) and **Associate** it with the
  instance. This gives a **stable IP** that survives stop/start, which DNS needs.
- **Security group inbound rules:**
  | Type        | Port | Source    |
  |-------------|------|-----------|
  | SSH         | 22   | My IP     |
  | HTTP        | 80   | Anywhere  |
  | HTTPS       | 443  | Anywhere  |
  - **Do NOT open port 2000** — Caddy fronts Piston now. (This is the key difference from
    the §C0 test, which exposed 2000 to your IP.)

### 4b. Install Docker + Piston + runtimes
SSH in (`ssh -i ~/.ssh/MainKey.pem ubuntu@<ELASTIC-IP>`), or run as one-shot commands
like in the §C0 test. Same automated setup you already used:
```bash
sudo apt-get update && sudo apt-get install -y docker.io jq
sudo systemctl enable --now docker
sudo docker run --privileged -d --name piston --restart unless-stopped \
  -p 2000:2000 -v piston-data:/piston ghcr.io/engineer-man/piston
# wait until this prints []  :
curl -s http://localhost:2000/api/v2/runtimes ; echo
```
Then copy + run the runtime installer from your laptop:
```bash
scp -i ~/.ssh/MainKey.pem scripts/setup-piston.sh ubuntu@<ELASTIC-IP>:~
ssh  -i ~/.ssh/MainKey.pem ubuntu@<ELASTIC-IP> 'chmod +x setup-piston.sh && ./setup-piston.sh'
```
Confirm it lists `python / javascript / typescript`.

### 4c. DNS for Piston
In Cloudflare: add A record `piston` → `<ELASTIC-IP>`, **DNS-only (grey cloud)**.
Verify: `dig +short piston.YOURDOMAIN.com` returns your Elastic IP.

### 4d. Caddy (HTTPS + CORS in front of Piston)
On the box:
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```
Write `/etc/caddy/Caddyfile` (replace both domains):
```
piston.YOURDOMAIN.com {
    @options method OPTIONS
    handle @options {
        header Access-Control-Allow-Origin "https://YOURDOMAIN.com"
        header Access-Control-Allow-Methods "GET, POST, OPTIONS"
        header Access-Control-Allow-Headers "Content-Type"
        respond 204
    }
    header Access-Control-Allow-Origin "https://YOURDOMAIN.com"
    reverse_proxy localhost:2000
}
```
```bash
sudo systemctl reload caddy      # auto-provisions the TLS cert (needs DNS + grey cloud)
```
Test from your laptop:
```bash
curl -s https://piston.YOURDOMAIN.com/api/v2/runtimes | jq length    # expect 3
```

---

## Final wiring + smoke test
1. In Vercel, confirm `VITE_PISTON_URL=https://piston.YOURDOMAIN.com/api/v2`, then
   **Redeploy** (env changes need a fresh build).
2. Open `https://YOURDOMAIN.com` → sign up/login → open a problem → **Run** →
   tests pass = the live site is executing code on your EC2 Piston over HTTPS. ✅
3. If Run fails, open the browser dev console:
   - **CORS error** → `Access-Control-Allow-Origin` in the Caddyfile must exactly match
     your frontend origin (`https://YOURDOMAIN.com`, no trailing slash).
   - **Cert / connection error** → Caddy cert didn't provision: check the `piston`
     record is grey-cloud and ports 80/443 are open.

---

## Cost & upkeep

| Item                              | Cost              |
|-----------------------------------|-------------------|
| Domain                            | ~$10–15 **/year** |
| EC2 t3.small + Elastic IP + disk  | ~$18–19 **/mo**   |
| (t3.micro alternative)            | ~$13 **/mo**      |
| Vercel + Supabase                 | Free              |

- Covered by your **$100 AWS credits** for ~5 months; realistic out-of-pocket to launch
  is just the **domain (~$12)**.
- **Stopping** the instance halts compute billing; with an **Elastic IP the public IP is
  preserved** (so no DNS change needed on restart) — but an Elastic IP attached to a
  **stopped** instance is billed (~$3.60/mo), as is the unattached one. EBS disk (~$0.65/mo)
  persists either way.

## Teardown (kill all spend)
- EC2 → **Terminate** the instance.
- **Release the Elastic IP** (an unattached EIP keeps billing).
- Remove the `piston` DNS record. Vercel + Supabase free tiers cost nothing to leave up.

---

## Appendix — UK ICO data protection fee
See the registrar note and ICO guidance in the chat. Short version: as a UK data
controller running a public app with user accounts (emails + saved problems), you most
likely need to pay the ICO data protection fee (Tier 1, ~£40/yr; ~£35 by direct debit)
unless an exemption applies. Confirm with the ICO self-assessment:
https://ico.org.uk/for-organisations/data-protection-fee/self-assessment/
You are the **controller**; Supabase and AWS are your **processors**.
