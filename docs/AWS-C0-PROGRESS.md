# AWS §C0 Free-Tier Test — Progress & Resume Guide

> Personal resume note for the Piston-on-AWS free-tier test. Pick up where you left off.
> Full reference: `docs/DEPLOY.md` §C0. Started: 2026-06-04.

## Where you are
- [x] AWS account created — **Free account plan**, $100 credits. No real charges.
- [x] EC2 instance launched (`t3.micro`, Ubuntu 24.04).
- [x] Key pair downloaded → moved to `~/.ssh/MainKey.pem`, `chmod 400` applied.
- [x] SSH in — confirmed (Ubuntu 26.04).
- [x] Install Docker + Piston on the box — container up, `/runtimes` returns `[]`.
- [x] Installed runtimes — python 3.12.0, javascript 20.11.1, typescript 5.0.3.
- [x] Wired local app via `vite.config.ts` proxy → Run + all tests pass on AWS. ✅ TEST PASSED.
- [ ] **NEXT:** Tear down the instance (Step 6) + revert the `vite.config.ts` proxy.

## Fill these in (from the EC2 console)
- **Region:** `eu-west-2` (London)
- **Public IP:** `<PUBLIC-IP>` (kept locally in `.env.local`; changes if you stop/start)
- **Key file:** `/home/miles/Downloads/MainKey.pem`

---

## Step 0 — Fix the key file (do this first)
SSH rejects a key that others can read. Lock it down. Recommended: move it into `~/.ssh/`.

```bash
mkdir -p ~/.ssh
mv /home/miles/Downloads/MainKey.pem ~/.ssh/MainKey.pem
chmod 400 ~/.ssh/MainKey.pem
```

After this your key path is **`~/.ssh/MainKey.pem`**. (If you'd rather leave it in Downloads,
just run `chmod 400 /home/miles/Downloads/MainKey.pem` instead — the `chmod` is the required part.)

## Step 1 — SSH in
```bash
ssh -i ~/.ssh/MainKey.pem ubuntu@<PUBLIC-IP>
```
First connect asks "are you sure?" → type `yes`. If it hangs, check the instance's security
group has **SSH (22) from My IP**.

## Step 2 — Install Docker + Piston (run on the box)
```bash
sudo apt update && sudo apt install -y docker.io jq
sudo systemctl enable --now docker

sudo docker run --privileged -d --name piston --restart unless-stopped \
  -p 2000:2000 -v piston-data:/piston ghcr.io/engineer-man/piston

curl -s http://localhost:2000/api/v2/runtimes ; echo     # wait until this prints []
```

## Step 3 — Copy the runtime installer over and run it
From your **laptop** (in the repo dir `~/Desktop/CodingInterviewPractice2/CodingInterviewPractice`):
```bash
scp -i ~/.ssh/MainKey.pem scripts/setup-piston.sh ubuntu@<PUBLIC-IP>:~
```
Then on the **box**:
```bash
chmod +x setup-piston.sh && ./setup-piston.sh        # installs Python + JS + TS (a few min)
```

## Step 4 — Smoke test (proves Piston runs on AWS)
On the box:
```bash
curl -s http://localhost:2000/api/v2/runtimes | jq -r '.[] | "\(.language) \(.version)"'
```
Seeing `python` / `javascript` / `typescript` = ✅ success.

## Step 5 — Wire your app to it (Claude does this)
Send Claude the instance's **public IP**. Claude edits `vite.config.ts` to point the dev
proxy at `http://<PUBLIC-IP>:2000` (the security group needs **Custom TCP 2000 from My IP**).
Then on your laptop:
```bash
npm run dev        # open a problem → hit Run → passing tests = executing code on AWS
```

## Step 6 — Tear down (stops any spend)
- EC2 → select the instance → **Instance state → Terminate**.
- No Elastic IP was allocated, so nothing lingers.
- Tell Claude to revert the `vite.config.ts` change.

---

## Gotchas
- **Region:** if the instance "disappears," you're looking at the wrong region.
- **Public IP changes** if you stop/start the instance (fine for a one-off test; just re-send
  the new IP for Step 5).
- **Key perms:** `chmod 400` is mandatory or SSH refuses to use the key.
- Port **2000** open only **from My IP** — it's temporary for this test; the real deploy closes
  it and puts Caddy + HTTPS in front.
