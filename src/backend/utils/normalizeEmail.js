/**
 * القيمة القانونية الوحيدة للبريد في كل عمليات المصادقة.
 * trim + toLowerCase فقط — لا نحذف النقاط ولا وسوم + لأن ذلك يدمج عناوين مختلفة فعلاً.
 */
export const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : email;