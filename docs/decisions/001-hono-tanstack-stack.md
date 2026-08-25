# ADR-001: Hono + TanStack 技术栈

Status: accepted

## Context

需要在 Cloudflare Workers 上提供 REST API 与管理界面。参考项目 LicenseEye 使用原生 Worker 路由与 React + Ant Design 单文件 Admin，不利于路由拆分、类型安全的请求校验与客户端缓存一致性。用户明确要求 Hono + TanStack，且团队熟悉 React 生态。

## Decision

- **API**：Hono on Workers，`@hono/zod-validator` 校验入参，路由按 `public` / `admin` 模块拆分
- **Admin**：Vite + React + **TanStack Router**（路由）+ **TanStack Query**（服务端状态）；UI 组件库选用 shadcn/ui + Tailwind（轻量、可定制），不引入 Ant Design
- **不采用** TanStack Start 全栈框架 v1：避免与 Workers 部署模型双重复杂度；Admin 为 SPA，API 为独立 Worker

## Alternatives

### 原生 fetch + 手写路由（LicenseEye 方式）

简单但缺少中间件链、OpenAPI 生成与一致错误处理；大规模 Admin API 难维护。**拒绝。**

### TanStack Start（全栈）

单仓库路由与 SSR 更统一，但 Cloudflare 部署路径、静态资源与 Worker 边界需额外适配。**v1 拒绝，v2 可 revisit。**

### Next.js on Cloudflare

生态成熟，但对纯 API Worker + 轻 Admin 过重，且与「Hono 优先」不一致。**拒绝。**

## Consequences

- 收益：类型安全 API、可测试 Hono app、Query 缓存减少 Admin 重复请求
- 成本：需自建 Admin 登录与 JWT 存储；两应用独立构建
- 兼容：公共 API 版本前缀 `/v1`，便于 SDK 锁定

## Verification

- `wrangler dev` 启动 Hono；`curl /health` 200
- Admin `npm run dev` 路由跳转与 Query 加载 products 列表

## Revisit when

- 需要 SSR/SEO 的面向客户门户
- TanStack Start 在 Cloudflare 有稳定官方模板且团队愿意合并部署单元
