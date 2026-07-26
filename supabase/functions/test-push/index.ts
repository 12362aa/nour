import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const FCM_SERVICE_ACCOUNT = JSON.parse(Deno.env.get("FCM_SERVICE_ACCOUNT") ?? "{}");

let _fcmAccessToken: string | null = null;
let _fcmTokenExpiry = 0;

async function getFCMAccessToken(): Promise<string> {
  const now = Date.now();
  if (_fcmAccessToken && now < _fcmTokenExpiry) return _fcmAccessToken;

  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const iat = Math.floor(now / 1000);
  const exp = iat + 3600;
  const payload = btoa(JSON.stringify({
    iss: FCM_SERVICE_ACCOUNT.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat,
    exp,
  }));

  const privateKeyPem = FCM_SERVICE_ACCOUNT.private_key;
  const binaryDer = pemToBinary(privateKeyPem);
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(`${header}.${payload}`)
  );
  
  const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
  const signature = base64Signature.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  
  const jwt = `${header}.${payload}.${signature}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const tokenData = await tokenRes.json();
  _fcmAccessToken = tokenData.access_token;
  _fcmTokenExpiry = now + (tokenData.expires_in - 60) * 1000;
  return _fcmAccessToken!;
}

function pemToBinary(pem: string): ArrayBuffer {
  const base64 = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function sendFCMPush(
  token: string,
  title: string,
  body: string,
  channelId: string,
  sound: string,
  data: Record<string, string>
): Promise<boolean> {
  const accessToken = await getFCMAccessToken();
  const androidSound = sound === "default" ? "default" : sound;

  const message = {
    message: {
      token,
      notification: { title, body },
      android: {
        priority: "high",
        notification: {
          channel_id: channelId,
          sound: androidSound,
          notification_priority: "PRIORITY_MAX",
          visibility: "PUBLIC",
        },
      },
      data: { ...data, channelId, sound },
    },
  };

  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${FCM_SERVICE_ACCOUNT.project_id}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("FCM send failed: ", err);
    return false;
  }
  return true;
}

serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: users, error } = await supabase
    .from("user_notification_prefs")
    .select("user_id, fcm_token")
    .not("fcm_token", "is", null);

  if (error || !users || users.length === 0) {
    return new Response(JSON.stringify({ error: "No users or failed to fetch", details: error }), { status: 400 });
  }

  let successCount = 0;
  for (const user of users) {
    const sent = await sendFCMPush(
      user.fcm_token,
      "اختبار الإشعارات الفورية ✅",
      "نجاح! الإشعارات الفورية (FCM) تعمل الآن بشكل ممتاز على جهازك.",
      "nour-reminders-v5",
      "default",
      { scope: "test" }
    );
    if (sent) successCount++;
  }

  return new Response(JSON.stringify({ message: "Test push sent", users: users.length, success: successCount }), {
    headers: { "Content-Type": "application/json" },
  });
});
