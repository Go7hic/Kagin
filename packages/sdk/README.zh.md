# Kagin SDK

TypeScript 客户端，用于 Kagin 许可证 API。

```ts
import { KaginClient } from "@kagin/sdk";
const client = new KaginClient("http://127.0.0.1:8787");
await client.heartbeat(licenseKey, "s1", "m1");
```
