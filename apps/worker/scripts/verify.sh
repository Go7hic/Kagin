#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
PORT=18787
BASE="http://127.0.0.1:${PORT}"
WR="pnpm exec wrangler --config ../../wrangler.jsonc"
PRODUCT="smoke-prod-${RANDOM}"
EMAIL="smoke-${RANDOM}@kagin.test"

rm -f /tmp/kagin-wrangler.log

export CI=true
$WR d1 migrations apply kagin-db --local 2>/dev/null || $WR d1 migrations apply DB --local

$WR dev -l --persist-to .wrangler/state --port "$PORT" >/tmp/kagin-wrangler.log 2>&1 &
PID=$!
cleanup() { kill "$PID" 2>/dev/null || true; }
trap cleanup EXIT

ready=0
for i in $(seq 1 60); do
  if curl -sf "$BASE/health" >/dev/null; then ready=1; break; fi
  sleep 1
done
if [ "$ready" -ne 1 ]; then
  echo "wrangler dev failed to start:" >&2
  tail -30 /tmp/kagin-wrangler.log >&2
  exit 1
fi

curl -sf "$BASE/health" | grep -q '"ok":true'
curl -sf "$BASE/v1/server-time" | grep -q 'server_time'

code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/admin/v1/products")
test "$code" = "401"

SIGNUP=$(curl -sf -X POST "$BASE/admin/v1/auth/signup" -H 'content-type: application/json' \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"smoke-pass-123\",\"org_name\":\"Smoke Org\"}")
echo "$SIGNUP" | grep -q token
ADMIN_JWT=$(echo "$SIGNUP" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); process.stdout.write(d.token)")
AUTH="Authorization: Bearer ${ADMIN_JWT}"

curl -sf -H "$AUTH" "$BASE/admin/v1/auth/me" | grep -q org_id

curl -sf -H "$AUTH" -X POST "$BASE/admin/v1/products" -H 'content-type: application/json' -d "{\"product_id\":\"${PRODUCT}\",\"name\":\"Smoke\"}" | grep -q ok
curl -sf -H "$AUTH" "$BASE/admin/v1/products" | grep -q "$PRODUCT"
curl -sf -H "$AUTH" -X POST "$BASE/admin/v1/products/${PRODUCT}/keypair" | grep -q ok

NOW=$(date +%s)
EXPIRES=$((NOW + 86400 * 30))
CREATE=$(curl -sf -H "$AUTH" -X POST "$BASE/admin/v1/licenses" -H 'content-type: application/json' \
  -d "{\"product_id\":\"${PRODUCT}\",\"type\":\"floating\",\"expires_at\":${EXPIRES},\"seat_limit\":2,\"features\":{\"tier\":\"pro\"}}")
echo "$CREATE" | grep -q license_key
LICENSE=$(echo "$CREATE" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); process.stdout.write(d.license_key)")

HB=$(curl -sf -X POST "$BASE/v1/heartbeat" -H 'content-type: application/json' -d "{\"license_key\":\"${LICENSE}\",\"session_id\":\"s1\",\"machine_id\":\"m1\"}")
echo "$HB" | grep -q 'server_time'

# The signed server_time must verify against the product public key, and a
# tampered time must not. The admin product list must not leak private_jwk.
PRODUCTS=$(curl -sf -H "$AUTH" "$BASE/admin/v1/products")
echo "$PRODUCTS" | grep -qv private_jwk
PUBJWK=$(echo "$PRODUCTS" | node -e "
const rows = JSON.parse(require('fs').readFileSync(0, 'utf8'));
const row = rows.find((r) => r.product_id === process.argv[1]);
process.stdout.write(row.public_jwk);
" "$PRODUCT")
echo "$HB" | node -e "
const hb = JSON.parse(require('fs').readFileSync(0, 'utf8'));
const jwk = JSON.parse(process.argv[1]);
const verify = async (server_time) => {
  const payload = { issued_at: hb.issued_at, expires_at: hb.expires_at, server_time };
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'Ed25519' }, false, ['verify']);
  return crypto.subtle.verify(
    'Ed25519',
    key,
    Uint8Array.from(atob(hb.signature), (ch) => ch.charCodeAt(0)),
    new TextEncoder().encode(JSON.stringify(payload)),
  );
};
(async () => {
  if (!(await verify(hb.server_time))) throw new Error('server_time signature did not verify');
  if (await verify(hb.server_time - 86400)) throw new Error('rolled-back server_time verified');
})();
" "$PUBJWK"

