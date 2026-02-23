const { PrismaClient } = require('@prisma/client');

// قاعدة البيانات الجديدة (DigitalOcean)
const prisma = new PrismaClient();

async function reimportProducts() {
  console.log('🔄 بدء إعادة استيراد المنتجات من Neon...\n');

  // قاعدة البيانات القديمة (Neon)
  const oldDb = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://neondb_owner:npg_I9FDMouVrWZ8@ep-broad-cloud-ai5vc0ab-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
      }
    }
  });

  try {
    // جلب المنتجات من Neon
    const products = await oldDb.product.findMany();
    console.log(`📦 وجدنا ${products.length} منتج في Neon\n`);

    if (products.length === 0) {
      console.log('❌ لا توجد منتجات في Neon للنقل!');
      return;
    }

    // نقل كل منتج
    for (const product of products) {
      try {
        await prisma.product.upsert({
          where: { id: product.id },
          update: product,
          create: product
        });
        console.log(`✅ تم نقل: ${product.name}`);
      } catch (error) {
        console.error(`❌ خطأ في نقل ${product.name}:`, error.message);
      }
    }

    // التحقق من العدد النهائي
    const finalCount = await prisma.product.count();
    console.log(`\n✅ تم الانتهاء! العدد النهائي: ${finalCount} منتج`);

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await oldDb.$disconnect();
    await prisma.$disconnect();
  }
}

reimportProducts();
