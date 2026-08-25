<p align="center">
  <img src="apps/admin/public/logo.png" alt="Kagin" width="96" height="96">
</p>

# Kagin

[English](README.md) · [中文](README_zh.md)

App license-key platform on Cloudflare: issue keys, verify, heartbeat, floating seats, feature tokens.

Hosted SaaS uses email signup for a workspace and optional Stripe billing. Self-host the same code with an external admin JWT and no Stripe.

Stack: Hono API, TanStack admin, TypeScript SDK. Runtime: Workers, D1, KV, Durable Objects.

Source is licensed under [PolyForm Noncommercial 1.0.0](LICENSE). Commercial use needs a separate license.

## Docs

| Doc | Contents |
| --- | --- |
| [Doc index](docs/README.md) | Map of all docs |
| [Product overview](docs/product/overview.md) | Verified behavior |
| [Licensing](docs/product/licensing.md) | API and policy |
| [Deploy](docs/DEPLOY.md) | Self-host on Cloudflare |
| [Security](docs/SECURITY.md) | Vulnerabilities and secrets |
| [ADRs](docs/decisions/README.md) | Architecture decisions |
| [SDK](packages/sdk/README.md) | Client |

Most of the `docs/` tree is in Chinese.

## Layout

```text
apps/worker/    Hono API and LicenseDO
apps/admin/     TanStack admin
packages/sdk/   TypeScript client
examples/ts/    Integration sample
```

## Local development

```bash
pnpm install
pnpm dev:worker    # http://127.0.0.1:8787
pnpm dev:admin     # http://127.0.0.1:5173, API proxied to the worker
```

Sign up or log in with email in the local admin. For a self-hosted JWT:

```bash
cd apps/worker && pnpm exec tsx scripts/gen-admin-jwt.ts
```

Env template: `.dev.vars.example` at the repo root. Copy it to `.dev.vars`. Do not commit real values.

## Verify

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm verify      # wrangler dev, API smoke, SDK sample
```

Production deploy: [docs/DEPLOY.md](docs/DEPLOY.md).
