"use client";

import { COLORS } from "@/constants/store";
import { PRODUCTS, CATEGORIES, Product } from "@/constants/products";
import ProductCard from "@/components/ProductCard";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSession } from "next-auth/react";

const getCategoryTranslationKey = (categoryId: string): string => {
  const keyMap: { [key: string]: string } = {
    "olive-oil": "shop.categoryOliveOil",
    "zatar": "shop.categoryZatar",
    "sage": "shop.categorySage",
    "freekeh": "shop.categoryFreekeh",
    "pressed-olives": "shop.categoryPressedOlives",
    "duqqa": "shop.categoryDuqqa",
    "soap": "shop.categorySoap",
  };
  return keyMap[categoryId] || "shop.categoryOliveOil";
};

export default function ShopContent() {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [allCategories, setAllCategories] = useState<Array<{ id: string; name: string }>>(CATEGORIES);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.products)) {
          setProducts(data.products);
          
          // Extract unique categories from products
          const productCategories = data.products
            .map((p: Product) => p.category)
            .filter((cat: any): cat is string => typeof cat === 'string' && cat.length > 0);
          
          const uniqueCategories: string[] = Array.from(new Set(productCategories));
          
          // Merge with predefined categories
          const categoriesMap = new Map<string, { id: string; name: string }>();
          
          // Add predefined categories first
          CATEGORIES.forEach(cat => {
            categoriesMap.set(cat.id, cat);
          });
          
          // Add custom categories from products
          uniqueCategories.forEach((catId) => {
            if (!categoriesMap.has(catId)) {
              categoriesMap.set(catId, { id: catId, name: catId });
            }
          });
          
          setAllCategories(Array.from(categoriesMap.values()));
        }
      }
    } catch {
      // keep fallback
    }
  };

  useEffect(() => {
    loadProducts();
    
    // Reload products every 10 seconds to catch new categories
    const interval = setInterval(() => {
      loadProducts();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

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
    ? products.filter((p) => p.category === selectedCategory)
    : products;

  return (
    <div>
      {/* Header */}
      <section
        style={{ backgroundColor: COLORS.primary }}
        className="text-white py-12 px-4"
      >
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">{t("shop.title")}</h1>
          <p className="text-lg opacity-90">
            {t("shop.subtitle")}
          </p>
        </div>
      </section>

      {/* Shop */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Categories */}
          <div className="lg:w-56 flex-shrink-0">
            <h3
              style={{ color: COLORS.primary }}
              className="text-xl font-bold mb-6"
            >
              {t("shop.categories")}
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedCategory(null)}
                style={{
                  backgroundColor: selectedCategory === null ? COLORS.primary : COLORS.light,
                  color: selectedCategory === null ? "white" : COLORS.dark,
                }}
                className="w-full text-left px-4 py-2 rounded transition-colors"
              >
                {t("shop.allProducts")}
              </button>
              {allCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  style={{
                    backgroundColor:
                      selectedCategory === category.id
                        ? COLORS.primary
                        : COLORS.light,
                    color:
                      selectedCategory === category.id ? "white" : COLORS.dark,
                  }}
                  className="w-full text-left px-4 py-2 rounded transition-colors"
                >
                  {t(getCategoryTranslationKey(category.id)) === getCategoryTranslationKey(category.id)
                    ? category.name
                    : t(getCategoryTranslationKey(category.id))}
                </button>
              ))}
            </div>


          </div>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="mb-4 text-sm text-gray-600">
              {t("shop.showing")} {filteredProducts.length} {t("shop.items")}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product, index) => (
                <div key={product.id} className="relative">
                  <ProductCard 
                    product={product} 
                    animationDelay={index * 50}
                  />
                  {isAdmin && (
                    <div className="absolute top-2 right-2 flex gap-2 z-10">
                      <button
                        onClick={() => window.location.href = `/admin/products/${product.id}/edit`}
                        className="bg-blue-600 text-white p-2 rounded-lg shadow-md hover:bg-blue-700"
                        title="تعديل المنتج"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        disabled={deleting === product.id}
                        className="bg-red-600 text-white p-2 rounded-lg shadow-md hover:bg-red-700 disabled:opacity-50"
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
          </div>
        </div>
      </section>
    </div>
  );
}
