const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const defaultCategories = [
  { name: "Olive Oil", nameAr: "زيت الزيتون" },
  { name: "Zaatar", nameAr: "زعتر بلدي" },
  { name: "Traditional Herbs", nameAr: "الأعشاب التقليدية" },
  { name: "Freekeh", nameAr: "الفريكة" },
  { name: "Pressed Olives", nameAr: "زيتون مكبوس" },
  { name: "Traditional Duqqa", nameAr: "الدقة التقليدية" },
  { name: "Traditional Soap", nameAr: "الصابون التقليدي" },
];

async function seedCategories() {
  console.log('🌱 إضافة التصنيفات الافتراضية...\n');

  for (const category of defaultCategories) {
    try {
      const existing = await prisma.category.findUnique({
        where: { name: category.name }
      });

      if (!existing) {
        await prisma.category.create({
          data: category
        });
        console.log(`✅ تم إضافة: ${category.nameAr} (${category.name})`);
      } else {
        console.log(`⏭️  موجود مسبقاً: ${category.nameAr}`);
      }
    } catch (error) {
      console.error(`❌ خطأ في إضافة ${category.nameAr}:`, error);
    }
  }

  console.log('\n✅ تم الانتهاء من إضافة التصنيفات!');
  await prisma.$disconnect();
}

seedCategories();
