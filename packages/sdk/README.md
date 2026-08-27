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

await client.activate("LICENSE_KEY", "machine-1", "buyer@example.com");

// List bound devices, unbind old machine, activate on new machine
const devices = await client.listActivations("LICENSE_KEY", "buyer@example.com");
await client.deactivate("LICENSE_KEY", "old-machine-id", "buyer@example.com");
await client.activate("LICENSE_KEY", "new-machine-id", "buyer@example.com");

const hb = await client.heartbeat("LICENSE_KEY", "session-1", "machine-1");
const ft = await client.issueFeatureToken("LICENSE_KEY", { pro: true });
const policy = await client.getPolicy();
```

See `examples/ts/check_license.ts`.
