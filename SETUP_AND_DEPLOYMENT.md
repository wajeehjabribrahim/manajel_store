# Manajel Store - Setup and Deployment Guide

## Quick Start

### Prerequisites
- Node.js 18.18.0 or higher
- npm 9.8.1 or higher
- Git (optional)

### Installation & Running Locally

```bash
# Navigate to project directory
cd C:\Users\wajee\Desktop\Manajel_store

# Install dependencies
npm install

# Run development server
npm run dev
```

Visit `http://localhost:3000` in your browser. The site will hot-reload as you make changes.

---

## Project Structure Overview

### Main Directories

**`src/app/`** - Next.js app router pages
- `page.tsx` files are automatically routed based on folder names
- Layouts apply to all pages in that directory and subdirectories

**`src/components/`** - Reusable React components
- `Header.tsx` - Navigation and branding
- `Footer.tsx` - Site footer with links
- `ProductCard.tsx` - Product display component

**`src/constants/`** - Configuration and data
- `store.ts` - Store branding, colors, contact info
- `products.ts` - Product database and categories

**`public/`** - Static assets (images, fonts, etc.)

---

## File Descriptions

### Core Pages

#### `src/app/page.tsx` - Home Page
The main landing page featuring:
- Hero section with gradient background
- Featured products grid
- "Why Choose Manajel" section
- Call-to-action buttons

**Key Components Used:**
- ProductCard (repeated for featured products)
- Navigation Links to shop and other pages

#### `src/app/shop/page.tsx` - Shop Catalog
Product listing page with:
- Sidebar category filter
- Product grid with responsive layout
- Active category highlighting
- Product count display

**State Management:**
- Uses React `useState` for selected category filter
- Filters products array based on selection

#### `src/app/contact/page.tsx` - Contact Form
Contact page with:
- Contact information display (3-column layout)
- Form with validation
- Form submission state handling
- Contact details sidebar

**Form Fields:**
- Full Name (required)
- Email (required)
- Phone (optional)
- Subject (required)
- Message (required, textarea)

#### `src/app/about/page.tsx` - About Us
Brand story page with:
- Company mission and values
- Products overview
- Core values checklist
- Contact CTA button

#### `src/app/faq/page.tsx` - FAQ
Accordion-style FAQ with 10 questions covering:
- Product authenticity
- Storage and shelf life
- Shipping and ordering
- Returns and support

**Interactive Elements:**
- HTML5 `<details>` elements for expandable Q&A

#### `src/app/cart/page.tsx` - Shopping Cart
Cart interface page with:
- Empty cart message
- "Coming Soon" notice for checkout
- Link to shop for more browsing
- Placeholder for future checkout integration

#### Policy Pages (`shipping-policy/`, `return-policy/`, `privacy-policy/`)
Comprehensive policy information:
- **Shipping:** Delivery areas, costs, times
- **Returns:** 30-day policy details
- **Privacy:** Data protection and compliance

---

## Components Deep Dive

### Header Component
```typescript
// File: src/components/Header.tsx
// Key Features:
- Mobile-responsive navigation
- Hamburger menu for mobile
- Logo/branding section
- Shopping cart icon
- Uses React hooks (useState)
```

### Footer Component
```typescript
// File: src/components/Footer.tsx
// Key Features:
- 4-column layout (Brand, Shop, Info, Policies)
- Links to all pages
- Contact information
- Copyright notice
```

### ProductCard Component
```typescript
// File: src/components/ProductCard.tsx
// Props:
- product: Product (type from constants/products)
// Features:
- Star rating display
- Review count
- Stock status badge
- Product initial (placeholder for image)
- Link to product details
```

---

## Data Structure

### Product Type
```typescript
interface Product {
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
```

### Categories
```typescript
type Category = 
  | "olive-oil"
  | "zatar"
  | "sage"
  | "freekeh"
  | "pressed-olives"
  | "duqqa";
```

---

## Styling System

### Tailwind CSS Classes Used
- **Spacing:** `p-4`, `px-8`, `py-3`, `mb-4`, `gap-8`
- **Layout:** `grid`, `flex`, `max-w-7xl`, `mx-auto`
- **Typography:** `text-4xl`, `font-bold`, `text-center`
- **Colors:** `text-white`, `bg-gradient-to-br`, `text-gray-600`
- **Effects:** `rounded-lg`, `shadow-md`, `hover:opacity-80`, `transition-opacity`
- **Responsive:** `md:grid-cols-2`, `lg:grid-cols-3`, `sm:flex-row`

### Dynamic Styling
Colors are applied via inline styles:
```typescript
style={{
  backgroundColor: COLORS.primary,
  color: COLORS.accent
}}
```

This allows for easy theme changes by updating the `COLORS` object in `constants/store.ts`.

---

## State Management

### Component-Level State
All components use React hooks:
- `useState` for local state (e.g., mobile menu, form inputs)
- No global state management needed for current features
- Ready to upgrade to Context API or Redux if needed

