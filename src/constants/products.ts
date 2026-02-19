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
  category: Category;
  description: string;
  price: number;
  sizes: {
    small: { weight: string; price: number };
    medium: { weight: string; price: number };
    large: { weight: string; price: number };
  };
  image: string;
  featured: boolean;
  inStock: boolean;
  rating: number;
  reviews: number;
}

// All products
export const PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Extra Virgin Olive Oil",
    category: "olive-oil",
    description:
      "Palestinian extra virgin olive oil, cold-pressed from olives grown in Salfit, known for its rich flavor and natural aroma. Ideal for daily use, cooking, and salads. Available in multiple sizes to suit all needs.",
    price: 45,
    sizes: {
      small: { weight: "250ml", price: 20 },
      medium: { weight: "500ml", price: 35 },
      large: { weight: "1L", price: 60 },
    },
    image: "/products/oile.png",
    featured: true,
    inStock: true,
    rating: 4.8,
    reviews: 124,
  },
  {
    id: "2",
    name: "Traditional Za'atar",
    category: "zatar",
    description:
      "Authentic Palestinian za'atar, naturally dried and blended with olive oil, sesame seeds, and sumac, offering a genuine taste that brings back memories of home. Perfect for breakfast and traditional bread. Available in multiple sizes.",
    price: 35,
    sizes: {
      small: { weight: "100g", price: 12 },
      medium: { weight: "250g", price: 25 },
      large: { weight: "500g", price: 45 },
    },
    image: "/products/Za'atar.jpg",
    featured: true,
    inStock: true,
    rating: 4.9,
    reviews: 98,
  },
  {
    id: "3",
    name: "Traditional Sage",
    category: "sage",
    description:
      "100% natural Palestinian sage, carefully dried to preserve its flavor and health benefits. Ideal for tea and daily use. Available in more than one size.",
    price: 28,
    sizes: {
      small: { weight: "100g", price: 10 },
      medium: { weight: "250g", price: 20 },
      large: { weight: "500g", price: 35 },
    },
    image: "/products/sage.jpg",
    featured: false,
    inStock: true,
    rating: 4.7,
    reviews: 56,
  },
  {
    id: "4",
    name: "Freekeh",
    category: "freekeh",
    description:
      "Traditional Palestinian freekeh prepared using time-honored methods, with a distinctive smoky flavor and high nutritional value. A healthy and authentic choice for Middle Eastern dishes. Available in multiple sizes.",
    price: 32,
    sizes: {
      small: { weight: "250g", price: 12 },
      medium: { weight: "500g", price: 22 },
      large: { weight: "1kg", price: 40 },
    },
    image: "/products/freekeh.jpg",
    featured: true,
    inStock: true,
    rating: 4.6,
    reviews: 72,
  },
  {
    id: "5",
    name: "Pickled Olives",
    category: "pressed-olives",
    description:
      "Palestinian pickled olives prepared using traditional methods, offering balanced flavor and premium quality. Made without preservatives. Available in different sizes.",
    price: 38,
    sizes: {
      small: { weight: "250g", price: 14 },
      medium: { weight: "500g", price: 28 },
      large: { weight: "1kg", price: 50 },
    },
    image: "/products/pressed-olives.jpg",
    featured: true,
    inStock: true,
    rating: 4.8,
    reviews: 85,
  },
  {
    id: "6",
    name: "Traditional Duqqa",
    category: "duqqa",
    description:
      "Authentic Palestinian duqqa made from carefully selected herbs and grains, delivering a bold and rich flavor. Commonly served with olive oil and bread. Available in multiple sizes.",
    price: 30,
    sizes: {
      small: { weight: "100g", price: 11 },
      medium: { weight: "250g", price: 22 },
      large: { weight: "500g", price: 38 },
    },
    image: "/products/doka.jpg",
    featured: false,
    inStock: true,
    rating: 4.7,
    reviews: 63,
  },
  {
    id: "7",
    name: "Palestinian Traditional Soap",
    category: "soap",
    description:
      "Handcrafted Palestinian traditional soap made with pure olive oil and natural ingredients. Gentle on the skin and rich in moisturizing properties. Perfect for daily use and suitable for all skin types. Each bar is carefully prepared using time-honored methods.",
    price: 18,
    sizes: {
      small: { weight: "100g", price: 8 },
      medium: { weight: "200g", price: 14 },
      large: { weight: "500g", price: 30 },
    },
    image: "/products/soap.jpg",
    featured: true,
    inStock: true,
    rating: 4.9,
    reviews: 156,
  },
];

export const CATEGORIES = [
  { id: "olive-oil", name: "Olive Oil", slug: "olive-oil" },
  { id: "zatar", name: "Traditional Za'atar", slug: "zatar" },
  { id: "sage", name: "Traditional Herbs (Sage)", slug: "sage" },
  { id: "freekeh", name: "Freekeh", slug: "freekeh" },
  { id: "pressed-olives", name: "Pressed Olives", slug: "pressed-olives" },
  { id: "duqqa", name: "Traditional Duqqa", slug: "duqqa" },
  { id: "soap", name: "Traditional Soap", slug: "soap" },
];
