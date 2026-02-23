import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PRODUCTS, Product } from "@/constants/products";

const toNumber = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const normalizeSizes = (sizes: any, fallbackPrice: number) => {
  if (!sizes || typeof sizes !== "object") {
    return fallbackPrice > 0
      ? { medium: { weight: "", price: fallbackPrice } }
      : undefined;
  }

  const normalized: Record<string, { weight: string; price: number }> = {};
  ("small,medium,large" as const).split(",").forEach((key) => {
    const raw = sizes[key];
    if (raw && typeof raw === "object") {
      const price = toNumber(raw.price);
      if (price > 0) {
        normalized[key] = {
          weight: typeof raw.weight === "string" ? raw.weight.trim() : "",
          price,
        };
      }
    }
  });

  if (Object.keys(normalized).length === 0 && fallbackPrice > 0) {
    normalized.medium = { weight: "", price: fallbackPrice };
  }

  return Object.keys(normalized).length ? normalized : undefined;
};

const mapDbProduct = (db: any, language?: string): Product => {
  const price = toNumber(db.price);
  let parsedSizes: any = undefined;
  if (typeof db.sizes === "string" && db.sizes.trim()) {
    try {
      parsedSizes = JSON.parse(db.sizes);
    } catch {
      parsedSizes = undefined;
    }
  }
  const sizes = normalizeSizes(parsedSizes, price) || {};
  const minPrice = Math.min(
    ...Object.values(sizes).map((s) => toNumber((s as any).price)).filter((v) => v > 0),
    price || Infinity
  );

  // استخدام اللغة الإنجليزية إذا كانت متوفرة واللغة المطلوبة هي الإنجليزية
  const name = (language === 'en' && db.nameEn) ? String(db.nameEn) : String(db.name);
  const description = (language === 'en' && db.descriptionEn) ? String(db.descriptionEn) : String(db.description);

  // Parse images JSON
  let images: string[] = [];
  if (typeof db.images === "string" && db.images.trim()) {
    try {
      const parsed = JSON.parse(db.images);
      images = Array.isArray(parsed) ? parsed : [];
    } catch {
      images = [];
    }
  }

  return {
    id: String(db.id),
    name,
    category: db.category as Product["category"],
    description,
    price: Number.isFinite(minPrice) && minPrice !== Infinity ? minPrice : price,
    sizes,
    image: db.imageData ? String(db.imageData) : (db.image ? String(db.image) : ""),
    images: images.length > 0 ? images : undefined,
    featured: Boolean(db.featured),
    inStock: Boolean(db.inStock),
    rating: toNumber(db.rating) || 0,
    reviews: Number.isFinite(Number(db.reviews)) ? Number(db.reviews) : 0,
  };
};

export async function GET(req: Request) {
  try {
    // الحصول على اللغة من header أو query parameter
    const url = new URL(req.url);
    const language = url.searchParams.get('lang') || 'ar';
    const dbProducts = await prisma.product.findMany({
      orderBy: { displayOrder: "asc" },
    });

    const mapped = dbProducts.map((p) => mapDbProduct(p, language));
    const existingIds = new Set(PRODUCTS.map((p) => p.id));
    const merged = [...PRODUCTS, ...mapped.filter((p: Product) => !existingIds.has(p.id))];

    return NextResponse.json({ products: merged });
  } catch (error) {
    return NextResponse.json({ products: PRODUCTS });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const nameEn = typeof body?.nameEn === "string" ? body.nameEn.trim() : null;
    const description = typeof body?.description === "string" ? body.description.trim() : "";
    const descriptionEn = typeof body?.descriptionEn === "string" ? body.descriptionEn.trim() : null;
    const category = typeof body?.category === "string" ? body.category.trim() : "";
    const image = typeof body?.image === "string" ? body.image.trim() : "";
    const imageData = typeof body?.imageData === "string" ? body.imageData.trim() : "";
    const images = typeof body?.images === "string" ? body.images : null;
    const rawPrice = toNumber(body?.price);

    if (!name || !description || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const sizes = normalizeSizes(body?.sizes, rawPrice);
    const sizePrices = sizes ? Object.values(sizes).map((s) => toNumber(s.price)).filter((v) => v > 0) : [];
    const minPrice = sizePrices.length ? Math.min(...sizePrices) : rawPrice;
    const price = minPrice > 0 ? minPrice : rawPrice;

    if (!price || price <= 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }

    const created = await prisma.product.create({
      data: {
        name,
        nameEn: nameEn || null,
        description,
        descriptionEn: descriptionEn || null,
        category,
        image: image || null,
        imageData: imageData || null,
        images: images || null,
        price,
        sizes: sizes ? JSON.stringify(sizes) : null,
        featured: Boolean(body?.featured),
        inStock: body?.inStock === false ? false : true,
        rating: 0,
        reviews: 0,
      },
    });

    return NextResponse.json({ product: mapDbProduct(created) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
