import { generateKeyPair, exportJWK, SignJWT } from "jose";
import { writeFileSync } from "fs";

const { publicKey, privateKey } = await generateKeyPair("RS256");
const pub = await exportJWK(publicKey);
const jwt = await new SignJWT({ sub: "admin-dev" })
  .setProtectedHeader({ alg: "RS256" })
  .setExpirationTime("24h")
  .sign(privateKey);

console.log("--- Paste into apps/worker/.dev.vars ---");
console.log(`ADMIN_JWT_PUBLIC_JWK=${JSON.stringify(pub)}`);
console.log("--- Admin JWT (paste into Admin UI login) ---");
console.log(jwt);
