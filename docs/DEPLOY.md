# 部署

把 Kagin 跑到你自己的 Cloudflare 账号上。本地开发见 [README](../README.md)。

## 创建 D1 和 KV

在仓库根目录：

```bash
pnpm exec wrangler d1 create kagin-db
pnpm exec wrangler kv namespace create kagin-kv
```

把输出的 D1 `database_id` 和 KV `id` 写进仓库根的 `wrangler.jsonc`。这两个值必须是你账号下的资源。Dashboard 里的 Worker 名必须是 `kagin`，和 `wrangler.jsonc` 的 `name` 一致。

## 执行迁移

`wrangler deploy` 不会跑 D1 migration。在仓库根执行：

```bash
pnpm exec wrangler d1 migrations apply kagin-db --local    # 本地开发库
pnpm exec wrangler d1 migrations apply kagin-db --remote   # 生产库
```

## 环境变量

本地：复制 `.dev.vars.example` 为 `.dev.vars`（和 `wrangler.jsonc` 放在仓库根）。不要提交真实值。

生产：Cloudflare Dashboard → 你的 Worker → Settings → **Variables and Secrets**。也可以用 Wrangler：

```bash
pnpm exec wrangler secret put PUBLIC_BASE_URL
pnpm exec wrangler secret put STRIPE_SECRET_KEY
pnpm exec wrangler secret put STRIPE_PRICE_ID
pnpm exec wrangler secret put STRIPE_WEBHOOK_SECRET
pnpm exec wrangler secret put CONTACT_EMAIL
```

托管 SaaS（Stripe 计费）需要：

- `PUBLIC_BASE_URL`：控制台对外 origin，不要尾斜杠。Checkout 和 Customer Portal 的回跳只使用这个值。
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`
- `CONTACT_EMAIL`：定价页联系按钮，可选

自托管 JWT 和托管 Stripe 互斥。配了 Stripe 密钥就不要再设 `ADMIN_JWT_PUBLIC_JWK`。

## Stripe webhook

端点：`https://<你的域名>/v1/stripe/webhook`

订阅这些事件：`checkout.session.completed`、`customer.subscription.updated`、`customer.subscription.deleted`。

在 Stripe Dashboard 打开 Customer Portal，否则控制台里的「管理账单」会失败。

第一次部署后记下 `*.workers.dev` 地址，把它设成 `PUBLIC_BASE_URL`。之后如果绑了自定义域名，再改成该 origin。

## GitHub 自动部署（Workers Builds）

`wrangler.jsonc`、`pnpm-workspace.yaml` 都在仓库根。Root directory 留空。不要填 `apps/worker`。

连接仓库后使用：

| 设置 | 值 |
| --- | --- |
| Root directory | 留空 |
| Build command | `pnpm install && pnpm --filter @kagin/admin build` |
| Deploy command | `npx wrangler d1 migrations apply kagin-db --remote && npx wrangler deploy` |

Deploy command 先给远程 D1 跑 migration，再发布 Worker。Admin 产物在 `apps/admin/dist`。

## 从本机发布

```bash
pnpm install
pnpm deploy
```

构建 Admin 时用环境变量控制登录 UI：

```bash
# SaaS（默认）：仅邮箱登录
VITE_SHOW_LEGACY_TOKEN=false pnpm --filter @kagin/admin build

# 自托管：显示粘贴 Admin JWT
VITE_SHOW_LEGACY_TOKEN=true pnpm --filter @kagin/admin build
```