ORG_SLUG=$(curl -sf -H "$AUTH" "$BASE/admin/v1/auth/me" | node -e "
process.stdout.write(JSON.parse(require('fs').readFileSync(0, 'utf8')).org.slug);
")
curl -sf "$BASE/v1/server-time?product_id=${PRODUCT}&org_slug=${ORG_SLUG}" | grep -q signature
curl -sf "$BASE/v1/server-time" | grep -qv signature

curl -sf -X POST "$BASE/v1/heartbeat" -H 'content-type: application/json' -d "{\"license_key\":\"${LICENSE}\",\"session_id\":\"s2\",\"machine_id\":\"m2\"}"
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/v1/heartbeat" -H 'content-type: application/json' -d "{\"license_key\":\"${LICENSE}\",\"session_id\":\"s3\",\"machine_id\":\"m3\"}")
test "$code" = "429"

CREATE2=$(curl -sf -H "$AUTH" -X POST "$BASE/admin/v1/licenses" -H 'content-type: application/json' \
  -d "{\"product_id\":\"${PRODUCT}\",\"type\":\"subscription\",\"expires_at\":${EXPIRES},\"seat_limit\":0}")
LICENSE2=$(echo "$CREATE2" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); process.stdout.write(d.license_key)")
curl -sf -X POST "$BASE/v1/heartbeat" -H 'content-type: application/json' -d "{\"license_key\":\"${LICENSE2}\",\"session_id\":\"nf1\",\"machine_id\":\"m1\"}" | grep -q server_time

curl -sf -X POST "$BASE/v1/ephemeral-token" -H 'content-type: application/json' -d "{\"license_key\":\"${LICENSE}\",\"machine_id\":\"m1\"}" | grep -q token_id

FT=$(curl -sf -X POST "$BASE/v1/feature-token" -H 'content-type: application/json' -d "{\"license_key\":\"${LICENSE}\",\"features\":{\"tier\":\"pro\"}}")
echo "$FT" | grep -q signature
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/v1/feature-token" -H 'content-type: application/json' -d "{\"license_key\":\"${LICENSE}\",\"features\":{\"tier\":\"enterprise\"}}")
test "$code" = "403"

curl -sf -H "$AUTH" -X POST "$BASE/admin/v1/policies" -H 'content-type: application/json' -d '{"policy":{"max_offline_days":7}}' | grep -q ok
curl -sf -H "$AUTH" "$BASE/admin/v1/policies" | grep -q max_offline_days

curl -sf -H "$AUTH" -X POST "$BASE/admin/v1/licenses/${LICENSE}/kick" -H 'content-type: application/json' -d '{"session_id":"s1"}' | grep -q ok

CREATE3=$(curl -sf -H "$AUTH" -X POST "$BASE/admin/v1/licenses" -H 'content-type: application/json' \
  -d "{\"product_id\":\"${PRODUCT}\",\"type\":\"perpetual\",\"expires_at\":${EXPIRES},\"seat_limit\":0,\"machine_limit\":2}")
LICENSE3=$(echo "$CREATE3" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); process.stdout.write(d.license_key)")

curl -sf -X POST "$BASE/v1/activate" -H 'content-type: application/json' \
  -d "{\"license_key\":\"${LICENSE3}\",\"machine_id\":\"dev1\"}" | grep -q '"activated":true'
curl -sf -X POST "$BASE/v1/activate" -H 'content-type: application/json' \
  -d "{\"license_key\":\"${LICENSE3}\",\"machine_id\":\"dev2\"}" | grep -q '"activated":true'
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/v1/activate" -H 'content-type: application/json' \
  -d "{\"license_key\":\"${LICENSE3}\",\"machine_id\":\"dev3\"}")
test "$code" = "403"

code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/v1/heartbeat" -H 'content-type: application/json' \
  -d "{\"license_key\":\"${LICENSE3}\",\"session_id\":\"na1\",\"machine_id\":\"dev9\"}")
test "$code" = "403"

curl -sf -X POST "$BASE/v1/heartbeat" -H 'content-type: application/json' \
  -d "{\"license_key\":\"${LICENSE3}\",\"session_id\":\"ok1\",\"machine_id\":\"dev1\"}" | grep -q server_time

CREATE4=$(curl -sf -H "$AUTH" -X POST "$BASE/admin/v1/licenses" -H 'content-type: application/json' \
  -d "{\"product_id\":\"${PRODUCT}\",\"type\":\"perpetual\",\"expires_at\":${EXPIRES},\"seat_limit\":0,\"machine_limit\":1,\"customer_identity\":\"buyer@cleer.test\"}")
LICENSE4=$(echo "$CREATE4" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); process.stdout.write(d.license_key)")

code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/v1/activate" -H 'content-type: application/json' \
  -d "{\"license_key\":\"${LICENSE4}\",\"machine_id\":\"cleer-m1\"}")
test "$code" = "400"

code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/v1/activate" -H 'content-type: application/json' \
  -d "{\"license_key\":\"${LICENSE4}\",\"machine_id\":\"cleer-m1\",\"identity\":\"wrong@cleer.test\"}")
test "$code" = "403"

curl -sf -X POST "$BASE/v1/activate" -H 'content-type: application/json' \
  -d "{\"license_key\":\"${LICENSE4}\",\"machine_id\":\"cleer-m1\",\"identity\":\"buyer@cleer.test\"}" | grep -q '"activated":true'

KEYRES=$(curl -sf -H "$AUTH" -X POST "$BASE/admin/v1/api-keys" -H 'content-type: application/json' -d '{"name":"verify-webhook"}')
API_KEY=$(echo "$KEYRES" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); process.stdout.write(d.api_key)")
API_AUTH="Authorization: Bearer ${API_KEY}"
curl -sf -H "$API_AUTH" -X POST "$BASE/admin/v1/licenses" -H 'content-type: application/json' \
  -d "{\"product_id\":\"${PRODUCT}\",\"type\":\"perpetual\",\"expires_at\":${EXPIRES},\"machine_limit\":1,\"customer_identity\":\"api@test.com\"}" | grep -q license_key
code=$(curl -s -o /dev/null -w '%{http_code}' -H "$API_AUTH" -X POST "$BASE/admin/v1/api-keys" -H 'content-type: application/json' -d '{"name":"blocked"}')
test "$code" = "403"

curl -sf -H "$AUTH" -X POST "$BASE/admin/v1/auth/logout" | grep -q ok
code=$(curl -s -o /dev/null -w '%{http_code}' -H "$AUTH" "$BASE/admin/v1/auth/me")
test "$code" = "401"

export KAGIN_BASE="$BASE"
export KAGIN_LICENSE_KEY="$LICENSE"
node --import tsx ../../examples/ts/check_license.ts

echo "verify: all smoke checks passed"
