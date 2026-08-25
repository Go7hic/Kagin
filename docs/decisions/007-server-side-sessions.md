# ADR-007: 控制台会话存 D1

Status: accepted

Supersedes: ADR-006 的「SaaS 会话」部分

## Context

控制台登录态原本是 HS256 无状态 JWT，签名密钥来自 `SAAS_SESSION_SECRET`。这带来两个问题：

- 部署前必须手动配一个密钥，否则注册登录直接 `503`
- token 签发后无法吊销，退出登录只是清掉浏览器里的副本，服务端仍认这张票直到 7 天过期

API 密钥（ADR 未单列）已经在用「随机 token + 只存哈希 + 每次查库」的模型，会话没有理由不同。

## Decision

- 会话行存 D1 `admin_sessions`：`session_id`、`org_id`、`user_id`、`prefix`、`token_hash`、`expires_at`、`revoked_at`
- token 形如 `kagin_sess_<32 随机字符>`，明文只回给客户端一次；库里只留 SHA-256 哈希
- 按 `prefix`（前 19 字符）走唯一索引定位，再做常数时间哈希比对
- `email` 与 `role` 每次从 `users` / `org_members` 实时读取，不写进 token
- 有效期 7 天；`POST /admin/v1/auth/logout` 置 `revoked_at`，立即失效
- 登录时顺带清理该用户已过期或已吊销的会话行
- 不再需要 `SAAS_SESSION_SECRET`

## Alternatives

- 保留 JWT，密钥首次运行写入 KV：省掉手动配置，但仍无法吊销
- httpOnly cookie：需要同源 BFF，SPA 直连 Worker 的结构下不适用（见 ADR-005）

## Consequences

每个管理请求多一次 D1 读取。控制台页面本就在查 D1，这点开销可接受，换来的是可吊销和无部署密钥。

## Verification

`pnpm verify` 覆盖：logout 后携带同一 token 请求 `/admin/v1/auth/me` 返回 `401`。
