"use client";

import { PRODUCTS, Product, CATEGORIES } from "@/constants/products";
import ProductCard from "@/components/ProductCard";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

const PRODUCTS_BATCH_SIZE = 4;

interface Category {
  id: string;
  name: string;
  nameAr?: string;
}

const normalizeCategoryValue = (value: string) =>
  value.trim().toLowerCase().replace(/[\s_]+/g, "-");

const categoryAliases: Record<string, string[]> = {
  "olive-oil": ["olive-oil", "oliveoil", "olive", "zayt", "zait", "زيت-الزيتون", "زيت"],
  zatar: ["zatar", "zaatar", "za3tar", "thyme", "زعتر", "الزعتر", "زعتر-بلدي"],
  zaatar: ["zatar", "zaatar", "za3tar", "thyme", "زعتر", "الزعتر", "زعتر-بلدي"],
  freekeh: ["freekeh", "freekah", "freakeh", "فريكة", "الفريكة"],
};

const matchesCategory = (raw: string, category: Category) => {
  const normalizedRaw = normalizeCategoryValue(raw);
  const normalizedId = normalizeCategoryValue(category.id);
  const normalizedName = normalizeCategoryValue(category.name);
  const normalizedNameAr = category.nameAr
    ? normalizeCategoryValue(category.nameAr)
    : "";

  if (
    normalizedRaw === normalizedId ||
    normalizedRaw === normalizedName ||
    normalizedRaw === normalizedNameAr
  ) {
    return true;
  }

  const aliases = categoryAliases[normalizedId] || [];
  const aliasesByName = categoryAliases[normalizedName] || [];
  return [...aliases, ...aliasesByName].some(
    (alias) => normalizeCategoryValue(alias) === normalizedRaw
  );
};

const resolveCategoryId = (value: string, categories: Category[]) => {
  const directMatch = categories.find((cat) => matchesCategory(value, cat));
  if (directMatch) {
    return directMatch.id;
  }

  const normalizedValue = normalizeCategoryValue(value);
  const looseMatch = categories.find((cat) => {
    const normalizedId = normalizeCategoryValue(cat.id);
    const normalizedName = normalizeCategoryValue(cat.name);
    const normalizedNameAr = cat.nameAr ? normalizeCategoryValue(cat.nameAr) : "";

    return (
      normalizedId.includes(normalizedValue) ||
      normalizedName.includes(normalizedValue) ||
      normalizedNameAr.includes(normalizedValue) ||
      normalizedValue.includes(normalizedId) ||
      normalizedValue.includes(normalizedName) ||
      (normalizedNameAr ? normalizedValue.includes(normalizedNameAr) : false)
    );
  });

  return looseMatch?.id;
};

const productMatchesSelectedCategory = (
  productCategory: string,
  selectedCategory: string,
  categories: Category[]
) => {
  const resolvedSelected = resolveCategoryId(selectedCategory, categories);
  const resolvedProduct = resolveCategoryId(productCategory, categories);

  if (resolvedSelected && resolvedProduct) {
    return resolvedSelected === resolvedProduct;
  }

  const normalizedProduct = normalizeCategoryValue(productCategory);
  const normalizedSelected = normalizeCategoryValue(selectedCategory);

  if (normalizedProduct === normalizedSelected) {
    return true;
  }

  const selectedCategoryObj = categories.find(
    (cat) =>
      normalizeCategoryValue(cat.id) === normalizedSelected ||
      normalizeCategoryValue(cat.name) === normalizedSelected ||
      (cat.nameAr && normalizeCategoryValue(cat.nameAr) === normalizedSelected)
  );

  if (!selectedCategoryObj) {
    const selectedAliases = categoryAliases[normalizedSelected] || [];
    return selectedAliases.some(
      (alias) => normalizeCategoryValue(alias) === normalizedProduct
    );
  }

  const candidates = new Set<string>([
    normalizeCategoryValue(selectedCategoryObj.id),
    normalizeCategoryValue(selectedCategoryObj.name),
    selectedCategoryObj.nameAr ? normalizeCategoryValue(selectedCategoryObj.nameAr) : "",
  ]);

  const normalizedName = normalizeCategoryValue(selectedCategoryObj.name);
  const aliasesById = categoryAliases[normalizeCategoryValue(selectedCategoryObj.id)] || [];
  const aliasesByName = categoryAliases[normalizedName] || [];

  [...aliasesById, ...aliasesByName].forEach((alias) => {
    candidates.add(normalizeCategoryValue(alias));
  });

  return candidates.has(normalizedProduct);
};

