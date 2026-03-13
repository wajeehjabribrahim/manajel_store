import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderNotification(
  userEmail: string | null | undefined,
  orderData: {
    id: string;
    total: number;
    customerName?: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    createdAt: Date;
  }
) {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || ['admin@manajel.works'];
  const customerEmail = userEmail && userEmail.trim() ? userEmail : "غير متوفر";
  const customerName = orderData.customerName || "زبون جديد";
  const adminOrdersUrl = "https://www.mnajel.com/admin/orders";
  
  try {
    // إرسال إيميل لجميع الأدمنز
    await resend.emails.send({
      from: 'Manajel Store <info@manajel.works>',
      to: adminEmails,
      subject: `🔔 طلب جديد من ${customerName} - Order #${orderData.id}`,
      html: `
        <div style="direction: rtl; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2d5016; text-align: center;">📦 طلب جديد وصل!</h2>
          <p>لديك طلب جديد من <strong>${customerName}</strong> يحتاج المراجعة</p>
          
          <h3 style="color: #2d5016; margin-top: 20px;">البيانات:</h3>
          <p><strong>اسم الزبون:</strong> ${customerName}</p>
          <p><strong>رقم الطلب:</strong> ${orderData.id}</p>
          <p><strong>البريد الإلكتروني للزبون:</strong> ${customerEmail}</p>
          <p><strong>الإجمالي:</strong> ₪${orderData.total}</p>
          <p><strong>التاريخ:</strong> ${new Date(orderData.createdAt).toLocaleString('ar-PS')}</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="background-color: #f0f0f0;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">المنتج</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">الكمية</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">السعر</th>
            </tr>
            ${orderData.items.map(item => `
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${item.name}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">₪${item.price}</td>
              </tr>
            `).join('')}
          </table>
          
          <p style="text-align: center;">
            <a href="${adminOrdersUrl}" style="background-color: #2d5016; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              عرض الطلب كاملاً
            </a>
          </p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
}

export async function sendContactNotification(
  adminEmails: string | string[],
  contactData: {
    name: string;
    email: string;
    message: string;
  }
) {
  try {
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
}

export async function sendSecurityAlert(
  userEmail: string,
  alertData: {
    type: 'failed_login' | 'blocked_login';
    email: string;
    timestamp: Date;
    attempts?: number;
  }
) {
  try {
    const subject = alertData.type === 'blocked_login' 
      ? '🔴 [تنبيه أمان] محاولات دخول مشبوهة متعددة'
      : '🟡 [تنبيه أمان] محاولة دخول فاشلة';

    const message = alertData.type === 'blocked_login'
      ? `تم اكتشاف ${alertData.attempts || 5} محاولات دخول متعددة الفاشلة على الحساب. تم حظر الحساب مؤقتاً لمدة 15 دقيقة.`
      : 'تم اكتشاف محاولة دخول فاشلة. قد تحتاج للتحقق من محاولات الوصول غير المصرح.';

    await resend.emails.send({
      from: 'Manajel Store <info@manajel.works>',
      to: userEmail,
      subject,
      html: `
        <div style="direction: rtl; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d9534f; text-align: center;">🔒 [تنبيه أمان للأدمن]</h2>
          
          <p style="color: #d9534f;"><strong>تم اكتشاف نشاط مشبوه على النظام</strong></p>
          
          <div style="padding: 15px; background-color: #f9f9f9; border-right: 3px solid #d9534f; margin: 20px 0;">
            <p><strong>نوع التنبيه:</strong> ${alertData.type === 'blocked_login' ? '🔴 محاولات دخول متعددة (حساب مغلق)' : '🟡 محاولة دخول فاشلة'}</p>
            <p><strong>البريد الإلكتروني:</strong> ${alertData.email}</p>
            <p><strong>عدد المحاولات:</strong> ${alertData.attempts || 1}</p>
            <p><strong>التاريخ والوقت:</strong> ${new Date(alertData.timestamp).toLocaleString('ar-PS')}</p>
          </div>
          
          <h3 style="color: #2d5016; margin-top: 20px;">التفاصيل:</h3>
          <p>${message}</p>
          
          <h3 style="color: #2d5016; margin-top: 20px;">الإجراء المقترح:</h3>
          <ul style="direction: rtl;">
            <li>راقب هذا الحساب للنشاط المشبوه</li>
            <li>تحقق من سجلات الوصول الأخرى</li>
            <li>قد تحتاج لإعادة تعيين كلمة المرور للمستخدم إذا استمرت المحاولات</li>
            <li>راجع قائمة IPs المحظورة إذا لزم الأمر</li>
          </ul>
          
          <p style="text-align: center; margin-top: 20px;">
            <a href="http://localhost:3000/admin" style="background-color: #2d5016; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              لوحة التحكم
            </a>
          </p>
          
          <p style="color: #999; font-size: 12px; margin-top: 20px; text-align: center; border-top: 1px solid #ddd; padding-top: 10px;">
            هذا البريد تنبيه أمان تلقائي من نظام مناجل. لا تشاركه مع أحد ولا تجاوب عليه.
          </p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('Security alert email error:', error);
    throw error;
  }
}

export async function sendOrderCancellationNotification(
  orderData: {
    id: string;
    customerName?: string | null;
    customerEmail?: string | null;
    total: number;
    cancelledBy: 'admin' | 'user' | 'guest';
    cancelledAt: Date;
  }
) {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || ['admin@manajel.works'];
  const adminOrdersUrl = "https://www.mnajel.com/admin/orders";
  const customerName = orderData.customerName?.trim() || "زبون";
  const customerEmail = orderData.customerEmail?.trim() || "غير متوفر";
  const cancelledByLabel =
    orderData.cancelledBy === 'admin'
      ? 'الأدمن'
      : orderData.cancelledBy === 'guest'
      ? 'زائر'
      : 'المستخدم';

  try {
    await resend.emails.send({
      from: 'Manajel Store <info@manajel.works>',
      to: adminEmails,
      subject: `⚠️ تم إلغاء طلب #${orderData.id}`,
      html: `
        <div style="direction: rtl; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #b91c1c; text-align: center;">⚠️ .تم إلغاء طلب</h2>
          <p>تم إلغاء الطلب التالي ويحتاج متابعة من الإدارة:</p>

          <div style="padding: 14px; background: #fff7ed; border-right: 4px solid #f97316; margin: 16px 0;">
            <p><strong>رقم الطلب:</strong> ${orderData.id}</p>
            <p><strong>اسم الزبون:</strong> ${customerName}</p>
            <p><strong>البريد الإلكتروني:</strong> ${customerEmail}</p>
            <p><strong>الإجمالي:</strong> ₪${orderData.total}</p>
            <p><strong>تم الإلغاء بواسطة:</strong> ${cancelledByLabel}</p>
            <p><strong>التاريخ:</strong> ${new Date(orderData.cancelledAt).toLocaleString('ar-PS')}</p>
          </div>

          <p style="text-align: center; margin-top: 20px;">
            <a href="${adminOrdersUrl}" style="background-color: #2d5016; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              فتح الطلبات في لوحة التحكم
            </a>
          </p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('Order cancellation email error:', error);
    throw error;
  }
}
