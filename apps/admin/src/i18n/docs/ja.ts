import type { DocsContent } from "./en";

export const jaDocs: DocsContent = {
  title: "ドキュメント",
  subtitle: "ライセンスの発行、サイトでの販売、アプリでの激活まで。",
  nav: {
    quickstart: "クイックスタート",
    console: "コンソール",
    schemaPolicy: "Schema とポリシー",
    licensing: "ライセンスの仕組み",
    developers: "販売とキー発行",
    clientApps: "アプリで激活",
    sdk: "TypeScript SDK",
    api: "API リファレンス",
    deploy: "セルフホストとデプロイ",
  },
  quickstart: {
    title: "クイックスタート",
    lede: "製品作成 → キー発行 → アプリで解除。数分で完了できます。",
    steps: [
      {
        title: "コンソールにサインイン",
        body: "Console を開き、ワークスペースのメールでログインします。製品とライセンスキーを管理する場所です。",
      },
      {
        title: "製品を作成",
        body: "製品へ進み、ID（例: my-app）と表示名を入力して作成。販売するアプリやサービスごとに 1 製品です。",
      },
      {
        title: "署名鍵ペアを生成",
        body: "製品一覧で「鍵ペア生成」。オフラインで機能トークンを検証する場合に必要です。",
      },
      {
        title: "ライセンスキーを発行",
        body: "ライセンスへ。製品・タイプ（買い切り / サブスク / フローティング）、端末上限と同時シート、任意で購入者アカウント（メールまたは電話）を設定。キーをコピーして顧客に渡します。",
      },
      {
        title: "アプリで激活",
        body: "公開 activate API にライセンスキー、安定した端末 ID、（绑定時は）購入者アカウントを送ります。その後は任意で heartbeat により失効やポリシー更新を確認できます。",
      },
    ],
    verifyTitle: "成功の目安",
    verifyBody: "顧客がキーを受け取り、アプリで激活に成功し、機能が解除されます。绑定端末は「ライセンス → 端末」で確認できます。",
  },
  console: {
    title: "コンソール",
    lede: "各管理画面の簡単な説明。",
    items: [
      { title: "概要", body: "健全性、製品・ライセンス数、最近のセッション、よく使うショートカット。" },
      { title: "製品", body: "販売するアプリを登録。任意で機能 Schema（Pro / 機能フラグ用）とオフライン検証用の署名鍵を設定。「Schema とポリシー」も参照。" },
      { title: "ライセンス", body: "キーの発行と失効。端末上限・同時シート、購入者メール/電話の绑定、激活端末の確認と解除。" },
      { title: "ポリシー", body: "激活後にアプリが守るルール（例: オフライン可能な日数）。詳細は「Schema とポリシー」。" },
      { title: "セッション", body: "ライブのチェックイン。キックでフローティングシートを即解放。" },
      { title: "API キー", body: "Web サイトや決済 webhook 用のサーバー秘密鍵。デスクトップ/モバイル App には埋め込まない。作成・失効はコンソールログイン時のみ。" },
    ],
  },
  schemaPolicy: {
    title: "Schema とポリシー",
    lede: "任意の 2 つの仕組みです。Schema はライセンスが持てる機能フィールドを定義し、ポリシーは激活後のアプリの振る舞い（オフライン猶予など）を伝えます。",
    whenTitle: "必要？",
    whenHeaders: ["製品の形", "機能 Schema", "ポリシー"],
    whenRows: [
      ["買い切りでキーがアプリ全体を解除するだけ", "不要でよい", "任意（定期オンライン確認したいならオフライン日数を設定）"],
      ["同一製品で Basic / Pro や機能フラグがある", "必要", "必要に応じて"],
      ["失効やオンライン再確認が必要", "任意", "必要 — オフライン日数と heartbeat を設定"],
    ],
    schemaTitle: "機能 Schema",
    schemaBody:
      "製品に設定します。許可する機能フィールドと型（string / number / boolean）を列挙。機能トークン発行やライセンスへの機能付与時に Schema で検証します。",
    schemaExampleTitle: "Schema の例",
    schemaExample: `{
  "properties": {
    "tier": "string",
    "export": "boolean"
  },
  "required": ["tier"]
}`,
    schemaNotes: [
      "激活が「アプリ全体の解除」だけなら空でよい。",
      "複数プランや機能スイッチがあるときに設定する。",
      "署名付き機能トークンをオフライン検証する場合は製品の鍵ペアを生成する。",
    ],
    policyTitle: "ポリシー",
    policyBody:
      "activate / heartbeat 成功時にクライアントへ返す JSON。アプリが読んで可否を判断します。オフライン日数などは主にクライアント側で守ります。",
    policyExampleTitle: "ポリシーの例",
    policyExample: `{
  "max_offline_days": 7,
  "require_heartbeat": true
}`,
    policyFieldsTitle: "よく使うフィールド",
    policyFields: [
      ["max_offline_days", "オンライン確認なしで使える日数。超えたら再接続を要求。"],
      ["require_heartbeat", "定期的に heartbeat すべきか（失効検知とポリシー更新）。"],
    ],
    policyNotes: [
      "コンソール → ポリシーでグローバル既定を公開。後から製品別上書きも可能。",
      "ほぼオフラインの買い切りなら max_offline_days を大きく、または require_heartbeat をオフ。",
      "より強いオンライン管理なら短い猶予と起動時 heartbeat。",
    ],
    vsTitle: "ライセンスとの関係",
    vsItems: [
      "ライセンスキー + 端末上限 + 購入者アカウント → 誰がどの端末で激活できるか（サーバー強制）。",
      "ポリシー → 激活後のアプリの振る舞い（サーバーが配り、クライアントが実行）。",
      "Schema → プラン/フラグ用の機能フィールドの形。",
    ],
  },
  licensing: {
    title: "ライセンスの仕組み",
    lede: "「誰が買ったか」「何台まで使えるか」「同時に何人まで」を分けて設定できます。単独でも組み合わせても使えます。",
    matrixTitle: "設定の一覧",
    matrixHeaders: ["設定", "顧客側", "Kagin 側"],
    matrixRows: [
      ["端末上限 = 0", "一度きりの端末绑定不要", "端末数の上限なし"],
      ["端末上限 = 1 または 2", "端末ごとに一度激活", "超過端末は拒否"],
      ["シート上限 = 0（非 floating）", "heartbeat は任意", "同時利用者の上限なし"],
      ["シート上限 > 0 または floating", "heartbeat でシート占有", "同時上限超過は拒否"],
      ["購入者アカウント設定済み", "同じメール/電話で激活", "不一致は拒否"],
    ],
    flowTitle: "よくある構成",
    flows: [
      {
        title: "買い切り・1 台",
        body: "デスクトップの買い切り販売向け。端末上限 1、シート 0。任意で購入者メール/電話を绑定。その端末で一度激活。",
      },
      {
        title: "2 台まで",
        body: "端末上限 2（例: 自宅と職場）。3 台目は先に 1 台解除が必要。",
      },
      {
        title: "チームのフローティングシート",
        body: "同時利用者数で売るオンライン向け。端末上限 0、シート N（または floating）。チェックインで占有、退出で解放。",
      },
    ],
    adminTitle: "日常オペレーション",
    adminItems: [
      "ライセンス → 端末: 绑定一覧と解除で枠を空ける。",
      "セッション: ライブ確認。キックでシート解放。",
      "失効: すべての端末で即無効。",
    ],
  },
  developers: {
    title: "販売とキー発行",
    lede: "サイトで決済が完了したら、サーバーが Kagin でライセンスキーを作り、顧客に届けます。",
    flowTitle: "推奨フロー",
    flowSteps: [
      "顧客がサイトで決済を完了。",
      "サーバー（または決済 webhook）が API キーで POST /admin/v1/licenses。",
      "激活時にアカウント照合したい場合は customer_identity にメールまたは電話を設定。",
      "返ってきた license_key を注文画面やメールで渡す。",
      "顧客はアプリの公開 activate API で激活（アプリに API キーは不要）。",
    ],
    keysTitle: "API キー",
    keysBody: "コンソール → API キー → 作成。kagin_sk_live_ で始まる秘密鍵をサーバー環境変数（例: KAGIN_API_KEY）へ。Authorization: Bearer <your-api-key>。",
    keysNotes: [
      "完全なシークレットは作成時に一度だけ表示。",
      "バックエンドからライセンス発行・失効、製品・セッション管理に使用。",
      "API キーは他の API キーを作成/失効できない — コンソールにログインして操作。",
      "漏洩したら即座に失効して再作成。",
    ],
    webhookTitle: "例: 決済後にキー発行",
    webhookCode: `// Node.js — 決済成功後
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
// 顧客へ license_key を送付`,
    manualTitle: "手動発行",
    manualBody: "個別取引やサポート用の再発行は、コンソール → ライセンスで手動作成。アプリ側の激活手順は同じです。",
    errorsTitle: "よくあるエラー",
    errorRows: [
      ["401 unauthorized", "API キー / ログイントークンが無効または欠落"],
      ["403 session_required", "API キーが他の API キー管理を試みた"],
      ["404 product_not_found", "product_id がワークスペースにない"],
      ["403 identity_mismatch", "激活アカウントが購入時の绑定と不一致"],
    ],
  },
  clientApps: {
    title: "アプリで激活",
    lede: "デスクトップ / モバイルは公開 /v1 API を使います。API キーや管理トークンをクライアントに埋め込まないでください。",
    desktopTitle: "典型的な買い切りデスクトップ",
    desktopSteps: [
      "端末上限 1（または 2）で発行。任意で購入者メール/電話を绑定。",
      "UI でライセンスキーを入力。绑定ありなら同じアカウントも入力。",
      "POST /v1/activate に license_key、安定した machine_id、必要なら identity。",
      "machine_id を安全に保存（例: Mac の Keychain）し、再利用。",
      "任意で起動時 heartbeat により失効やポリシー更新を確認。",
    ],
    activateTitle: "激活リクエスト",
    activateCode: `POST /v1/activate
{
  "license_key": "your-license-key",
  "machine_id": "stable-device-id",
  "identity": "buyer@example.com"
}`,
    activateErrorsTitle: "激活エラー",
    activateErrors: [
      "identity_required — アカウント绑定キーなのに identity がない",
      "identity_mismatch — メール/電話が購入アカウントと不一致",
      "machine_limit_exceeded — 端末上限に達している",
      "machine_not_activated — 端末上限ありなのに activate 前に heartbeat",
      "license_expired / license_not_active — 期限切れまたは失効",
    ],
    machineIdTitle: "端末 ID（machine_id）",
    machineIdBody: "端末ごとに安定した ID を作り安全に保存。Mac ではハードウェア UUID、または Keychain に保存したランダム UUID。同じ端末では同じ ID を再利用。",
    noSecretTitle: "セキュリティ",
    noSecretBody: "Kagin API キーや管理ログイントークンをアプリに入れない。クライアントが持つのは顧客のライセンスキーと、必要な場合の購入アカウントだけ。",
  },
  sdk: {
    title: "TypeScript SDK",
    lede: "Node / Web 向けの任意ヘルパー: activate、heartbeat、機能トークン。",
    install: "インストール",
    installCode: "pnpm add @kagin/sdk",
    exampleTitle: "最小例",
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
      "端末上限が 0 より大きいときは端末ごとに一度 activate。",
      "同じ端末の heartbeat では同じ session_id を再利用。",
      "last_seen_server_time を保存して時刻巻き戻しを検知。",
      "フローティングが満席のときは HTTP 429。",
    ],
  },
  api: {
    title: "API リファレンス",
    lede: "公開 /v1（アプリ用）。管理 /admin/v1（サーバーとコンソール用）。",
    publicTitle: "公開 API（アプリ）",
    adminTitle: "管理 API（サーバー）",
    tableHeaders: ["メソッド", "パス", "説明"] as [string, string, string],
    errorHeaders: ["エラー", "意味"] as [string, string],
    publicRows: [
      ["GET", "/health", "ヘルス"],
      ["GET", "/v1/server-time", "署名付きサーバー時刻"],
      ["GET", "/v1/policy", "マージ済みポリシー"],
      ["POST", "/v1/activate", "激活 / 端末绑定"],
      ["POST", "/v1/heartbeat", "セッション更新"],
      ["POST", "/v1/feature-token", "機能トークン発行"],
      ["POST", "/v1/ephemeral-token", "短期端末トークン"],
    ],
    adminRows: [
      ["POST", "/admin/v1/auth/signup", "ワークスペース登録"],
      ["POST", "/admin/v1/auth/login", "ログイン"],
      ["GET", "/admin/v1/products", "製品一覧"],
      ["POST", "/admin/v1/licenses", "ライセンス作成"],
      ["GET/POST", "/admin/v1/api-keys", "API キー一覧/作成（コンソール session のみ）"],
      ["POST", "/admin/v1/api-keys/:id/revoke", "API キー失効（コンソール session のみ）"],
      ["GET", "/admin/v1/licenses/:key/activations", "激活端末一覧"],
      ["DELETE", "/admin/v1/licenses/:key/activations/:machine_id", "端末解除"],
      ["POST", "/admin/v1/licenses/bulk", "CSV 一括"],
      ["GET", "/admin/v1/sessions", "セッション一覧"],
      ["POST", "/admin/v1/policies", "ポリシー公開"],
    ],
    authNote: "管理 API は Authorization: Bearer <API キーまたはコンソール session>。API キーは他の API キーを管理できない。",
  },
  deploy: {
    title: "セルフホストとデプロイ",
    lede: "Cloudflare Workers 上で自前運用する場合。ホスト済みワークスペースなら本ページは不要です。",
    localTitle: "ローカル開発",
    localCode: `pnpm install
pnpm dev:worker
pnpm dev:admin`,
    secretsTitle: "シークレット",
    secrets: [
      "ADMIN_JWT_PUBLIC_JWK — 任意（セルフホスト Admin JWT）",
      "STRIPE_SECRET_KEY / STRIPE_PRICE_ID / STRIPE_WEBHOOK_SECRET — 任意（ホスティング課金）",
      "CONTACT_EMAIL — 任意（商用セルフホストの連絡先）",
    ],
    buildTitle: "本番ビルド",
    buildCode: `pnpm install
pnpm deploy
pnpm verify`,
  },
};
