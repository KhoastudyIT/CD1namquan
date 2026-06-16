-- =============================================================
-- NAM QUAN — Database Migration
-- PostgreSQL 14+
-- Chạy: psql -U <user> -d <database> -f migration.sql
-- =============================================================

-- Extension UUID (dùng gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =============================================================
-- BẢNG
-- =============================================================

-- Người dùng
CREATE TABLE IF NOT EXISTS users (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(255) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  role        VARCHAR(20)  NOT NULL DEFAULT 'customer'
              CHECK (role IN ('customer', 'admin')),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Danh mục sản phẩm (Sofa, Ghế, Giường...)
CREATE TABLE IF NOT EXISTS categories (
  id    SERIAL       PRIMARY KEY,
  name  VARCHAR(100) NOT NULL,
  img   VARCHAR(500) NOT NULL DEFAULT ''
);

-- Bộ sưu tập (BST Modern Living, Luxury...)
CREATE TABLE IF NOT EXISTS collections (
  id    SERIAL       PRIMARY KEY,
  name  VARCHAR(100) NOT NULL,
  img   VARCHAR(500) NOT NULL DEFAULT ''
);

-- Sản phẩm
CREATE TABLE IF NOT EXISTS products (
  id           SERIAL        PRIMARY KEY,
  name         VARCHAR(200)  NOT NULL,
  type         VARCHAR(100)  NOT NULL,                  -- Ghế Sofa, Giường, Bàn Trà...
  price        INTEGER       NOT NULL CHECK (price > 0), -- VND
  category     VARCHAR(100)  NOT NULL,                  -- Phòng khách, Phòng ngủ...
  img          VARCHAR(500)  NOT NULL DEFAULT '/images/placeholder.jpg',
  rating       NUMERIC(3,1)  NOT NULL DEFAULT 5.0
               CHECK (rating >= 0 AND rating <= 5),
  sold         INTEGER       NOT NULL DEFAULT 0,
  stock        INTEGER       NOT NULL DEFAULT 0,
  description  TEXT          NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Flash sale (liên kết sản phẩm + giá khuyến mãi)
CREATE TABLE IF NOT EXISTS flash_sales (
  id              SERIAL      PRIMARY KEY,
  product_id      INTEGER     NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price           INTEGER     NOT NULL CHECK (price > 0),          -- Giá khuyến mãi
  original_price  INTEGER     NOT NULL CHECK (original_price > 0), -- Giá gốc
  stock           INTEGER     NOT NULL DEFAULT 0,
  sold            INTEGER     NOT NULL DEFAULT 0,
  starts_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at         TIMESTAMPTZ,                                      -- NULL = không giới hạn
  active          BOOLEAN     NOT NULL DEFAULT TRUE
);

-- Bài viết / tin tức
CREATE TABLE IF NOT EXISTS news (
  id            SERIAL        PRIMARY KEY,
  title         VARCHAR(500)  NOT NULL,
  publish_date  DATE          NOT NULL,
  img           VARCHAR(500)  NOT NULL DEFAULT '',
  excerpt       TEXT          NOT NULL DEFAULT '',
  content       TEXT          NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Giỏ hàng (mỗi user có đúng 1 cart)
CREATE TABLE IF NOT EXISTS carts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

-- Dòng sản phẩm trong giỏ
CREATE TABLE IF NOT EXISTS cart_items (
  id          SERIAL   PRIMARY KEY,
  cart_id     UUID     NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id  INTEGER  NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity    INTEGER  NOT NULL DEFAULT 1 CHECK (quantity > 0),
  UNIQUE (cart_id, product_id)
);

-- Đơn hàng
CREATE TABLE IF NOT EXISTS orders (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID         NOT NULL REFERENCES users(id),
  total             INTEGER      NOT NULL CHECK (total >= 0), -- VND
  shipping_address  TEXT         NOT NULL,
  note              TEXT         NOT NULL DEFAULT '',
  status            VARCHAR(20)  NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Dòng sản phẩm trong đơn hàng (snapshot tại thời điểm đặt)
CREATE TABLE IF NOT EXISTS order_items (
  id          SERIAL        PRIMARY KEY,
  order_id    UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  INTEGER       NOT NULL REFERENCES products(id),
  quantity    INTEGER       NOT NULL CHECK (quantity > 0),
  name        VARCHAR(200)  NOT NULL, -- snapshot
  price       INTEGER       NOT NULL, -- snapshot (VND)
  img         VARCHAR(500)  NOT NULL DEFAULT ''
);


-- =============================================================
-- INDEXES
-- =============================================================

CREATE INDEX IF NOT EXISTS idx_products_category   ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_type       ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_price      ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_rating     ON products(rating DESC);
CREATE INDEX IF NOT EXISTS idx_products_sold       ON products(sold DESC);
CREATE INDEX IF NOT EXISTS idx_products_stock      ON products(stock);

CREATE INDEX IF NOT EXISTS idx_flash_sales_active  ON flash_sales(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_flash_sales_product ON flash_sales(product_id);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart     ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product  ON cart_items(product_id);

CREATE INDEX IF NOT EXISTS idx_orders_user         ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status       ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created      ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order   ON order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_news_publish_date   ON news(publish_date DESC);

CREATE INDEX IF NOT EXISTS idx_users_email         ON users(email);


-- =============================================================
-- TRIGGER: tự động cập nhật updated_at
-- =============================================================

CREATE OR REPLACE FUNCTION trg_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

CREATE OR REPLACE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

CREATE OR REPLACE TRIGGER trg_carts_updated_at
  BEFORE UPDATE ON carts
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

CREATE OR REPLACE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();


-- =============================================================
-- SEED DATA
-- =============================================================

-- Categories
INSERT INTO categories (id, name, img) VALUES
  (1, 'Sofa',       '/images/catSofa.jpg'),
  (2, 'Ghế',        '/images/catChair.jpg'),
  (3, 'Bàn & Tủ',   '/images/catTable.jpg'),
  (4, 'Giường',     '/images/catBed.jpg'),
  (5, 'Ngoại trời', '/images/catOutdoor.jpg'),
  (6, 'Văn phòng',  '/images/catOffice.jpg'),
  (7, 'Trang trí',  '/images/catDecor.jpg')
ON CONFLICT (id) DO NOTHING;

SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));

-- Collections
INSERT INTO collections (id, name, img) VALUES
  (1, 'BST MODERN LIVING', '/images/modern.jpg'),
  (2, 'BST LUXURY',        '/images/luxury.jpg'),
  (3, 'BST MINIMALIST',    '/images/minimal.jpg')
ON CONFLICT (id) DO NOTHING;

SELECT setval('collections_id_seq', (SELECT MAX(id) FROM collections));

-- Products
INSERT INTO products (id, name, type, price, category, img, rating, sold, stock, description) VALUES
  ( 1, 'Sofa Băng Vải Linen Mây',      'Ghế Sofa',     18900000, 'Phòng khách', '/images/sofaBeige.jpg',  4.8, 124,  50, 'Sofa băng vải linen thiết kế tối giản, chất liệu cao cấp phù hợp không gian phòng khách hiện đại.'),
  ( 2, 'Bình Gốm Trang Trí Emerald',   'Decor',         1290000, 'Decor',       '/images/vaseGreen.jpg',  4.9,  56,  80, 'Bình gốm men ngọc lục bảo, điểm nhấn trang trí sang trọng.'),
  ( 3, 'Ghế Bành Bọc Nỉ Azure',        'Ghế Armchair',  6500000, 'Phòng khách', '/images/armBlue.jpg',    4.7,  88,  30, 'Ghế bành bọc nỉ xanh azure, thiết kế cổ điển thanh lịch.'),
  ( 4, 'Ghế Mây Đan Thủ Công',         'Ghế Thư Giãn',  3900000, 'Ngoại trời',  '/images/rattan.jpg',     4.6,  41,  25, 'Ghế mây đan tay thủ công, bền đẹp phù hợp ban công ngoài trời.'),
  ( 5, 'Giường Ngủ Tân Cổ Điển',       'Giường',       24500000, 'Phòng ngủ',   '/images/bedClassic.jpg', 4.9,  73,  15, 'Giường ngủ phong cách tân cổ điển, khung gỗ tự nhiên kết hợp đầu giường bọc nỉ.'),
  ( 6, 'Bàn Trà Tròn Mặt Đá',          'Bàn Trà',       5200000, 'Phòng khách', '/images/tableBlack.jpg', 4.8, 102,  40, 'Bàn trà tròn mặt đá marble đen, chân kim loại mạ vàng sang trọng.'),
  ( 7, 'Sofa Module Vải Bố',            'Ghế Sofa',     22900000, 'Phòng khách', '/images/sofaWhite.jpg',  4.8,  67,  20, 'Sofa module dạng góc chữ L vải bố, có thể tùy chỉnh layout linh hoạt.'),
  ( 8, 'Tủ Đầu Giường Gỗ Sồi',         'Tủ',            4100000, 'Phòng ngủ',   '/images/drawer.jpg',     4.7,  95,  60, 'Tủ đầu giường gỗ sồi tự nhiên, 2 ngăn kéo tiện dụng.'),
  ( 9, 'Bàn Làm Việc Gỗ Tự Nhiên',     'Bàn',           7800000, 'Văn phòng',   '/images/deskWood.jpg',   4.9,  58,  35, 'Bàn làm việc mặt gỗ tự nhiên rộng rãi, chân kim loại vững chắc.'),
  (10, 'Ghế Armchair Bọc Vải Kem',      'Ghế Armchair',  5400000, 'Phòng khách', '/images/armBeige.jpg',   4.6, 130,  45, 'Ghế armchair bọc vải kem tone beige nhẹ nhàng, tạo sự ấm áp cho phòng khách.'),
  (11, 'Sofa Băng Da Cao Cấp',          'Ghế Sofa',     29900000, 'Phòng khách', '/images/sofaSlate.jpg',  4.9,  49,  10, 'Sofa da bò thật màu xám đậm, sang trọng và bền bỉ.'),
  (12, 'Ghế Bành Tân Cổ Điển Rose',    'Ghế Armchair',  6900000, 'Phòng ngủ',   '/images/armPink.jpg',    4.7,  38,  20, 'Ghế bành hồng phấn phong cách tân cổ điển, điểm nhấn cho phòng ngủ nữ tính.')
ON CONFLICT (id) DO NOTHING;

SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));

-- Flash Sales
INSERT INTO flash_sales (id, product_id, price, original_price, stock, sold, active) VALUES
  (101,  5, 11000000, 16500000,  80, 64, TRUE),
  (102, 10,  7500000, 10900000,  60, 41, TRUE),
  (103,  6,  7500000,  9800000,  95, 88, TRUE),
  (104,  3,  7500000,  9200000,  30, 22, TRUE),
  (105,  9, 11000000, 14200000,  88, 73, TRUE),
  (106,  2,  7500000,  9900000,  45, 30, TRUE),
  (107,  8,  7500000, 10100000,  70, 55, TRUE),
  (108, 11,  7500000, 12500000,  99, 91, TRUE)
ON CONFLICT (id) DO NOTHING;

SELECT setval('flash_sales_id_seq', (SELECT MAX(id) FROM flash_sales));

-- News
INSERT INTO news (id, title, publish_date, img, excerpt, content) VALUES
  (1,
   'Xu Hướng Nội Thất 2026 – Tinh Tế & Bền Vững',
   '2026-03-11',
   '/images/news1.jpg',
   'Khám phá những phong cách thiết kế nổi bật với vật liệu thân thiện môi trường, tối giản mà ấm cúng.',
   'Năm 2026 chứng kiến sự trỗi dậy mạnh mẽ của xu hướng nội thất bền vững. Các vật liệu tái chế, gỗ có chứng nhận FSC và vải hữu cơ đang dần thay thế các chất liệu truyền thống.'
  ),
  (2,
   'Bàn Trà – Điểm Nhấn Hoàn Hảo Cho Phòng Khách',
   '2026-02-21',
   '/images/news2.jpg',
   'Thiết kế đa dạng, đường nét tinh tế và chất liệu cao cấp giúp hoàn thiện không gian sống của bạn.',
   'Bàn trà không chỉ là vật dụng chức năng mà còn là tác phẩm nghệ thuật trong không gian phòng khách. Xu hướng năm nay ưu tiên mặt đá tự nhiên kết hợp chân kim loại.'
  ),
  (3,
   'Giải Pháp Nội Thất Văn Phòng Hiện Đại',
   '2026-02-23',
   '/images/news3.jpg',
   'Tối ưu công năng sử dụng với hệ thống bàn ghế linh hoạt, tạo cảm hứng cho không gian làm việc.',
   'Không gian làm việc hiện đại cần được thiết kế có hệ thống, tối ưu ergonomics và tạo cảm hứng sáng tạo. NAM QUAN cung cấp đầy đủ giải pháp nội thất văn phòng cao cấp.'
  )
ON CONFLICT (id) DO NOTHING;

SELECT setval('news_id_seq', (SELECT MAX(id) FROM news));


-- =============================================================
-- KIỂM TRA SAU KHI CHẠY
-- =============================================================
-- SELECT COUNT(*) FROM products;      -- 12
-- SELECT COUNT(*) FROM flash_sales;   -- 8
-- SELECT COUNT(*) FROM categories;    -- 7
-- SELECT COUNT(*) FROM collections;   -- 3
-- SELECT COUNT(*) FROM news;          -- 3
