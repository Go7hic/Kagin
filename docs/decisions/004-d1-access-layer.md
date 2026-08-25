# ADR-004: D1 访问层 — 参数化 prepared statements

Status: accepted

## Context

阶段 1 需选择 D1 访问方式：Drizzle ORM、Kysely 或原生 prepared statements。

## Decision

使用 `apps/worker/src/db.ts` 集中封装 **D1 prepared statements**，不引入 ORM。

## Alternatives

- Drizzle：类型更好，但增加依赖与迁移工具链
- 分散 SQL：难维护

## Consequences

- 收益：零额外依赖、与 LicenseEye  SQL 对齐、Workers 冷启动更小
- 成本：行类型手动维护

## Verification

迁移 apply 成功；CRUD 集成路径通过 worker 路由验证。
