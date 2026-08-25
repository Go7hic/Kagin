# ADR-005: Admin UI JWT 存储

Status: accepted

## Context

管理端需携带 Admin JWT 调用 `/admin/v1/*`。需在浏览器中持久登录态，同时避免不必要的 XSS 暴露面。

## Decision

- JWT 存于 **`sessionStorage`**（`kagin_admin_token` 键），tab 关闭即清除
- 不使用 `localStorage`（降低跨会话泄露面）
- 不使用 httpOnly cookie（v1 无同源 BFF；SPA 直连 Worker API）
- 登出：清除 sessionStorage 并刷新页面

## Alternatives

- localStorage：跨会话方便，但 XSS 后持久化风险更高
- Cookie + BFF：更安全，但需额外服务端会话层

## Verification

Admin 登录后刷新同 tab 仍可用；关闭 tab 后需重新登录。
