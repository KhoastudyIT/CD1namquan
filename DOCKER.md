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

## 7. Deploy lên VPS (đã có Nginx Proxy Manager)

Áp dụng cho VPS đang chạy **Nginx Proxy Manager** (NPM) ở network `host`, giữ
cổng 80/443 và cấp chứng chỉ Let's Encrypt qua giao diện web.

Stack này **không publish cổng nào ra Internet** — nhờ `BIND_IP=127.0.0.1` trong
`.env`, tất cả chỉ nghe loopback; NPM gọi vào rồi phục vụ ra ngoài kèm HTTPS.
Không cần mở thêm cổng ufw ngoài SSH + 80 + 443 (NPM đã dùng sẵn).

### 7.1. Tạo bản ghi DNS

Ba subdomain, đều trỏ A record về IP VPS:

```
A   namquan.dienlanhkv.website           → <IP VPS>
A   api-namquan.dienlanhkv.website       → <IP VPS>
A   storage-namquan.dienlanhkv.website   → <IP VPS>
```

Chờ DNS lan rồi kiểm tra — NPM sẽ cấp chứng chỉ thất bại nếu chạy sớm:

```bash
dig +short namquan.dienlanhkv.website
```

### 7.2. Lấy mã nguồn và cấu hình

```bash
git clone https://github.com/KhoastudyIT/CD1namquan.git
cd CD1namquan
cp .env.example .env
nano .env
```

Sửa trong `.env`: đổi hết mật khẩu (`openssl rand -base64 32`) và thay tên miền
cho khớp. Kiểm tra cổng định dùng còn trống:

```bash
sudo ss -tlnp | grep -E ':3033 |:5173 |:9000 |:5433 '   # không ra gì là trống
```

Trùng thì đổi `API_PORT` / `WEB_PORT` trong `.env`.

### 7.3. Khởi động

```bash
docker compose up -d --build
```

Trước khi chạy, **xác nhận `BIND_IP=127.0.0.1` đã có trong `.env`** — thiếu dòng
này là Postgres, MinIO và API publish ra `0.0.0.0`, tức lộ thẳng ra Internet:

```bash
docker compose config | grep host_ip
```

Phải ra đúng **5 dòng** `host_ip: 127.0.0.1`. Thấy `0.0.0.0` thì dừng lại, sửa
`.env` rồi kiểm tra lại — đừng chạy tiếp.

Kiểm tra tại chỗ trước khi cấu hình NPM:

```bash
docker compose ps                                    # đều Up, postgres/minio (healthy)
curl http://127.0.0.1:3033/api/health                 # {"status":"ok"}
curl -sI http://127.0.0.1:5173 | head -1              # 200 OK
curl -sI http://127.0.0.1:9000/minio/health/live | head -1
docker compose logs backend | grep "Lưu trữ ảnh"      # MinIO bucket "namquan" sẵn sàng
```

### 7.4. Tạo Proxy Host trong NPM

Vào giao diện NPM → **Hosts → Proxy Hosts → Add Proxy Host**, tạo 3 mục:

| Domain Names | Forward Hostname | Forward Port |
|---|---|---|
| `namquan.dienlanhkv.website` | `127.0.0.1` | `5173` |
| `api-namquan.dienlanhkv.website` | `127.0.0.1` | `3033` |
| `storage-namquan.dienlanhkv.website` | `127.0.0.1` | `9000` |

Mỗi mục: Scheme để `http`, bật **Block Common Exploits**, sang tab **SSL** chọn
*Request a new SSL Certificate* + **Force SSL** + đồng ý điều khoản.

Riêng host **storage**, mở tab **Advanced** và dán:

```nginx
client_max_body_size 10m;
```

MinIO nhận file tối đa 5MB; không đặt dòng này thì nginx có thể chặn trước ở mức
mặc định 1MB và ảnh tải lên sẽ lỗi `413`.

### 7.5. Kiểm tra từ ngoài

```bash
curl https://api-namquan.dienlanhkv.website/api/health
curl -sI https://storage-namquan.dienlanhkv.website/minio/health/live | head -1
```

Mở `https://namquan.dienlanhkv.website`, đăng nhập `admin@namquan.vn` /
`admin123` (**đổi mật khẩu ngay**), vào Dashboard → Tin tức → tải thử một ảnh.
Ảnh hiện ra là toàn bộ chuỗi đã thông.

Vào MinIO Console khi cần — không mở cổng, đi qua SSH tunnel:

```bash
ssh -L 9001:localhost:9001 user@<IP VPS>    # rồi mở http://localhost:9001
```

### 7.6. Bốn lỗi hay gặp

| Triệu chứng | Nguyên nhân |
|---|---|
| Trang trắng, Console báo lỗi CORS | `CORS_ORIGIN` không khớp domain đang mở. Sửa `.env` rồi `up -d backend`. |
| Tải ảnh lỗi `SignatureDoesNotMatch` | `MINIO_PUBLIC_URL` không khớp domain trong NPM. Chữ ký ký theo host này nên phải đúng từng ký tự, kể cả `https://`. |
| Tải ảnh lỗi `413 Request Entity Too Large` | Thiếu `client_max_body_size` ở tab Advanced của host storage. |
| Đổi `VITE_API_URL` mà frontend vẫn gọi địa chỉ cũ | Biến nhúng lúc **build**. Phải `up -d --build frontend`. |

### 7.7. Cập nhật khi có code mới

```bash
cd CD1namquan
git pull origin dev
docker compose up -d --build
```

`.env` nằm trong `.gitignore` nên `git pull` không ghi đè cấu hình.

---

## 8. Chạy KHÔNG dùng Docker (local thuần)
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
