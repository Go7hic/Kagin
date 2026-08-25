export const enDocs = {
  title: "Documentation",
  subtitle: "How to issue licenses, sell them on your site, and activate them in your app.",
  nav: {
    quickstart: "Quick start",
    console: "Console",
    schemaPolicy: "Schema & policies",
    licensing: "How licensing works",
    developers: "Sell & issue keys",
    clientApps: "Activate in your app",
    sdk: "TypeScript SDK",
    api: "API reference",
    deploy: "Self-host & deploy",
  },
  quickstart: {
    title: "Quick start",
    lede: "Create a product, issue a license key, and unlock your app — in a few minutes.",
    steps: [
      {
        title: "Sign in to the console",
        body: "Open Console and sign in with your workspace email. This is where you manage products and license keys.",
      },
      {
        title: "Create a product",
        body: "Go to Products, enter an ID (for example my-app) and a display name, then create. Each product is one app or service you sell.",
      },
      {
        title: "Generate a signing keypair",
        body: "In the product list, click Generate keypair. You need this if your app verifies signed feature tokens offline.",
      },
      {
        title: "Issue a license key",
        body: "Go to Licenses. Choose the product, pick a type (buy once, subscription, or floating seats), set how many devices and concurrent seats you allow, and optionally bind a buyer account (email or phone). Copy the key and send it to your customer.",
      },
      {
        title: "Activate in your app",
        body: "Your app calls the public activate API with the license key, a stable device ID, and the buyer account if you bound one. After that, optional heartbeats can check for revoke and policy updates.",
      },
    ],
    verifyTitle: "What success looks like",
    verifyBody: "The customer receives a key, enters it in your app, activation succeeds, and the licensed features unlock. You can see the bound device under Licenses → Devices.",
  },
  console: {
    title: "Console",
    lede: "A short tour of each screen in the admin console.",
    items: [
      {
        title: "Overview",
        body: "Service health, how many products and licenses you have, recent sessions, and shortcuts to common tasks.",
      },
      {
        title: "Products",
        body: "Register each app you sell. Optionally set a feature schema (for Pro / feature flags) and generate signing keys for offline token checks. See Schema & policies for details.",
      },
      {
        title: "Licenses",
        body: "Issue and revoke keys. Set device limits and concurrent seats. Bind a buyer email or phone. View or unbind activated devices.",
      },
      {
        title: "Policies",
        body: "Rules your app should follow after activation — for example how many days it may stay offline. See Schema & policies for details.",
      },
      {
        title: "Sessions",
        body: "Live client check-ins. Kick a session to free a floating seat right away.",
      },
      {
        title: "API keys",
        body: "Server secrets for your website or payment webhooks. Never put them inside a desktop or mobile app. Create and revoke keys only while signed in to the console.",
      },
    ],
  },
  schemaPolicy: {
    title: "Schema & policies",
    lede: "Two optional tools. Schema describes which features a license can carry. Policies tell your app how to behave after activation (for example offline grace).",
    whenTitle: "Do I need them?",
    whenRows: [
      ["Buy-once app, key only unlocks the whole product", "Schema: no", "Policy: optional (set offline days if you want periodic online checks)"],
      ["Same key, different plans (Basic / Pro) or feature flags", "Schema: yes", "Policy: as needed"],
      ["Must be able to revoke or force re-check online", "Schema: optional", "Policy: yes — set offline days and heartbeat expectations"],
    ],
    whenHeaders: ["Your product", "Feature schema", "Policy"],
    schemaTitle: "Feature schema",
    schemaBody:
      "Defined on a Product. It lists allowed feature fields and types (string, number, boolean). When you issue feature tokens or attach features to a license, Kagin checks them against this schema so junk fields cannot slip in.",
    schemaExampleTitle: "Example schema",
    schemaExample: `{
  "properties": {
    "tier": "string",
    "export": "boolean"
  },
  "required": ["tier"]
}`,
    schemaNotes: [
      "Leave it empty if activation only means “this app is unlocked”.",
      "Use it when one product sells multiple tiers or toggles (export, cloud sync, seats inside the app, and so on).",
      "Generate a product keypair if the app verifies signed feature tokens offline.",
    ],
    policyTitle: "Policies",
    policyBody:
      "A JSON object returned to the client on activate and heartbeat. Your app reads it and decides what to allow — Kagin does not forcibly lock the machine by itself for offline days; the client should enforce the rules.",
    policyExampleTitle: "Example policy",
    policyExample: `{
  "max_offline_days": 7,
  "require_heartbeat": true
}`,
    policyFieldsTitle: "Common fields",
    policyFields: [
      ["max_offline_days", "How many days the app may run without a successful online check. After that, require network again."],
      ["require_heartbeat", "Whether the app should periodically call heartbeat (for revoke detection and fresh policy)."],
    ],
    policyNotes: [
      "Publish a global policy under Console → Policies. It applies to all products unless you add product-specific overrides later.",
      "For a mostly offline buy-once desktop app, use a larger max_offline_days or turn require_heartbeat off.",
      "For SaaS-like control, keep a shorter offline window and have the app heartbeat on launch.",
    ],
    vsTitle: "How this fits with licenses",
    vsItems: [
      "License key + device limit + buyer account → who can activate and on which machines (server-enforced).",
      "Policy → how the app should behave after activation (client-enforced using server-provided settings).",
      "Schema → shape of optional feature payloads when you sell tiers or flags.",
    ],
  },
  licensing: {
    title: "How licensing works",
    lede: "Kagin separates who bought the key, which devices may use it, and how many people can be online at once. You can use each layer alone or together.",
    matrixTitle: "Settings at a glance",
    matrixHeaders: ["Setting", "What customers do", "What Kagin enforces"],
    matrixRows: [
      ["Device limit = 0", "No one-time device bind required", "No cap on distinct devices"],
      ["Device limit = 1 or 2", "Activate once per device", "Extra devices are rejected"],
      ["Seat limit = 0 (non-floating)", "Heartbeat optional", "No concurrent-user cap"],
      ["Seat limit > 0 or floating type", "App holds a seat via heartbeat", "Too many online users get rejected"],
      ["Buyer account set", "Activate with the same email or phone", "Wrong account is rejected"],
    ],
    flowTitle: "Common setups",
    flows: [
      {
        title: "Buy once, one computer",
        body: "Best for desktop apps sold as a one-time purchase. Device limit 1, seat limit 0, optionally bind the buyer’s email or phone. Customer activates once on that machine.",
      },
      {
        title: "Two devices",
        body: "Same as above with device limit 2 — for example home and work machines. A third machine cannot activate until you unbind one.",
      },
      {
        title: "Team floating seats",
        body: "Best for online tools sold by concurrent users. Device limit 0, seat limit N (or floating type). Clients check in to occupy a seat; when someone leaves, a seat frees up.",
      },
    ],
    adminTitle: "Day-to-day operations",
    adminItems: [
      "Licenses → Devices: see which machines are bound; unbind to free a slot for a replacement device.",
      "Sessions: see live check-ins; kick to free a floating seat.",
      "Revoke: immediately invalidates a key for every device.",
    ],
  },
  developers: {
    title: "Sell & issue keys",
    lede: "After a customer pays on your website, your server creates a license key through Kagin and delivers it to them.",
    flowTitle: "Recommended purchase flow",
    flowSteps: [
      "Customer completes checkout on your site (any payment provider).",
      "Your server (or payment webhook) calls POST /admin/v1/licenses with an API key.",
      "Pass the buyer email or phone as customer_identity if you want activation to require that account.",
      "Show or email the returned license_key to the customer.",
      "The customer activates inside your app via the public activate API — no API key in the app.",
    ],
    keysTitle: "API keys",
    keysBody: "In the console open API keys → Create key. Copy the secret (starts with kagin_sk_live_) into your server environment, for example KAGIN_API_KEY. Send it as: Authorization: Bearer <your-api-key>.",
    keysNotes: [
      "The full secret is shown only once when you create it.",
      "Use API keys to issue and revoke licenses and to manage products and sessions from your backend.",
      "API keys cannot create or revoke other API keys — sign in to the console for that.",
      "If a key leaks, revoke it immediately and create a new one.",
    ],
    webhookTitle: "Example: create a key after payment",
    webhookCode: `// Node.js — after payment succeeds
const res = await fetch("https://api.example.com/admin/v1/licenses", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    authorization: "Bearer " + process.env.KAGIN_API_KEY,
  },
  body: JSON.stringify({
    product_id: "my-app",
    type: "perpetual",
    expires_at: Math.floor(Date.now() / 1000) + 86400 * 365 * 10,
    machine_limit: 1,
    seat_limit: 0,
    customer_identity: order.buyer_email,
  }),
});
const { license_key } = await res.json();
// Email or show license_key to the customer`,
    manualTitle: "Manual issuance",
    manualBody: "For private sales, gift keys, or support replacements, create licenses in Console → Licenses. Customers still activate the same way in your app.",
    errorsTitle: "Common errors",
    errorRows: [
      ["401 unauthorized", "Missing or invalid API key / login token"],
      ["403 session_required", "An API key tried to manage other API keys"],
      ["404 product_not_found", "product_id is not in your workspace"],
      ["403 identity_mismatch", "Activate used a different account than the one bound to the key"],
    ],
  },
  clientApps: {
    title: "Activate in your app",
    lede: "Desktop and mobile apps talk to the public /v1 API. Do not embed API keys or admin tokens in the client.",
    desktopTitle: "Typical desktop buy-once flow",
    desktopSteps: [
      "Issue the license with device limit 1 (or 2), and optionally bind the buyer email or phone.",
      "In your UI, ask for the license key and — if bound — the same account used at purchase.",
      "Call POST /v1/activate with license_key, a stable machine_id, and identity when required.",
      "Store machine_id securely (for example Keychain on Mac) and reuse it later.",
      "Optionally call heartbeat on launch to pick up revokes and policy changes.",
    ],
    activateTitle: "Activate request",
    activateCode: `POST /v1/activate
{
  "license_key": "your-license-key",
  "machine_id": "stable-device-id",
  "identity": "buyer@example.com"
}`,
    activateErrorsTitle: "Activate errors",
    activateErrors: [
      "identity_required — this key is bound to an account, but identity was missing",
      "identity_mismatch — email or phone does not match the purchase account",
      "machine_limit_exceeded — too many devices already activated",
      "machine_not_activated — called heartbeat before activate when a device limit is set",
      "license_expired / license_not_active — key expired or was revoked",
    ],
    machineIdTitle: "Device ID (machine_id)",
    machineIdBody: "Create one stable ID per device and store it securely. On Mac, a hardware UUID or a random UUID saved to Keychain both work. Reusing the same ID keeps reactivation on the same machine reliable.",
    noSecretTitle: "Security reminder",
    noSecretBody: "Never ship your Kagin API key or admin login token inside the app. Clients only need the customer’s license key and, when required, their account (email or phone).",
  },
  sdk: {
    title: "TypeScript SDK",
    lede: "Optional helper for Node or web clients: activate, heartbeat, and feature tokens.",
    install: "Install",
    installCode: "pnpm add @kagin/sdk",
    exampleTitle: "Minimal example",
    exampleCode: `import { KaginClient } from "@kagin/sdk";

const client = new KaginClient("https://your-api.example.com");

await client.activate("your-license-key", "machine-abc", "buyer@example.com");

const hb = await client.heartbeat(
  "your-license-key",
  crypto.randomUUID(),
  "machine-abc",
);

console.log(hb.state, hb.server_time);`,
    notes: [
      "Call activate once per device when the license has a device limit greater than zero.",
      "Reuse the same session_id on every heartbeat for that machine.",
      "Persist last_seen_server_time (StorageAdapter helps) to detect clock rollback.",
      "Floating seats return HTTP 429 when the concurrent limit is full.",
    ],
  },
  api: {
    title: "API reference",
    lede: "Public routes under /v1 (for apps). Admin routes under /admin/v1 (for your server and console).",
    publicTitle: "Public API (apps)",
    adminTitle: "Admin API (server)",
    tableHeaders: ["Method", "Path", "Description"] as [string, string, string],
    errorHeaders: ["Error", "Meaning"] as [string, string],
    publicRows: [
      ["GET", "/health", "Service health"],
      ["GET", "/v1/server-time", "Signed server time"],
      ["GET", "/v1/policy", "Merged policy (optional product_id)"],
      ["POST", "/v1/activate", "Activate / bind a device"],
      ["POST", "/v1/heartbeat", "Session check-in / renew"],
      ["POST", "/v1/feature-token", "Issue a signed feature token"],
      ["POST", "/v1/ephemeral-token", "Short-lived machine token"],
    ],
    adminRows: [
      ["POST", "/admin/v1/auth/signup", "Create workspace account"],
      ["POST", "/admin/v1/auth/login", "Sign in"],
      ["GET", "/admin/v1/products", "List products"],
      ["POST", "/admin/v1/licenses", "Create a license key"],
      ["GET/POST", "/admin/v1/api-keys", "List / create API keys (console session only)"],
      ["POST", "/admin/v1/api-keys/:id/revoke", "Revoke an API key (console session only)"],
      ["GET", "/admin/v1/licenses/:key/activations", "List activated devices"],
      ["DELETE", "/admin/v1/licenses/:key/activations/:machine_id", "Unbind a device"],
      ["POST", "/admin/v1/licenses/bulk", "CSV bulk import"],
      ["GET", "/admin/v1/sessions", "Recent sessions"],
      ["POST", "/admin/v1/policies", "Publish a global policy"],
    ],
    authNote: "Admin routes need Authorization: Bearer <API key or console session token>. API keys cannot manage other API keys.",
  },
  deploy: {
    title: "Self-host & deploy",
    lede: "If you run Kagin yourself on Cloudflare Workers. Hosted workspaces can skip this page.",
    localTitle: "Local development",
    localCode: `pnpm install
pnpm dev:worker    # API + console assets on :8787
pnpm dev:admin     # Vite console on :5173`,
    secretsTitle: "Required secrets",
    secrets: [
      "ADMIN_JWT_PUBLIC_JWK — optional, self-hosted admin JWT",
      "STRIPE_SECRET_KEY / STRIPE_PRICE_ID / STRIPE_WEBHOOK_SECRET — optional hosted billing",
      "CONTACT_EMAIL — optional, pricing page contact for commercial self-host",
    ],
    buildTitle: "Production build",
    buildCode: `pnpm install
pnpm deploy
pnpm verify`,
  },
};

export type DocsContent = typeof enDocs;
