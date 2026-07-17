# Chạy NAM QUAN bằng Docker

Toàn bộ project (Postgres + Backend API + Frontend) chạy chỉ bằng **1 lệnh**.

## 0. Yêu cầu
- **Docker Desktop** đang chạy (Docker Engine 20+, Compose v2).
- Kiểm tra: `docker --version` và `docker compose version`.

## 1. Chạy lần đầu
Tại thư mục gốc project (nơi có `docker-compose.yml`):

```bash
docker compose up -d --build
```

Lệnh này sẽ:
1. Kéo image `postgres:16-alpine`, build image `backend` và `frontend`.
2. Khởi tạo Postgres và **tự nạp** `backend/database/nam_quan_database.sql` (tạo bảng + dữ liệu mẫu).
3. Backend chờ Postgres `healthy` rồi mới khởi động, seed sẵn tài khoản admin.

Chờ ~20–40s cho lần đầu. Kiểm tra trạng thái:

```bash
docker compose ps
```
→ cả 3 phải `Up`, riêng `namquan_postgres` là `Up (healthy)`.

## 2. Truy cập
| Thành phần | URL | Ghi chú |
|---|---|---|
| Frontend | http://localhost:5173 | Giao diện chính |
| Backend API | http://localhost:3000 | |
| API Docs (Swagger) | http://localhost:3000/api-docs | |
| Health check | http://localhost:3000/api/health | `{"status":"ok"}` |
| PostgreSQL | `localhost:5433` | user/pass/db: `postgres` / `postgres` / `nam_quan` |

**Tài khoản có sẵn:**
- Admin: `admin@namquan.vn` / `admin123`
- Khách: `customer@namquan.vn` (xem seed)

> Cổng Postgres publish ở **5433** (không phải 5432) để tránh đụng Postgres cài sẵn trên máy. Bên trong Docker vẫn là 5432.

## 3. Lệnh dùng hằng ngày
```bash
docker compose up -d              # bật (không build lại)
docker compose up -d --build      # bật + build lại sau khi ĐỔI CODE
docker compose logs -f backend    # xem log backend (Ctrl+C để thoát)
docker compose logs -f            # xem log tất cả
docker compose restart backend    # khởi động lại 1 service
docker compose ps                 # trạng thái
docker compose down               # TẮT (giữ nguyên dữ liệu DB)
docker compose down -v            # TẮT + XOÁ dữ liệu DB (lần sau nạp lại SQL từ đầu)
```

## 4. Khi sửa code
- **Sửa backend** (`backend/src/...`): `docker compose up -d --build backend`
- **Sửa frontend** (`frontend/src/...`): `docker compose up -d --build frontend`
- **Sửa file SQL** (`nam_quan_database.sql`): phải nạp lại DB →
  `docker compose down -v && docker compose up -d --build`
  (vì SQL chỉ chạy khi khởi tạo DB lần đầu, dữ liệu cũ nằm trong volume).

## 5. Đổi cấu hình (tuỳ chọn)
Tạo file `.env` cạnh `docker-compose.yml` để override:
```env
POSTGRES_PASSWORD=matkhau_moi
JWT_SECRET=chuoi-bi-mat-rieng
CORS_ORIGIN=http://localhost:5173
VITE_API_URL=http://localhost:3000/api/v1
```

## 6. Xử lý sự cố
| Triệu chứng | Nguyên nhân / cách xử lý |
|---|---|
| `port is already allocated` | Cổng 3000/5173/5433 đang bị chiếm. Tắt app chiếm cổng, hoặc sửa `ports` trong `docker-compose.yml`. |
| Backend log `ECONNREFUSED ...5432` | Postgres chưa healthy. Xem `docker compose logs postgres`; thử `docker compose up -d` lại. |
| Đổi SQL nhưng dữ liệu không cập nhật | SQL chỉ nạp lần đầu. Chạy `docker compose down -v` rồi `up` lại. |
| Frontend gọi API lỗi CORS | Đảm bảo `CORS_ORIGIN` khớp URL frontend (mặc định `http://localhost:5173`). |
| Muốn làm sạch hoàn toàn | `docker compose down -v --rmi local` (xoá cả image build). |

## 7. Chạy KHÔNG dùng Docker (local thuần)
Cần cài Node 20+ và một Postgres local:
```bash
# Backend
cd backend
cp .env.example .env          # sửa DATABASE_URL cho khớp Postgres của bạn
npm install
node src/db/setup.js          # tạo DB nam_quan + nạp SQL
npm run dev                    # chạy API ở :3000

# Frontend (terminal khác)
cd frontend
npm install
npm run dev                    # chạy Vite ở :5173
```
