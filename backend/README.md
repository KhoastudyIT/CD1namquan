# Nam Quan — Furniture E-Commerce API

Backend REST API cho nền tảng thương mại điện tử nội thất cao cấp **NAM QUAN**.

## Tech stack

| Layer | Technology |
|---|---|
| Runtime | Node.js ≥ 22, ESM (`"type": "module"`) |
| Framework | Express 4 + express-async-errors |
| Database | In-memory Map (dev) / PostgreSQL 14+ (prod — xem `database/migration.sql`) |
| Auth | JWT — access token (7 ngày mặc định, tuỳ chỉnh qua `JWT_EXPIRES_IN`) |
| Validation | Zod 3 |
| Security | Helmet, CORS, bcryptjs |
| Logging | Morgan (dev mode) |
| API Docs | OpenAPI 3.0.3, Scalar (`@scalar/express-api-reference`) |

---

## Prerequisites

- **Node.js ≥ 22**
- npm ≥ 10
- **PostgreSQL 14+** *(chỉ khi dùng database thật — hiện tại backend dùng in-memory store)*

---

## Quick start

### 1. Clone và cài đặt

```bash
git clone <repo-url>
cd CD1namquan/backend
npm install
```

### 2. Biến môi trường (tuỳ chọn)

Backend hoạt động mặc định **không cần file `.env`**. Nếu muốn tuỳ chỉnh, đặt biến môi trường trước khi chạy:

```bash
# Windows PowerShell
$env:PORT = "3000"
$env:JWT_SECRET = "your-strong-secret"
$env:CORS_ORIGIN = "http://localhost:5173"

# Linux / macOS
export PORT=3000
export JWT_SECRET=your-strong-secret
export CORS_ORIGIN=http://localhost:5173
```

### 3. Khởi tạo database (nếu dùng PostgreSQL)

```bash
psql -U <user> -d <database> -f database/migration.sql
```

File `migration.sql` bao gồm:
- Tạo tất cả bảng (users, products, categories, collections, news, carts, cart_items, orders, order_items, flash_sales)
- Tạo indexes tối ưu hiệu suất
- Triggers tự động cập nhật `updated_at`
- Seed data mẫu (12 sản phẩm, 7 danh mục, 3 bộ sưu tập, 8 flash sale, 3 bài tin tức)

### 4. Khởi động server

```bash
npm run dev    # Dev server với hot-reload → http://localhost:3000
```

### 5. MinIO — lưu trữ ảnh bài viết (tuỳ chọn)

Dashboard tải ảnh bìa bài viết lên MinIO theo luồng **presigned URL 2 bước**: backend
ký một URL `PUT` tạm thời, trình duyệt đẩy file thẳng lên MinIO (không đi qua API),
rồi lưu `publicUrl` vào cột `news.img`.

```bash
docker compose up -d minio     # từ thư mục gốc dự án
```

| | |
|---|---|
| S3 API | http://localhost:9000 |
| Console quản trị | http://localhost:9001 (`minioadmin` / `minioadmin`) |
| Bucket | `namquan` — backend tự tạo lúc khởi động và mở quyền đọc ẩn danh |

Bốn biến `MINIO_*` trong `.env` (xem `.env.example`) là đủ để chạy. **Bỏ trống cả
`MINIO_ENDPOINT`, `MINIO_ACCESS_KEY` và `MINIO_SECRET_KEY` sẽ tắt tính năng tải ảnh**:
backend vẫn chạy đầy đủ, chỉ riêng `POST /news/images/upload-url` trả `503` kèm lý do,
và admin vẫn dán được đường dẫn ảnh thủ công trong form soạn bài.

Ràng buộc phía server (không phụ thuộc client): chỉ nhận `image/jpeg`, `image/png`,
`image/webp`; tối đa 5MB; tên file do server sinh bằng UUID nên tên client gửi lên
không thể gây ghi đè hay path traversal.

Khi deploy, `MINIO_ENDPOINT` là địa chỉ nội bộ backend gọi MinIO, còn `MINIO_PUBLIC_URL`
là địa chỉ trình duyệt truy cập — chữ ký được ký theo `MINIO_PUBLIC_URL` nên hai giá trị
này phải khai báo đúng, nếu không MinIO sẽ từ chối chữ ký.

