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

## 7. Deploy lên VPS (chạy bằng IP, chưa có tên miền)

> ⚠ **Không có HTTPS.** Mật khẩu đăng nhập và token đi qua mạng ở dạng thô, ai
> chặn được đường truyền là đọc được. Chỉ dùng để demo/thử nghiệm — đừng nhập
> dữ liệu thật. Khi có tên miền, xem mục 7.5 để bật TLS.

### 7.1. Chuẩn bị VPS
Cần Ubuntu 22.04+ (hoặc tương đương), tối thiểu 2GB RAM.

```bash
# Cài Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && exec su -l $USER   # để chạy docker không cần sudo

# Mở đúng 3 cổng cần thiết
sudo ufw allow OpenSSH
sudo ufw allow 5173/tcp    # frontend
sudo ufw allow 3033/tcp    # API — 3000 đã có web API khác dùng nên đổi sang 3033
sudo ufw allow 9000/tcp    # MinIO — trình duyệt tải/xem ảnh trực tiếp
sudo ufw enable
```

Nếu 5173 hoặc 9000 cũng đã bị chiếm, kiểm tra bằng `sudo ss -tlnp | grep -E '5173|9000'`
rồi sửa cổng publish tương ứng trong `docker-compose.yml` (phần bên trái dấu `:`).

Cổng **5433** (Postgres) và **9001** (MinIO Console) cố ý KHÔNG mở. Overlay
production đã ép chúng chỉ nghe trên `127.0.0.1`.

### 7.2. Lấy mã nguồn và cấu hình
```bash
git clone https://github.com/KhoastudyIT/CD1namquan.git
cd CD1namquan
cp .env.example .env
nano .env
```

Trong `.env`, thay **toàn bộ** `<IP-VPS>` bằng IP thật và đổi hết mật khẩu:

```bash
openssl rand -base64 32    # chạy 3 lần, lấy cho POSTGRES_PASSWORD / JWT_SECRET / MINIO_ROOT_PASSWORD
```

> Đừng dùng lại giá trị trong `backend/.env` — file đó đã nằm trên GitHub.

### 7.3. Khởi động
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

**Luôn phải kèm cả hai `-f`.** Thiếu `docker-compose.prod.yml` là Postgres bị
publish thẳng ra Internet.

### 7.4. Kiểm tra
```bash
docker compose ps                                   # tất cả Up, postgres/minio là (healthy)
curl http://localhost:3033/api/health                # {"status":"ok"}
curl -s http://localhost:3033/api/v1/news | head -c 200
docker compose logs backend | grep "Lưu trữ ảnh"     # phải thấy: MinIO bucket "namquan" sẵn sàng
```

> Cổng **3033** là cổng publish ra máy chủ (đặt bằng `API_PORT` trong `.env`).
> Bên trong container backend vẫn nghe 3000, nên `PORT` trong compose giữ nguyên.

Mở `http://<IP-VPS>:5173`, đăng nhập `admin@namquan.vn` / `admin123`
(**đổi mật khẩu ngay**), vào Dashboard → Tin tức → thử tải một ảnh lên.

Vào MinIO Console khi cần — không mở cổng, đi qua SSH tunnel:
```bash
ssh -L 9001:localhost:9001 user@<IP-VPS>    # rồi mở http://localhost:9001
```

### 7.5. Ba lỗi hay gặp

| Triệu chứng | Nguyên nhân |
|---|---|
| Trang load nhưng trống trơn, Console báo lỗi CORS | `CORS_ORIGIN` trong `.env` không khớp URL đang mở. Sửa rồi `docker compose ... up -d backend`. |
| `port is already allocated` khi khởi động | Cổng publish đã có dịch vụ khác chiếm. Xem `sudo ss -tlnp \| grep <cổng>`, đổi `API_PORT` trong `.env` (hoặc `ports` trong compose với 5173/9000). |
| Tải ảnh báo `SignatureDoesNotMatch` | `MINIO_PUBLIC_URL` còn là `localhost` hoặc sai IP. Chữ ký ký theo host này nên phải đúng tuyệt đối. |
| Đổi `VITE_API_URL` mà frontend vẫn gọi địa chỉ cũ | Biến này nhúng lúc **build**. Phải `up -d --build frontend`, restart không ăn thua. |

### 7.6. Khi có tên miền
Đổi sang HTTPS cần: 2 bản ghi A (`domain.com` và `storage.domain.com`), thêm
nginx reverse proxy + certbot, rồi sửa `.env` thành `https://`. Lưu ý **MinIO
phải có subdomain riêng** — URL upload được ký kèm đường dẫn nên không đặt sau
path con (`/storage/...`) được, nginx cắt tiền tố đi là chữ ký hỏng.

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
