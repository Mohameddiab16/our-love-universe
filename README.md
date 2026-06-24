# Our Love Universe 💕 - v2.0

## خطوات التشغيل

### 1. تشغيل SQL في Supabase
1. اذهب لـ Supabase Dashboard → مشروعك → **SQL Editor**
2. انسخ محتوى `supabase-schema.sql` كله والصقه واضغط **Run**

### 2. إعداد Storage (للصور الشخصية)
1. في Supabase → **Storage** → اضغط **New Bucket**
2. اسم الـ Bucket: `avatars`
3. فعّل **Public bucket**

### 3. تشغيل التطبيق
```bash
cd "C:\Users\Mohamed Diab\Desktop\our-love-universe"
npm install
npm run dev
```

ثم افتح: http://localhost:3000

---

## الميزات (v2.0)

### العوالم
- 🌍 عالم شخصي
- 💑 عالم ثنائي
- 👨‍👩‍👧‍👦 عالم عائلي
- دعوة أعضاء بالبريد
- صلاحيات: مشاهد / محرر / مسؤول

### المحتوى
- 📸 ذكريات (مكان + موقع + تاريخ)
- 💌 رسائل الحب مع نظام المزاج
- 🎉 مناسبات مع عد تنازلي
- 🌙 خط زمني جميل
- 📊 إحصائيات شاملة

### التفاعل
- ⚡ تحديات يومية + نقاط
- 🎁 أفكار تواريخ مع فلتر الميزانية
- 💕 اختبار التوافق
- ⏱️ عدّاد الأيام والساعات

### الاشتراكات
- 🌟 مجاني
- 💑 ثنائي ($3.99/شهر)
- 👨‍👩‍👧‍👦 عائلي ($5.99/شهر)
- 🏷️ أكواد ترويجية (مثال: `LOVE2024`)

### لوحة الإدارة
- إحصائيات عامة
- إنشاء أكواد ترويجية
- إدارة المستخدمين
- (تفعيل الإدارة: ضع `is_admin = true` في جدول profiles)

### التخصيص
- 8 مظاهر: Rose, Sunset, Ocean, Forest, Lavender, Coral, Moon, Heart
- وضع مظلم (Dark Mode)
- دعم اللغتين: العربية والإنجليزية
- نسخ احتياطية JSON

### الحساب
- تسجيل بالبريد + رقم الهاتف + صورة شخصية
- تأكيد البريد الإلكتروني
- تغيير كلمة المرور
- ملف شخصي كامل

---

## هيكل الملفات
```
our-love-universe/
├── app/
│   ├── auth/          # تسجيل دخول + إنشاء حساب
│   ├── page.tsx       # Dashboard
│   ├── worlds/        # العوالم
│   ├── memories/      # الذكريات
│   ├── messages/      # الرسائل
│   ├── occasions/     # المناسبات
│   ├── timeline/      # الخط الزمني
│   ├── stats/         # الإحصائيات
│   ├── challenges/    # التحديات
│   ├── date-ideas/    # أفكار التواريخ
│   ├── compatibility/ # اختبار التوافق
│   ├── subscription/  # الاشتراكات
│   ├── admin/         # لوحة الإدارة
│   ├── profile/       # الملف الشخصي
│   ├── settings/      # الإعدادات
│   └── notifications/ # الإشعارات
├── components/
│   ├── Navbar.tsx
│   ├── Modal.tsx
│   ├── AuthGuard.tsx
│   └── DayCounter.tsx
├── contexts/
│   └── AppContext.tsx  # Theme + Dark Mode + Lang
├── lib/
│   ├── supabase.ts
│   ├── auth.ts
│   ├── themes.ts      # 8 مظاهر
│   └── i18n.ts        # عربي + إنجليزي
└── supabase-schema.sql
```
