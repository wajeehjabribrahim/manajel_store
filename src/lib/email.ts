import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderNotification(
  userEmail: string | null | undefined,
  orderData: {
    id: string;
    total: number;
    items: Array<{ name: string; quantity: number; price: number }>;
    createdAt: Date;
  }
) {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || ['admin@manajel.works'];
  const customerEmail = userEmail && userEmail.trim() ? userEmail : "غير متوفر";
  
  try {
    // إرسال إيميل لجميع الأدمنز
    await resend.emails.send({
      from: 'Manajel Store <info@manajel.works>',
      to: adminEmails,
      subject: `🔔 طلب جديد - Order #${orderData.id}`,
      html: `
        <div style="direction: rtl; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2d5016; text-align: center;">📦 طلب جديد وصل!</h2>
          <p>لديك طلب جديد يحتاج المراجعة</p>
          
          <h3 style="color: #2d5016; margin-top: 20px;">البيانات:</h3>
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
            <a href="http://localhost:3000/admin/orders" style="background-color: #2d5016; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
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
    const emailList = Array.isArray(adminEmails) ? adminEmails : [adminEmails];
    await resend.emails.send({
      from: 'Manajel Store <info@manajel.works>',
      to: emailList,
      subject: `📧 رسالة جديدة من ${contactData.name}`,
      html: `
        <div style="direction: rtl; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2d5016; text-align: center;">📬 رسالة تواصل جديدة</h2>
          
          <p><strong>الاسم:</strong> ${contactData.name}</p>
          <p><strong>البريد الإلكتروني:</strong> ${contactData.email}</p>
          
          <h3 style="color: #2d5016; margin-top: 20px;">الرسالة:</h3>
          <p style="padding: 15px; background-color: #f9f9f9; border-right: 3px solid #2d5016; white-space: pre-wrap;">
            ${contactData.message}
          </p>
          
          <p style="text-align: center;">
            <a href="mailto:${contactData.email}" style="background-color: #2d5016; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              الرد على الرسالة
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
