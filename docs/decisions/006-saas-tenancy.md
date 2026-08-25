# ADR-006: SaaS 多租户与邮箱登录

Status: accepted

## Context

产品目标包含托管 SaaS：多个客户 workspace 共用一套部署，控制台需邮箱登录而非粘贴 JWT。v1 已有 BYO JWT（`ADMIN_JWT_PUBLIC_JWK`）用于自托管与 CI。

## Decision

### 租户模型

- `organizations` + `users` + `org_members`（注册时创建 workspace，用户为 `owner`）
- 业务表 `products`、`licenses`、`policies` 增加 `org_id`；`products` 主键为 `(org_id, product_id)`
- 迁移将历史数据归入 `org_id = 'legacy'`

### 认证

- SaaS 会话：服务端 session，存 D1（见 [ADR-007](007-server-side-sessions.md)；原为 HS256 JWT）
- 路由：`POST /admin/v1/auth/signup`、`/auth/login`；`GET /admin/v1/auth/me`（需 Bearer）
- 保留 RS256 外部 JWT：无 SaaS token 时回退 `ADMIN_JWT_PUBLIC_JWK`，`org_id = legacy`

### 密码

- PBKDF2-SHA256，120k iterations，随机 salt，存于 `users.password_hash`

### 公共 API

- `license_key` 仍全局唯一；心跳/feature token 通过 license 行取 `org_id`
- `GET /v1/policy` 可选 `org_slug` 查询参数以区分同名 `product_id`

## Alternatives

- 仅 OAuth（Google/GitHub）：减少密码运维，但自托管与 SaaS 双模式需更多配置
- 每租户独立 D1：隔离更强，运维与成本更高

## Verification

`pnpm verify`：signup → admin CRUD → 公共 API 冒烟；`pnpm test` 覆盖未配置 SaaS 时 signup 503。
