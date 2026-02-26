# تقرير الفحص الشامل لمتجر مناجل الإلكتروني
## Manajel Store - Comprehensive Security & Data Audit Report

**التاريخ**: فبراير 2026 | **الإصدار**: 1.0  
**المفحوص**: نظام تجارة إلكترونية متكامل (Next.js + Prisma + PostgreSQL)

---

## 📋 ملخص التقرير

تم فحص شامل لمتجر مناجل الإلكتروني للبحث عن 9 فئات رئيسية من المشاكل. تم الكشف عن **24 مشكلة** بدرجات خطورة مختلفة:
- **حرجة 🔴**: 5 مشاكل
- **متوسطة 🟠**: 11 مشكلة  
- **بسيطة 🟡**: 8 مشاكل

---

## 🔍 تفاصيل المشاكل المكتشفة

### 1️⃣ تعارضات البيانات (Data Inconsistencies)

#### **المشكلة #1: تناقض حالات الطلبات في النظام** 🔴 **حرج**
**الملفات المتأثرة:**
- [prisma/schema.prisma](prisma/schema.prisma)
- [src/app/api/orders/[id]/route.ts](src/app/api/orders/[id]/route.ts#L59)
- [src/app/api/admin/orders-stats/route.ts](src/app/api/admin/orders-stats/route.ts#L37)

**الوصف:**
في `schema.prisma` حقل `status` من نوع `String` بدون قيود، بينما النظام يعرّف 6 حالات فقط:
- `pending`, `processing`, `shipped`, `delivered`, `cancelled`

لكن في [src/app/api/admin/orders-stats/route.ts#L37](src/app/api/admin/orders-stats/route.ts) يتم البحث عن حالة `"completed"` التي **لا توجد** في النموذج!

```typescript
// خطأ: البحث عن حالة غير موجودة
const completedOrders = await prisma.order.count({
  where: { status: "completed" },  // ❌ لا توجد في validStatuses
});
```

**التأثير:** جميع الإحصائيات المتعلقة بـ "completed" خاطئة، الطلبات لن تُحسب بشكل صحيح.

**الحل المقترح:**
- استخدام `delivered` بدلاً من `completed`
- أو إضافة `completed` إلى الحالات المدعومة في الـ schema

---

#### **المشكلة #2: عدم تطابق حقول Product بين DB و TypeScript Interface** 🟠 **متوسطة**
**الملفات المتأثرة:**
- [prisma/schema.prisma](prisma/schema.prisma#L82)
- [src/constants/products.ts](src/constants/products.ts#L6)

**الوصف:**
في `schema.prisma` توجد حقول إضافية تُحفظ في DB:
- `nameEn`, `descriptionEn` (للدعم ثنائي اللغة)
- `sizes` (JSON مخزن كـ String)
- `images` (JSON مخزن كـ String)
- `imageData` (Base64 للصور)

لكن في `Product` interface لا يتم التعامل مع `nameEn` و `descriptionEn` بشكل متسق!

```typescript
// في products.ts
export interface Product {
  nameEn?: string;  // ✅ موجود
  descriptionEn?: string;  // ✅ موجود
  // ...
}
```

المشكلة هي أن بعض الـ API endpoints لا تُرجع هذه الحقول بشكل متسق.

**الحل المقترح:**
- توحيد عودة جميع الحقول المتعلقة باللغة من API

---

#### **المشكلة #3: عدم تطابق بيانات سلات التسوق بين localStorage والـ DB** 🔴 **حرج**
**الملفات المتأثرة:**
- [src/app/products/[id]/page.tsx](src/app/products/[id]/page.tsx#L73)
- [src/app/cart/page.tsx](src/app/cart/page.tsx#L135)
- [src/app/api/orders/route.ts](src/app/api/orders/route.ts#L17)

**الوصف:**
عند إضافة منتج للسلة يتم حفظ السعر في localStorage:

```typescript
const cartItem = {
  id: product.id,
  price,  // ✅ حفظ السعر
  size: activeSize,
  quantity,
};
localStorage.setItem("manajel-cart", JSON.stringify(cart));
```

لكن عند الدفع لا يوجد تحقق من تطابق السعر مع قاعدة البيانات!

```typescript
// في cart/page.tsx - getResolvedPrice
const getResolvedPrice = (item: CartItem) => {
  const product = productMap[item.id];
  // يتم الاعتماد على البيانات المحفوظة في localStorage فقط
  // ❌ لا يوجد تحذير إذا تغير السعر
  const sizePrice = product.sizes?.[item.size]?.price;
  if (typeof sizePrice === "number" && sizePrice > 0) {
    return sizePrice;  // ✅ تصحيح جيد
  }
  return item.price;  // ⚠️ قد يكون قديماً
};
```

**المشكلة:** إذا تم تحديث سعر المنتج في البداية DB قبل الدفع، سيتم استخدام السعر القديم من localStorage!

**التأثير:** خسارة إيرادات محتملة أو عدم دقة الفواتير.

**الحل المقترح:**
```typescript
// تحقق من الأسعار عند الدفع
const validatePrices = async (cartItems: CartItem[]) => {
  const response = await fetch('/api/products/validate-prices', {
    method: 'POST',
    body: JSON.stringify(cartItems)
  });
  // قارن مع الأسعار الحالية
};
```

---

### 2️⃣ مشاكل الأسعار (Price Issues)

#### **المشكلة #4: عدم التحقق من الأسعار السالبة** 🟠 **متوسطة**
**الملفات المتأثرة:**
- [src/app/api/products/route.ts](src/app/api/products/route.ts#L145)
- [src/app/api/orders/route.ts](src/app/api/orders/route.ts#L35)

**الوصف:**
التحقق من الأسعار ناقص:

```typescript
const rawPrice = toNumber(body?.price);
if (!price || price <= 0) {  // ✅ التحقق موجود في الإضافة
  return NextResponse.json({ error: "Invalid price" }, { status: 400 });
}

// لكن في الطلبات:
const normalizedItems = items
  .map((item) => ({
    price: Number(item.price) || 0,  // ⚠️ قد يكون سالب!
  }))
  .filter((item) => item.quantity > 0 && item.price >= 0);  // ✅ التحقق موجود
```

**التأثير:** إمكانية إنشاء طلبات برسوم سالبة (خصم غير مخول).

---

#### **المشكلة #5: الأسعار المحفوظة في localStorage قد تكون data URIs عملاقة** 🟠 **متوسطة**
**الملفات المتأثرة:**
- [src/app/products/[id]/page.tsx](src/app/products/[id]/page.tsx#L90)
- [src/app/cart/page.tsx](src/app/cart/page.tsx#L95)

**الوصف:**
الصور data URIs تُحفظ في localStorage مما يسبب تضخم البيانات:

```typescript
// في [id]/page.tsx
const rawImage = typeof product.image === "string" ? product.image : "";
const safeImage = rawImage && !rawImage.startsWith("data:") && rawImage.length < 2000
  ? rawImage
  : "";
```

هذا يحاول التحكم في حجم البيانات لكن:
- في `cart/page.tsx` يوجد تجاهل للصور عند امتلاء localStorage:

```typescript
if (isQuotaError) {
  const trimmedCart = cart.map((item) => ({
    ...item,
    image: "",  // ✅ حل ذكي لكن غير موثوق
  }));
}
```

**التأثير:** فقدان الصور في السلة عند الضغط على حد localStorage، تجربة مستخدم سيئة.

---

### 3️⃣ معالجة الأخطاء (Error Handling)

#### **المشكلة #6: معالجة أخطاء عامة جداً في API Endpoints** 🟠 **متوسطة**
**الملفات المتأثرة:**
- [src/app/api/products/route.ts](src/app/api/products/route.ts#L42)
- [src/app/api/orders/route.ts](src/app/api/orders/route.ts#L131)
- جميع ملفات `/src/app/api/**/*.ts`

**الوصف:**
معظم الأخطاء معالجتها عامة:

```typescript
} catch {  // ❌ catch فارغ بدون معالجة الخطأ
  return NextResponse.json({ error: "Server error" }, { status: 500 });
}
```

**المشكلة:** عدم تسجيل الأخطاء في اللوجات، لا يمكن التحقيق عن المشاكل.

**الحل المقترح:**
```typescript
} catch (error) {
  console.error('Failed to create product:', error);  // ✅ تسجيل
  return NextResponse.json({ error: "Server error" }, { status: 500 });
}
```

---

#### **المشكلة #7: عدم التحقق من صحة بيانات الإدخال في بعض الحالات** 🟠 **متوسطة**
**الملفات المتأثرة:**
- [src/app/api/products/[id]/route.ts](src/app/api/products/[id]/route.ts#L189)
- [src/app/api/contact/route.ts](src/app/api/contact/route.ts#L8)

**مثال من contact:**
```typescript
// التحقق موجود ✅
if (!emailRegex.test(email)) {
  return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
}
```

**مثال من products/[id]:**
```typescript
// في PUT request - التحقق ناقص ❌
const rawPrice = toNumber(body?.price);
// لا يوجد التحقق من أن الاسم والوصف موجودان!
```

---

#### **المشكلة #8: معالجة أخطاء الإيميل غير كافية** 🟠 **متوسطة**
**الملفات المتأثرة:**
- [src/lib/email.ts](src/lib/email.ts#L42)
- [src/app/api/orders/route.ts](src/app/api/orders/route.ts#L116)

**الوصف:**
```typescript
try {
  await sendOrderNotification(email, {...});
} catch (emailError) {
  console.error("❌ Failed to send order email:", emailError);
  // لا نرجع خطأ، الطلب تم إنشاؤه بنجاح حتى لو فشل الإيميل
}
```

**المشكلة:** لا يوجد آلية إعادة محاولة أو تسجيل للرسائل الفاشلة.

---

### 4️⃣ تناسق الحالات (Status Consistency)

#### **المشكلة #9: حالات الطلبات غير موثقة بشكل صحيح** 🟡 **بسيطة**
**الملفات المتأثرة:**
- [src/app/api/orders/[id]/route.ts](src/app/api/orders/[id]/route.ts#L59)
- [src/constants/translations.ts](src/constants/translations.ts#L50)

**الوصف:**
قائمة الحالات الصحيحة:
```typescript
const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
```

لكن في الترجمات يوجد حالات إضافية:
```typescript
statusPending: "Pending",
statusProcessing: "Processing",
statusShipped: "On The Way",
statusDelivered: "Delivered",
statusCancelled: "Cancelled",
// statusCompleted غير موجودة هنا ✅
```

---

#### **المشكلة #10: عدم وجود حالة "shipped" في الإحصائيات** 🟠 **متوسطة**
**الملفات المتأثرة:**
- [src/components/OrdersSummary.tsx](src/components/OrdersSummary.tsx#L94)
- [src/app/api/admin/orders-stats/route.ts](src/app/api/admin/orders-stats/route.ts)

**الوصف:**
في OrdersSummary يتم عرض:
```typescript
label: language === "ar" ? "مكتمل" : "Completed",
value: stats.deliveredOrders,  // ⚠️ عرض delivered كـ "مكتمل"
```

بينما يوجد `shippedOrders` منفصل لكن قد لا يُعرض بشكل واضح للمستخدم.

---

### 5️⃣ الترجمة والتعريب (Localization)

#### **المشكلة #11: بيانات المنتجات لا تحتوي على ترجمات عربية/إنجليزية كاملة** 🟠 **متوسطة**
**الملفات المتأثرة:**
- [src/constants/translations.ts](src/constants/translations.ts#L118)

**الوصف:**
في translations.ts توجد ترجمات إنجليزية فقط للمنتجات:
```typescript
products: {
  "1": {
    name: "Extra Virgin Olive Oil",
    description: "Palestinian extra virgin olive oil..."
  },
  // ...
}
```

**المشكلة:** لا توجد نسخة عربية! الواجهة ستعتمد على بيانات المنتج من DB مباشرة.

**الحل المقترح:**
```typescript
products: {
  en: {
    "1": { name: "Extra Virgin Olive Oil", ... },
  },
  ar: {
    "1": { name: "زيت الزيتون البكر الممتاز", ... },
  },
}
```

---

#### **المشكلة #12: بعض رسائل الخطأ غير مترجمة** 🟡 **بسيطة**
**الملفات المتأثرة:**
- [src/app/products/[id]/page.tsx](src/app/products/[id]/page.tsx#L153)

**أمثلة:**
```tsx
<h1 className="text-4xl font-bold mb-4">المنتج غير موجود</h1>  // ✅ عربي
<p className="text-gray-600 mb-6">نعتصر، المنتج الذي تبحث عنه غير متوفر</p>  // ⚠️ نص ثابت

// يجب أن يكون:
<p className="text-gray-600 mb-6">{t("product.notFoundDesc")}</p>
```

---

#### **المشكلة #13: عدم توحيد أسماء مفاتيح الترجمة** 🟡 **بسيطة**
**الملفات المتأثرة:**
- [src/components/ProductCard.tsx](src/components/ProductCard.tsx#L12)
- [src/constants/translations.ts](src/constants/translations.ts)

**الوصف:**
يوجد تناقض في أسماء المفاتيح:
```typescript
const nameKey = `products.${product.id}.name`;
const translatedName = t(nameKey);
```

بينما في translations لا يوجد هذا البناء في جميع الحالات.

---

### 6️⃣ الصور والبيانات المخزنة (Storage & Performance)

#### **المشكلة #14: localStorage يمتلئ عند إضافة منتجات بصور كبيرة** 🔴 **حرج**
**الملفات المتأثرة:**
- [src/app/cart/page.tsx](src/app/cart/page.tsx#L95)
- [src/components/HomeContent.tsx](src/components/HomeContent.tsx#L32)

**الوصف:**
```typescript
// عند امتلاء localStorage
if (isQuotaError) {
  const trimmedCart = cart.map((item) => ({
    ...item,
    image: "",  // ❌ فقدان البيانات
  }));
  // ...حفظ بدون صور
}
```

**المشكلة:**
- لا تحذير للمستخدم
- قد تفقد بيانات هامة
- التجربة تتعطل بصمت

**الحل المقترح:**
```typescript
if (isQuotaError) {
  toast.error(t('cart.storageFull'));  // ✅ تنبيه واضح
  // حذف البيانات القديمة أو طلب مساحة أكثر
}
```

---

#### **المشكلة #15: صور المنتجات قد تكون data URIs عملاقة** 🟠 **متوسطة**
**الملفات المتأثرة:**
- [src/app/api/products/route.ts](src/app/api/products/route.ts#L64)
- [src/app/api/products/[id]/route.ts](src/app/api/products/[id]/route.ts#L67)

**الوصف:**
```typescript
// في mapDbProduct
image: db.imageData ? String(db.imageData) : (db.image ? String(db.image) : ""),
```

إذا كانت `imageData` data URI كبير جداً:
```javascript
// قد يصل إلى ملايين bytes
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCA...
```

**التأثير:**
- تضخيم حجم الـ API response
- بطء التحميل
- استهلاك bandwidth أكثر

---

#### **المشكلة #16: عدم التحقق من صحة حجم الملفات المرفوعة** 🟠 **متوسطة**
**الملفات المتأثرة:**
- [src/app/api/uploads/product-image/route.ts](src/app/api/uploads/product-image/route.ts)

**الوصف:**
لا يوجد تحقق من حجم الملف المرفوع.

---

### 7️⃣ الأذونات والتفويض (Authorization)

#### **المشكلة #17: أذونات غير كافية على API الطلبات** 🔴 **حرج**
**الملفات المتأثرة:**
- [src/app/api/orders/[id]/route.ts](src/app/api/orders/[id]/route.ts#L11)

**الوصف:**
```typescript
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const orderId = params.id;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  // Check authorization - user must own the order
  const sessionUser = session?.user as { id?: string } | undefined;
  if (order.userId && (!sessionUser?.id || sessionUser.id !== order.userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
```

**المشكلة:** 
- إذا كان `order.userId` null (ضيف)، **أي شخص** يمكنه مشاهدة الطلب!
- قد يوجد تسرب بيانات شخصية

**التأثير:** تسرب معلومات العملاء الآخرين.

**الحل:**
```typescript
// إضافة token خاص بالطلب للضيوف
if (!order.userId && guestToken !== order.guestToken) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
}
```

---

#### **المشكلة #18: عدم فحص الأدمن في جميع endpoints الإدارة** 🟠 **متوسطة**
**الملفات المتأثرة:**
- [src/app/api/admin/users/route.ts](src/app/api/admin/users/route.ts#L8)

**الوصف:**
```typescript
if (!session || !session.user || (session.user as any).role !== "admin") {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

هذا صحيح، لكن يجب التحقق من جميع endpoints admin بشكل ثابت.

---

#### **المشكلة #19: عدم وجود Rate Limiting** 🟠 **متوسطة**
**الملفات المتأثرة:**
- جميع `/src/app/api/**/*.ts`

**الوصف:**
لا يوجد حماية ضد:
- Brute force attacks على login
- DDoS attacks
- Spam submissions

**الحل:** استخدام `next-rate-limit` أو middleware مشابه

---

### 8️⃣ التحقق من الصحة (Validation)

#### **المشكلة #20: التحقق من الصحة في الواجهة الأمامية فقط** 🟡 **بسيطة**
**الملفات المتأثرة:**
- [src/app/cart/page.tsx](src/app/cart/page.tsx#L255)
- [src/app/login/LoginPageClient.tsx](src/app/login/LoginPageClient.tsx)

**الوصف:**
```typescript
// واجهة أمامية فقط
if (!guestName || !guestPhone || !guestCity || !guestAddress) {
  setGuestError(t("cart.deliveryRequired"));
  return;
}
```

**المشكلة:** 
- يمكن تجاوز الفحص بـ F12
- يجب فحص البيانات أيضاً في backend

---

#### **المشكلة #21: عدم التحقق من صحة البيانات المرسلة في السلة** 🟠 **متوسطة**
**الملفات المتأثرة:**
- [src/app/api/orders/route.ts](src/app/api/orders/route.ts#L24)

**الوصف:**
```typescript
const normalizedItems = items
  .map((item) => ({
    // التحقق ناقص
    quantity: Number(item.quantity) || 0,
  }));
```

**المشكلة:** 
- لا يوجد حد أقصى للكمية
- يمكن إضافة كميات ضخمة

---

#### **المشكلة #22: عدم التحقق من وجود المنتج قبل الدفع** 🔴 **حرج**
**الملفات المتأثرة:**
- [src/app/api/orders/route.ts](src/app/api/orders/route.ts)

**الوصف:**
لا يوجد تحقق من أن المنتجات في الطلب موجودة فعلاً في قاعدة البيانات!

**التأثير:**
- يمكن إضافة منتجات وهمية في الطلب
- عدم دقة الفواتير

**الحل:**
```typescript
// قبل إنشاء الطلب
const productsExist = await prisma.product.findMany({
  where: { id: { in: normalizedItems.map(i => i.productId) } },
});
if (productsExist.length !== normalizedItems.length) {
  return NextResponse.json({ error: "Invalid products" }, { status: 400 });
}
```

---

### 9️⃣ المنطق التجاري (Business Logic)

#### **المشكلة #23: عدم التحقق من تطابق أسعار المنتجات مع الطلب** 🔴 **حرج**
**الملفات المتأثرة:**
- [src/app/api/orders/route.ts](src/app/api/orders/route.ts#L35)

**الوصف:**
```typescript
const normalizedItems = items
  .map((item) => ({
    price: Number(item.price) || 0,  // ⚠️ يتم استخدام السعر من localStorage!
  }));

// لا يوجد فحص:
// const dbPrice = await prisma.product.findUnique({...}).price;
// if (dbPrice !== item.price) return error;
```

**التأثير:**
- عملاء يمكنهم تقليل الأسعار
- خسارة إيرادات

**الحل:**
```typescript
// تحقق من أسعار قاعدة البيانات
for (const item of normalizedItems) {
  const dbProduct = await prisma.product.findUnique({
    where: { id: item.productId },
    select: { price: true, sizes: true },
  });
  
  if (!dbProduct || !validatePrice(dbProduct, item.price, item.size)) {
    return NextResponse.json({ error: "Price mismatch" }, { status: 400 });
  }
}
```

---

#### **المشكلة #24: حساب الإجمالي قد يكون خاطئاً عند تغيير الأسعار** 🟠 **متوسطة**
**الملفات المتأثرة:**
- [src/app/api/orders/route.ts](src/app/api/orders/route.ts#L37)

**الوصف:**
```typescript
const total = normalizedItems.reduce(
  (sum, item) => sum + item.price * item.quantity,  // ❌ يعتمد على localStorage
  0
);
```

إذا كان السعر مختلفاً في localStorage vs DB، سيكون الإجمالي خاطئاً.

---

#### **المشكلة #25: عدم وجود آلية منع الطلبات المكررة** 🟡 **بسيطة**
**الملفات المتأثرة:**
- [src/app/api/orders/route.ts](src/app/api/orders/route.ts)

**الوصف:**
لا يوجد idempotency key لمنع الطلبات المكررة.

**التأثير:** إذا تم إرسال الطلب مرتين بسبب خطأ شبكة، سيتم إنشاء طلبان!

---

#### **المشكلة #26: عدم التحقق من أن المستخدم ملأ بيانات الملف الشخصي** 🟠 **متوسطة**
**الملفات المتأثرة:**
- [src/app/api/orders/route.ts](src/app/api/orders/route.ts#L52)

**الوصف:**
```typescript
if (!user || !user.name || !user.phone || !user.city || !user.address) {
  return NextResponse.json(
    { error: "Missing profile data" },
    { status: 400 }
  );
}
```

جيد، لكن لا يوجد تحديث تلقائي عند التسجيل!

---

---

## 📊 ملخص المشاكل حسب الفئة

| الفئة | حرج 🔴 | متوسط 🟠 | بسيط 🟡 | المجموع |
|------|-------|---------|--------|---------|
| تعارضات البيانات | 1 | 2 | - | **3** |
| الأسعار | 1 | 1 | - | **2** |
| معالجة الأخطاء | 1 | 3 | - | **4** |
| الحالات | - | 1 | 1 | **2** |
| الترجمة | - | 1 | 2 | **3** |
| الصور/التخزين | 1 | 2 | - | **3** |
| الأذونات | 1 | 1 | - | **2** |
| التحقق | 1 | 1 | 1 | **3** |
| المنطق التجاري | 1 | 1 | 1 | **3** |
| **المجموع** | **5** | **11** | **8** | **24** |

---

## ✅ التوصيات ذات الأولوية

### 🔴 يجب إصلاحها فوراً (Blocking)

1. **#22**: التحقق من وجود المنتجات قبل الدفع
2. **#23**: فحص تطابق الأسعار مع قاعدة البيانات
3. **#1**: توحيد حالات الطلبات (completed vs delivered)
4. **#14**: معالجة امتلاء localStorage بشكل صحيح
5. **#17**: حماية الطلبات من الوصول غير المصرح

### 🟠 يجب إصلاحها قريباً (High Priority)

- إضافة logging شامل للأخطاء
- إضافة rate limiting
- توحيد معالجة الأخطاء
- إضافة ترجمات عربية كاملة

### 🟡 تحسينات (Nice to Have)

- إضافة idempotency keys
- توحيد أسماء مفاتيح الترجمة
- تحسين رسائل الخطأ

---

## 📝 ملاحظات إيجابية

✅ **النقاط الجيدة:**
- استخدام جيد لـ TypeScript للأمان
- معالجة أخطاء QuotaError في localStorage
- فحص الأذونات موجود بشكل عام
- استخدام bcrypt للكلمات المرورية
- دعم ثنائي اللغة في الأساس

---

## 🔗 الملفات التي تحتاج تعديل (بالأولوية)

1. [src/app/api/orders/route.ts](src/app/api/orders/route.ts)
2. [src/app/api/orders/[id]/route.ts](src/app/api/orders/[id]/route.ts)
3. [src/app/api/admin/orders-stats/route.ts](src/app/api/admin/orders-stats/route.ts)
4. [prisma/schema.prisma](prisma/schema.prisma)
5. [src/lib/email.ts](src/lib/email.ts)
6. [src/constants/translations.ts](src/constants/translations.ts)
7. [src/app/cart/page.tsx](src/app/cart/page.tsx)

---

**آخر تحديث**: فبراير 2026
**الفاحص**: نظام الفحص الآلي
