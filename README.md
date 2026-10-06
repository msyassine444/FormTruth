# FormTruth

![Python](https://img.shields.io/badge/python-3.11+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-green.svg)
![Tests](https://img.shields.io/badge/tests-288%20passed-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-orange.svg)

> **"Grammarly" للتناسق في البيانات الرسمية.**

FormTruth يمنع المستخدم من إرسال نماذج مهمة تحتوي على معلومات متناقضة، عبر مقارنة النموذج الحالي مع **مصدر حقيقة (Truth Profile)** مستخرج من وثائقه.

---

## 🎯 الفكرة

عند التقديم على جامعة، فيزا، وظيفة، قرض، أو تأمين، تكون معلوماتك موزعة بين:

- 📄 CV / Resume
- 📑 وثائق PDF
- 📝 ملفات Word
- 🗂️ نماذج سابقة
- 🌐 النموذج الحالي على الويب

**المشكلة:** قد تكتب معلومة مختلفة بدون أن تنتبه.

**الحل:** FormTruth يكشف التناقض **قبل** أن تضغط "Submit".

```text
CV:        Employment Start → 2022
Web Form:  Employment Start → 2023
                     ↓
              ⚠️ CONFLICT
```

---

## 🧠 كيف يعمل؟

FormTruth يبني **Truth Profile** يحتوي على المعلومات المرجعية للمستخدم، ثم يقارنها بالمعلومات الموجودة في النموذج الحالي.

```text
📄 Documents (TXT / PDF / DOCX)
        ↓
   /extract-facts        ← استخراج الحقائق
        ↓
   /build-truth          ← بناء Truth Profile
        ↓
   /compare              ← المقارنة مع النموذج
        ↓
   ✅ MATCH / ⚠️ CONFLICT / ❓ UNKNOWN
```

### مثال

```text
Truth Profile:
Employment Start → 2022

Current Form:
Employment Start → 2023
```

النتيجة:

```text
⚠️ CONFLICT

Truth: 2022
Form:  2023
```

**قاعدة ذهبية:** FormTruth **لا يخمّن الحقيقة**. إذا لم تكن المعلومة معروفة بشكل موثوق، تكون النتيجة:

```text
❓ UNKNOWN
```

---

## ✨ الميزات

- 📥 **استخراج النص** من TXT / PDF / DOCX
- 🔍 **استخراج الحقائق** تلقائيًا: emails, phones, dates, urls, names, national IDs
- 🎯 **استخراج سياقي ذكي** — يفهم `"DOB: 2009-05-12"` و `"Employment Start: 2022"`
- 🌍 **دعم العربية والإنجليزية** في labels
- 🧠 **تطبيع ذكي**:
  - الأرقام: `2022` = `"2022"` = `"  2022  "`
  - التواريخ (غير الملتبسة فقط): `"2009-05-12"` = `"2009/05/12"` = `"25/12/2009"`
  - الهواتف: `"0612345678"` = `"+212612345678"` = `"06 12 34 56 78"`
  - المنطقيات: `True` = `"yes"` = `"نعم"` = `1`
  - النصوص: `"  Yassine Annous  "` = `"Yassine Annous"`
- ⚡ **API سريع** بـ FastAPI
- 🧪 **188 اختبار Python + 100 اختبار JavaScript** يغطّون كل الطبقات

---

## 🚀 مراحل المشروع

| الإصدار    | الوصف                                    | الحالة |
| ---------- | ---------------------------------------- | ------ |
| **v0.1**   | Core Engine (MATCH / CONFLICT / UNKNOWN) | ✅     |
| **v0.2.0** | استخراج TXT                              | ✅     |
| **v0.2.1** | استخراج الحقائق (regex)                  | ✅     |
| **v0.2.2** | بناء Truth Profile                       | ✅     |
| **v0.2.3** | دعم PDF                                  | ✅     |
| **v0.2.4** | دعم DOCX                                 | ✅     |
| **v0.2.5** | استخراج سياقي (Context-aware)            | ✅     |
| **v0.3**   | استخراج بالذكاء الاصطناعي (AI)           | 🚧     |
| **v0.4**   | إضافة المتصفح (Browser Extension)        | ✅     |
| **v0.5**   | تتبّع الطلبات السابقة                    | 🔜     |
| **v1.0**   | Consistency Firewall                     | 🔜     |

---

## 🎯 الهدف النهائي

FormTruth ليس مجرد قارئ PDF أو أداة استخراج بيانات.

الهدف هو بناء **طبقة تحقق من البيانات قبل إرسال النماذج المهمة**.

> **Check before you submit.**

---

## 📦 التثبيت

```bash
git clone https://github.com/msyassine444/FormTruth.git
cd FormTruth
python -m venv .venv
```

**Windows:**

```powershell
.venv\Scripts\Activate.ps1
```

**Linux / macOS:**

```bash
source .venv/bin/activate
```

ثم:

```bash
pip install -r requirements.txt
```

---

## 🚀 التشغيل

```bash
uvicorn backend.main:app --reload
```

افتح:

- 🌐 **API**: http://127.0.0.1:8000
- 📖 **Swagger UI**: http://127.0.0.1:8000/docs

---

## 🧪 الاختبارات

```bash
python -m pytest
```

المتوقع:

```text
188 passed in ~2s
```

---

## 📡 واجهات API

### `GET /`

فحص سريع + رقم الإصدار.

**Response:**

```json
{
  "message": "FormTruth is running",
  "version": "1.0.0"
}
```

---

### `POST /compare`

مقارنة Truth Profile مع نموذج.

**Request:**

```json
{
  "truth": {
    "name": "ياسين العلمي",
    "phone": "0612345678",
    "dob": "2009-05-12"
  },
  "form": {
    "name": "ياسين العلمي",
    "phone": "+212612345678",
    "dob": "2009/05/12"
  }
}
```

**Response:**

```json
{
  "results": [
    {
      "field": "name",
      "status": "MATCH",
      "truth": "ياسين العلمي",
      "form": "ياسين العلمي"
    },
    {
      "field": "phone",
      "status": "MATCH",
      "truth": "0612345678",
      "form": "+212612345678"
    },
    {
      "field": "dob",
      "status": "MATCH",
      "truth": "2009-05-12",
      "form": "2009/05/12"
    }
  ],
  "summary": { "MATCH": 3, "CONFLICT": 0, "UNKNOWN": 0 }
}
```

**معاني الحالات:**

- ✅ `MATCH` — القيمتان متطابقتان بعد التطبيع
- ⚠️ `CONFLICT` — عندنا قيمة مرجعية، لكنها مختلفة
- ❓ `UNKNOWN` — ما عندنا قيمة مرجعية لهذا الحقل

---

### `POST /extract`

استخراج النص الخام من ملف.

**Request:** `multipart/form-data` مع حقل `file`.

**Response:**

```json
{
  "filename": "cv.pdf",
  "content_type": "application/pdf",
  "size": 12345,
  "text": "..."
}
```

---

### `POST /extract-facts`

استخراج حقائق منظمة + سياقية من ملف.

**Request:** `multipart/form-data` مع حقل `file`.

**Response:**

```json
{
  "filename": "cv.txt",
  "size": 123,
  "facts": {
    "emails": ["Yassine Annous@example.com"],
    "phones": ["612345678"],
    "dates": ["2009-05-12"],
    "urls": ["https://Yassine Annous.dev"],
    "names": ["ياسين العلمي"],
    "national_ids": []
  },
  "contextual": {
    "name": "ياسين العلمي",
    "email": "Yassine Annous@example.com",
    "phone": "612345678",
    "dob": "2009-05-12",
    "employment_start": "2022"
  }
}
```

---

### `POST /build-truth`

تحويل `facts` + `contextual` إلى Truth Profile.

**Request:**

```json
{
  "facts": {
    "names": ["ياسين العلمي"],
    "emails": ["Yassine Annous@example.com"],
    "phones": ["612345678"],
    "dates": ["2009-05-12"],
    "urls": [],
    "national_ids": []
  },
  "contextual": {
    "name": "ياسين العلمي",
    "dob": "2009-05-12"
  },
  "hints": {}
}
```

**Response:**

```json
{
  "truth": {
    "name": "ياسين العلمي",
    "email": "Yassine Annous@example.com",
    "phone": "612345678",
    "dob": "2009-05-12"
  },
  "warnings": []
}
```

**الأولوية:**

1. `hints` — المستخدم يعرف أفضل (الأعلى)
2. `contextual` — من `"Label: Value"`
3. `facts` — استخراج عام (الأقل)

---

## 🎬 مثال كامل — Pipeline

```bash
# 1. استخرج الحقائق من CV
curl -X POST http://127.0.0.1:8000/extract-facts \
  -F "file=@cv.pdf"

# 2. ابنِ Truth Profile
curl -X POST http://127.0.0.1:8000/build-truth \
  -H "Content-Type: application/json" \
  -d '{"facts": {...}, "contextual": {...}, "hints": {}}'

# 3. قارن مع النموذج الحالي
curl -X POST http://127.0.0.1:8000/compare \
  -H "Content-Type: application/json" \
  -d '{"truth": {...}, "form": {...}}'
```

### مثال عملي:

```text
📄 cv.txt:
Name: Yassine Annous
Email: Yassine Annous@example.com
Phone: 0612345678
DOB: 2009-05-12
Employment Start: 2022

        ↓ /extract-facts

📊 facts + contextual

        ↓ /build-truth

🧠 Truth Profile:
{
  "name": "Yassine Annous",
  "email": "Yassine Annous@example.com",
  "phone": "612345678",
  "dob": "2009-05-12",
  "employment_start": "2022"
}

        ↓ /compare مع النموذج

🌐 Form:
{
  "name": "Yassine Annous",
  "phone": "+212612345678",
  "dob": "2009/05/12",
  "employment_start": "2023"
}

        ↓

⚠️ نتائج المقارنة:
{
  "results": [
    {"field": "name",             "status": "MATCH"},
    {"field": "phone",            "status": "MATCH"},
    {"field": "dob",              "status": "MATCH"},
    {"field": "employment_start", "status": "CONFLICT"}  ← ⚠️
  ],
  "summary": {"MATCH": 3, "CONFLICT": 1, "UNKNOWN": 0}
}
```

**FormTruth أنقذك من كتابة 2023 بدل 2022!** 🎉

---

## 🧠 قواعد التطبيع

| النوع         | أمثلة                                                             |
| ------------- | ----------------------------------------------------------------- |
| **الأرقام**   | `2022` = `"2022"` = `"  2022  "`                                  |
| **التواريخ**  | `"2009-05-12"` = `"2009/05/12"` = `"25/12/2009"` (الملتبسة مثل `"05/12/2009"` → UNKNOWN) |
| **الهواتف**   | `"0612345678"` = `"+212612345678"` = `"06 12 34 56 78"`           |
| **المنطقيات** | `True` = `"yes"` = `"نعم"` = `1`                                  |
| **النصوص**    | `"  Yassine Annous  "` = `"Yassine Annous"`                                     |

---

## 🌐 إضافة المتصفح (Browser Extension)

تتحقق من نموذج الويب الحالي مقابل **Truth Profile** — والمقارنة تتم **محليًا** داخل المتصفح، ولا تُرسل قيم النموذج إلى أي خادم.

### التركيب (Developer mode)
1. افتح `chrome://extensions/`
2. فعّل **Developer mode**
3. **Load unpacked** ← اختر مجلد `formtruth-extension/`

### المسار الكامل
```text
📄 Documents
      ↓  POST /extract-facts
🧩 facts + contextual
      ↓  POST /build-truth
🧠 Truth Profile (JSON)
      ↓  Import داخل الإضافة (تبويب Profile)
🌐 Web Form
      ↓  Scan this page (محلي)
✅ MATCH / ⚠️ CONFLICT / ❓ UNKNOWN / ⬜ EMPTY
```

### معاني الحالات
| الحالة | المعنى |
| ------ | ------ |
| **MATCH** | الحقل له قيمة تطابق Truth Profile |
| **CONFLICT** | الحقل له قيمة تعارض Truth Profile |
| **UNKNOWN** | لا توجد معلومة موثوقة كافية (لا تخمين) |
| **EMPTY** | الحقل فارغ |

> التواريخ الملتبسة مثل `05/12/2009` تُعتبر **UNKNOWN** ولا تُخمَّن أبدًا.

### استيراد Truth Profile
1. شغّل الخادم: `uvicorn backend.main:app --reload`
2. استخرج الحقائق وابنِ الملف:
   ```bash
   curl -X POST http://127.0.0.1:8000/extract-facts -F "file=@cv.pdf"
   curl -X POST http://127.0.0.1:8000/build-truth \
     -H "Content-Type: application/json" \
     -d '{"facts": {...}, "contextual": {...}, "hints": {}}'
   ```
3. افتح الإضافة ← تبويب **Profile** ← **Import / export Truth Profile** ← الصق رد `/build-truth` (أو ملف JSON).
4. انتقل إلى النموذج ← تبويب **Scan** ← **Scan this page**.

### اختبارات الإضافة
```bash
cd formtruth-extension
node --test
```

### الخصوصية
- المقارنة **محلية بالكامل**؛ لا تُنقل قيم حقول النموذج عبر الشبكة.
- لا صلاحيات شبكة (`activeTab` + `scripting` + `storage` فقط).
- يمكن حذف الملف المخزَّن أي وقت عبر **Clear profile**.
- الملفات المرفوعة لا تُخزَّن على الخادم.

### Smart Form Intelligence الحقيقية (الممندة في الإضافة)
ترتيب أولوية الإشارات المستخدمة لتعريف الحقل (`lib/identify.js`):
1. `type=email|tel|url` (الأقوى)
2. `autocomplete` (`given-name`, `family-name`, `bday`, ...)
3. `aria-labelledby` → `aria-label` → `<label>` (تسميات الوصولية تتفوق على name/id)
4. `data-field` / `data-testid` / `data-test`
5. `placeholder` / `title`
6. `name` / `id` (الأضعف — قد تكون مضللة)

- ✅ دعم `aria-labelledby` (يتم حلّ المعرّفات المشار إليها بأمان)
- ✅ يقرأ الحقول من **iframes** (`allFrames`)
- ✅ يكشف الحقول **المضافة بعد التحميل** عبر `MutationObserver` خفيف يظهر تنبيه "الصفحة تغيّرت — أعد الفحص" دون إعادة فحص تلقائية مستمرة
- ✅ **إزالة تكرار آمنة**: يدمج فقط الحقول المتطابقة (نفس الحقل/نفس الإطار/نفس القيمة) ولا يخفي حقولًا بقيَم مختلفة
- ✅ قاموس مرادفات عربي + إنجليزي مشترك (`backend/parsers/fields.json`)

### حدود معروفة (MVP)
- حقول `contenteditable` غير مفحوصة.
- تطبيع الهاتف الافتراضي يطرح بادئة دولة المغرب (+212)؛ ويمكن تمرير بادئة دولة أخرى كخيار برمجي، لكن **المطابقة بين صيغة دولية ومحلية لدولة ثالثة بدون بادئة دولية/رمز الدولة غير مضمونة**.
- حالة `EMPTY` خاصة بالإضافة ولا نظير لها في الباكند (الباكند يعطي UNKNOWN)؛ موثّقة في parity test.
- لا يوجد إعادة فحص تلقائية دورية — الفحص يدوي عبر "Scan this page"، والتغييرات الديناميكية تظهر كتنبيه فقط.
- التواريخ الملتبسة لا تُخمَّن أبدًا (UNKNOWN).
- حد أقصى لحجم الرفع 5MB افتراضيًا، قابل للضبط عبر متغير البيئة `FORM_TRUTH_MAX_UPLOAD_BYTES`.

---


## 🏗️ المعمارية

```text
backend/
├── main.py                    # FastAPI app — endpoints
├── models.py                  # Pydantic models
├── services.py                # Consistency Engine (المقارنة)
├── extractors/                # استخراج النص من الملفات
│   ├── base.py                # واجهة موحدة
│   ├── txt_extractor.py
│   ├── pdf_extractor.py
│   ├── docx_extractor.py
│   └── dispatcher.py          # يختار extractor حسب الامتداد
├── parsers/                   # استخراج الحقائق من النص
│   ├── facts.py               # regex عام
│   └── context.py             # regex سياقي (Label: Value)
└── builders/
    └── truth_builder.py       # دمج facts + contextual → truth
```

### إضافة المتصفح

```text
formtruth-extension/
├── manifest.json              # MV3: activeTab + scripting + storage (بلا صلاحيات شبكة)
├── background.js              # badge: MATCH / CONFLICT / UNKNOWN
├── popup.html / popup.js      # الملف + الاستيراد + الفحص (صفحة إضافة → تدعم ES modules)
└── lib/
    ├── fields.js              # قاموس الحقول (مُولَّد من backend/parsers/fields.json)
    ├── canonicalize.js        # توحيد أسماء الحقول
    ├── identify.js            # تعريف الحقول من DOM
    ├── compare.js             # MATCH / CONFLICT / UNKNOWN / EMPTY
    ├── dates.js               # تواريخ بلا تخمين
    ├── profile.js             # استيراد/تصدير Truth Profile
    ├── storage.js             # تخزين محلي (قابل للحذف)
    ├── exporter.js            # تقرير JSON
    └── clipboard.js
    ├── dynamic.js             # lightweight MutationObserver for dynamic forms
    ├── dedupe.js              # safe duplicate handling for scan results
    └── firewall.js            # Consistency Firewall (extracted from popup.js)
```

**قاموس الحقول المشترك:** `backend/parsers/fields.json` هو المصدر الوحيد لأسماء الحقول ومرادفاتها.
يقرؤه الباكند مباشرة، ويُولَّد منه `formtruth-extension/lib/fields.js` عبر `python tools/sync_fields.py`
(ويحرس اختبارُ `tests/test_field_vocabulary.py` عدم الانحراف).


---

## 📂 هيكل المشروع

```text
FormTruth/
├── backend/                   # الكود المصدري (FastAPI)
├── tests/                     # 188 اختبار Python
├── tools/                     # مزامنة قاموس الحقول (fields.json → fields.js)

├── documents/                 # ملفات تجريبية
├── formtruth-extension/       # إضافة المتصفح (Chrome MV3, v0.6.0)
├── .gitignore
├── pytest.ini
├── requirements.txt
├── pyproject.toml
├── LICENSE
└── README.md
```

---

## 🛠️ التقنيات

| التقنية              | الاستخدام          |
| -------------------- | ------------------ |
| **FastAPI**          | إطار الويب         |
| **Pydantic**         | التحقق من البيانات |
| **pypdf**            | قراءة PDF          |
| **python-docx**      | قراءة DOCX         |
| **pytest**           | الاختبارات         |
| **python-multipart** | رفع الملفات        |

---

## 🤝 المساهمة

نرحّب بـ Pull requests.

- 🐛 للأخطاء: افتح Issue
- 💡 للاقتراحات: افتح Issue مع `enhancement`
- 🔧 للتطوير: اعمل fork و PR

### قواعد commit

نستخدم **Conventional Commits**:

```text
feat:     ميزة جديدة
fix:      إصلاح
docs:     توثيق
test:     اختبارات
refactor: إعادة هيكلة
chore:    مهام صيانة
```

---

## 📜 الرخصة

MIT — اطلع على [LICENSE](LICENSE).

---

## 📚 وثائق تجارية

- [PRIVACY.md](PRIVACY.md) — ما الذي تعالجه FormTruth، وأين يُخزَّن، وهل تُرسل البيانات.
- [SECURITY.md](SECURITY.md) — مراجعة الأمان v1.0.
- [CHANGELOG.md](CHANGELOG.md) — سجل التغييرات.
- [COMMERCIAL_ROADMAP.md](COMMERCIAL_ROADMAP.md) — خارطة طريق ما بعد v1.0.
- [QA_CHECKLIST.md](QA_CHECKLIST.md) — قائمة فحص العالم الحقيقي.

## 🏅 النتيجة (Consistency Score) — v1.0

درجة حتمية وقابلة للتفسير في نتيجة الفحص:

- كل حقل معرَّف له قيمة في Truth Profile: MATCH = 1، UNKNOWN = 0.5، CONFLICT = 0.
- الحقول الفارغة (EMPTY) تُستبعد من المقام.
- الحقول غير الموجودة في الملف الشخصي تُستبعد.
- النتيجة = `round(100 × النقاط / الحقول المعتبرة)`، عدد صحيح من 0 إلى 100.

## 👤 ملفات شخصية متعددة — v1.0

يمكن إنشاء عدة Truth Profiles (Personal / Work / School…) والتبديل بينها من تبويب
Profile. الإعدادات (بادئة دولة الهاتف، تفعيل الـ Firewall) تُحفَظ محليًا في
`chrome.storage.local`. لا تُخزَّن قيم الحقول الشخصية في الـ History — فقط أسماء
الحقول والأعداد والدرجة.

<p align="center">
  <b>Check before you submit.</b><br>
  <sub>Built with ❤️ using FastAPI</sub>
</p>
