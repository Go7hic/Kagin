# ADR-008: server time 改用 Ed25519 签名

Status: accepted

Supersedes: ADR-003 中的 Server time 小节

## Context

ADR-003 定下 `sig = HMAC-SHA256(SERVER_TIME_SECRET, time)`，由客户端验签防时间回滚。落地后这个设计有三个问题：

1. **客户端无法验签。** HMAC 是对称的，验签方需要同一把密钥，而 `SERVER_TIME_SECRET` 只在 Worker 侧。桌面应用里内嵌共享密钥等于公开它。SDK 因此从未实现验签，收到的 `signature` 直接丢弃。
2. **不配也不报错。** 实现里的回退链是 `env.SERVER_TIME_SECRET || KV.get("server_time_secret") || "dev-secret"`。生产忘配就静默用仓库里写死的 `"dev-secret"` 签名。KV 分支从未被写入过，是死代码。
3. **多一个必须运维的 secret。** 部署清单、轮换流程、本地开发都得带上它，换来的是一个没人校验的字段。

同时 feature token 已经在用每 product 一对的 Ed25519 密钥，SDK 也已经有 `verifyFeatureTokenEd25519`。签名时间完全可以复用这套密钥，无需任何新 secret。

## Decision

- 删除 `SERVER_TIME_SECRET` 与 `signServerTime` 的 HMAC 实现。
- server time 用**签发方 product 的 Ed25519 私钥**签名，客户端用已内嵌的 `public_jwk` 验签。
- 签名载荷（字段顺序即 `JSON.stringify` 顺序，验签方须一致）：
  - `activate` / `heartbeat`：`{ issued_at, expires_at, server_time }`
  - `GET /v1/server-time?product_id=&org_slug=`：`{ server_time }`
- **签名可选。** product 尚未生成密钥对时响应不带 `signature` 字段，而不是失败或降级到弱密钥。SDK 类型相应改为 `signature?: string`。
- `GET /v1/server-time` 不带 `product_id` 时返回未签名时间；`org_slug` 的解析规则与 `/v1/policy` 一致。
- SDK 抽出 `verifyEd25519(payload, signature, publicJWK)`，feature token 与 server time 共用；新增 `verifyServerTimeEd25519`。

顺带修掉一个相邻缺陷：`db.listProducts` 原本 `SELECT *`，把 product 的 `private_jwk` 通过 `GET /admin/v1/products` 返回给了前端。改为显式列出字段，不含私钥。

## Alternatives

### 直接删掉签名字段

防回滚其实已由 SDK 本地的 `last_seen_server_time` 比对承担，签名不是唯一防线。但删字段是公开 API 的破坏性变更，且失去了「服务端时间不可伪造」这一层——中间人可以篡改 `server_time` 把授权续期。**拒绝。**

### 保留 HMAC，仅去掉 `"dev-secret"` 回退

只是把静默失败变成显式失败，客户端依然无法验签。**拒绝。**

### 为 server time 单独一对密钥（而非复用 product 密钥）

多一套密钥的生成、分发、轮换流程，而 server time 的签名边界本就是「这个 product 的授权」，复用语义正确。**拒绝。**

### 让客户端从 API 拉取公钥

公钥经网络下发会被中间人替换，防篡改就失效了。公钥应在构建期内嵌进客户端。**拒绝。**

## Consequences

- 收益：少一个必配 secret；签名首次真正可验证；生产不再可能用公开常量签名。
- 成本：`/v1/server-time` 想拿签名需带 `product_id`；未生成密钥对的 product 拿不到签名。
- 破坏性：`SERVER_TIME_SECRET` 已配置的部署可直接移除该 secret，无需迁移数据。

## Verification

`apps/worker/scripts/verify.sh` 中：

- heartbeat 的 `signature` 用 product `public_jwk` 验签通过
- 把 `server_time` 减 86400 后验签失败（防回滚生效）
- `GET /admin/v1/products` 响应不含 `private_jwk`
- 带 `product_id` + `org_slug` 的 `/v1/server-time` 有 `signature`，不带则无

## Revisit when

- 需要与 product 无关的可信时间源（例如跨 product 的全局配额）
- 密钥轮换期间需要同时接受新旧签名（届时需要 `kid`）