---

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | — | `3000` | HTTP port |
| `JWT_SECRET` | — | `nam-quan-dev-secret-change-in-prod` | Khoá ký JWT (**bắt buộc đổi khi deploy production**) |
| `JWT_EXPIRES_IN` | — | `7d` | Thời hạn token (vd: `1h`, `7d`, `30d`) |
| `NODE_ENV` | — | `development` | `development` hoặc `production` |
| `CORS_ORIGIN` | — | `http://localhost:5173` | Allowed origin cho CORS (frontend URL) |
| `OPENAPI_ENABLED` | — | `true` (trừ khi set `false`) | `false` để tắt Scalar docs |
| `MINIO_ENDPOINT` | — | — | Địa chỉ backend gọi MinIO (vd `http://minio:9000`). Bỏ trống = tắt tải ảnh |
| `MINIO_PUBLIC_URL` | — | = `MINIO_ENDPOINT` | Địa chỉ trình duyệt truy cập MinIO — chữ ký ký theo host này |
| `MINIO_ACCESS_KEY` | — | — | Access key MinIO |
| `MINIO_SECRET_KEY` | — | — | Secret key MinIO |
| `MINIO_PUBLIC_BUCKET` | — | `namquan` | Bucket chứa ảnh công khai |
| `STORAGE_UPLOAD_URL_TTL` | — | `3600` | Hạn dùng URL upload (giây) |

---

## API docs

### DEV

Scalar UI được bật tự động khi `OPENAPI_ENABLED !== 'false'`:

| URL | Mô tả |
|---|---|
| `http://localhost:3000/api-docs` | Scalar API docs UI |
| `http://localhost:3000/api/openapi.json` | Raw OpenAPI 3.0.3 spec (JSON) |

Tính năng nổi bật:
- Giao diện sidebar hiện đại với tìm kiếm endpoint
- Request / Response viewer với **Try It Out**
- Dark mode toggle
- Schema viewer với type expansion lồng nhau

**Authorize:** click biểu tượng khóa → nhập JWT access token từ `POST /api/v1/auth/login` hoặc `POST /api/v1/auth/register`.

### Import vào Postman / Bruno / Insomnia

1. Khởi động dev server
2. Import từ URL: `http://localhost:3000/api/openapi.json`
3. Spec bao gồm đầy đủ request/response examples và schema definitions

### PROD

Để tắt docs ở production, set:

```env
OPENAPI_ENABLED=false
```

---

## API base URL

```
/api/v1
```

### Routes tổng quan

| Prefix | Auth | Mô tả |
|---|---|---|
| `/api/v1/auth/register` | — | Đăng ký tài khoản mới |
| `/api/v1/auth/login` | — | Đăng nhập, nhận JWT token |
| `/api/v1/auth/me` | JWT | Lấy thông tin user hiện tại |
| `/api/v1/auth/logout` | JWT | Đăng xuất |
| `/api/v1/products` | — / JWT (CUD) | Xem, tạo, sửa, xóa sản phẩm |
| `/api/v1/products/flash-sales` | — | Danh sách flash sale |
| `/api/v1/categories` | — | Danh sách danh mục |
| `/api/v1/collections` | — | Danh sách bộ sưu tập |
| `/api/v1/news` | — | Danh sách & chi tiết tin tức |
| `/api/v1/cart` | JWT | Giỏ hàng (xem, thêm, sửa, xóa) |
| `/api/v1/orders` | JWT | Đặt hàng & lịch sử đơn hàng |

Health check (no auth):

| URL | Mô tả |
|---|---|
| `GET /api/health` | Server uptime check |

---

## Chi tiết API endpoints

### Auth

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | — | Đăng ký (name, email, password) → trả về user + token |
| `POST` | `/api/v1/auth/login` | — | Đăng nhập (email, password) → trả về user + token |
| `GET` | `/api/v1/auth/me` | JWT | Lấy thông tin tài khoản hiện tại |
| `POST` | `/api/v1/auth/logout` | JWT | Đăng xuất |

