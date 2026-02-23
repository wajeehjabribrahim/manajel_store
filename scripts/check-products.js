const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProducts() {
  try {
    const products = await prisma.product.findMany();
    console.log('\n📦 عدد المنتجات في قاعدة البيانات:', products.length);
    
    if (products.length === 0) {
      console.log('❌ لا توجد منتجات!\n');
    } else {
      console.log('\n✅ المنتجات الموجودة:');
      products.forEach((p, i) => {
        console.log(`${i + 1}. ${p.name} (${p.nameAr || 'بدون اسم عربي'})`);
      });
      console.log('');
    }
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProducts();
