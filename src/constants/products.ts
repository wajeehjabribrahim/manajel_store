// Product categories
export type Category =
  | "olive-oil"
  | "zatar"
  | "sage"
  | "freekeh"
  | "pressed-olives"
  | "duqqa"
  | "soap";

// Product type
export interface Product {
  id: string;
  name: string;
  nameEn?: string;
  category: Category;
  description: string;
  descriptionEn?: string;
  price: number;
  sizes: {
    small?: { weight: string; price: number };
    medium?: { weight: string; price: number };
    large?: { weight: string; price: number };
  };
  image: string;
  images?: string[];
  featured: boolean;
  inStock: boolean;
  rating: number;
  reviews: number;
}

// All products
export const PRODUCTS: Product[] = [
  // Static products removed by request. Use database-managed products instead.
];

export const CATEGORIES = [
  { id: "olive-oil", name: "Olive Oil", slug: "olive-oil" },
  { id: "zatar", name: "Traditional Za'atar", slug: "zatar" },
  { id: "sage", name: "Traditional Herbs (Sage)", slug: "sage" },
  { id: "freekeh", name: "Freekeh", slug: "freekeh" },
  { id: "pressed-olives", name: "Pickled Olives", slug: "pressed-olives" },
  { id: "duqqa", name: "Traditional Duqqa", slug: "duqqa" },
  { id: "soap", name: "Traditional Soap", slug: "soap" },
];
