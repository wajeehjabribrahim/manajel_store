"use client";

import { COLORS } from "@/constants/store";
import { PRODUCTS, CATEGORIES } from "@/constants/products";
import ProductCard from "@/components/ProductCard";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredProducts = selectedCategory
    ? PRODUCTS.filter((p) => p.category === selectedCategory)
    : PRODUCTS;

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
              {CATEGORIES.map((category) => (
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
                  {t(getCategoryTranslationKey(category.id))}
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
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
