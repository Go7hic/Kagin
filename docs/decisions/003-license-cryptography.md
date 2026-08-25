# ADR-003: 密码学与令牌模型

Status: accepted

## Context

客户端需离线或低延迟校验特性授权；需防时间回滚与伪造。LicenseEye 采用 Ed25519 feature token、HMAC server-time、机器指纹与风险分。需在 Kagin 明确算法选择与密钥存放位置。

> 2026-08 修订：server time 原定的 HMAC 方案已改为 Ed25519，见下文与 ADR-008。

## Decision

### Feature token

- 算法：**Ed25519**（Web Crypto `sign` / `verify`）
- 每 product 一对密钥；`private_jwk` 存 D1（仅 Worker 读）；`public_jwk` 给 SDK 与 examples
- Payload JSON 字段：`license_key`, `features`, `server_time`, `exp`, 可选 `quota`
- 支持 `kid` 字段便于未来轮换（v1 生成时写入固定 kid）

### Server time

- 用签发方 product 的 **Ed25519 私钥**签名，客户端用已内嵌的 `public_jwk` 验签（见 ADR-008）
- `activate` / `heartbeat` 响应签 `{ issued_at, expires_at, server_time }`
- `GET /v1/server-time?product_id=&org_slug=` 签 `{ server_time }`；不带 `product_id` 时返回未签名时间

### Ephemeral token

- 随机 `token_id`，存 D1；绑定 `machine_id` + `ttl`；不签名链外泄

### Admin 认证

- 外部 IdP 或自签 JWT；Worker 仅持 **公钥 JWK**（`ADMIN_JWT_PUBLIC_JWK`）验证
- 不实现 OAuth 服务器 v1

### 风险与指纹

- 服务端聚合指标写 `fingerprints`；阈值驱动 `licenses.state` 迁移
- 具体阈值 v1 默认常量，后续可 policy 化

## Alternatives

### RSA feature token

更常见但密钥更大、验证更慢；Ed25519 在 Workers 原生支持良好。**拒绝。**

### 仅 HMAC license key 作为 bearer

无 per-feature 离线授权，易重放。**拒绝。**

### 私钥存 KV 而非 D1

KV 适合缓存，D1 适合与 product 行同事务读写；私钥更新频率低。**拒绝 KV 作主存。**

## Consequences

- 收益：与 LicenseEye SDK 概念兼容，examples 可对照迁移
- 成本：私钥在 D1 需访问控制与备份策略；轮换需 Admin 流程
- 合规：指纹与 IP/国家收集需在运营文档披露（GDPR）

## Verification

- SDK `verifyFeatureToken` 对合法/篡改 token 分别 pass/fail
- 修改系统时钟模拟 `time_anomaly` 触发风险更新

## Revisit when

- 需要硬件绑定或 TEE attestation
- 多 region 密钥轮换自动化
