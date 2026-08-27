# 许可证域

许可证、会话、令牌与策略在客户端和运营侧的可观察行为。计费边界见 [产品概览](overview.md)。

## 公共 API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/health` | 服务健康 |
| GET | `/v1/meta` | 托管价格、产品上限、是否启用 Stripe |
| GET | `/v1/server-time` | `server_time`。带 `product_id`（SaaS 下还要 `org_slug`）时附 Ed25519 签名 |
| GET | `/v1/policy?product_id=&org_slug=` | 合并后的 policy。SaaS 下同名 product 需要 `org_slug` |
| POST | `/v1/activate` | 设备绑定（`machine_limit > 0` 时必填）。许可证绑了账号时要传 `identity` |
| GET | `/v1/activations?license_key=&identity=` | 列出已绑定设备（绑了账号时要传 `identity`） |
| POST | `/v1/deactivate` | 解绑设备。绑了账号时要传 `identity`。解绑后可在新设备上 `/activate` |
| POST | `/v1/heartbeat` | 会话续期。浮动或有席位时走 LicenseDO |
| POST | `/v1/feature-token` | 只签发 `license.features` 内的权限。载荷含 `exp` |
| POST | `/v1/ephemeral-token` | 短期机器绑定令牌 |
| POST | `/v1/stripe/webhook` | Stripe 签名校验。事件：checkout 完成、订阅更新、订阅删除 |

## 管理 API（`/admin/v1/*`）

免 Bearer：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/admin/v1/auth/signup` | 邮箱、密码、workspace 名 → session |
| POST | `/admin/v1/auth/login` | 邮箱、密码 → session |

需要 Bearer（API key `kagin_sk_live_…`、SaaS session 或自托管 Admin JWT）：

| 资源 | 操作 |
| --- | --- |
| `auth/logout` | POST。作废当前 session |
| `auth/me` | GET |
| `products` | GET、POST、DELETE；`POST :id/keypair`；`PUT :id/features` |
| `licenses` | GET、POST；`GET :key`；`POST :key/revoke`；`GET :key/sessions`；`GET :key/activations`；`DELETE :key/activations/:machine_id`；`POST :key/kick`；`POST bulk`（CSV） |
| `api_keys` | GET、POST；`POST :id/revoke`（仅 session。API key 不能管其他 key） |
| `sessions` | GET（最近 500 条） |
| `policies` | GET、POST |
| `billing/checkout` | POST。托管 Stripe Checkout |
| `billing/portal` | POST。托管 Customer Portal |

## 授权模式（可同时启用）

| 配置 | 客户端 | 服务端 |
| --- | --- | --- |
| `machine_limit = 0` | 无需 `/activate` | 不限制设备数 |
| `machine_limit = 1/2/…` | 每台设备 `POST /v1/activate` 一次 | 超限或未激活 → 403 |
| `seat_limit = 0` 且非 floating | heartbeat 可选 | 无并发席位 cap |
| `seat_limit > 0` 或 `type=floating` | heartbeat 占席位 | 满席 → 429 |
| 两者都设 | 先 activate，再按 policy heartbeat | 设备绑定 + 并发席位 |
| `customer_identity` 已设 | activate 时传 `identity`（邮箱/手机号等） | 不匹配 → `identity_mismatch` |

### License 类型与席位

- `perpetual` / `subscription` / `floating`
- `perpetual` 无需提交 `expires_at`，服务端不会按到期时间拒绝；另外两种类型必须提交未来的 `expires_at`
- 自动发码应提交稳定且租户内唯一的 `external_reference`（例如 `stripe:<checkout_session_id>`）；相同请求重试返回原 `license_key`，参数冲突返回 `external_reference_conflict`
- `seat_limit > 0` 或 `type=floating` 时心跳经 LicenseDO 计数
- `seat_limit=0` 且无浮动：跳过 DO，仍写 D1 session 与指纹
- `machine_limit > 0`：heartbeat / feature-token / ephemeral-token 需已激活的 `machine_id`

### 状态机

`active → grace → restricted → revoked`（由 `risk_score` 阈值驱动）

## 数据表

- `0001_init.sql`：`products`、`licenses`、`sessions`、`ephemeral_tokens`、`feature_tokens`、`policies`、`fingerprints`
- `0002_saas.sql`：`organizations`、`users`、`org_members`
- `0003_license_activations.sql`：`license_activations`
- `0004_license_customer_identity.sql`：`licenses.customer_identity`
- `0005_api_keys.sql`：`api_keys`
- `0006_billing.sql`：组织上的 Stripe 字段
- `0007_admin_sessions.sql`：`admin_sessions`
- `0008_stripe_unique.sql`：Stripe customer 和 subscription 唯一索引

## 失败与边界

见 [产品概览](overview.md)。

- 浮动许可证第 N+1 个并发 session 返回 429（`pnpm verify` 覆盖）
- 设备绑定许可证第 N+1 台设备 `/activate` 返回 403（`machine_limit_exceeded`）
- 未激活设备调用 heartbeat 返回 403（`machine_not_activated`）

## 怎么验收

- `pnpm verify`：Admin CRUD、heartbeat 席位、设备 activate、tokens、kick
- `examples/ts/check_license.ts`，环境变量 `KAGIN_LICENSE_KEY`

## 相关决策

[ADR-003](../decisions/003-license-cryptography.md) · [ADR-004](../decisions/004-d1-access-layer.md) · [ADR-007](../decisions/007-server-side-sessions.md) · [ADR-008](../decisions/008-ed25519-server-time.md)
