export const SIZE_KEYS = ["small", "medium", "large"] as const;

export type SizeKey = (typeof SIZE_KEYS)[number];

export const DEFAULT_SIZE_KEY: SizeKey = "medium";

export interface ProductSize {
  label?: string;
  weight: string;
  price: number;
  salePrice?: number;
}

export type ProductSizes = Partial<Record<SizeKey, ProductSize>>;

export const getFallbackSizeLabel = (
  size: string,
  t?: (key: string) => string
) => {
  const translationKey = `product.${size}`;
  const translated = t?.(translationKey);
  return translated && translated !== translationKey ? translated : size;
};

export const getProductSizeLabel = (
  size: string,
  sizes?: Record<string, { label?: string } | undefined> | null,
  t?: (key: string) => string
) => {
  const customLabel = sizes?.[size]?.label?.trim();
  return customLabel || getFallbackSizeLabel(size, t);
};

export const parseProductSizes = (sizes: unknown): Record<string, ProductSize> | undefined => {
  if (!sizes) {
    return undefined;
  }

  if (typeof sizes === "string") {
    try {
      const parsed = JSON.parse(sizes);
      return parsed && typeof parsed === "object"
        ? (parsed as Record<string, ProductSize>)
        : undefined;
    } catch {
      return undefined;
    }
  }

  return typeof sizes === "object" ? (sizes as Record<string, ProductSize>) : undefined;
};
