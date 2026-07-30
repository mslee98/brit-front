// supabase/functions/signup/index.ts
// Final signup: auth.users + user_profiles + user_roles

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SignupBody {
  name: string;
  rrnFront7: string;
  mobileCarrier: string;
  phone: string;
  bankCode: string;
  accountNumber: string;
  accountHolderName: string;
  transactionPin: string;
  loginPassword: string;
  nickname: string;
}

function jsonResponse(data: Record<string, unknown>, status = 200): Response {
  return Response.json(data, { status, headers: corsHeaders });
}

function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** Korea local 010… → E.164 +82… (single place for Auth + profile) */
function toKoreaE164(phone: string): string {
  const digits = digitsOnly(phone);
  if (digits.startsWith("82")) return `+${digits}`;
  if (digits.startsWith("0")) return `+82${digits.slice(1)}`;
  return `+82${digits}`;
}

function deriveBirthDate(rrnFront7: string): string {
  const yy = Number(rrnFront7.slice(0, 2));
  const mm = rrnFront7.slice(2, 4);
  const dd = rrnFront7.slice(4, 6);
  const genderDigit = Number(rrnFront7[6]);
  const century = genderDigit === 3 || genderDigit === 4 || genderDigit === 7 ||
      genderDigit === 8
    ? 2000
    : 1900;
  return `${century + yy}-${mm}-${dd}`;
}

function deriveGenderCode(rrnFront7: string): "M" | "F" {
  const d = Number(rrnFront7[6]);
  return d % 2 === 1 ? "M" : "F";
}

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** bcrypt-compatible cost via Web Crypto is unavailable; use salted SHA-256 + note for Nest bcrypt */
async function hashTransactionPin(pin: string, pepper: string): Promise<string> {
  // Prefer bcrypt in Nest; Edge interim: sha256(pepper:pin)
  return sha256Hex(`${pepper}:${pin}`);
}

async function hashIdentityKey(
  name: string,
  rrnFront7: string,
  pepper: string,
): Promise<string> {
  return sha256Hex(`${pepper}|${name}|${rrnFront7}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "METHOD_NOT_ALLOWED" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const pinPepper = Deno.env.get("TRANSACTION_PIN_PEPPER") ?? "brit-dev-pepper";

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "SERVER_MISCONFIGURED" }, 500);
  }

  let body: SignupBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "INVALID_JSON" }, 400);
  }

  if (
    !body.name || !body.rrnFront7 || !body.phone || !body.bankCode ||
    !body.accountNumber || !body.transactionPin || !body.loginPassword ||
    !body.nickname
  ) {
    return jsonResponse({ error: "INVALID_PAYLOAD" }, 400);
  }

  if (!/^\d{7}$/.test(body.rrnFront7)) {
    return jsonResponse({ error: "INVALID_RRN" }, 400);
  }
  if (!/^\d{6}$/.test(body.transactionPin)) {
    return jsonResponse({ error: "INVALID_PIN" }, 400);
  }
  if (body.loginPassword.length < 8) {
    return jsonResponse({ error: "INVALID_PASSWORD" }, 400);
  }
  if (!/^[가-힣a-zA-Z0-9_]{2,12}$/.test(body.nickname.trim())) {
    return jsonResponse({ error: "INVALID_NICKNAME" }, 400);
  }

  const phoneE164 = toKoreaE164(body.phone);
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    phone: phoneE164,
    password: body.loginPassword,
    phone_confirm: true,
    user_metadata: { nickname: body.nickname.trim() },
  });

  if (createError || !created.user) {
    const msg = createError?.message ?? "CREATE_USER_FAILED";
    if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("exists")) {
      return jsonResponse({ error: "PHONE_EXISTS" }, 409);
    }
    return jsonResponse({ error: "SIGNUP_FAILED", message: msg }, 400);
  }

  const userId = created.user.id;
  const now = new Date().toISOString();
  const identityKeyHash = await hashIdentityKey(body.name, body.rrnFront7, pinPepper);
  const pinHash = await hashTransactionPin(body.transactionPin, pinPepper);

  const { error: profileError } = await admin.from("user_profiles").insert({
    user_id: userId,
    status: "ACTIVE",
    nickname: body.nickname.trim(),
    name: body.name,
    birth_date: deriveBirthDate(body.rrnFront7),
    gender_code: deriveGenderCode(body.rrnFront7),
    mobile_carrier: body.mobileCarrier,
    phone_number: phoneE164,
    identity_key_hash: identityKeyHash,
    bank_code: body.bankCode,
    bank_account_number: body.accountNumber,
    bank_account_holder_name: body.accountHolderName || body.name,
    bank_account_verified_at: now,
    transaction_pin_hash: pinHash,
    phone_verified_at: now,
    identity_verified_at: now,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(userId);
    if (profileError.message.includes("nickname") || profileError.code === "23505") {
      return jsonResponse({ error: "NICKNAME_TAKEN" }, 409);
    }
    if (profileError.message.includes("identity_key")) {
      return jsonResponse({ error: "IDENTITY_EXISTS" }, 409);
    }
    return jsonResponse({ error: "PROFILE_FAILED", message: profileError.message }, 400);
  }

  const { error: roleError } = await admin.from("user_roles").insert({
    user_id: userId,
    role: "CONSUMER",
  });

  if (roleError) {
    await admin.from("user_profiles").delete().eq("user_id", userId);
    await admin.auth.admin.deleteUser(userId);
    return jsonResponse({ error: "ROLE_FAILED", message: roleError.message }, 400);
  }

  return jsonResponse({
    success: true,
    userId,
    nickname: body.nickname.trim(),
    phoneE164,
  });
});
