# Change: Kagin 初始平台（Hono + TanStack）

Status: complete

## Intent

在 Cloudflare 上交付可运营的 App License Key 管理平台。参考 LicenseEye 的功能域与数据模型，用 **Hono + TanStack** 重新实现，形成可维护 monorepo，供后续迭代与自托管部署。

## Scope

- Monorepo 脚手架（worker / admin / sdk）
- D1 schema 与迁移（对齐 LicenseEye 核心表）
- Hono Worker：公共 API + Admin API + License DO
- TanStack 管理端：产品、许可证、策略、会话
- TypeScript SDK + 至少一个客户端示例
- Wrangler 部署配置与 secrets 文档
- CI：typecheck + build（各 package）

## Non-goals

- LicenseEye 代码直接 fork 或逐文件迁移
- 支付、多租户、邮件通知
- 完整 analytics 面板（v1 仅列表与基础指标）
- 生产环境 WAF/限流具体规则配置（文档提及，不自动化）

## Acceptance

### 阶段 0 — 仓库与工具链

- [x] `package.json` workspaces：`apps/worker`, `apps/admin`, `packages/sdk`
- [x] 共享 `tsconfig`、ESLint 基础配置
- [x] `wrangler.jsonc`（非 TOML）+ `wrangler types` 生成 `worker-configuration.d.ts`
- [x] README 与 docs 链通

### 阶段 1 — 数据层

- [x] `0001_init.sql`：products, licenses, sessions, policies, fingerprints, tokens 表
- [x] 本地 `wrangler d1 migrations apply --local` 成功
- [x] D1 访问层（repository 或 drizzle，择一并在 ADR 记录）

### 阶段 2 — Hono Worker 骨架

- [x] `apps/worker/src/index.ts` 导出 default fetch handler
- [x] 路由分组：`/v1/*` 公共、`/admin/v1/*` 管理
- [x] 健康检查 `GET /health`
- [x] Zod 请求校验 + 统一错误 JSON
- [x] `wrangler dev` 可访问 health

### 阶段 3 — 认证与 Admin API

- [x] Admin JWT 中间件（`ADMIN_JWT_PUBLIC_JWK` secret）
- [x] Products CRUD
- [x] Licenses CRUD（含 Ed25519 密钥对生成存 D1）
- [x] Policies CRUD + 合并读取
- [x] 管理 API 集成测试或 hono testClient 覆盖主路径

### 阶段 4 — 公共 License API

- [x] `GET /v1/server-time`（签名方案后改为 Ed25519，见 ADR-008）
- [x] `POST /v1/heartbeat`（非 floating 路径完整）
- [x] `POST /v1/feature-token` 签发与 schema 校验
- [x] `POST /v1/ephemeral-token`
- [x] 指纹更新与风险分基础逻辑

### 阶段 5 — Durable Object（浮动席位）

- [x] `LicenseDO`：活跃 session 集合、`seat_limit` 强制
- [x] 心跳路由对 `floating` 类型转发 DO
- [x] Admin 踢出 session 释放席位
- [x] 验收：N+1 并发心跳，第 N+1 被拒绝

### 阶段 6 — Admin UI（TanStack）

- [x] Vite + React + TanStack Router 路由表
- [x] TanStack Query：products / licenses / sessions / policies
- [x] 页面：Dashboard、Products、Licenses（含 CSV 导入）、Policies、Sessions
- [x] Admin JWT 登录态（Bearer 存 memory 或 secure cookie 策略在 UI ADR 补充）
- [x] `npm run build` 产出静态资源；Worker 通过 Assets 或 Pages 托管（见 ADR-002）

### 阶段 7 — SDK 与示例

- [x] `packages/sdk`：heartbeat、verify/consume feature token、storage adapter
- [x] `examples/ts/check_license.ts` 可运行
- [x] SDK README 中英使用说明

### 阶段 8 — 部署与运维

- [x] 生产 `wrangler deploy` 文档化（D1/KV/DO bindings ID）
- [x] Secrets 清单：`ADMIN_JWT_PUBLIC_JWK`
- [x] GitHub Actions：`npm run build` + `tsc` 全包
- [x] SECURITY.md 漏洞报告流程

## Constraints

- Cloudflare Workers 运行时；兼容日期近 30 天内
- 密钥与 secrets 不入库（见 [SECURITY.md](../SECURITY.md)）
- 参考 LicenseEye 行为时以本仓库 `docs/product` 为权威，不以参考仓库 README 为准
- ystack：每阶段独立 verify + commit（sequence-verifiable-units）

## Design

