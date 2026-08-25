<p align="center">
  <img src="apps/admin/public/logo.png" alt="Kagin" width="96" height="96">
</p>

# Kagin

[English](README.md) · [中文](README_zh.md)

在 Cloudflare 上运行的 App 许可证密钥平台：签发、校验、心跳、浮动席位、特性令牌。

托管 SaaS 用邮箱注册 workspace，并可用 Stripe 订阅。自托管同一套代码，用外部 Admin JWT，不接 Stripe。

技术栈：Hono API、TanStack 管理端、TypeScript SDK。运行时是 Workers、D1、KV、Durable Objects。

源码按 [PolyForm Noncommercial 1.0.0](LICENSE) 授权。商业使用需要单独许可。

## 文档

| 文档 | 内容 |
| --- | --- |
| [文档索引](docs/README.md) | 全部分类 |
| [产品概览](docs/product/overview.md) | 已验证行为 |
| [许可证域](docs/product/licensing.md) | API 与策略 |
| [部署](docs/DEPLOY.md) | 自托管到 Cloudflare |
| [安全](docs/SECURITY.md) | 漏洞与密钥 |
| [ADR](docs/decisions/README.md) | 架构决策 |
| [SDK](packages/sdk/README.zh.md) | 客户端 |

## 结构

```text
apps/worker/    Hono API 与 LicenseDO
apps/admin/     TanStack 管理端
packages/sdk/   TypeScript 客户端
examples/ts/    集成示例
```

## 本地开发

```bash
pnpm install
pnpm dev:worker    # http://127.0.0.1:8787
pnpm dev:admin     # http://127.0.0.1:5173，API 代理到 worker
```

本地 Admin 用邮箱注册或登录即可。自托管 JWT：

```bash
cd apps/worker && pnpm exec tsx scripts/gen-admin-jwt.ts
```

环境变量模板：仓库根的 `.dev.vars.example`。复制为 `.dev.vars`，不要提交真实值。

## 验证

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm verify      # wrangler dev、API 冒烟、SDK 示例
```

生产部署见 [docs/DEPLOY.md](docs/DEPLOY.md)。
