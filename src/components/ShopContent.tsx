"use client";

import { PRODUCTS, Product, CATEGORIES } from "@/constants/products";
import ProductCard from "@/components/ProductCard";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { showToast } from "@/components/Toast";

const PRODUCTS_BATCH_SIZE = 4;

interface Category {
  id: string | number;
  name: string;
  nameAr?: string;
}

const normalizeId = (
  value: string | number | null | undefined
) => {
  return String(value ?? "").trim();
};

const normalizeCategoryValue = (
  value: string | number | null | undefined
) => {
  return normalizeId(value)
    .toLowerCase()
    .replace(/[\s_]+/g, "-");
};

const getGridColumns = (width: number) => {
  if (width >= 1280) return 5;
  if (width >= 1024) return 4;
  if (width >= 768) return 3;
  return 2;
};

const categoryAliases: Record<string, string[]> = {
  "olive-oil": [
    "olive-oil",
    "oliveoil",
    "olive",
    "zayt",
    "zait",
    "زيت",
    "زيت-الزيتون",
    "زيت الزيتون",
  ],

  zatar: [
    "zatar",
    "zaatar",
    "za3tar",
    "thyme",
    "زعتر",
    "الزعتر",
    "زعتر-بلدي",
  ],

  zaatar: [
    "zatar",
    "zaatar",
    "za3tar",
    "thyme",
    "زعتر",
    "الزعتر",
    "زعتر-بلدي",
  ],

  freekeh: [
    "freekeh",
    "freekah",
    "freakeh",
    "فريكة",
    "الفريكة",
  ],

  pickles: [
    "pickles",
    "pickle",
    "مخللات",
    "المخللات",
    "زيتون",
    "الزيتون",
  ],

  soap: [
    "soap",
    "nabulsi-soap",
    "صابون",
    "الصابون",
    "صابون نابلسي",
  ],

  gifts: [
    "gifts",
    "gift",
    "هدايا",
    "الهدايا",
    "باقات",
    "الباقات",
  ],
};

const matchesCategory = (
  rawValue: string | number,
  category: Category
) => {
  const raw = normalizeCategoryValue(rawValue);

  const categoryId = normalizeCategoryValue(
    category.id
  );

  const categoryName = normalizeCategoryValue(
    category.name
  );

  const categoryNameAr = normalizeCategoryValue(
    category.nameAr
  );

  if (
    raw === categoryId ||
    raw === categoryName ||
    raw === categoryNameAr
  ) {
    return true;
  }

  const aliasesById =
    categoryAliases[categoryId] || [];

  const aliasesByName =
    categoryAliases[categoryName] || [];

  return [
    ...aliasesById,
    ...aliasesByName,
  ].some(
    (alias) =>
      normalizeCategoryValue(alias) === raw
  );
};

const resolveCategoryId = (
  value: string | number,
  categories: Category[]
) => {
  const directMatch = categories.find(
    (category) =>
      matchesCategory(value, category)
  );

  if (directMatch) {
    return normalizeId(directMatch.id);
  }

  const normalizedValue =
    normalizeCategoryValue(value);

  const looseMatch = categories.find(
    (category) => {
      const categoryId =
        normalizeCategoryValue(category.id);

      const categoryName =
        normalizeCategoryValue(category.name);

      const categoryNameAr =
        normalizeCategoryValue(category.nameAr);

      return (
        categoryId.includes(normalizedValue) ||
        categoryName.includes(normalizedValue) ||
        categoryNameAr.includes(normalizedValue) ||
        normalizedValue.includes(categoryId) ||
        normalizedValue.includes(categoryName) ||
        (
          categoryNameAr &&
          normalizedValue.includes(categoryNameAr)
        )
      );
    }
  );

  return looseMatch
    ? normalizeId(looseMatch.id)
    : undefined;
};

