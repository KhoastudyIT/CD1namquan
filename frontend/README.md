# Nam Quan — Furniture E-Commerce Frontend

Ứng dụng frontend cho website thương mại điện tử nội thất cao cấp **NAM QUAN**, xây dựng với React + Vite, thiết kế hiện đại tối giản, responsive đa thiết bị.

## 🏗 Kiến trúc dự án

### Stack & Runtime

| Layer | Technology |
|---|---|
| Framework | React 18 (SPA — Single Page Application) |
| Build Tool | Vite 5 + `@vitejs/plugin-react` |
| Language | JavaScript (ESM — `"type": "module"`) |
| Styling | Vanilla CSS + CSS Custom Properties (Token System) |
| Typography | Google Fonts — **Be Vietnam Pro** (body) + **Playfair Display** (accent serif) |
| Icons | Custom inline SVG icon set (stroke-based, ~20 icons) |
| Animations | CSS `@keyframes` + IntersectionObserver scroll reveal |
| State | React `useState` + `useCallback` (lightweight, no external state library) |

### Nguyên tắc thiết kế (Design Principles)

1. **Token-driven CSS** — Tất cả màu sắc, shadows, border-radius, font đều dùng CSS Custom Properties (`--green`, `--ink`, `--shadow-md`...). Không hardcode giá trị.
2. **Component-based** — Mỗi section trên trang là một component độc lập (Header, Hero, FlashSale, Showroom...).
3. **Responsive-first** — 4 breakpoints: desktop (> 980px), tablet (≤ 980px), mobile (≤ 760px), small (≤ 480px).
4. **Progressive reveal** — Các section hiện dần khi scroll vào viewport bằng `IntersectionObserver`.
5. **Graceful image fallback** — Component `Img` tự động hiển thị placeholder striped khi ảnh lỗi hoặc chưa tải.

---

## ⚠️ Thông tin quan trọng

### 1. Static Data vs API Mode

Hiện tại, app chạy ở chế độ **Static Data**. Toàn bộ dữ liệu được quản lý trong file `src/data.js`:

- **12 sản phẩm** nội thất (sofa, ghế, giường, bàn, tủ, decor)
- **8 sản phẩm flash sale** với giá khuyến mãi
- **7 danh mục** sản phẩm
- **3 bộ sưu tập** (Modern Living, Luxury, Minimalist)
- **3 bài tin tức**
- **7 đối tác**

> **Khi chuyển sang Backend API:** Chỉ cần thay đổi `src/data.js` — import từ API thay vì dữ liệu tĩnh. Các component UI **không cần thay đổi**.

### 2. Styling & Design Tokens

Dự án sử dụng hệ thống CSS token trong `:root`. **Không sử dụng màu hex/RGB trực tiếp** trong components, luôn tham chiếu CSS variables:

```css
/* ✅ Đúng */
color: var(--green);
background: var(--mint);
box-shadow: var(--shadow-md);

/* ❌ Sai */
color: #1f9d4d;
background: #e4f4e6;
```

**Bảng màu chính:**

| Token | Giá trị | Mục đích |
|---|---|---|
| `--green` | `#1f9d4d` | Màu chủ đạo (primary) |
| `--green-ink` | `#15803d` | Text heading xanh |
| `--mint` | `#e4f4e6` | Background nhẹ (light green) |
| `--ink` | `#1d2722` | Text đậm chính |
| `--muted` | `#6d7b73` | Text phụ |
| `--orange` | `#f59a1c` | Flash sale accent |
| `--gold` | `#c9a86a` | Accent vàng sang trọng |
| `--paper` | `#ffffff` | Background chính |

### 3. Giỏ hàng & Yêu thích

State giỏ hàng và yêu thích được quản lý trong `App.jsx`:
- **Cart** (`useState`): Mảng ID sản phẩm
- **Favorites** (`useState` + `Set`): Set các ID yêu thích
- Khi thêm sản phẩm → hiện **toast notification** ở dưới màn hình

### 4. Image Assets

Tất cả 32 hình ảnh nằm trong `public/images/`. Component `Img` sử dụng `loading="lazy"` và fallback placeholder tự động.

---

## 🚀 Cách chạy

### 1. Cài đặt dependencies

