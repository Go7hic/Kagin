# SaaS MVP — 多租户与邮箱登录

Status: **complete**

## Goal

托管 SaaS 最小闭环：注册 workspace、邮箱登录、租户数据隔离、保留自托管 JWT 路径。

## Acceptance

- [x] D1 migration `0002_saas.sql`（organizations、users、org_members、org_id 列）
- [x] `POST /admin/v1/auth/signup`、`/auth/login`、`GET /auth/me`
- [x] Admin API 按 `org_id` 隔离 products/licenses/policies/sessions
- [x] 控制台邮箱登录 + 自托管 JWT 折叠入口
- [x] `pnpm verify` 使用 signup 流程
- [x] ADR-006、product overview、DEPLOY 更新

## Out of scope（本阶段）

- Stripe 计费、团队邀请、多 org 切换、Magic link、SSO

## Verification

```bash
pnpm typecheck && pnpm test && pnpm build && pnpm verify
```