const productMatchesSelectedCategory = (
  productCategory: string,
  selectedCategory: string,
  categories: Category[]
) => {
  const normalizedProductCategory =
    normalizeCategoryValue(productCategory);

  const normalizedSelectedCategory =
    normalizeCategoryValue(selectedCategory);

  if (
    normalizedProductCategory ===
    normalizedSelectedCategory
  ) {
    return true;
  }

  const resolvedProductCategory =
    resolveCategoryId(
      productCategory,
      categories
    );

  const resolvedSelectedCategory =
    resolveCategoryId(
      selectedCategory,
      categories
    );

  if (
    resolvedProductCategory &&
    resolvedSelectedCategory
  ) {
    return (
      resolvedProductCategory ===
      resolvedSelectedCategory
    );
  }

  const selectedCategoryObject =
    categories.find(
      (category) =>
        normalizeId(category.id) ===
          normalizeId(selectedCategory) ||
        matchesCategory(
          selectedCategory,
          category
        )
    );

  if (!selectedCategoryObject) {
    const aliases =
      categoryAliases[
        normalizedSelectedCategory
      ] || [];

    return aliases.some(
      (alias) =>
        normalizeCategoryValue(alias) ===
        normalizedProductCategory
    );
  }

  const candidates = new Set<string>();

  candidates.add(
    normalizeCategoryValue(
      selectedCategoryObject.id
    )
  );

  candidates.add(
    normalizeCategoryValue(
      selectedCategoryObject.name
    )
  );

  if (selectedCategoryObject.nameAr) {
    candidates.add(
      normalizeCategoryValue(
        selectedCategoryObject.nameAr
      )
    );
  }

  const aliasesById =
    categoryAliases[
      normalizeCategoryValue(
        selectedCategoryObject.id
      )
    ] || [];

  const aliasesByName =
    categoryAliases[
      normalizeCategoryValue(
        selectedCategoryObject.name
      )
    ] || [];

  [
    ...aliasesById,
    ...aliasesByName,
  ].forEach((alias) => {
    candidates.add(
      normalizeCategoryValue(alias)
    );
  });

  return candidates.has(
    normalizedProductCategory
  );
};

