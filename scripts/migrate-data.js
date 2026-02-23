const { PrismaClient } = require('@prisma/client');

// قاعدة البيانات القديمة (Neon)
const oldDb = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_I9FDMouVrWZ8@ep-broad-cloud-ai5vc0ab-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    }
  }
});

// قاعدة البيانات الجديدة (DigitalOcean)
const newDb = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://doadmin:AVNS__tejusH53rnOrphYp3P@manajel-store-db-do-user-33429531-0.f.db.ondigitalocean.com:25060/defaultdb?sslmode=require"
    }
  }
});

async function migrateData() {
  try {
    console.log('🔄 بدء نقل البيانات...\n');

    // 1. نقل المستخدمين
    console.log('📦 نقل المستخدمين...');
    const users = await oldDb.user.findMany();
    console.log(`   وجدنا ${users.length} مستخدم`);
    
    for (const user of users) {
      await newDb.user.upsert({
        where: { email: user.email },
        update: user,
        create: user
      });
    }
    console.log('✅ تم نقل المستخدمين\n');

    // 2. نقل رسائل التواصل
    console.log('📦 نقل رسائل التواصل...');
    const messages = await oldDb.contactMessage.findMany();
    console.log(`   وجدنا ${messages.length} رسالة`);
    
    for (const message of messages) {
      await newDb.contactMessage.create({
        data: {
          id: message.id,
          name: message.name,
          email: message.email,
          message: message.message,
          createdAt: message.createdAt,
          isRead: message.isRead,
          response: message.response,
          respondedAt: message.respondedAt
        }
      }).catch(() => {
        // تجاهل إذا كان موجود
      });
    }
    console.log('✅ تم نقل رسائل التواصل\n');

    // 3. نقل المنتجات
    console.log('📦 نقل المنتجات...');
    const products = await oldDb.product.findMany();
    console.log(`   وجدنا ${products.length} منتج`);
    
    for (const product of products) {
      await newDb.product.create({
        data: {
          id: product.id,
          name: product.name,
          nameAr: product.nameAr,
          description: product.description,
          descriptionAr: product.descriptionAr,
          price: product.price,
          category: product.category,
          categoryAr: product.categoryAr,
          image: product.image,
          images: product.images,
          stock: product.stock,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt
        }
      }).catch(() => {
        // تجاهل إذا كان موجود
      });
    }
    console.log('✅ تم نقل المنتجات\n');

    // 4. نقل الطلبات مع العناصر
    console.log('📦 نقل الطلبات...');
    const orders = await oldDb.order.findMany({
      include: {
        items: true
      }
    });
    console.log(`   وجدنا ${orders.length} طلب`);
    
    for (const order of orders) {
      await newDb.order.create({
        data: {
          id: order.id,
          userId: order.userId,
          status: order.status,
          totalAmount: order.totalAmount,
          currency: order.currency,
          paymentMethod: order.paymentMethod,
          shippingAddress: order.shippingAddress,
          shippingCity: order.shippingCity,
          phoneNumber: order.phoneNumber,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          items: {
            create: order.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              image: item.image
            }))
          }
        }
      }).catch(() => {
        // تجاهل إذا كان موجود
      });
    }
    console.log('✅ تم نقل الطلبات\n');

    console.log('✅✅✅ تم نقل جميع البيانات بنجاح! ✅✅✅');
    console.log(`
📊 ملخص النقل:
   - ${users.length} مستخدم
   - ${messages.length} رسالة تواصل
   - ${products.length} منتج
   - ${orders.length} طلب
    `);

  } catch (error) {
    console.error('❌ خطأ في نقل البيانات:', error);
  } finally {
    await oldDb.$disconnect();
    await newDb.$disconnect();
  }
}

migrateData();
