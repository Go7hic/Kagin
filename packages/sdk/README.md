# Kagin SDK

TypeScript client for Kagin license API.

## Install

```bash
npm install @kagin/sdk
```

## Usage

```ts
import { KaginClient } from "@kagin/sdk";

const client = new KaginClient("https://your-worker.example.com");

const hb = await client.heartbeat("LICENSE_KEY", "session-1", "machine-1");
const ft = await client.issueFeatureToken("LICENSE_KEY", { pro: true });
const policy = await client.getPolicy();
```

See `examples/ts/check_license.ts`.
