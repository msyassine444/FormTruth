// FormTruth — Content Script
// يقرأ حقول النموذج من الصفحة الحالية.

const SKIP_TYPES = new Set([
  "hidden", "submit", "button", "reset", "image", "file",
  "checkbox", "radio", "password", "search", "color", "range",
]);

const SKIP_KEYWORDS = [
  "toggle", "switch", "captcha", "csrf", "token",
  "password", "search", "subscribe", "newsletter",
];

function isVisible(el) {
  if (!el.offsetParent && el.offsetWidth === 0 && el.offsetHeight === 0) {
    return false;
  }
  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") return false;
  if (style.opacity === "0") return false;
  return true;
}

function shouldSkip(el, key) {
  // type
  const type = (el.type || "").toLowerCase();
  if (SKIP_TYPES.has(type)) return true;

  // aria-hidden
  if (el.getAttribute("aria-hidden") === "true") return true;

  // hidden attribute
  if (el.hidden) return true;

  // key words في الاسم/الـ id
  const lowerKey = key.toLowerCase();
  if (SKIP_KEYWORDS.some(k => lowerKey.includes(k))) return true;

  // قيمة on/off
  const v = (el.value || "").trim().toLowerCase();
  if (v === "on" || v === "off") return true;

  // قيمة فاضية
  if (!v) return true;

  // قيمة طويلة جدًا (احتمال نص مقال وليس حقل)
  if (v.length > 500) return true;

  return false;
}

function findFormFields() {
  const fields = {};
  const inputs = document.querySelectorAll("input, textarea, select");

  for (const el of inputs) {
    if (el.disabled || el.readOnly) continue;
    if (!isVisible(el)) continue;

    // احصل على اسم الحقل
    let key = el.name || el.id || el.getAttribute("aria-label") || "";

    if (!key) {
      // ابحث عن label قريب
      const label = el.labels && el.labels[0];
      if (label) key = label.textContent.trim();
    }

    if (!key) {
      // ابحث عن placeholder
      key = el.placeholder || "";
    }

    if (!key) continue;

    // نظّف المفتاح
    key = key.replace(/[\[\]]/g, "").trim();

    // فلترة
    if (shouldSkip(el, key)) continue;

    // القيمة
    fields[key] = el.value.trim();
  }

  return fields;
}

// استمع لطلب من الـ popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getFormFields") {
    const fields = findFormFields();
    sendResponse({ fields });
  }
  return true;
});