export default function ShopContent() {
  const { t, dir, language } = useLanguage();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(CATEGORIES.map(c => ({ id: c.id, name: c.name, nameAr: c.name })));
  const [deleting, setDeleting] = useState<string | null>(null);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_BATCH_SIZE);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
        }
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setCategoriesLoaded(true);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await fetch(`/api/products?lang=${language}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.products)) {
          setProducts(data.products);
          try {
            localStorage.setItem(`manajel-products-cache-${language}`, JSON.stringify(data.products));
          } catch {
            // ignore cache errors
          }
        }
      }
    } catch {
      // keep fallback
    } finally {
      setProductsLoaded(true);
    }
  };

  useEffect(() => {
    const CACHE_TTL = 60 * 60 * 1000; // 1 hour
    const cacheKey = `manajel-products-cache-${language}`;
    const metaKey = `manajel-products-cache-meta-${language}`;
    let fresh = false;

    try {
      const cached = localStorage.getItem(cacheKey);
      const metaRaw = localStorage.getItem(metaKey);

      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProducts(parsed);
          if (metaRaw) {
            try {
              const meta = JSON.parse(metaRaw);
              const ts = typeof meta?.ts === "number" ? meta.ts : 0;
              if (Date.now() - ts < CACHE_TTL) fresh = true;
            } catch {
              // ignore meta parse
            }
          }
        }
      }

      loadCategories();
      if (!fresh) {
        loadProducts();
      } else {
        setProductsLoaded(true);
      }
    } catch {
      loadCategories();
      loadProducts();
    }

    return () => undefined;
  }, [language]);

  // Read category from URL
  useEffect(() => {
    const category = searchParams.get('category');

    if (!category) {
      setSelectedCategory(null);
      return;
    }

    const matchedCategory = categories.find((cat) => matchesCategory(category, cat));
    setSelectedCategory(matchedCategory?.id ?? category);
  }, [searchParams, categories]);

  const handleDelete = async (productId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
      return;
    }

    setDeleting(productId);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await loadProducts();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data?.error || "فشل حذف المنتج");
      }
    } catch {
      alert("حدث خطأ أثناء الحذف");
    } finally {
      setDeleting(null);
    }
  };

  const filteredProducts = selectedCategory
    ? products.filter(
        (p) =>
          productMatchesSelectedCategory(
            p.category,
            selectedCategory,
            categories
          )
      )
    : products;

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMoreProducts = visibleCount < filteredProducts.length;

  const isLoading = !categoriesLoaded || !productsLoaded;

  useEffect(() => {
    setVisibleCount(PRODUCTS_BATCH_SIZE);
  }, [selectedCategory, language, filteredProducts.length]);

  useEffect(() => {
    if (isLoading || !hasMoreProducts || !loadMoreRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) {
          return;
        }
        setVisibleCount((prev) => Math.min(prev + PRODUCTS_BATCH_SIZE, filteredProducts.length));
      },
      {
        root: null,
        rootMargin: "300px 0px",
        threshold: 0.01,
      }
    );

    observer.observe(loadMoreRef.current);

    return () => {
      observer.disconnect();
    };
  }, [isLoading, hasMoreProducts, filteredProducts.length]);

  // Restore to the last clicked product first (stronger than raw Y),
  // and if lazy-loading hides it, progressively increase visible items.
  // Then fallback to stored Y position.
  useEffect(() => {
    try {
      if (!productsLoaded) return;

      const productId = sessionStorage.getItem('lastProductId');
      const pos = sessionStorage.getItem('manajel:shop:scroll');
      let done = false;
      let tries = 0;

      if (productId) {
        const interval = setInterval(() => {
          const el = document.getElementById(`product-${productId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'auto', block: 'center' });
            done = true;
            clearInterval(interval);
            sessionStorage.removeItem('lastProductId');
            sessionStorage.removeItem('manajel:shop:scroll');
            return;
          }

          // If element is not in DOM yet due to lazy-loading, reveal more cards
          setVisibleCount((prev) => Math.min(prev + PRODUCTS_BATCH_SIZE, filteredProducts.length));

          tries += 1;
          if (tries > 20) {
            clearInterval(interval);
          }
        }, 100);

        setTimeout(() => {
          clearInterval(interval);

          // fallback to Y position if product element wasn't found in time
          if (!done && pos) {
            const n = Number(pos);
            if (!Number.isNaN(n)) {
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  window.scrollTo({ top: n, behavior: 'auto' });
                  sessionStorage.removeItem('manajel:shop:scroll');
                  sessionStorage.removeItem('lastProductId');
                });
              });
            }
          }
        }, 3000);
        return;
      }

      // fallback path when only Y position exists
      if (pos) {
        const n = Number(pos);
        if (!Number.isNaN(n)) {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              window.scrollTo({ top: n, behavior: 'auto' });
              sessionStorage.removeItem('manajel:shop:scroll');
            });
          });
        }
      }
    } catch {
      // ignore
    }
  }, [productsLoaded, filteredProducts.length]);

  return (
    <div className="bg-[#121416] text-[#F2ECE2]">
      <div aria-hidden className="h-8 md:h-12 lg:h-16" />
      {/* Header */}
      <section
        style={{
          background:
            "linear-gradient(180deg, #14171a 0%, #101214 100%)",
          borderBottom: "1px solid rgba(201,166,107,0.25)",
        }}
        className="px-4 py-12 text-white"
      >
        <div className="max-w-7xl mx-auto">
          <h1 className="mb-2 text-3xl sm:text-4xl text-[#C9A66B] leading-tight tajawal-regular-all">{t("shop.title")}</h1>
          <p className="text-sm sm:text-base md:text-lg text-white/80 leading-relaxed tajawal-regular-all">
            {t("shop.subtitle")}
          </p>
        </div>
      </section>

      {/* Shop */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Categories */}
          <div className="lg:w-56 flex-shrink-0">
            <h3 className="mb-4 sm:mb-6 text-lg sm:text-xl font-bold text-[#C9A66B] tajawal-regular-all">
              {t("shop.categories")}
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-1.5 sm:gap-2 tajawal-regular-all">
              {isLoading ? (
                // Categories Skeleton
                <>
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <div key={idx} className="relative h-full animate-pulse">
                      <div className="h-9 sm:h-10 w-full rounded-xl border border-white/10 bg-white/10" />
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`w-full rounded-xl border px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base transition-colors ${
                      selectedCategory === null
                        ? "border-[#C9A66B]/50 bg-[#C9A66B]/20 text-[#F2ECE2]"
                         : "border-white/15 bg-[#121416] text-white/85 hover:border-white/30 hover:text-white"
                    } ${dir === 'rtl' ? 'text-right' : 'text-left'}`}
                    type="button"
                  >
                    {t("shop.allProducts")}
                  </button>
                  {categories.map((category) => {
                    const displayName = language === 'ar' ? (category.nameAr || category.name) : category.name;
                    
                    return (
                      <button
                        key={category.id}
                        onClick={() => {
                          console.log('Selected category:', category.id);
                          setSelectedCategory(category.id);
                        }}
                        className={`w-full rounded-xl border px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base transition-colors ${
                          selectedCategory === category.id
                            ? "border-[#C9A66B]/50 bg-[#C9A66B]/20 text-[#F2ECE2]"
                             : "border-white/15 bg-[#121416] text-white/85 hover:border-white/30 hover:text-white"
                        } ${dir === 'rtl' ? 'text-right' : 'text-left'}`}
                        type="button"
                      >
                        {displayName}
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {!isLoading && (
              <div className="mb-4 text-sm text-white/80">
                {t("shop.showing")} {filteredProducts.length} {t("shop.items")}
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 md:gap-8 auto-rows-fr">
              {isLoading || filteredProducts.length === 0
                ? Array.from({ length: 8 }).map((_, idx) => (
                    <div key={idx} className="relative h-full animate-pulse">
                      <div className="mb-4 h-48 w-full rounded-lg bg-white/10" />
                      <div className="mb-2 h-6 w-3/4 rounded bg-white/10" />
                      <div className="mb-2 h-4 w-1/2 rounded bg-white/10" />
                      <div className="mb-2 h-4 w-1/3 rounded bg-white/10" />
                      <div className="mt-auto h-8 w-1/2 rounded bg-white/10" />
                    </div>
                  ))
                : visibleProducts.map((product, index) => (
                  <div id={`product-${product.id}`} key={product.id} className="relative h-full">
                      <ProductCard 
                        product={product} 
                        animationDelay={index * 50}
                        isFirstProduct={index < 3}
                      />
                      {isAdmin && (
                        <div className="absolute top-2 right-2 flex gap-2 z-10">
                          <button
                            onClick={() => window.location.href = `/admin/products/${product.id}/edit`}
                            className="rounded-lg border border-[#C9A66B]/60 bg-[#14171a]/95 p-2 text-[#F2ECE2] shadow-md backdrop-blur hover:bg-[#1b1f23]"
                            title="تعديل المنتج"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            disabled={deleting === product.id}
                            className="rounded-lg border border-red-400/50 bg-red-500/20 p-2 text-red-200 shadow-md hover:bg-red-500/30 disabled:opacity-50"
                            title="حذف المنتج"
                          >
                            {deleting === product.id ? (
                              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
            </div>

            {!isLoading && hasMoreProducts && (
              <div ref={loadMoreRef} className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => Math.min(prev + PRODUCTS_BATCH_SIZE, filteredProducts.length))}
                  className="gold-button rounded-xl px-5 py-2 text-sm font-bold"
                >
                  {language === "ar" ? "تحميل المزيد" : "Load more"}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
