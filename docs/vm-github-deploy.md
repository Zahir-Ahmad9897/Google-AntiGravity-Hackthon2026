# CIRO VM Auto Deploy

This project can auto-deploy the Python/web app to a Google Compute Engine VM after every push to `main`.

## Required GitHub Secrets

Add these in GitHub:

`Repository -> Settings -> Secrets and variables -> Actions -> New repository secret`

- `VM_HOST`: VM external IP, for example `34.57.175.11`
- `VM_USER`: Linux username used for SSH, for example `zahir` or the username shown in the VM SSH terminal
- `VM_SSH_KEY`: private SSH key that can log into the VM
- `VM_APP_DIR`: absolute app directory on VM, for example `/home/zahir/Google-AntiGravity-Hackthon2026`

## VM One-Time Setup

Run once inside the VM repo directory:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Keep `.env` only on the VM. Do not commit it to GitHub.

## What The Workflow Does

On every push to `main`, GitHub Actions SSHs into the VM, runs:

```bash
git fetch origin main
git reset --hard origin/main
source .venv/bin/activate
pip install -r requirements.txt
pkill -f "uvicorn main:app" || true
nohup .venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 > ciro.log 2>&1 &
```

Then it checks:

```bash
http://127.0.0.1:8000/health
```