### Products

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| `GET` | `/api/v1/products` | — | Danh sách sản phẩm (lọc, tìm kiếm, phân trang, sắp xếp) |
| `GET` | `/api/v1/products/flash-sales` | — | Sản phẩm đang flash sale |
| `GET` | `/api/v1/products/:id` | — | Chi tiết sản phẩm |
| `POST` | `/api/v1/products` | JWT | Tạo sản phẩm mới |
| `PUT` | `/api/v1/products/:id` | JWT | Cập nhật sản phẩm |
| `DELETE` | `/api/v1/products/:id` | JWT | Xóa sản phẩm |

**Query parameters cho `GET /products`:**

| Param | Type | Default | Mô tả |
|---|---|---|---|
| `category` | string | — | Lọc theo danh mục (vd: `Phòng khách`, `Phòng ngủ`) |
| `type` | string | — | Lọc theo loại (vd: `Ghế Sofa`, `Giường`) |
| `search` | string | — | Tìm kiếm theo tên sản phẩm |
| `sort` | enum | `newest` | `price_asc`, `price_desc`, `rating`, `sold`, `newest` |
| `page` | integer | `1` | Trang hiện tại |
| `limit` | integer | `12` | Số sản phẩm mỗi trang (tối đa 100) |

### Categories

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| `GET` | `/api/v1/categories` | — | Danh sách danh mục |

### Collections

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| `GET` | `/api/v1/collections` | — | Danh sách bộ sưu tập |

### News

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| `GET` | `/api/v1/news` | — | Danh sách bài viết |
| `GET` | `/api/v1/news/:id` | — | Chi tiết bài viết |

### Cart

> **Tất cả các endpoint giỏ hàng đều yêu cầu JWT authentication.**

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/v1/cart` | Xem giỏ hàng hiện tại |
| `POST` | `/api/v1/cart/items` | Thêm sản phẩm vào giỏ |
| `PUT` | `/api/v1/cart/items/:productId` | Cập nhật số lượng |
| `DELETE` | `/api/v1/cart/items/:productId` | Xóa một sản phẩm khỏi giỏ |
| `DELETE` | `/api/v1/cart` | Xóa toàn bộ giỏ hàng |

### Orders

> **Tất cả các endpoint đơn hàng đều yêu cầu JWT authentication.**

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/v1/orders` | Lịch sử đơn hàng (mới nhất trước) |
| `POST` | `/api/v1/orders` | Tạo đơn hàng mới |
| `GET` | `/api/v1/orders/:id` | Chi tiết đơn hàng |

---

## Response format

### Thành công

```json
{
  "success": true,
  "message": "Success",
  "data": { ... }
}
```

### Thành công (có phân trang)

```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "total": 12,
    "page": 1,
    "limit": 12,
    "totalPages": 1
  }
}
```

### Lỗi

```json
{
  "success": false,
  "message": "Mô tả lỗi"
}
```