### Shop Page Filter
```typescript
const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
const filteredProducts = selectedCategory
  ? PRODUCTS.filter((p) => p.category === selectedCategory)
  : PRODUCTS;
```

---

## Deployment Guide

### Build for Production
```bash
npm run build
```

This creates an optimized `.next` directory ready for deployment.

### Run Production Build Locally
```bash
npm start
```

### Deploying to Vercel (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow prompts to connect GitHub repository and deploy

### Deploying to Netlify

1. Create `netlify.toml` in project root:
```toml
[build]
  command = "npm run build"
  functions = "netlify/functions"
  
[context.production.environment]
  NEXT_PUBLIC_API_URL = "https://api.manajel.ps"
```

2. Deploy via Netlify CLI or dashboard

### Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t manajel-store .
docker run -p 3000:3000 manajel-store
```

---

## Environment Variables

Create `.env.local` file for local development:
```
NEXT_PUBLIC_STORE_NAME=Manajel
NEXT_PUBLIC_API_URL=https://api.example.com
```

For production, set these in your deployment platform's environment settings.

---

## Performance Optimization

### Current Optimizations
- Static page generation for all pages
- Inline CSS for dynamic styles (no CSS-in-JS overhead)
- Minimal JavaScript bundle
- Responsive images ready

### Recommended Further Optimizations
1. **Image Optimization:** Replace product initials with actual images
2. **Code Splitting:** Automatically handled by Next.js
3. **Caching:** Enable browser caching headers
4. **CDN:** Deploy through CDN for global distribution
5. **Database:** Add product database instead of hardcoded data

---

## Adding Features

### Adding a New Product
Edit `src/constants/products.ts`:
```typescript
{
  id: "7",
  name: "New Product Name",
  category: "olive-oil",
  description: "Product description here...",
  price: 35,
  sizes: {
    small: { weight: "250ml", price: 20 },
    medium: { weight: "500ml", price: 30 },
    large: { weight: "1L", price: 50 },
  },
  image: "/products/new-product.jpg",
  featured: true,
  inStock: true,
  rating: 4.8,
  reviews: 42,
}
```

### Adding a New Category
1. Update `Category` type in `src/constants/products.ts`
2. Add to `CATEGORIES` array
3. Products will automatically appear when filtered

### Adding a New Page
1. Create folder: `src/app/new-page/`
2. Add `page.tsx` file
3. Automatically routed to `/new-page`

Example:
```typescript
// src/app/blog/page.tsx
export default function Blog() {
  return (
    <div>
      <h1>Blog Page</h1>
      {/* Your content here */}
    </div>
  );
}
```

---

## Troubleshooting

### Common Issues

**Issue:** Port 3000 already in use
```bash
# Windows - Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port
npm run dev -- -p 3001
```

**Issue:** Module not found errors
```bash
# Clear cache and reinstall
rm -r node_modules .next
npm install
npm run build
```

**Issue:** Styling not applying
- Check Tailwind CSS imports in layout
- Verify colors are properly referenced from `COLORS` object
- Clear browser cache

**Issue:** Navigation not working
- Check page file names and folder structure
- Ensure `page.tsx` files are in correct locations
- Verify routes in navigation components

---

## Testing Checklist

Before deployment, test:

- [ ] Home page loads correctly
- [ ] Navigation menu works (desktop and mobile)
- [ ] Shop page displays all products
- [ ] Category filter works in shop
- [ ] Contact form validates and submits
- [ ] All policy pages load correctly
- [ ] Footer links work
- [ ] Mobile responsive design works
- [ ] Colors display correctly
- [ ] No console errors

---

## Monitoring & Analytics

### Recommended Services
1. **Analytics:** Google Analytics 4
2. **Error Tracking:** Sentry
3. **Performance:** Vercel Analytics
4. **SEO:** Google Search Console

### Adding Google Analytics
Add to `src/app/layout.tsx`:
```typescript
import Script from "next/script";
{% raw %}
<Script
  src="https://www.googletagmanager.com/gtag/js?id=GA_ID"
  strategy="afterInteractive"
/>
<Script
  id="google-analytics"
  strategy="afterInteractive"
  dangerouslySetInnerHTML={{
    __html: `window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'GA_ID');`,
  }}
/>
{% endraw %}
```

---

## Maintenance Tasks

### Weekly
- Monitor error logs
- Check page load times
- Review analytics

### Monthly
- Update dependencies: `npm update`
- Security audit: `npm audit`
- Backup database/data

### Quarterly
- Full security review
- Performance optimization
- User feedback review

---

## Support Resources

- **Next.js Docs:** https://nextjs.org/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **React:** https://react.dev
- **TypeScript:** https://www.typescriptlang.org/docs/

---

## Next Steps

1. **Immediate:** Deploy to Vercel/Netlify
2. **Week 1:** Set up analytics and domain
3. **Week 2:** Add product images
4. **Week 3:** Implement payment processing
5. **Month 1:** Add product detail pages
6. **Month 2:** Implement shopping cart and checkout

---

**For questions or support, contact:** contact@mnajel.com
