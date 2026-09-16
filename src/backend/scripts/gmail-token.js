// يُشغَّل مرة واحدة محلياً: npm run gmail:token
// يفتح صفحة موافقة Google لحساب Gmail المرسل ويطبع GMAIL_REFRESH_TOKEN
// الذي يوضع في متغيّرات Railway. لا يحتاج OAuth Playground ولا أي أداة خارجية.
//
// المتطلبات (مرة واحدة في Google Cloud Console):
//   1. مشروع جديد → APIs & Services → Library → تفعيل "Gmail API"
//   2. OAuth consent screen → External → أضف بريدك كـ Test user، ثم "Publish app"
//      (بدون النشر تنتهي صلاحية refresh token بعد 7 أيام)
//   3. Credentials → Create credentials → OAuth client ID → نوع "Desktop app"
//      وانسخ Client ID و Client secret إلى GMAIL_CLIENT_ID و GMAIL_CLIENT_SECRET في .env

import "dotenv/config";
import http from "node:http";
import crypto from "node:crypto";
import { exec } from "node:child_process";

const SCOPE = "https://www.googleapis.com/auth/gmail.send";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

const clientId = process.env.GMAIL_CLIENT_ID;
const clientSecret = process.env.GMAIL_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error(
    "❌ ضع GMAIL_CLIENT_ID و GMAIL_CLIENT_SECRET في ملف .env أولاً (من Google Cloud Console → Credentials → OAuth client, نوع Desktop app)"
  );
  process.exit(1);
}

// حماية CSRF قياسية: الحالة تُولَّد عشوائياً وتُطابَق عند العودة
const state = crypto.randomBytes(16).toString("hex");

const openBrowser = (url) => {
  const cmd =
    process.platform === "win32"
      ? `start "" "${url}"`
      : process.platform === "darwin"
        ? `open "${url}"`
        : `xdg-open "${url}"`;
  exec(cmd, () => {}); // إن فشل الفتح التلقائي فالرابط مطبوع أدناه
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  if (url.pathname !== "/") {
    res.writeHead(404).end();
    return;
  }

  const finish = (status, text) => {
    res.writeHead(status, { "content-type": "text/plain; charset=utf-8" });
    res.end(text);
    server.close();
  };

  if (url.searchParams.get("state") !== state) {
    finish(400, "state غير مطابق، أعد تشغيل السكربت");
    return;
  }
  const error = url.searchParams.get("error");
  if (error) {
    finish(400, `Google رفض الطلب: ${error}`);
    console.error("❌", error);
    return;
  }

  const code = url.searchParams.get("code");
  const redirectUri = `http://127.0.0.1:${server.address().port}/`;

  try {
    const tokenRes = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const data = await tokenRes.json();
    if (!tokenRes.ok || !data.refresh_token) {
      throw new Error(JSON.stringify(data));
    }

    finish(200, "✅ تم. يمكنك إغلاق هذه الصفحة والعودة إلى الطرفية.");
    console.log("\n✅ انسخ هذه القيم إلى متغيّرات Railway (وإلى .env إن أردت الإرسال عبر API محلياً):\n");
    console.log(`GMAIL_CLIENT_ID=${clientId}`);
    console.log(`GMAIL_CLIENT_SECRET=${clientSecret}`);
    console.log(`GMAIL_REFRESH_TOKEN=${data.refresh_token}\n`);
  } catch (err) {
    finish(500, "فشل تبادل الرمز، انظر الطرفية");
    console.error("❌ فشل الحصول على refresh token:", err.message);
    process.exitCode = 1;
  }
});

// المنفذ 0 = أي منفذ حر؛ عملاء "Desktop app" يقبلون أي منفذ loopback دون تسجيله مسبقاً
server.listen(0, "127.0.0.1", () => {
  const redirectUri = `http://127.0.0.1:${server.address().port}/`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline", // بدونه لا يُعطى refresh token
    prompt: "consent", // يضمن إصدار refresh token حتى لو سبقت الموافقة
    state,
  });
  const url = `${AUTH_URL}?${params}`;

  console.log("🔑 افتح هذا الرابط وسجّل الدخول بحساب Gmail المرسل (نفس EMAIL_USER):\n");
  console.log(url, "\n");
  console.log("(إن ظهرت شاشة 'Google hasn't verified this app' اضغط Advanced → Go to ... (unsafe) — هذا تطبيقك أنت)\n");
  openBrowser(url);
});
