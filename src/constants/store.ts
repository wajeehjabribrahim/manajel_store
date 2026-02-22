// Store configuration and constants
export const STORE_NAME = "Manajel";
export const STORE_TAGLINE = "Palestinian Heritage in Every Product";
export const STORE_DESCRIPTION = "";

// Currency
export const CURRENCY_SYMBOL = "₪";

// Brand Colors
export const COLORS = {
  primary: "#556B2F", // Olive Green
  secondary: "#8B7355", // Earthy Brown
  accent: "#F5F5DC", // Creamy Beige
  dark: "#2C2C2C", // Embroidery Black
  light: "#FAFAF8",
  border: "#D4AF8F",
};

// Size options
export const SIZES = [
  { value: "small", label: "Small (250g)" },
  { value: "medium", label: "Medium (500g)" },
  { value: "large", label: "Large (1kg)" },
];

// Navigation
export const NAVIGATION = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Shop", href: "/shop" },
  { name: "Contact", href: "/contact" },
];

// Footer Links
export const FOOTER_LINKS = {
  shop: [
    { name: "All Products", href: "/shop" },
    { name: "Olive Oil", href: "/shop?category=olive-oil" },
    { name: "Za'atar", href: "/shop?category=zatar" },
    { name: "Freekeh", href: "/shop?category=freekeh" },
  ],
  info: [
    { name: "About Us", href: "/about" },
    { name: "Contact", href: "/contact" },
    { name: "FAQ", href: "/faq" },
  ],
  policies: [
    { name: "Shipping Policy", href: "/shipping-policy" },
    { name: "Return Policy", href: "/return-policy" },
    { name: "Privacy Policy", href: "/privacy-policy" },
  ],
};

// Contact Information
export const CONTACT_INFO = {
  phone: "+972569834393",
  email: "contact@mnajel.com",
  address: "Salfit, Palestine",
  city: "Salfit",
  country: "Palestine",
};
