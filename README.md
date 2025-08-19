# Alchaar Kiosk

A kiosk‑optimized shopping UI for a vertical 2160×3840 screen, built with Next.js App Router, React, Tailwind v4, Prisma, and Postgres. Ships as a Docker app with one‑command install, automatic DB migrations, pre‑update backups, and a simple update/restore flow.

## Features

- Modern shopper UI: redesigned category/product cards, larger kiosk typography, sticky header, cart FAB mid‑right.
- EN/AR toggle; product names unchanged; admin/orders remain LTR.
- Filters respect settings: hide prices disables price filters and sales; hide stock disables stock filters.
- Data rules: exclude uncategorized products; only leaf categories may contain products.
- Infra: multi‑stage Docker image, non‑root runtime, healthchecks, DB wait + `prisma migrate deploy` at startup.
- Ops: prod docker‑compose with volumes, GHCR image via CI on `main`, update script that auto‑backs up DB.

## Tech stack

Next.js 15, React 19, TypeScript, Tailwind CSS v4, Prisma, Postgres, Docker/Compose, GHCR.

## Structure

- `src/` app/components/contexts/hooks
- `prisma/` schema + migrations
- `public/` static assets
  - `logo.svg` tracked
  - `categories/` and `products/` present but empty in git (placeholders); `products/` is host‑mounted in prod
- `docker/entrypoint.sh` DB wait + migrate
- `docker-compose.prod.yml` prod stack (DB + app + healthchecks)
- `scripts/` deploy, update, backup, restore (PowerShell)
- `Dockerfile` multi‑stage build

## Easy install (Windows + Docker Desktop)

1. Install Docker Desktop (WSL2 backend).
2. Download this repo (ZIP) or clone; open PowerShell in the project folder.
3. Copy `.env.example` to `.env` and set:
   - `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
   - Optional `DATABASE_URL` (otherwise entrypoint builds one from PG vars)
   - UI flags: `NEXT_PUBLIC_HIDE_PRICES`, `NEXT_PUBLIC_SALES_ENABLED`, `NEXT_PUBLIC_HIDE_STOCK`, `NEXT_PUBLIC_ADMIN_PASS`
4. Place product images (if any) in `public/products/`.
5. Deploy:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
./scripts/deploy-prod.ps1 -EnvFile ./.env
```

App: http://localhost:3000

## Update (pulls image from GHCR; auto‑backup)

Push to `main` -> CI publishes `ghcr.io/ahmad-fatayerji/alchaar-kiosk:latest`.
On the kiosk PC:

```powershell
./scripts/update-prod.ps1 -EnvFile ./.env
```

Creates `preupdate-YYYYMMDD-HHMMSS.sql.gz` in the `backups` volume, pulls latest, restarts.

## Backups and restore

- Volume: `alchaar-kiosk_backups` mounted to `/backups` in DB container.
- List backups:

```powershell
docker compose -f docker-compose.prod.yml exec db ls -lah /backups
```

- Manual backup:

```powershell
./scripts/backup-db.ps1 -EnvFile ./.env -BackupName backup-manual.sql.gz
```

- Restore:

```powershell
./scripts/restore-db.ps1 -BackupName preupdate-YYYYMMDD-HHMMSS.sql.gz -EnvFile ./.env
```

## CI/CD (GHCR)

- Workflow `.github/workflows/docker-publish.yml` builds on `main` and pushes tags:
  - `latest` and short SHA to `ghcr.io/ahmad-fatayerji/alchaar-kiosk`.
- Compose defaults to that image; override via `APP_IMAGE` env if needed.

### Why GHCR shows an "unknown/unknown" entry

You’ll see OS/Arch `linux/amd64` and also `unknown/unknown`. The latter is typically an OCI artifact (provenance/attestation or metadata) pushed by Buildx, which GHCR lists with unknown OS/arch. It’s harmless and can be ignored.

- To hide it, set in the workflow step:
  - `provenance: false` (and optionally `sbom: false`) on `docker/build-push-action`.
- To support more platforms, set `platforms: linux/amd64,linux/arm64` and keep QEMU setup.

## Troubleshooting

- Build error: `/app/public: not found` -> The Dockerfile now creates `public/`, `public/categories`, `public/products` even if empty; ensure `public/logo.svg` exists.
- Scripts blocked: run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in PowerShell session.
- App not starting: check `docker compose -f docker-compose.prod.yml logs -f db` and `app` logs; entrypoint waits for DB and runs migrations.

## License

Proprietary – internal deployment for Alchaar kiosk.