### Monorepo 布局

```text
kagin/
├── apps/
│   ├── worker/
│   │   ├── src/
│   │   │   ├── index.ts          # Hono app + export
│   │   │   ├── routes/
│   │   │   │   ├── public.ts
│   │   │   │   └── admin.ts
│   │   │   ├── middleware/
│   │   │   ├── services/
│   │   │   └── do/LicenseDO.ts
│   │   ├── migrations/
│   │   └── wrangler.jsonc
│   └── admin/
│       ├── src/
│       │   ├── routes/           # TanStack Router
│       │   ├── api/              # typed fetch + Query keys
│       │   └── main.tsx
│       └── vite.config.ts
├── packages/
│   └── sdk/
└── docs/
```

### Hono 应用结构

- `createApp()` 绑定 `Env`（D1, KV, DO）
- `app.use('*', cors)` 仅 admin 源或配置化
- `app.route('/v1', publicRoutes)`
- `app.route('/admin/v1', adminRoutes)` + jwt middleware

### TanStack 数据流

- Router：file-based 或手动 route tree（与 LicenseEye 的单一 App.tsx 对比，按路由拆分）
- Query：`useProducts`, `useLicenses(productId)`, mutations 带 optimistic 可选
- API client：共享 `packages/api-types` 可选（阶段 2 后评估）

### 与 LicenseEye 差异摘要

| 维度 | LicenseEye | Kagin |
| --- | --- | --- |
| API 框架 | 原生 fetch 路由 | Hono + Zod |
| Admin UI | React + Ant Design 单文件 | TanStack Router + Query |
| 配置 | wrangler.toml | wrangler.jsonc |
| 结构 | admin/workers/sdk 平铺 | apps/* + packages/* |

## Decisions

- Hono + TanStack — 见 [ADR-001](../decisions/001-hono-tanstack-stack.md)
- Cloudflare 绑定 — 见 [ADR-002](../decisions/002-cloudflare-bindings.md)
- Ed25519 令牌 — 见 [ADR-003](../decisions/003-license-cryptography.md)

## Verification plan

| 阶段 | 验证 |
| --- | --- |
| 0–1 | migrations apply；`wrangler types` 无错 |
| 2–4 | hono testClient / vitest；curl 脚本 |
| 5 | 并发脚本压 heartbeat |
| 6 | 浏览器手动 + admin build |
| 7 | `tsx examples/ts/check_license.ts` |
| 8 | CI green + 远程 deploy smoke |

## Product docs to update

- `docs/product/overview.md` — converge 时改为 verified behavior
- `docs/product/licensing.md` — API 路径与错误码最终锁定
- 本 brief — 完成后 archive 或删除（Git 保留历史）

---

## ystack 开发清单（执行顺序）

以下为 **Feature playbook** 吞吐量检查点，按顺序执行；独立 workstream 可并行。

### Blocking first steps（必须先完成）

1. living-spec inspect ✓（本 brief）
2. ADR-001 / 002 / 003 审阅确认
3. 阶段 0 脚手架 + 阶段 1 迁移

### Independent workstreams（可并行，写入范围不重叠）

| Workstream | 负责人 | 产出 | 依赖 |
| --- | --- | --- | --- |
| W1 Worker API | feature_impl | 阶段 2–5 | 阶段 1 |
| W2 Admin UI | feature_impl | 阶段 6 | 阶段 3 API 可用 |
| W3 SDK | feature_impl | 阶段 7 | 阶段 4 公共 API |

### Shared mutable state（需串行）

- D1 schema 变更：仅 W1 在阶段 1 锁定，后续 ALTER 走独立 migration PR
- `wrangler.jsonc` bindings：W1 维护，W2/W3 只读
- 公共 API 契约：W1 定稿后 W2/W3 对齐

### Smallest safe decomposition

- 不拆多 Worker；单 Worker + DO + 静态 Assets 足够 v1
- Admin 不嵌 TanStack Start 全栈；SPA + API 分离降低复杂度

### 每阶段完成定义（DoD）

1. 该阶段 Acceptance 勾选全过
2. `verify` 在真实表面（dev server / test / 浏览器）
3. 小 commit，message 含阶段号
4. 若改变产品行为，更新 product doc 草稿段落

### 建议 PR 栈

1. `feat/scaffold` — 阶段 0–1
2. `feat/worker-core` — 阶段 2–4
3. `feat/license-do` — 阶段 5
4. `feat/admin-ui` — 阶段 6
5. `feat/sdk` — 阶段 7
6. `chore/ci-deploy` — 阶段 8
