import type { DocsContent } from "./en";

export const zhDocs: DocsContent = {
  title: "使用文档",
  subtitle: "如何签发激活码、在网站售卖，以及在你的 App 里完成激活。",
  nav: {
    quickstart: "快速开始",
    console: "控制台",
    schemaPolicy: "Schema 与策略",
    licensing: "授权怎么工作",
    developers: "售卖与发码",
    clientApps: "在 App 里激活",
    sdk: "TypeScript SDK",
    api: "API 参考",
    deploy: "自托管与部署",
  },
  quickstart: {
    title: "快速开始",
    lede: "创建产品、签发激活码、在 App 里解锁——几分钟就能跑通。",
    steps: [
      {
        title: "登录控制台",
        body: "打开 Console，用工作区邮箱登录。之后在这里管理产品和激活码。",
      },
      {
        title: "创建产品",
        body: "进入「产品」，填写产品 ID（例如 my-app）和显示名称后创建。每个产品对应你要售卖的一款应用或服务。",
      },
      {
        title: "生成签名密钥对",
        body: "在产品列表点击「生成密钥对」。若 App 需要离线验证功能令牌，需要这对密钥。",
      },
      {
        title: "签发激活码",
        body: "进入「授权」。选择产品，选择类型（永久买断 / 订阅 / 浮动席位），设置设备上限与并发席位，可选绑定购买账号（邮箱或手机）。复制激活码发给用户。",
      },
      {
        title: "在 App 里激活",
        body: "App 调用公开的激活接口，传入激活码、稳定的设备 ID，以及（若已绑定）购买账号。之后可按需用心跳检测吊销与策略更新。",
      },
    ],
    verifyTitle: "怎样算成功",
    verifyBody: "用户收到激活码，在 App 里输入并激活成功，对应功能解锁。你可在「授权 → 设备」看到已绑定的设备。",
  },
  console: {
    title: "控制台",
    lede: "各管理页面的简要说明。",
    items: [
      { title: "概览", body: "服务健康、产品与授权数量、近期会话，以及常用快捷入口。" },
      { title: "产品", body: "登记你要售卖的应用。可选配置功能 Schema（用于 Pro / 功能开关），并生成离线校验用的签名密钥。详见「Schema 与策略」。" },
      { title: "授权", body: "签发与吊销激活码。设置设备上限与并发席位，绑定购买邮箱或手机，查看或解绑已激活设备。" },
      { title: "策略", body: "激活后 App 应遵守的规则，例如最多可离线几天。详见「Schema 与策略」。" },
      { title: "会话", body: "实时在线心跳。踢出会话可立即释放浮动席位。" },
      { title: "API 密钥", body: "给网站或支付回调用的服务端密钥。切勿写入桌面或移动 App。创建与吊销需在控制台登录后操作。" },
    ],
  },
  schemaPolicy: {
    title: "Schema 与策略",
    lede: "两个可选能力。Schema 描述授权可以携带哪些功能字段；策略告诉 App 激活之后该怎么运行（例如离线宽限）。",
    whenTitle: "要不要用？",
    whenHeaders: ["你的产品", "功能 Schema", "策略"],
    whenRows: [
      ["买断软件，激活码只负责整包解锁", "可不配", "可选（若希望定期联网校验，再设离线天数）"],
      ["同一产品有基础版 / Pro 或功能开关", "需要", "按需配置"],
      ["需要吊销或强制联网复核", "可选", "需要 — 设置离线天数与心跳预期"],
    ],
    schemaTitle: "功能 Schema",
    schemaBody:
      "配置在「产品」上。列出允许的功能字段及类型（string、number、boolean）。签发功能令牌或给授权附带功能时，Kagin 会按 Schema 校验，避免乱传字段。",
    schemaExampleTitle: "Schema 示例",
    schemaExample: `{
  "properties": {
    "tier": "string",
    "export": "boolean"
  },
  "required": ["tier"]
}`,
    schemaNotes: [
      "若激活只表示「整款 App 可用」，可以留空。",
      "若同一产品要卖多档或开关（导出、云同步等），再配置 Schema。",
      "若 App 要离线验证带签名的功能令牌，请先为产品生成密钥对。",
    ],
    policyTitle: "策略",
    policyBody:
      "激活与心跳成功时，服务端会把策略 JSON 返回给客户端。App 读取后自行决定是否允许继续使用——离线天数等规则主要由客户端执行，而不是服务端直接锁死本机。",
    policyExampleTitle: "策略示例",
    policyExample: `{
  "max_offline_days": 7,
  "require_heartbeat": true
}`,
    policyFieldsTitle: "常用字段",
    policyFields: [
      ["max_offline_days", "允许连续多少天不成功联网校验；超期后应要求重新联网。"],
      ["require_heartbeat", "App 是否应定期调用 heartbeat（便于感知吊销并刷新策略）。"],
    ],
    policyNotes: [
      "在控制台 → 策略发布全局默认；之后可再为单个产品做覆盖。",
      "偏离线的买断桌面软件，可把 max_offline_days 设大，或关闭 require_heartbeat。",
      "若希望更强的在线管控，缩短离线窗口，并在启动时做 heartbeat。",
    ],
    vsTitle: "和激活码的关系",
    vsItems: [
      "激活码 + 设备上限 + 购买账号 → 谁能激活、在哪台机器用（服务端强制）。",
      "策略 → 激活之后 App 应如何表现（客户端按服务端下发的规则执行）。",
      "Schema → 做功能分级 / 开关时，功能字段长什么样。",
    ],
  },
  licensing: {
    title: "授权怎么工作",
    lede: "Kagin 把「谁买的」「能在几台设备用」「同时能几个人在线」分开配置，可单独用，也可组合。",
    matrixTitle: "设置一览",
    matrixHeaders: ["设置", "用户侧", "系统侧"],
    matrixRows: [
      ["设备上限 = 0", "无需一次性绑设备", "不限制设备数"],
      ["设备上限 = 1 或 2", "每台设备激活一次", "超出设备将被拒绝"],
      ["并发席位 = 0（非浮动）", "心跳可选", "不限制同时在线人数"],
      ["并发席位 > 0 或浮动类型", "App 通过心跳占用席位", "在线人数超限将被拒绝"],
      ["绑定了购买账号", "激活时填写相同邮箱或手机", "账号不一致将被拒绝"],
    ],
    flowTitle: "常见搭配",
    flows: [
      {
        title: "买断，一台电脑",
        body: "适合桌面软件一次性购买。设备上限 1、并发 0，可选绑定买家邮箱或手机。用户在该设备激活一次即可。",
      },
      {
        title: "两台设备",
        body: "设备上限设为 2，例如家里和公司各一台。第三台需先解绑一台才能激活。",
      },
      {
        title: "团队浮动席位",
        body: "适合按同时在线人数售卖的在线工具。设备上限 0、并发席位 N（或浮动类型）。客户端心跳占席位，有人下线后席位释放。",
      },
    ],
    adminTitle: "日常运维",
    adminItems: [
      "授权 → 设备：查看已绑定机器，解绑可为换机腾出名额。",
      "会话：查看实时心跳，踢出可立即释放浮动席位。",
      "吊销：立即让该激活码在所有设备失效。",
    ],
  },
  developers: {
    title: "售卖与发码",
    lede: "用户在网站付款成功后，由你的服务器调用 Kagin 生成激活码并交付给用户。",
    flowTitle: "推荐购买流程",
    flowSteps: [
      "用户在你的网站完成支付（任意支付渠道）。",
      "你的服务器（或支付回调）用 API 密钥调用 POST /admin/v1/licenses。",
      "若希望激活时校验账号，将买家邮箱或手机写入 customer_identity。",
      "把返回的 license_key 展示在订单页或发到邮箱。",
      "用户在 App 内调用公开激活接口完成激活——App 里不要放 API 密钥。",
    ],
    keysTitle: "API 密钥",
    keysBody: "控制台 → API 密钥 → 创建。将密钥（以 kagin_sk_live_ 开头）写入服务器环境变量，例如 KAGIN_API_KEY。请求头：Authorization: Bearer <你的密钥>。",
    keysNotes: [
      "完整密钥仅在创建时显示一次。",
      "可用 API 密钥在后端签发/吊销授权，并管理产品与会话。",
      "API 密钥不能创建或吊销其他 API 密钥——请登录控制台操作。",
      "密钥泄露请立即吊销并重新创建。",
    ],
    webhookTitle: "示例：支付成功后发码",
    webhookCode: `// Node.js — 支付成功后
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
// 将 license_key 发给用户`,
    manualTitle: "手动签发",
    manualBody: "私下交易、赠送或客服补发时，在控制台 → 授权 手动创建即可。用户在 App 里的激活方式相同。",
    errorsTitle: "常见错误",
    errorRows: [
      ["401 unauthorized", "缺少或无效的 API 密钥 / 登录令牌"],
      ["403 session_required", "API 密钥试图管理其他 API 密钥"],
      ["404 product_not_found", "product_id 不在你的工作区中"],
      ["403 identity_mismatch", "激活时账号与购买时绑定的不一致"],
    ],
  },
  clientApps: {
    title: "在 App 里激活",
    lede: "桌面与移动应用调用公开的 /v1 接口。切勿把 API 密钥或管理员令牌写进客户端。",
    desktopTitle: "典型桌面买断流程",
    desktopSteps: [
      "签发时设置设备上限为 1（或 2），可选绑定买家邮箱或手机。",
      "在界面中让用户输入激活码；若已绑定账号，再输入相同邮箱或手机。",
      "调用 POST /v1/activate，传入 license_key、稳定的 machine_id，以及需要的 identity。",
      "将 machine_id 安全保存（例如 Mac 的 Keychain），之后复用。",
      "可选：启动时调用 heartbeat，以便感知吊销与策略变更。",
      "换机时：在旧设备调用 POST /v1/deactivate；若已绑定账号，也可列出设备后远程解绑，再在新设备 activate。",
    ],
    activateTitle: "激活请求",
    activateCode: `POST /v1/activate
{
  "license_key": "your-license-key",
  "machine_id": "stable-device-id",
  "identity": "buyer@example.com"
}`,
    activateErrorsTitle: "激活错误",
    activateErrors: [
      "identity_required — 该码绑定了账号，但未传 identity",
      "identity_mismatch — 邮箱或手机与购买账号不一致",
      "machine_limit_exceeded — 已激活设备数达到上限",
      "machine_not_activated — 设置了设备上限却未先激活就调了 heartbeat",
      "license_expired / license_not_active — 已过期或已吊销",
    ],
    machineIdTitle: "设备 ID（machine_id）",
    machineIdBody: "每台设备生成一个稳定 ID 并安全存储。在 Mac 上可用硬件 UUID，或把随机 UUID 存进 Keychain。同一台机器复用同一 ID，换机再激活更可靠。",
    rebindTitle: "解绑并迁移到新设备",
    rebindBody: "设备数已满时，用户可在 App 内自助释放名额：GET /v1/activations 查看已绑定设备（绑了账号需传 identity），POST /v1/deactivate 解绑指定 machine_id，再在新设备 POST /v1/activate。",
    rebindCode: `GET /v1/activations?license_key=...&identity=buyer@example.com

POST /v1/deactivate
{
  "license_key": "your-license-key",
  "machine_id": "old-device-id",
  "identity": "buyer@example.com"
}

POST /v1/activate
{
  "license_key": "your-license-key",
  "machine_id": "new-device-id",
  "identity": "buyer@example.com"
}`,
    noSecretTitle: "安全提醒",
    noSecretBody: "切勿在 App 内放置 Kagin API 密钥或控制台登录令牌。客户端只需用户的激活码，以及（若需要）其购买账号。",
  },
  sdk: {
    title: "TypeScript SDK",
    lede: "可选的 Node / Web 客户端封装：激活、心跳与功能令牌。",
    install: "安装",
    installCode: "pnpm add @kagin/sdk",
    exampleTitle: "最小示例",
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
      "设备上限大于 0 时，每台设备先调用一次 activate。",
      "同一台机器每次 heartbeat 复用同一个 session_id。",
      "持久化 last_seen_server_time（可用 StorageAdapter）以检测时钟回拨。",
      "浮动席位在并发满时返回 HTTP 429。",
      "可用 listActivations 与 deactivate 让用户自助换机，无需联系客服。",
    ],
  },
  api: {
    title: "API 参考",
    lede: "公开接口在 /v1（给 App）；管理接口在 /admin/v1（给你的服务器与控制台）。",
    publicTitle: "公开 API（App）",
    adminTitle: "管理 API（服务器）",
    tableHeaders: ["方法", "路径", "说明"] as [string, string, string],
    errorHeaders: ["错误", "含义"] as [string, string],
    publicRows: [
      ["GET", "/health", "服务健康"],
      ["GET", "/v1/server-time", "签名服务器时间"],
      ["GET", "/v1/policy", "合并后的策略（可选 product_id）"],
      ["POST", "/v1/activate", "激活 / 绑定设备"],
      ["GET", "/v1/activations", "列出已绑定设备（绑了账号需 identity）"],
      ["POST", "/v1/deactivate", "解绑设备，便于换机"],
      ["POST", "/v1/heartbeat", "会话签到 / 续期"],
      ["POST", "/v1/feature-token", "签发功能令牌"],
      ["POST", "/v1/ephemeral-token", "短期机器令牌"],
    ],
    adminRows: [
      ["POST", "/admin/v1/auth/signup", "注册工作区"],
      ["POST", "/admin/v1/auth/login", "登录"],
      ["GET", "/admin/v1/products", "产品列表"],
      ["POST", "/admin/v1/licenses", "创建激活码"],
      ["GET/POST", "/admin/v1/api-keys", "列出/创建 API 密钥（仅控制台登录）"],
      ["POST", "/admin/v1/api-keys/:id/revoke", "吊销 API 密钥（仅控制台登录）"],
      ["GET", "/admin/v1/licenses/:key/activations", "已激活设备列表"],
      ["DELETE", "/admin/v1/licenses/:key/activations/:machine_id", "解绑设备"],
      ["POST", "/admin/v1/licenses/bulk", "CSV 批量导入"],
      ["GET", "/admin/v1/sessions", "近期会话"],
      ["POST", "/admin/v1/policies", "发布全局策略"],
    ],
    authNote: "管理接口需 Authorization: Bearer <API 密钥或控制台登录令牌>。API 密钥不能管理其他 API 密钥。",
  },
  deploy: {
    title: "自托管与部署",
    lede: "若你自行在 Cloudflare Workers 上运行 Kagin。使用托管工作区可跳过本页。",
    localTitle: "本地开发",
    localCode: `pnpm install
pnpm dev:worker    # API + 控制台静态资源 :8787
pnpm dev:admin     # Vite 控制台 :5173`,
    secretsTitle: "必要密钥",
    secrets: [
      "ADMIN_JWT_PUBLIC_JWK — 可选，自托管 Admin JWT",
      "STRIPE_SECRET_KEY / STRIPE_PRICE_ID / STRIPE_WEBHOOK_SECRET — 可选，托管订阅",
      "CONTACT_EMAIL — 可选，定价页商用自托管联系邮箱",
    ],
    buildTitle: "生产构建",
    buildCode: `pnpm install
pnpm deploy
pnpm verify`,
  },
};
