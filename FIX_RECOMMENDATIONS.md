# الحل المقترح للمشاكل الحرجة

## 🔧 خطط الإصلاح التفصيلية

### المشكلة #1: تعارض حالات الطلبات
**الوصف**: البحث عن `status: "completed"` غير موجود

**الحل**:
```typescript
// في src/app/api/admin/orders-stats/route.ts - السطر 37
// من:
const completedOrders = await prisma.order.count({
  where: { status: "completed" },  // ❌
});

// إلى:
const deliveredOrders = await prisma.order.count({
  where: { status: "delivered" },  // ✅
});

// وتحديث الـ schema إذا لزم
// const validStatuses = ["pending", "processing", "shipped", "delivered", "completed", "cancelled"];
// لكن حالياً المدعوم هو: pending, processing, shipped, delivered, cancelled
```

---

### المشكلة #2 و #3: التحقق من الأسعار والمنتجات
**المشكلة**: الأسعار من localStorage قد تكون قديمة، والمنتجات قد لا تكون موجودة

**الحل الشامل** في `src/app/api/orders/route.ts`:

```typescript
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const items: OrderItemInput[] = Array.isArray(body?.items) ? body.items : [];
    const notes = typeof body?.notes === "string" ? body.notes.trim() : "";

    if (!items.length) {
      return NextResponse.json({ error: "No items" }, { status: 400 });
    }

    // ✅ الخطوة 1: التحقق من صحة البيانات الأساسية
    const normalizedItems = items
      .map((item) => ({
        productId: String(item.id),
        name: String(item.name),
        size: String(item.size),
        quantity: Number(item.quantity) || 0,
        price: Number(item.price) || 0,
        image: typeof item.image === "string" ? item.image : undefined,
      }))
      .filter((item) => item.quantity > 0 && item.price >= 0);

    if (!normalizedItems.length) {
      return NextResponse.json({ error: "Invalid items" }, { status: 400 });
    }

    // ✅ الخطوة 2: التحقق من وجود المنتجات وسعرها من DB
    const productIds = [...new Set(normalizedItems.map(i => i.productId))];
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, price: true, sizes: true, inStock: true },
    });

    // تحقق من أن جميع المنتجات موجودة
    if (dbProducts.length !== productIds.length) {
      console.warn('[Orders] Some products not found:', {
        requested: productIds,
        found: dbProducts.map(p => p.id),
      });
      return NextResponse.json(
        { error: "Some products are no longer available" },
        { status: 400 }
      );
    }

    // تحقق من الأسعار
    const productMap = new Map(dbProducts.map(p => [p.id, p]));
    const validatedItems = normalizedItems.map(item => {
      const dbProduct = productMap.get(item.productId);
      if (!dbProduct) {
        throw new Error(`Product ${item.productId} not found`);
      }

      // تحقق من السعر
      let correctPrice = dbProduct.price;
      
      if (item.size && dbProduct.sizes) {
        try {
          const sizes = typeof dbProduct.sizes === 'string' 
            ? JSON.parse(dbProduct.sizes) 
            : dbProduct.sizes;
          const sizePrice = sizes?.[item.size]?.price;
          if (typeof sizePrice === 'number' && sizePrice > 0) {
            correctPrice = sizePrice;
          }
        } catch (e) {
          console.error('Error parsing sizes:', e);
        }
      }

      // تحذير إذا كان السعر مختلفاً
      if (Math.abs(correctPrice - item.price) > 0.01) {
        console.warn('[Orders] Price mismatch for product:', {
          productId: item.productId,
          clientPrice: item.price,
          dbPrice: correctPrice,
        });
        // اختياري: يمكن إرجاع خطأ أو استخدام السعر الجديد
        // لتحسين التجربة، نستخدم السعر الجديد مع تحذير
      }

      return {
        ...item,
        price: correctPrice,  // ✅ استخدام السعر الصحيح
      };
    });

    // ✅ الخطوة 3: حساب الإجمالي الصحيح
    const total = validatedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // بقية الكود...
    let shippingName = "";
    let shippingPhone = "";
    let shippingCity = "";
    let shippingAddress = "";
    let email: string | null = null;
    let userId: string | null = null;

    if (session?.user) {
      const sessionUser = session.user as { id?: string; email?: string | null };
      if (sessionUser.id) {
        userId = sessionUser.id;
        const user = await prisma.user.findUnique({
          where: { id: sessionUser.id },
        });
        if (!user || !user.name || !user.phone || !user.city || !user.address) {
          return NextResponse.json(
            { error: "Missing profile data" },
            { status: 400 }
          );
        }
        shippingName = user.name;
        shippingPhone = user.phone;
        shippingCity = user.city;
        shippingAddress = user.address;
        email = user.email ?? sessionUser.email ?? null;
      }
    }

    if (!userId) {
      shippingName = typeof body?.name === "string" ? body.name.trim() : "";
      shippingPhone = typeof body?.phone === "string" ? body.phone.trim() : "";
      shippingCity = typeof body?.city === "string" ? body.city.trim() : "";
      shippingAddress = typeof body?.address === "string" ? body.address.trim() : "";
      email = typeof body?.email === "string" ? body.email.trim() : null;

      if (!shippingName || !shippingPhone || !shippingCity || !shippingAddress) {
        return NextResponse.json(
          { error: "Missing delivery data" },
          { status: 400 }
        );
      }
    }

    // إنشاء الطلب
    const order = await prisma.order.create({
      data: {
        userId,
        total,
        shippingName,
        shippingPhone,
        shippingCity,
        shippingAddress,
        shippingNotes: notes || null,
        email,
        items: {
          create: validatedItems.map((item) => ({
            productId: item.productId,
            name: item.name,
            size: item.size,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity,
            image: item.image || null,
          })),
        },
      },
    });

    // إرسال الإيميل
    try {
      console.log("📧 Sending order email to:", email ?? "(no customer email)");
      await sendOrderNotification(email, {
        id: order.id,
        total,
        items: validatedItems,
        createdAt: order.createdAt,
      });
      console.log("✅ Order email sent successfully");
    } catch (emailError) {
      console.error("❌ Failed to send order email:", emailError);
    }

    return NextResponse.json({ ok: true, orderId: order.id }, { status: 201 });
  } catch (error) {
    console.error('[Orders POST] Error:', error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
```