export default function ShopContent() {
  const { t, language } = useLanguage();
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  const isAdmin =
    (
      session?.user as
        | { role?: string }
        | undefined
    )?.role === "admin";

  const [selectedCategory, setSelectedCategory] =
    useState<string | null>(null);

  const [products, setProducts] =
    useState<Product[]>(PRODUCTS);

  const [productsLang, setProductsLang] =
    useState<string | null>(null);

  const [categories, setCategories] =
    useState<Category[]>(
      CATEGORIES.map((category) => ({
        id: category.id,
        name: category.name,
        nameAr: category.name,
      }))
    );

  const [categoriesLoaded, setCategoriesLoaded] =
    useState(false);

  const [productsLoaded, setProductsLoaded] =
    useState(false);

  const [visibleCount, setVisibleCount] =
    useState(PRODUCTS_BATCH_SIZE);

  const [deleting, setDeleting] =
    useState<string | null>(null);

  const loadMoreRef =
    useRef<HTMLDivElement | null>(null);

  const rowSizeRef =
    useRef(PRODUCTS_BATCH_SIZE);

  const restoredRef =
    useRef(false);

  /*
   * تحديد عدد أعمدة المنتجات
   */
  useEffect(() => {
    const updateRowSize = () => {
      rowSizeRef.current =
        getGridColumns(window.innerWidth);
    };

    updateRowSize();

    window.addEventListener(
      "resize",
      updateRowSize
    );

    return () => {
      window.removeEventListener(
        "resize",
        updateRowSize
      );
    };
  }, []);

  /*
   * جلب التصنيفات
   */
  const loadCategories = async () => {
    try {
      const response = await fetch(
        "/api/categories"
      );

      if (response.ok) {
        const data = await response.json();

        if (
          Array.isArray(data) &&
          data.length > 0
        ) {
          setCategories(data);

          try {
            localStorage.setItem(
              "manajel-categories-cache",
              JSON.stringify(data)
            );
          } catch {
            // تجاهل أخطاء التخزين
          }
        }
      }
    } catch (error) {
      console.error(
        "Error loading categories:",
        error
      );
    } finally {
      setCategoriesLoaded(true);
    }
  };

  /*
   * جلب المنتجات
   */
  const loadProducts = async () => {
    try {
      const response = await fetch(
        `/api/products?lang=${language}`
      );

      if (response.ok) {
        const data = await response.json();

        if (
          Array.isArray(data?.products)
        ) {
          setProducts(data.products);
          setProductsLang(language);

          try {
            localStorage.setItem(
              `manajel-products-cache-${language}`,
              JSON.stringify(data.products)
            );

            localStorage.setItem(
              `manajel-products-cache-meta-${language}`,
              JSON.stringify({
                ts: Date.now(),
              })
            );
          } catch {
            // تجاهل أخطاء التخزين
          }
        }
      }
    } catch (error) {
      console.error(
        "Error loading products:",
        error
      );
    } finally {
      setProductsLoaded(true);
    }
  };

  /*
   * تحميل البيانات من الكاش ثم تحديثها
   */
  useEffect(() => {
    const CACHE_TTL =
      60 * 60 * 1000;

    const productsCacheKey =
      `manajel-products-cache-${language}`;

    const productsMetaKey =
      `manajel-products-cache-meta-${language}`;

    let productsCacheIsFresh = false;

    /*
     * كاش التصنيفات
     */
    try {
      const cachedCategories =
        localStorage.getItem(
          "manajel-categories-cache"
        );

      if (cachedCategories) {
        const parsedCategories =
          JSON.parse(cachedCategories);

        if (
          Array.isArray(parsedCategories) &&
          parsedCategories.length > 0
        ) {
          setCategories(parsedCategories);
          setCategoriesLoaded(true);
        }
      }
    } catch {
      // تجاهل أخطاء الكاش
    }

    /*
     * كاش المنتجات
     */
    try {
      const cachedProducts =
        localStorage.getItem(
          productsCacheKey
        );

      const cachedMeta =
        localStorage.getItem(
          productsMetaKey
        );

      if (cachedProducts) {
        const parsedProducts =
          JSON.parse(cachedProducts);

        if (
          Array.isArray(parsedProducts) &&
          parsedProducts.length > 0
        ) {
          setProducts(parsedProducts);
          setProductsLang(language);

          if (cachedMeta) {
            try {
              const parsedMeta =
                JSON.parse(cachedMeta);

              const timestamp =
                typeof parsedMeta?.ts ===
                "number"
                  ? parsedMeta.ts
                  : 0;

              if (
                Date.now() - timestamp <
                CACHE_TTL
              ) {
                productsCacheIsFresh = true;
              }
            } catch {
              // تجاهل أخطاء البيانات
            }
          }
        }
      }
    } catch {
      // تجاهل أخطاء الكاش
    }

    loadCategories();

    if (!productsCacheIsFresh) {
      loadProducts();
    } else {
      setProductsLoaded(true);
    }

    return () => undefined;
  }, [language]);

  /*
   * اختيار الفئة من الرابط
   *
   * إذا ما في فئة بالرابط،
   * يتم اختيار أول فئة تلقائيًا
   */
  useEffect(() => {
    if (!categories.length) {
      return;
    }

    const categoryFromUrl =
      searchParams.get("category");

    if (categoryFromUrl) {
      const matchedCategory =
        categories.find((category) =>
          matchesCategory(
            categoryFromUrl,
            category
          )
        );

      setSelectedCategory(
        normalizeId(
          matchedCategory?.id ??
            categoryFromUrl
        )
      );

      return;
    }

    setSelectedCategory(
      (currentCategory) => {
        if (currentCategory) {
          return normalizeId(
            currentCategory
          );
        }

        return normalizeId(
          categories[0]?.id
        );
      }
    );
  }, [categories, searchParams]);

  /*
   * تغيير الفئة
   */
  const handleCategoryChange = (
    categoryId: string | number
  ) => {
    const normalizedCategoryId =
      normalizeId(categoryId);

    setSelectedCategory(
      normalizedCategoryId
    );

    setVisibleCount(
      rowSizeRef.current * 2
    );

    try {
      const url = new URL(
        window.location.href
      );

      url.searchParams.set(
        "category",
        normalizedCategoryId
      );

      window.history.pushState(
        {},
        "",
        url.toString()
      );
    } catch {
      // تجاهل أخطاء الرابط
    }
  };

  /*
   * حذف المنتج
   */
  const handleDelete = async (
    productId: string
  ) => {
    const confirmed = window.confirm(
      "هل أنت متأكد من حذف هذا المنتج؟"
    );

    if (!confirmed) {
      return;
    }

    setDeleting(productId);

    try {
      const response = await fetch(
        `/api/products/${productId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        await loadProducts();
      } else {
        const data =
          await response
            .json()
            .catch(() => ({}));

        showToast(
          data?.error ||
            "فشل حذف المنتج",
          "error"
        );
      }
    } catch {
      showToast(
        "حدث خطأ أثناء حذف المنتج",
        "error"
      );
    } finally {
      setDeleting(null);
    }
  };

  /*
   * فلترة المنتجات حسب الفئة
   */
  const filteredProducts = useMemo(() => {
    /*
     * لا تعرض المنتجات قبل تحميل لغة المنتجات الحالية
     */
    if (productsLang !== language) {
      return [];
    }

    /*
     * لا تعرض كل المنتجات إذا ما في فئة مختارة
     */
    if (!selectedCategory) {
      return [];
    }

    return products.filter((product) =>
      productMatchesSelectedCategory(
        product.category,
        selectedCategory,
        categories
      )
    );
  }, [
    products,
    productsLang,
    language,
    selectedCategory,
    categories,
  ]);

  const visibleProducts =
    filteredProducts.slice(
      0,
      visibleCount
    );

  const hasMoreProducts =
    visibleCount <
    filteredProducts.length;

  /*
   * التحميل فقط للبيانات،
   * وليس عند عدم وجود فئة مختارة
   */
  const isLoading =
    !categoriesLoaded ||
    !productsLoaded;

  /*
   * إعادة عدد المنتجات عند تغيير الفئة
   */
  useEffect(() => {
    setVisibleCount(
      rowSizeRef.current * 2
    );
  }, [selectedCategory, language]);

  /*
   * تحميل المزيد تلقائيًا
   */
  useEffect(() => {
    if (
      isLoading ||
      !hasMoreProducts ||
      !loadMoreRef.current
    ) {
      return;
    }

    const observer =
      new IntersectionObserver(
        (entries) => {
          const entry = entries[0];

          if (
            !entry?.isIntersecting
          ) {
            return;
          }

          setVisibleCount(
            (previousCount) => {
              const row =
                rowSizeRef.current;

              const nextCount =
                (
                  Math.floor(
                    previousCount / row
                  ) + 1
                ) * row;

              return Math.min(
                nextCount,
                filteredProducts.length
              );
            }
          );
        },
        {
          root: null,
          rootMargin: "300px 0px",
          threshold: 0.01,
        }
      );

    observer.observe(
      loadMoreRef.current
    );

    return () => {
      observer.disconnect();
    };
  }, [
    isLoading,
    hasMoreProducts,
    filteredProducts.length,
  ]);

  /*
   * اسم الفئة المختارة
   */
  const selectedCategoryName =
    useMemo(() => {
      const category =
        categories.find(
          (item) =>
            normalizeId(item.id) ===
            normalizeId(
              selectedCategory
            )
        );

      if (!category) {
        return "";
      }

      return language === "ar"
        ? category.nameAr ||
            category.name
        : category.name;
    }, [
      categories,
      selectedCategory,
      language,
    ]);

  /*
   * استعادة مكان المستخدم السابق
   */
  useEffect(() => {
    if (
      !productsLoaded ||
      restoredRef.current
    ) {
      return;
    }

    try {
      const lastProductId =
        sessionStorage.getItem(
          "lastProductId"
        );

      const storedScroll =
        sessionStorage.getItem(
          "manajel:shop:scroll"
        );

      if (
        !lastProductId &&
        !storedScroll
      ) {
        return;
      }

      restoredRef.current = true;

      const clearStoredValues = () => {
        try {
          sessionStorage.removeItem(
            "lastProductId"
          );

          sessionStorage.removeItem(
            "manajel:shop:scroll"
          );
        } catch {
          // تجاهل أخطاء التخزين
        }
      };

      const restoreScroll = () => {
        const position =
          Number(storedScroll);

        if (
          storedScroll &&
          !Number.isNaN(position)
        ) {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              window.scrollTo({
                top: position,
                behavior: "auto",
              });

              clearStoredValues();
            });
          });
        } else {
          clearStoredValues();
        }
      };

      if (lastProductId) {
        const productIndex =
          filteredProducts.findIndex(
            (product) =>
              String(product.id) ===
              String(lastProductId)
          );

        if (productIndex >= 0) {
          const row =
            rowSizeRef.current;

          const requiredCount =
            Math.min(
              (
                Math.ceil(
                  (productIndex + 1) / row
                ) + 1
              ) * row,
              filteredProducts.length
            );

          setVisibleCount(
            (previousCount) =>
              Math.max(
                previousCount,
                requiredCount
              )
          );

          let tries = 0;

          const findProductElement =
            () => {
              const element =
                document.getElementById(
                  `product-${lastProductId}`
                );

              if (element) {
                element.scrollIntoView({
                  behavior: "auto",
                  block: "center",
                });

                clearStoredValues();
                return;
              }

              tries += 1;

              if (tries < 30) {
                requestAnimationFrame(
                  findProductElement
                );
              } else {
                restoreScroll();
              }
            };

          requestAnimationFrame(
            findProductElement
          );

          return;
        }
      }

      restoreScroll();
    } catch {
      // تجاهل أخطاء الاستعادة
    }
  }, [
    productsLoaded,
    filteredProducts,
  ]);

  return (
    <div className="bg-[#FBF8F2] text-[#121416]">
      {/* عنوان المتجر */}
      <section
        style={{
          background:
            "linear-gradient(180deg, #F3EEE3 0%, #FBF8F2 100%)",
          borderBottom:
            "1px solid rgba(201,166,107,0.25)",
        }}
        className="px-4 py-7 text-[#121416]"
      >
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-2 text-3xl leading-tight text-[#C9A66B] sm:text-4xl tajawal-regular-all">
            {t("shop.title")}
          </h1>

          <p className="text-sm leading-relaxed text-black/80 sm:text-base md:text-lg tajawal-regular-all">
            {t("shop.subtitle")}
          </p>
        </div>
      </section>

      {/* محتوى المتجر */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        {/* عنوان اختيار الفئة */}
        <div className="mb-5 text-center">
         <h2 className="text-2xl font-bold text-[#3E2F1C] sm:text-3xl tajawal-regular-all">
            {language === "ar"
              ? "اختر فئة لعرض منتجاتها"
              : "Choose a category to view its products"}
          </h2>

          <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-[#C9A66B]" />
        </div>

        {/* الفئات */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-center gap-2 tajawal-regular-all">
            {isLoading ? (
              Array.from({ length: 5 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="animate-pulse"
                  >
                    <div className="h-9 w-24 rounded-full border border-black/10 bg-black/10" />
                  </div>
                )
              )
            ) : (
              categories.map((category) => {
                const categoryId =
                  normalizeId(
                    category.id
                  );

                const displayName =
                  language === "ar"
                    ? category.nameAr ||
                      category.name
                    : category.name;

                const isSelected =
                  normalizeId(
                    selectedCategory
                  ) === categoryId;

                return (
                  <button
                    key={categoryId}
                    type="button"
                    onClick={() =>
                      handleCategoryChange(
                        categoryId
                      )
                    }
                    className={`rounded-full border px-4 py-1.5 text-sm transition-all duration-200 sm:px-5 sm:py-2 sm:text-base ${
                      isSelected
                        ? "border-[#C9A66B] bg-[#C9A66B]/30 font-bold text-[#3E2F1C] shadow-sm ring-1 ring-[#C9A66B]/30"
                        : "border-black/15 bg-white text-black/85 hover:border-[#C9A66B]/60 hover:text-black"
                    }`}
                  >
                    {displayName}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* اسم الفئة وعدد المنتجات */}
        {!isLoading &&
          selectedCategoryName && (
            <div className="mb-4 flex items-center gap-2 text-sm text-black/80 tajawal-regular-all">
              <span className="font-bold text-[#3E2F1C]">
                {selectedCategoryName}
              </span>

              <span className="text-black/40">
                —
              </span>

              <span>
                {filteredProducts.length}{" "}
                {t("shop.items")}
              </span>
            </div>
          )}

        {/* شبكة المنتجات */}
        <div className="grid auto-rows-fr grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 md:gap-6 lg:grid-cols-4 xl:grid-cols-5">
          {/*
           * Skeleton يظهر فقط أثناء التحميل
           */}
          {isLoading ? (
            Array.from({ length: 8 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="relative h-full animate-pulse"
                >
                  <div className="mb-4 h-48 w-full rounded-lg bg-black/10" />

                  <div className="mb-2 h-6 w-3/4 rounded bg-black/10" />

                  <div className="mb-2 h-4 w-1/2 rounded bg-black/10" />

                  <div className="mb-2 h-4 w-1/3 rounded bg-black/10" />

                  <div className="mt-auto h-8 w-1/2 rounded bg-black/10" />
                </div>
              )
            )
          ) : filteredProducts.length === 0 ? (
            /*
             * إذا الفئة ما فيها منتجات
             */
            <div className="col-span-full flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-[#C9A66B]/30 bg-white/60 px-6 py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#C9A66B]/15">
                <svg
                  className="h-8 w-8 text-[#C9A66B]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.6}
                    d="M20 13V7a2 2 0 00-2-2h-3l-1-2H10L9 5H6a2 2 0 00-2 2v6m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4m5 4h6"
                  />
                </svg>
              </div>

              <h3 className="mb-2 text-lg font-bold text-[#3E2F1C] tajawal-regular-all">
                {language === "ar"
                  ? "لا توجد منتجات"
                  : "No products found"}
              </h3>

              <p className="max-w-md text-sm text-black/60 tajawal-regular-all">
                {language === "ar"
                  ? "لا توجد منتجات متوفرة ضمن هذه الفئة حاليًا."
                  : "There are currently no products available in this category."}
              </p>
            </div>
          ) : (
            /*
             * المنتجات التابعة للفئة المختارة
             */
            visibleProducts.map(
              (product, index) => (
                <div
                  id={`product-${product.id}`}
                  key={product.id}
                  className="relative h-full"
                >
                  <ProductCard
                    product={product}
                    animationDelay={
                      index * 50
                    }
                    isFirstProduct={
                      index < 3
                    }
                  />

                  {isAdmin && (
                    <div className="absolute right-2 top-2 z-10 flex gap-2">
                      {/* تعديل */}
                      <button
                        type="button"
                        onClick={() => {
                          window.location.href =
                            `/store/admin/products/${product.id}/edit`;
                        }}
                        className="rounded-lg border border-[#C9A66B]/60 bg-white/95 p-2 text-[#121416] shadow-md backdrop-blur hover:bg-[#F3EEE3]"
                        title="تعديل المنتج"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>

                      {/* حذف */}
                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(
                            String(product.id)
                          )
                        }
                        disabled={
                          deleting ===
                          String(product.id)
                        }
                        className="rounded-lg border border-red-400/50 bg-red-500/20 p-2 text-red-200 shadow-md hover:bg-red-500/30 disabled:opacity-50"
                        title="حذف المنتج"
                      >
                        {deleting ===
                        String(product.id) ? (
                          <svg
                            className="h-5 w-5 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />

                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l-2.647z"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )
            )
          )}
        </div>

        {/* تحميل المزيد */}
        {!isLoading &&
          hasMoreProducts && (
            <div
              ref={loadMoreRef}
              className="mt-6 flex justify-center"
            >
              <button
                type="button"
                onClick={() =>
                  setVisibleCount(
                    (previousCount) => {
                      const row =
                        rowSizeRef.current;

                      const nextCount =
                        (
                          Math.floor(
                            previousCount /
                              row
                          ) + 1
                        ) * row;

                      return Math.min(
                        nextCount,
                        filteredProducts.length
                      );
                    }
                  )
                }
                className="rounded-full border border-[#C9A66B] px-6 py-2 text-sm font-semibold text-[#3E2F1C] transition hover:bg-[#C9A66B]/15"
              >
                {language === "ar"
                  ? "عرض المزيد"
                  : "Load more"}
              </button>
            </div>
          )}
      </section>
    </div>
  );
}