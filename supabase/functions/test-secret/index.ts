// COPY THE EXACT FUNCTIONS FROM check-notifications
function stringToBuffer(str: string) {
  return new TextEncoder().encode(str);
}
function base64url(buffer: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
async function getFCMAccessToken(): Promise<string> {
  const accountStr = Deno.env.get("FCM_SERVICE_ACCOUNT");
  if (!accountStr) throw new Error("FCM_SERVICE_ACCOUNT secret is missing");
  const account = JSON.parse(accountStr);

  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = base64url(stringToBuffer(JSON.stringify(header)));
  const encodedClaim = base64url(stringToBuffer(JSON.stringify(claim)));

  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pemContents = account.private_key
    .replace(pemHeader, "")
    .replace(pemFooter, "")
    .replace(/\n/g, "");
  const binaryDerString = atob(pemContents);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }

  const key = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    stringToBuffer(\.\)
  );
  const encodedSignature = base64url(signature);
  const jwt = \.\.\;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=\,
  });
  if (!response.ok) throw new Error(await response.text());
  const data = await response.json();
  return data.access_token;
}

Deno.serve(async (req) => {
  try {
    const token = await getFCMAccessToken();
    return new Response(JSON.stringify({ status: "success", tokenPrefix: token.substring(0, 10) }));
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message, stack: e.stack }), { status: 500 });
  }
});