```bash
cd frontend
npm install
```

### 2. Chạy Development Server

Khởi động dev server với Hot Module Replacement (HMR):

```bash
npm run dev
```

Mở [http://localhost:5173](http://localhost:5173) trên trình duyệt. Browser sẽ tự động mở nhờ cấu hình `server.open: true` trong Vite.

### 3. Build Production

Tạo bản build tối ưu cho production:

```bash
npm run build
```

Output sẽ nằm trong thư mục `dist/`.

### 4. Preview Production Build

Xem trước bản build production locally:

```bash
npm run preview
```

---

## npm scripts

| Script | Mô tả |
|---|---|
| `npm run dev` | Dev server với HMR → `http://localhost:5173` |
| `npm run build` | Build production → thư mục `dist/` |
| `npm run preview` | Preview bản build production |

---

## Cấu trúc thư mục

```
frontend/
├── public/
│   └── images/                    # 32 ảnh sản phẩm, danh mục, hero, news...
│       ├── heroLiving.jpg         # Ảnh hero banner
│       ├── sofaBeige.jpg          # Ảnh sản phẩm
│       ├── catSofa.jpg            # Ảnh danh mục
│       ├── modern.jpg             # Ảnh bộ sưu tập
│       ├── news1.jpg              # Ảnh tin tức
│       └── ...
├── src/
│   ├── components/
│   │   ├── ui.jsx                 # UI primitives (Img, Icon, Stars, ColorDots, toast, useReveal)
│   │   ├── cards.jsx              # Card components (ProductCard, FlashCard, CategoryPill, NewsCard)
│   │   ├── Logo.jsx               # Logo NAM QUAN
│   │   ├── Header.jsx             # Sticky header (nav, search, cart badge, fav badge)
│   │   ├── Drawer.jsx             # Mobile navigation drawer
│   │   ├── Hero.jsx               # Hero banner full-width
│   │   ├── Categories.jsx         # Danh mục sản phẩm (pill circles)
│   │   ├── Showcase.jsx           # Giới thiệu "Về Nam Quan" (2 ảnh + stats)
│   │   ├── FlashSale.jsx          # Flash sale grid + countdown timer
│   │   ├── NewArrivals.jsx        # Hàng mới về / Bán chạy (tab switch)
│   │   ├── Showroom.jsx           # Phòng trưng bày (filter by category + sort)
│   │   ├── Collections.jsx        # Bộ sưu tập (3 cards overlay)
│   │   ├── BigImage.jsx           # Full-width showcase image
│   │   ├── Trust.jsx              # Cam kết (chính hãng, miễn phí ship, đổi trả)
│   │   ├── News.jsx               # Tin tức (3 cards)
│   │   ├── Partners.jsx           # Đối tác
│   │   ├── CTA.jsx                # Form tư vấn miễn phí (validation)
│   │   └── Footer.jsx             # Footer (info, showrooms, socials)
│   ├── data.js                    # Static data (products, flash sales, categories, collections, news)
│   ├── index.css                  # Global styles + design tokens + all component CSS
│   ├── main.jsx                   # React DOM entry point
│   └── App.jsx                    # Root component (state, routing sections)
├── index.html                     # HTML entry (fonts, viewport, title)
├── vite.config.js                 # Vite configuration
└── package.json
```

---

## Các section trên trang

Trang landing page bao gồm **13 sections** được render tuần tự:

| # | Component | Mô tả | Interactive |
|---|---|---|---|
| 1 | `Header` | Sticky header, nav links, search/bell/heart/cart icons, badge counts | ✅ Menu mobile, smooth scroll |
| 2 | `Drawer` | Mobile navigation drawer (slide-in) | ✅ Open/close animation |
| 3 | `Hero` | Full-width hero banner với tagline + CTA buttons | ✅ Scroll reveal |
| 4 | `Categories` | 7 danh mục hiện dạng pill tròn | ✅ Hover lift effect |
| 5 | `Showcase` | Giới thiệu thương hiệu, 2 ảnh overlap + thống kê | ✅ Scroll reveal |
| 6 | `FlashSale` | Grid 8 sản phẩm KM, countdown timer, % giảm, thanh sold | ✅ Countdown realtime, add to cart |
| 7 | `NewArrivals` | Tab "Hàng mới về" / "Bán chạy", grid 4 sản phẩm | ✅ Tab switch, fav, add to cart |
| 8 | `Showroom` | Grid sản phẩm, filter by category, sort by price | ✅ Category tabs, filter, sort |
| 9 | `Collections` | 3 bộ sưu tập dạng card overlay | ✅ Hover zoom |
| 10 | `BigImage` | Ảnh showroom full-width | — |
| 11 | `Trust` | 3 cam kết (chính hãng, ship, đổi trả) | ✅ Hover lift |
| 12 | `News` | 3 bài tin tức | ✅ Hover lift + zoom |
| 13 | `Partners` | Logo 7 đối tác | ✅ Hover highlight |
| 14 | `CTA` | Form tư vấn (tên + SĐT) + ảnh ghế | ✅ Form validation, toast |
| 15 | `Footer` | Logo, 3 showroom addresses, social links | — |

---

## Hệ thống Component

### UI Primitives (`ui.jsx`)

| Export | Loại | Mô tả |
|---|---|---|
| `Img` | Component | Image với lazy loading + graceful fallback to striped placeholder |
| `Icon` | Component | Inline SVG icon set (~20 icons: cart, heart, search, star, truck...) |
| `Stars` | Component | Hiển thị rating sao (filled/empty) |
| `ColorDots` | Component | Chấm tròn màu sắc sản phẩm |
| `vnd()` | Function | Format số tiền VND (`18900000` → `18.900.000`) |
| `useReveal()` | Hook | IntersectionObserver scroll reveal (gọi 1 lần trong App) |
| `toast()` | Function | Toast notification (tự tạo DOM node, auto-hide 2.2s) |

### Card Components (`cards.jsx`)

| Export | Mô tả |
|---|---|
| `ProductCard` | Card sản phẩm (ảnh, type, tên, rating, màu, giá, fav/cart buttons) |
| `FlashCard` | Card flash sale (thêm: % giảm, giá cũ/mới, thanh sold progress) |
| `CategoryPill` | Danh mục tròn (avatar + tên) |
| `NewsCard` | Card tin tức (ảnh, title, date, excerpt, link "Đọc tiếp") |
| `FavBtn` | Nút yêu thích (heart icon, toggle active) |

---

## Responsive Breakpoints

| Breakpoint | Thay đổi chính |
|---|---|
| **> 980px** (Desktop) | Grid 4 cột, full nav, showcase side-by-side |
| **≤ 980px** (Tablet) | Grid 3 cột, showcase stack, CTA stack, footer 2 cột |
| **≤ 760px** (Mobile) | Nav ẩn → burger menu, grid 2 cột, hero nhỏ hơn, collections 1 cột |
| **≤ 480px** (Small) | Grid 2 cột gap nhỏ, hero title 28px, card name nhỏ hơn |

---

## Kết nối với Backend

Frontend giao tiếp với backend API qua CORS origin `http://localhost:5173`.

| Frontend | Backend |
|---|---|
| `http://localhost:5173` | `http://localhost:3000` |

Để chạy fullstack từ thư mục gốc:

```bash
# Terminal 1 — Backend
npm run dev:be     # → http://localhost:3000

# Terminal 2 — Frontend
npm run dev:fe     # → http://localhost:5173
```

Hoặc cài tất cả dependencies cùng lúc:

```bash
npm run install:all
```

---

## Tính năng nổi bật

- 🎨 **Design system** — CSS Custom Properties token system nhất quán
- ⚡ **Flash Sale realtime** — Countdown timer + progress bar "đã bán"
- 🔍 **Filter & Sort** — Lọc theo danh mục, sắp xếp theo giá
- 🛒 **Cart & Favorites** — Thêm giỏ hàng, yêu thích với toast notification
- 📱 **Responsive** — Mobile drawer, adaptive grid, touch-friendly
- 🎞️ **Scroll reveal** — Hiệu ứng fade-up khi section xuất hiện
- 🖼️ **Image fallback** — Placeholder striped graceful khi ảnh lỗi
- 🔤 **Vietnamese typography** — Be Vietnam Pro + Playfair Display
- 🏷️ **Inline SVG icons** — Nhẹ, không dependency, tùy chỉnh size/stroke/fill