---

### المشكلة #4: ثغرة Authorization في عرض الطلبات
**الوصف**: الطلبات من الضيوف يمكن الوصول إليها بدون token

**الحل**:
```typescript
// في src/app/api/orders/[id]/route.ts

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const orderId = params.id;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // ✅ فحص Authorization محسّن
    const sessionUser = session?.user as { id?: string } | undefined;
    
    // الحالة 1: مستخدم مسجل دخول
    if (order.userId) {
      // يجب أن يكون صاحب الطلب أو أدمن
      if (!sessionUser?.id || (sessionUser.id !== order.userId && (session?.user as { role?: string }).role !== "admin")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } else {
      // الحالة 2: طلب من ضيف
      // ✅ يجب أن يقدم guest token صحيح
      const guestToken = req.headers.get('x-guest-token');
      if (!guestToken || guestToken !== generateGuestToken(order.id)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// دالة مساعدة لإنشاء token للضيوف
function generateGuestToken(orderId: string): string {
  const crypto = require('crypto');
  return crypto
    .createHash('sha256')
    .update(orderId + process.env.GUEST_TOKEN_SECRET)
    .digest('hex');
}
```

**وفي خطوة الدفع** في `src/app/cart/page.tsx`:
```typescript
const submitOrder = async (guestData?: {...}) => {
  // ... كود موجود ...

  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      // إضافة guest token إذا كان ضيف
      ...(guestData && { "x-guest-token": generateGuestToken(orderId) }),
    },
    body: JSON.stringify(payload),
  });

  // ... بقية الكود ...
};
```

---

### المشكلة #5: امتلاء localStorage
**الحل**:
```typescript
// في src/app/cart/page.tsx - حوالي السطر 95

// Save cart to localStorage whenever it changes
useEffect(() => {
  if (!isLoading) {
    try {
      localStorage.setItem("manajel-cart", JSON.stringify(cartItems));
    } catch (error) {
      const isQuotaError = error instanceof DOMException && error.name === "QuotaExceededError";
      if (isQuotaError) {
        // ✅ تنبيه واضح للمستخدم
        alert(t("cart.storageFull") || "Storage is full. Some items were removed from cache.");
        
        // محاولة حفظ بدون صور
        const trimmedCart = cartItems.map((item) => ({
          ...item,
          image: "",  // إزالة الصور لتوفير مساحة
        }));
        
        try {
          localStorage.setItem("manajel-cart", JSON.stringify(trimmedCart));
          console.warn("Cart saved without images due to storage limit");
        } catch {
          // إذا فشل حتى هذا، قم بحذف بيانات قديمة
          localStorage.clear();
          try {
            localStorage.setItem("manajel-cart", JSON.stringify(trimmedCart));
          } catch {
            // ✅ إذا فشل كل شيء، أخبر المستخدم
            alert(t("cart.storageCritical") || "Critical: Unable to save cart. Please complete checkout immediately.");
            console.error("CRITICAL: Cannot save cart to localStorage");
          }
        }
      } else {
        // خطأ آخر غير QuotaError
        console.error("Storage error:", error);
      }
    }
  }
}, [cartItems, isLoading, t]);
```

**أضف إلى translations.ts**:
```typescript
cart: {
  // ... كود موجود ...
  storageFull: "Your browser storage is full. Please proceed to checkout.",
  storageCritical: "Critical storage issue. Please complete your purchase immediately.",
}
```

---

## 📋 Checklist الإصلاح

- [ ] إصلاح #1: تحديث orders-stats.ts من completed إلى delivered
- [ ] إصلاح #2 + #3: تطبيق كود التحقق الشامل في orders/route.ts
- [ ] إصلاح #4: إضافة guest token في orders/[id]/route.ts
- [ ] إصلاح #5: تحسين معالجة localStorage في cart/page.tsx
- [ ] Testing شامل لجميع الحالات
- [ ] تحديث التوثيق

---

## 🧪 حالات Testing المقترحة

```typescript
// Test Price Validation
describe('Order Price Validation', () => {
  it('should reject order if product price changed', async () => {
    // محاكاة تغيير السعر
    // التأكد من رفض الطلب
  });

  it('should use database price, not localStorage price', async () => {
    // إرسال سعر مختلف من localStorage
    // التحقق من استخدام سعر DB
  });
});

// Test Product Existence
describe('Order Product Validation', () => {
  it('should reject order with non-existent product', async () => {
    // محاولة إنشاء طلب بـ product ID وهمي
    // التأكد من الرفض
  });
});

// Test Authorization
describe('Guest Order Authorization', () => {
  it('should reject order access without valid guest token', async () => {
    // محاولة الوصول بدون token
    // التأكد من الرفض
  });

  it('should allow access with valid guest token', async () => {
    // الوصول بـ token صحيح
    // التأكد من السماح
  });
});
```

---

**ملاحظة**: يُرجى اختبار جميع التغييرات بدقة قبل النشر في الإنتاج.
