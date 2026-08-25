import { KaginClient } from "../../packages/sdk/src/index.ts";

async function main() {
  const base = process.env.KAGIN_BASE || "http://127.0.0.1:8787";
  const licenseKey = process.env.KAGIN_LICENSE_KEY || "";
  if (!licenseKey) {
    console.error("Set KAGIN_LICENSE_KEY");
    process.exit(1);
  }
  const client = new KaginClient(base);
  const hb = await client.heartbeat(licenseKey, "example-session", "example-machine");
  console.log("heartbeat:", hb.state, hb.server_time);
  const policy = await client.getPolicy();
  console.log("policy:", policy);
  const ft = await client.issueFeatureToken(licenseKey, { tier: "pro" });
  console.log("feature token server_time:", ft.server_time);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
