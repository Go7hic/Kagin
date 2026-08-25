# ADR-002: Cloudflare 绑定与部署模型

Status: accepted

## Context

许可证系统需要 relational 数据、低延迟配置缓存、浮动席位强一致计数。LicenseEye 使用 D1 + KV + LicenseDO。需在 Kagin 确定配置文件格式、Admin 静态资源托管方式与环境划分。

## Decision

| 绑定 | 用途 |
| --- | --- |
| **D1** (`DB`) | products, licenses, sessions, policies, fingerprints, token 日志 |
| **KV** (`KV`) | policy 快照缓存、可选 JWK 集、特性 schema 热读 |
| **Durable Object** (`LicenseDO`) | 浮动 license 席位与活跃 session |
| **Workers Assets** | Admin SPA `apps/admin/dist` 由同一 Worker 或 `wrangler.jsonc` assets 配置托管 |

- 配置文件：**wrangler.jsonc**（JSONC），`compatibility_date` 取当月
- 环境：`env.staging` / `env.production` 分离 D1 database_id 与 KV id
- 本地开发：`wrangler dev --local --persist`；迁移 `wrangler d1 migrations apply DB --local`

### Secrets（Wrangler secret，非 vars）

- `PUBLIC_BASE_URL`（托管 Checkout 和 Portal 回跳 origin）
- `STRIPE_SECRET_KEY`、`STRIPE_PRICE_ID`、`STRIPE_WEBHOOK_SECRET`
- `ADMIN_JWT_PUBLIC_JWK`（仅自托管。与 Stripe 互斥）
- `CONTACT_EMAIL`（可选）

### Vars（非敏感）

- `HEARTBEAT_TIMEOUT_SECONDS`（默认 120）
- `TIME_SKEW_TOLERANCE_SECONDS`（默认 60）
- `FEATURE_SCHEMA_STRICT`（未设置时视为 true）

## Alternatives

### Cloudflare Pages（Admin）+ Worker（API）分离

部署简单但跨域、JWT cookie、预览环境配置翻倍。**v1 可选，默认单 Worker + Assets 减少运维面。**

### Hyperdrive + 外部 Postgres

更强查询能力，违背「全在 CF 边缘」与 LicenseEye 对齐的 D1 模型。**拒绝 v1。**

### R2 存密钥

对象存储不适合高频读私钥；D1 + secret 足够。**拒绝。**

## Consequences

- 收益：与 LicenseEye 运维模型一致，Wrangler 单命令部署
- 成本：D1 写入吞吐与 DO 冷启动需监控；Assets 需先 build admin
- 运维：`wrangler.jsonc` 里的 D1 `database_id` 和 KV `id` 必须换成部署账号下的资源。步骤见 [部署](../DEPLOY.md)。

## Verification

- 本地 persist 重启后 D1 数据保留
- 部署后 Admin 静态页与 `/v1/health` 同域可访问（若采用 Assets 绑定）

## Revisit when

- Admin 体积或发布频率与 API 差异过大，需独立 Pages CI
- 需要只读副本或复杂报表查询迁出 D1