### Lỗi validation (Zod)

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "path": "email", "message": "Invalid email" }
  ]
}
```

---

## Xác thực (Authentication)

Sử dụng **JWT Bearer Token**:

1. Đăng ký hoặc đăng nhập để nhận token
2. Gửi token trong header cho các request cần auth:

```
Authorization: Bearer <token>
```

3. Token chứa payload: `{ id, email, role }`
4. Roles: `customer` (mặc định), `admin`

---

## npm scripts

| Script | Mô tả |
|---|---|
| `npm run dev` | Dev server với hot-reload (`node --watch`) |
| `npm start` | Production server |

---

## Cấu trúc thư mục

```
backend/
├── database/
│   └── migration.sql          # PostgreSQL schema + seed data
├── src/
│   ├── config/
│   │   └── index.js           # Biến cấu hình (env vars)
│   ├── db/
│   │   └── store.js           # In-memory data store (Map)
│   ├── docs/
│   │   └── openapi.js         # OpenAPI 3.0.3 spec + Scalar setup
│   ├── middleware/
│   │   ├── authenticate.js    # JWT auth middleware
│   │   ├── errorHandler.js    # Centralized error handler + AppError class
│   │   └── validate.js        # Zod body & query validation middleware
│   ├── modules/
│   │   ├── auth/              # Đăng ký, đăng nhập, thông tin user
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.schema.js
│   │   │   └── auth.service.js
│   │   ├── cart/              # Giỏ hàng
│   │   │   ├── cart.controller.js
│   │   │   ├── cart.routes.js
│   │   │   ├── cart.schema.js
│   │   │   └── cart.service.js
│   │   ├── categories/        # Danh mục sản phẩm
│   │   │   ├── category.controller.js
│   │   │   ├── category.routes.js
│   │   │   └── category.service.js
│   │   ├── collections/       # Bộ sưu tập
│   │   │   ├── collection.controller.js
│   │   │   ├── collection.routes.js
│   │   │   └── collection.service.js
│   │   ├── news/              # Tin tức & bài viết
│   │   │   ├── news.controller.js
│   │   │   ├── news.routes.js
│   │   │   └── news.service.js
│   │   ├── orders/            # Đơn hàng
│   │   │   ├── order.controller.js
│   │   │   ├── order.routes.js
│   │   │   ├── order.schema.js
│   │   │   └── order.service.js
│   │   └── products/          # Sản phẩm
│   │       ├── product.controller.js
│   │       ├── product.routes.js
│   │       ├── product.schema.js
│   │       └── product.service.js
│   ├── utils/
│   │   └── response.js        # Helper: ok(), created(), paginated(), noContent()
│   ├── app.js                 # Express app factory (middleware + routes)
│   ├── index.js               # Minimal entry (dev/test fallback)
│   └── server.js              # HTTP server entry point
└── package.json
```

---

## Kiến trúc (Architecture)

Mỗi module (auth, products, cart, ...) tuân theo kiến trúc **3 lớp**:

```
Routes  →  Controller  →  Service
  │            │              │
  │            │              └── Business logic + data access
  │            └── Parse request, call service, format response
  └── Định nghĩa HTTP method, path, middleware (auth, validate)
```

### Middleware pipeline

```
Request → Helmet → CORS → JSON Parser → Morgan → Route Handler
                                                       │
                                          ┌────────────┤
                                          │            │
                                     authenticate  validate(schema)
                                          │            │
                                          └────────────┤
                                                       ↓
                                                  Controller
                                                       │
                                                       ↓
                                               Error Handler
                                          (AppError / ZodError / JWT)
```

### Error handling

| Error type | HTTP Status | Mô tả |
|---|---|---|
| `AppError` (operational) | Tuỳ chỉnh | Lỗi business logic có chủ đích |
| `ZodError` | `422` | Dữ liệu request không hợp lệ |
| `JsonWebTokenError` | `401` | Token không hợp lệ |
| `TokenExpiredError` | `401` | Token hết hạn |
| Unexpected Error | `500` | Lỗi hệ thống không xác định |

---

## Database schema

File `database/migration.sql` định nghĩa 9 bảng:

| Bảng | Mô tả |
|---|---|
| `users` | Người dùng (UUID PK, roles: customer/admin) |
| `categories` | Danh mục sản phẩm |
| `collections` | Bộ sưu tập nội thất |
| `products` | Sản phẩm (giá VND, rating, stock, sold) |
| `flash_sales` | Flash sale (giá KM, giá gốc, thời gian) |
| `news` | Bài viết / tin tức |
| `carts` | Giỏ hàng (1 user = 1 cart) |
| `cart_items` | Dòng sản phẩm trong giỏ |
| `orders` | Đơn hàng (status: pending → confirmed → shipped → delivered / cancelled) |
| `order_items` | Snapshot sản phẩm tại thời điểm đặt hàng |

### Seed data có sẵn

| Dữ liệu | Số lượng |
|---|---|
| Sản phẩm nội thất | 12 |
| Danh mục | 7 |
| Bộ sưu tập | 3 |
| Flash sale | 8 |
| Bài tin tức | 3 |

> **Lưu ý:** Ở chế độ dev hiện tại, backend sử dụng **in-memory Map** (`src/db/store.js`) làm data store. Dữ liệu sẽ bị reset khi restart server. File `migration.sql` dùng để triển khai PostgreSQL thật.

---

## Chạy cùng Frontend

Từ thư mục gốc dự án (`CD1namquan/`):

```bash
# Cài tất cả dependencies
npm run install:all

# Chạy backend (terminal 1)
npm run dev:be     # → http://localhost:3000

# Chạy frontend (terminal 2)
npm run dev:fe     # → http://localhost:5173
```

Frontend (Vite + React) giao tiếp với backend qua CORS origin `http://localhost:5173`.
