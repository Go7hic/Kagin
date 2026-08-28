# Kagin

> Source-available app license-key platform on Cloudflare: issue keys, bind devices or seats, verify in-app, operate from a console.

## What it does

Kagin manages license keys for apps. Operators create products, issue keys, set device or seat limits, and revoke or kick sessions. Client apps activate, heartbeat, and request signed feature tokens.

## Who it is for

Developers and small teams shipping paid desktop or mobile apps who need enforceable licensing without running a custom authz stack.

## Core features

- Device binding (`machine_limit`) with activate / deactivate / list activations
- Floating concurrent seats (`seat_limit` + Durable Object)
- Ed25519-signed feature tokens per product
- Policies and risk states (grace / restricted)
- Admin console, API keys, TypeScript SDK
- Hosted Stripe billing or self-host

## Common use cases

- Buy-once license limited to 1–2 machines
- Subscription keys with expiry
- Team floating seats for concurrent use
- Payment webhook fulfillment with idempotent `external_reference`

## Install or try

- Hosted: https://kagin.dev/en — open console, create a product, issue a key
- Docs: https://kagin.dev/en/docs/quickstart
- Self-host: https://kagin.dev/en/docs/deploy and https://github.com/Go7hic/Kagin

## Pricing

- Hosted: **$5 / month**, up to **5 products**
- Self-host noncommercial: free under PolyForm Noncommercial 1.0.0
- Commercial self-host: contact hello@kagin.dev

## Compared with alternatives

Unlike opaque closed licensing SaaS, Kagin’s source is auditable and the same binary runs hosted or self-hosted. Unlike a fully custom Worker, machine limits and seats are enforced by the API out of the box.

## Current status

Actively hosted at https://kagin.dev. Public APIs for activate/deactivate, heartbeat, tokens, and admin device rebind are available. Team invites / SSO are out of scope today.

## Official links

- Site: https://kagin.dev
- Docs: https://kagin.dev/en/docs/quickstart
- GitHub: https://github.com/Go7hic/Kagin
- Email: hello@kagin.dev
- X: https://x.com/Go7hic
- AI index: https://kagin.dev/llms.txt
