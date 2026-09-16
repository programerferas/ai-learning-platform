/**
 * Luxora Learn — بوابة إرسال البريد عبر Google Apps Script
 *
 * لماذا؟ Railway يحجب منافذ SMTP على الخطط غير المدفوعة، وGmail API يحتاج
 * توثيق تطبيق من Google. هذا السكربت يعمل بحسابك أنت ويُنشر كـ Web App برابط HTTPS،
 * فيرسل الخادم إليه طلب POST ويرسل هو البريد من حساب Gmail نفسه. مجاني (100 رسالة/يوم).
 *
 * خطوات النشر (مرة واحدة، بحساب Gmail المرسل):
 *   1. افتح https://script.google.com → New project → احذف المحتوى والصق هذا الملف كاملاً.
 *   2. غيّر قيمة SECRET أدناه إلى نص عشوائي طويل (مثلاً 40 حرفاً) واحفظ (Ctrl+S).
 *   3. Deploy → New deployment → ⚙ Select type → Web app:
 *        Execute as: Me   |   Who has access: Anyone
 *      → Deploy → Authorize access → اختر حسابك → إن ظهر "Google hasn't verified this app"
 *        اضغط Advanced → Go to (unsafe) → Allow.
 *   4. انسخ Web app URL (ينتهي بـ /exec).
 *   5. في Railway → backend → Variables:
 *        MAIL_WEBHOOK_URL    = الرابط من الخطوة 4
 *        MAIL_WEBHOOK_SECRET = نفس قيمة SECRET من الخطوة 2
 *
 * ملاحظة: بعد أي تعديل على هذا الملف يجب Deploy → Manage deployments → ✎ → Version: New
 *         → Deploy، وإلا يبقى الرابط على النسخة القديمة.
 */

// ⚠️ غيّر هذه القيمة قبل النشر — أي طلب لا يحملها يُرفض
const SECRET = "CHANGE-ME-TO-A-LONG-RANDOM-STRING";

/** فحص صحة: الخادم يستدعيه عند الإقلاع للتأكد من الرابط والصلاحيات */
function doGet() {
  return respond({
    ok: true,
    service: "luxora-mail",
    sender: Session.getEffectiveUser().getEmail(),
    remainingToday: MailApp.getRemainingDailyQuota(),
  });
}

/** الإرسال الفعلي: { secret, to, subject, html, text?, senderName? } */
function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return respond({ ok: false, error: "invalid JSON body" });
  }

  if (SECRET === "CHANGE-ME-TO-A-LONG-RANDOM-STRING") {
    return respond({ ok: false, error: "SECRET not set in Apps Script" });
  }
  if (body.secret !== SECRET) {
    return respond({ ok: false, error: "unauthorized" });
  }
  if (!body.to || !body.subject || !body.html) {
    return respond({ ok: false, error: "to, subject and html are required" });
  }

  try {
    MailApp.sendEmail({
      to: body.to,
      subject: body.subject,
      htmlBody: body.html,
      body: body.text || "", // النسخة النصية لعملاء البريد التي لا تعرض HTML
      name: body.senderName || "Luxora Learn",
    });
    return respond({ ok: true, remainingToday: MailApp.getRemainingDailyQuota() });
  } catch (err) {
    return respond({ ok: false, error: String(err) });
  }
}

function respond(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}
