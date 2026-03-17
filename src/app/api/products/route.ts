import { NextResponse } from "next/server";
import { corsMiddleware, applyCorsHeaders } from "@/lib/cors";
import { prisma } from "@/lib/prisma";
import { PRODUCTS, Product } from "@/constants/products";
import { requireAdminAccess } from "@/lib/adminAuth";
import { ProductSizes, SIZE_KEYS } from "@/lib/productSizes";

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

  const normalized: ProductSizes = {};
  SIZE_KEYS.forEach((key) => {
    const raw = sizes[key];
    if (raw && typeof raw === "object") {
      const price = toNumber(raw.price);
      if (price > 0) {
        const entry: { label?: string; labelEn?: string; weight: string; price: number; salePrice?: number } = {
          weight: typeof raw.weight === "string" ? raw.weight.trim() : "",
          price,
        };
        if (typeof raw.label === "string" && raw.label.trim()) {
          entry.label = raw.label.trim();
        }
        if (typeof raw.labelEn === "string" && raw.labelEn.trim()) {
          entry.labelEn = raw.labelEn.trim();
        }
        const salePrice = toNumber(raw.salePrice);
        if (salePrice > 0 && salePrice < price) entry.salePrice = salePrice;
        normalized[key] = entry;
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
  const ingredients =
    language === 'en' && db.ingredientsEn
      ? String(db.ingredientsEn)
      : db.ingredients
      ? String(db.ingredients)
      : undefined;

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
    ingredients,
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
  // CORS preflight
  // @ts-ignore
  const corsResult = corsMiddleware(req);
  if (corsResult && corsResult instanceof NextResponse && corsResult.body === null) {
    return corsResult;
  }
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

    let response = NextResponse.json({ products: merged });
    response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    response = applyCorsHeaders(response, req.headers.get('origin'));
    return response;
  } catch (error) {
    console.error("Error fetching products:", error);
    let response = NextResponse.json(
      { error: "فشل جلب المنتجات" },
      { status: 500 }
    );
    response = applyCorsHeaders(response, req.headers.get('origin'));
    return response;
  }
}

export async function POST(req: Request) {
  // CORS preflight
  // @ts-ignore
  const corsResult = corsMiddleware(req);
  if (corsResult && corsResult instanceof NextResponse && corsResult.body === null) {
    return corsResult;
  }
  try {
    const adminCheck = await requireAdminAccess();
    if (!adminCheck.ok) {
      let response = adminCheck.response;
      response = applyCorsHeaders(response, req.headers.get('origin'));
      return response;
    }

    const body = await req.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const nameEn = typeof body?.nameEn === "string" ? body.nameEn.trim() : null;
    const description = typeof body?.description === "string" ? body.description.trim() : "";
    const descriptionEn = typeof body?.descriptionEn === "string" ? body.descriptionEn.trim() : null;
    const ingredients = typeof body?.ingredients === "string" ? body.ingredients.trim() : null;
    const ingredientsEn = typeof body?.ingredientsEn === "string" ? body.ingredientsEn.trim() : null;
    const category = typeof body?.category === "string" ? body.category.trim() : "";
    const image = typeof body?.image === "string" ? body.image.trim() : "";
    const imageData = typeof body?.imageData === "string" ? body.imageData.trim() : "";
    const images = typeof body?.images === "string" ? body.images : null;
    const rawPrice = toNumber(body?.price);

    if (!name || !description || !category) {
      let response = NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      response = applyCorsHeaders(response, req.headers.get('origin'));
      return response;
    }

    const sizes = normalizeSizes(body?.sizes, rawPrice);
    const sizePrices = sizes ? Object.values(sizes).map((s) => toNumber(s.price)).filter((v) => v > 0) : [];
    const minPrice = sizePrices.length ? Math.min(...sizePrices) : rawPrice;
    const price = minPrice > 0 ? minPrice : rawPrice;

    if (!price || price <= 0) {
      let response = NextResponse.json({ error: "Invalid price" }, { status: 400 });
      response = applyCorsHeaders(response, req.headers.get('origin'));
      return response;
    }

    const created = await prisma.product.create({
      data: {
        name,
        nameEn: nameEn || null,
        description,
        descriptionEn: descriptionEn || null,
        ingredients: ingredients || null,
        ingredientsEn: ingredientsEn || null,
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
      } as any,
    });

    let response = NextResponse.json({ product: mapDbProduct(created) }, { status: 201 });
    response = applyCorsHeaders(response, req.headers.get('origin'));
    return response;
  } catch (error) {
    let response = NextResponse.json({ error: "Server error" }, { status: 500 });
    response = applyCorsHeaders(response, req.headers.get('origin'));
    return response;
  }
}
