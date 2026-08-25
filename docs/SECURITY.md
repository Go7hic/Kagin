# 安全

## 报告漏洞

不要为安全漏洞开公开 GitHub Issue。用 GitHub Security Advisories，或私下联系维护者。报告里写清现象、复现步骤、影响，有修复建议也一并附上。

## 不要提交这些

- `ADMIN_JWT_PUBLIC_JWK`
- `STRIPE_SECRET_KEY`、`STRIPE_PRICE_ID`、`STRIPE_WEBHOOK_SECRET`
- License key、API token
- Product Ed25519 私钥

本地用 `apps/worker/.dev.vars`（已 gitignore）。生产用 Wrangler secret 或 Dashboard 的 Variables and Secrets。步骤见 [部署](DEPLOY.md)。

## 运营

- 给 Admin API 加限流，并在 Cloudflare 控制台开 WAF
- 定期轮换 JWT 公钥和 product Ed25519 密钥对
- 盯异常心跳和风险分飙升
- 给 D1 做备份

## SDK

- 校验 server-time 签名和 feature token
- 安全存放 license key
- 跟着仓库更新 SDK

威胁模型见 [ADR-003](decisions/003-license-cryptography.md)。
