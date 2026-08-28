# 产品概览

Kagin 管理 App 许可证密钥的完整生命周期：产品、签发、设备绑定、客户端校验、心跳、浮动席位、特性令牌、策略。同一套代码支持托管 SaaS 和自托管。

## 角色

| 角色 | 能力 |
| --- | --- |
| 运营者（Admin） | 邮箱注册或登录 workspace；或自托管下粘贴 Admin JWT。管理本 workspace 的产品、许可证、策略、CSV 导入、会话审计与 kick；在控制台查看/解绑/手动绑定设备。托管模式下可订阅 Stripe。 |
| 客户端（SDK） | activate / deactivate / listActivations、心跳、feature token、ephemeral token、server-time、policy |
| 系统 | Ed25519 签发 feature token；LicenseDO 浮动席位；D1 多租户 |

## 已验证旅程

1. SaaS：注册 workspace（邮箱、密码、组织名），登录拿到 session。
2. 创建 Product；需要离线验签时再生成 Ed25519 keypair（可选）。
3. 创建或 CSV 导入 License，归属当前 `org_id`。支付回调用 `external_reference` 保证发码幂等。
4. 客户端 `activate` 绑定设备（`machine_limit > 0` 时）；换机时 `deactivate` 后再 `activate`，或由管理员在控制台解绑/绑定。
5. SDK `heartbeat`，再 `issueFeatureToken`。
6. `floating` 且设了 `seat_limit`：席位满时 `429`。
7. 指纹聚合驱动 `state` 迁移。

托管计费配了 Stripe 之后：定价 $5 / 月，每个 workspace 最多 5 个产品。未付费不能再创建产品（`402`）。已签发的许可证继续可用，直到被吊销。取消订阅在周期结束前仍算已付费。

## Admin 认证

| 模式 | 条件 | 控制台 |
| --- | --- | --- |
| SaaS | 默认可用。session 存在 D1 | 邮箱登录或注册 |
| 自托管 | `ADMIN_JWT_PUBLIC_JWK` | 折叠区粘贴 Bearer JWT（`org_id = legacy`） |

配了 Stripe 密钥后，自托管 JWT 登录返回 `403 legacy_disabled`。两条路径不要同时开。

API：`POST /admin/v1/auth/signup`、`/auth/login`、`/auth/logout`；`GET /admin/v1/auth/me`。

## 失败与边界

- `invalid_license`、`license_not_active`、`license_expired`：4xx JSON `{ error }`（`perpetual` 不按到期拒绝）
- 席位满：`429`，`no_seats`
- 设备超限：`403 machine_limit_exceeded`；未激活：`403 machine_not_activated`
- 账号绑定不匹配：`400 identity_required` / `403 identity_mismatch`
- 发码 `external_reference` 参数冲突：`409 external_reference_conflict`
- Admin 无 token 或 token 无效：`401 unauthorized`
- 邮箱已注册：`409 email_taken`；密码错误：`401 invalid_credentials`
- 跨租户访问 license 或 product：`404 not_found`
- 托管未付费还要创建产品：`402 payment_required`
- 已付费但产品数达到上限：`403 product_limit`
- Stripe 未配置时调 Checkout 或 Portal：`503 stripe_not_configured`

## 当前范围

**在范围内。** 单 workspace 注册、owner、租户隔离、托管 Stripe 订阅（5 个产品上限）、设备自助解绑换机、发码幂等。

**不在范围内。** 团队邀请、多 org 切换、Magic link、SSO、复杂 RBAC。Worker 已绑定 Send Email，但尚未内置事务邮件业务流。

## 技术约束

单 Worker，绑定 D1、KV、LicenseDO、Workers Assets、Send Email（`EMAIL`）。

- 公共：`/v1/*`
- 管理：`/admin/v1/*`（session、API key 或自托管 JWT）
- 注册登录：`/admin/v1/auth/*` 免除鉴权

## 怎么验收

```bash
pnpm verify
pnpm test
pnpm dev:worker
```

## 相关决策

[ADR-001](../decisions/001-hono-tanstack-stack.md) · [ADR-002](../decisions/002-cloudflare-bindings.md) · [ADR-003](../decisions/003-license-cryptography.md) · [ADR-005](../decisions/005-admin-jwt-storage.md) · [ADR-006](../decisions/006-saas-tenancy.md) · [ADR-007](../decisions/007-server-side-sessions.md) · [ADR-008](../decisions/008-ed25519-server-time.md)
