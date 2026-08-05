"use client";

import { PRODUCTS, Product, CATEGORIES } from "@/constants/products";
import ProductCard from "@/components/ProductCard";
import { useEffect, useRef, useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { showToast } from "@/components/Toast";

const PRODUCTS_BATCH_SIZE = 4;

// Products per grid row at each viewport width (must match the grid's
// grid-cols-2 / md:grid-cols-3 / lg:grid-cols-4 / xl:grid-cols-5 classes)
const getGridColumns = (width: number) =>
  width >= 1280 ? 5 : width >= 1024 ? 4 : width >= 768 ? 3 : 2;

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
  const { t, language } = useLanguage();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  // Language the loaded products were fetched for; see filteredProducts.
  const [productsLang, setProductsLang] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>(CATEGORIES.map(c => ({ id: c.id, name: c.name, nameAr: c.name })));
  const [deleting, setDeleting] = useState<string | null>(null);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_BATCH_SIZE);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // One lazy-load step = one full grid row, tracked against the viewport width
  const rowSizeRef = useRef(PRODUCTS_BATCH_SIZE);

  useEffect(() => {
    const updateRowSize = () => {
      rowSizeRef.current = getGridColumns(window.innerWidth);
    };
    updateRowSize();
    window.addEventListener("resize", updateRowSize);
    return () => window.removeEventListener("resize", updateRowSize);
  }, []);

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
          try {
            localStorage.setItem('manajel-categories-cache', JSON.stringify(data));
          } catch {
            // ignore cache errors
          }
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
          setProductsLang(language);
          try {
            localStorage.setItem(`manajel-products-cache-${language}`, JSON.stringify(data.products));
            try {
              localStorage.setItem(
                `manajel-products-cache-meta-${language}`,
                JSON.stringify({ ts: Date.now() })
              );
            } catch {
              // ignore meta cache errors
            }
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

    // Render cached categories instantly so returning to the page doesn't
    // flash skeletons while /api/categories responds (it still refreshes below)
    try {
      const cachedCats = localStorage.getItem('manajel-categories-cache');
      if (cachedCats) {
        const parsedCats = JSON.parse(cachedCats);
        if (Array.isArray(parsedCats) && parsedCats.length > 0) {
          setCategories(parsedCats);
          setCategoriesLoaded(true);
        }
      }
    } catch {
      // ignore cache errors
    }

    try {
      const cached = localStorage.getItem(cacheKey);
      const metaRaw = localStorage.getItem(metaKey);

      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProducts(parsed);
          setProductsLang(language);
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
        showToast(data?.error || "فشل حذف المنتج", "error");
      }
    } catch {
      showToast("حدث خطأ أثناء الحذف", "error");
    } finally {
      setDeleting(null);
    }
  };

  const filteredProducts = useMemo(() => {
    // Products carry names in the language they were fetched for. After a
    // language switch the previous list lingers until the refetch resolves, so
    // it is withheld rather than rendered with the wrong-language names.
    if (productsLang !== language) return [];
    return selectedCategory
      ? products.filter((p) =>
          productMatchesSelectedCategory(p.category, selectedCategory, categories)
        )
      : products;
  }, [products, selectedCategory, categories, productsLang, language]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMoreProducts = visibleCount < filteredProducts.length;

  const isLoading = !categoriesLoaded || !productsLoaded;

  useEffect(() => {
    // Start with two full rows for the current viewport width.
    // Deliberately NOT keyed on filteredProducts.length: a background data
    // refresh must not collapse the list and yank the user back to the top.
    setVisibleCount(rowSizeRef.current * 2);
  }, [selectedCategory, language]);

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
        // Advance to the next full-row boundary so rows never render incomplete
        setVisibleCount((prev) => {
          const row = rowSizeRef.current;
          return Math.min((Math.floor(prev / row) + 1) * row, filteredProducts.length);
        });
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

  // Restore to the last clicked product when returning from a product page.
  // Reveals every row up to that product in ONE state update, then scrolls
  // straight to it — no incremental reveal crawl. Falls back to the stored
  // Y position. Runs once per mount.
  const restoredRef = useRef(false);
  useEffect(() => {
    if (!productsLoaded || restoredRef.current) return;

    try {
      const productId = sessionStorage.getItem('lastProductId');
      const pos = sessionStorage.getItem('manajel:shop:scroll');
      if (!productId && !pos) return;
      restoredRef.current = true;

      const clearKeys = () => {
        try {
          sessionStorage.removeItem('lastProductId');
          sessionStorage.removeItem('manajel:shop:scroll');
        } catch {
          // ignore
        }
      };

      const scrollToStoredY = () => {
        const n = Number(pos);
        if (pos && !Number.isNaN(n)) {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              window.scrollTo({ top: n, behavior: 'auto' });
              clearKeys();
            });
          });
        } else {
          clearKeys();
        }
      };

      if (productId) {
        const index = filteredProducts.findIndex((p) => String(p.id) === String(productId));
        if (index >= 0) {
          // Reveal the product's row plus one extra row in a single update
          const row = rowSizeRef.current;
          const needed = Math.min((Math.ceil((index + 1) / row) + 1) * row, filteredProducts.length);
          setVisibleCount((prev) => Math.max(prev, needed));

          let tries = 0;
          const tick = () => {
            const el = document.getElementById(`product-${productId}`);
            if (el) {
              el.scrollIntoView({ behavior: 'auto', block: 'center' });
              clearKeys();
              return;
            }
            tries += 1;
            if (tries < 30) {
              requestAnimationFrame(tick);
            } else {
              scrollToStoredY();
            }
          };
          requestAnimationFrame(tick);
          return;
        }
      }

      scrollToStoredY();
    } catch {
      // ignore
    }
  }, [productsLoaded, filteredProducts]);

  return (
    <div className="bg-[#FBF8F2] text-[#121416]">
      {/* Header */}
      <section
        style={{
          background:
            "linear-gradient(180deg, #F3EEE3 0%, #FBF8F2 100%)",
          borderBottom: "1px solid rgba(201,166,107,0.25)",
        }}
        className="px-4 py-7 text-[#121416]"
      >
        <div className="max-w-7xl mx-auto">
          <h1 className="mb-2 text-3xl sm:text-4xl text-[#C9A66B] leading-tight tajawal-regular-all">{t("shop.title")}</h1>
          <p className="text-sm sm:text-base md:text-lg text-black/80 leading-relaxed tajawal-regular-all">
            {t("shop.subtitle")}
          </p>
        </div>
      </section>

      {/* Shop */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-2">
          {/* Categories - horizontal chips */}
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2 tajawal-regular-all">
              {isLoading ? (
                // Categories Skeleton
                <>
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <div key={idx} className="relative animate-pulse">
                      <div className="h-9 w-24 rounded-full border border-black/10 bg-black/10" />
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      try {
                        const u = new URL(window.location.href);
                        u.searchParams.delete('category');
                        window.history.pushState({}, '', u.toString());
                      } catch {}
                      setSelectedCategory(null);
                    }}
                    className={`rounded-full border px-4 sm:px-5 py-1.5 sm:py-2 text-sm sm:text-base transition-colors ${
                      selectedCategory === null
                        ? "border-[#C9A66B] bg-[#C9A66B]/20 font-semibold text-[#121416]"
                         : "border-black/15 bg-[#FFFFFF] text-black/85 hover:border-[#C9A66B]/60 hover:text-black"
                    }`}
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
                            try {
                              const u = new URL(window.location.href);
                              u.searchParams.set('category', category.id);
                              window.history.pushState({}, '', u.toString());
                            } catch {}
                            setSelectedCategory(category.id);
                          }}
                        className={`rounded-full border px-4 sm:px-5 py-1.5 sm:py-2 text-sm sm:text-base transition-colors ${
                          selectedCategory === category.id
                            ? "border-[#C9A66B] bg-[#C9A66B]/20 font-semibold text-[#121416]"
                             : "border-black/15 bg-[#FFFFFF] text-black/85 hover:border-[#C9A66B]/60 hover:text-black"
                        }`}
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
              <div className="mb-4 text-sm text-black/80 tajawal-regular-all">
                {(() => {
                  const cat = categories.find((c) => c.id === selectedCategory);
                  const catName = cat
                    ? (language === "ar" ? cat.nameAr || cat.name : cat.name)
                    : t("shop.allProducts");
                  return `${catName} — ${filteredProducts.length} ${t("shop.items")}`;
                })()}
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5 md:gap-6 auto-rows-fr">
              {isLoading || filteredProducts.length === 0
                ? Array.from({ length: 8 }).map((_, idx) => (
                    <div key={idx} className="relative h-full animate-pulse">
                      <div className="mb-4 h-48 w-full rounded-lg bg-black/10" />
                      <div className="mb-2 h-6 w-3/4 rounded bg-black/10" />
                      <div className="mb-2 h-4 w-1/2 rounded bg-black/10" />
                      <div className="mb-2 h-4 w-1/3 rounded bg-black/10" />
                      <div className="mt-auto h-8 w-1/2 rounded bg-black/10" />
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
                            onClick={() => window.location.href = `/store/admin/products/${product.id}/edit`}
                            className="rounded-lg border border-[#C9A66B]/60 bg-[#FFFFFF]/95 p-2 text-[#121416] shadow-md backdrop-blur hover:bg-[#F3EEE3]"
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
                  onClick={() =>
                    setVisibleCount((prev) => {
                      const row = rowSizeRef.current;
                      return Math.min((Math.floor(prev / row) + 1) * row, filteredProducts.length);
                    })
                  }
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
