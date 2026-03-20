# SCI POS - نظام نقطة البيع
## الصناعات الكيميائية السودانية

---

## 🚀 تشغيل محلي (Local)

```bash
# 1. استنساخ المشروع
git clone https://github.com/daoudtajeldeinn-png/Sudanes-Chemical-Industries_POS.git
cd sci-pos

# 2. تثبيت المكتبات
npm install

# 3. إنشاء ملف البيئة
cp .env.local.example .env.local
# افتح .env.local وأضف connection string

# 4. تشغيل التطبيق
npm run dev
```

افتح المتصفح: **http://localhost:3000**

---

## ☁️ نشر على Vercel

### الطريقة الأولى: عبر واجهة Vercel (الأسهل)
1. اذهب إلى https://vercel.com
2. اضغط **"Add New Project"**
3. اختر المستودع من GitHub
4. أضف **Environment Variables**:
   - `MONGODB_URI` = connection string الخاص بك
   - `JWT_SECRET` = أي نص عشوائي طويل
5. اضغط **Deploy** ✅

### الطريقة الثانية: عبر CLI
```bash
npm install -g vercel
vercel login
vercel
# اتبع التعليمات وأضف المتغيرات
```

---

## 🔐 بيانات الدخول الأولى
- **البريد:** admin@sci.sd
- **كلمة المرور:** Admin@123

---

## 📦 مزايا النظام
- ✅ نقطة البيع (POS) - مبيعات سريعة
- ✅ إدارة المنتجات الكيميائية
- ✅ إدارة العملاء والموردين
- ✅ الفواتير وطباعتها
- ✅ التقارير والإحصائيات
- ✅ تنبيهات المخزون المنخفض
- ✅ دعم اللغة العربية RTL
- ✅ يعمل على MongoDB Atlas
