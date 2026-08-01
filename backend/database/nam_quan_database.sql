-- =============================================================
-- NAM QUAN — COMPLETE DATABASE V2
-- PostgreSQL 14+
-- Includes: home, products, collections, favorites, login/users,
-- news, contact, cart, orders, search, notifications, showroom,
-- SEO, menus, coupons, admin support.
-- Run: psql -U <user> -d <database> -f nam_quan_complete_database_v2.sql
-- =============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- =============================================================
-- DROP TABLES
-- =============================================================
DROP TABLE IF EXISTS page_views CASCADE;
DROP TABLE IF EXISTS product_tags CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS coupon_usage CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS faqs CASCADE;
DROP TABLE IF EXISTS search_history CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS review_images CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS project_images CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS consultation_requests CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS showroom_images CASCADE;
DROP TABLE IF EXISTS showrooms CASCADE;
DROP TABLE IF EXISTS company_info CASCADE;
DROP TABLE IF EXISTS menus CASCADE;
DROP TABLE IF EXISTS banners CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS product_specs CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS carts CASCADE;
DROP TABLE IF EXISTS news CASCADE;
DROP TABLE IF EXISTS news_categories CASCADE;
DROP TABLE IF EXISTS flash_sales CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS brands CASCADE;
DROP TABLE IF EXISTS collections CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS user_addresses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =============================================================
-- USERS / LOGIN
-- =============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL DEFAULT '',
  password VARCHAR(255) NOT NULL,
  avatar VARCHAR(500),
  role VARCHAR(30) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','staff','manager','admin','super_admin')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','blocked')),
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_addresses (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_name VARCHAR(100) NOT NULL,
  receiver_phone VARCHAR(20) NOT NULL,
  province VARCHAR(100) NOT NULL DEFAULT '',
  district VARCHAR(100) NOT NULL DEFAULT '',
  ward VARCHAR(100) NOT NULL DEFAULT '',
  address TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- CATEGORY / COLLECTION / BRAND / PRODUCT
-- =============================================================
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(150) NOT NULL UNIQUE,
  img VARCHAR(500) NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  seo_title VARCHAR(255),
  seo_description TEXT,
  seo_keywords TEXT,
  og_image VARCHAR(500),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE collections (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(150) NOT NULL UNIQUE,
  img VARCHAR(500) NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  seo_title VARCHAR(255),
  seo_description TEXT,
  seo_keywords TEXT,
  og_image VARCHAR(500),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE brands (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  slug VARCHAR(180) NOT NULL UNIQUE,
  logo VARCHAR(500) NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(250) NOT NULL UNIQUE,
  sku VARCHAR(100) UNIQUE,
  type VARCHAR(100) NOT NULL,
  price INTEGER NOT NULL CHECK (price > 0),
  sale_price INTEGER CHECK (sale_price IS NULL OR sale_price > 0),
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  collection_id INTEGER REFERENCES collections(id) ON DELETE SET NULL,
  brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL,
  category VARCHAR(100) NOT NULL DEFAULT '',
  img VARCHAR(500) NOT NULL DEFAULT '/images/placeholder.jpg',
  rating NUMERIC(3,1) NOT NULL DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
  sold INTEGER NOT NULL DEFAULT 0 CHECK (sold >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  description TEXT NOT NULL DEFAULT '',
  short_desc TEXT NOT NULL DEFAULT '',
  seo_title VARCHAR(255),
  seo_description TEXT,
  seo_keywords TEXT,
  og_image VARCHAR(500),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','draft')),
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE product_images (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  img VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255) NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE product_specs (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  material VARCHAR(255) NOT NULL DEFAULT '',
  color VARCHAR(255) NOT NULL DEFAULT '',
  dimensions VARCHAR(255) NOT NULL DEFAULT '',
  warranty VARCHAR(255) NOT NULL DEFAULT '',
  origin VARCHAR(255) NOT NULL DEFAULT '',
  style VARCHAR(255) NOT NULL DEFAULT '',
  room VARCHAR(255) NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT ''
);

CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(120) NOT NULL UNIQUE
);

CREATE TABLE product_tags (
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, tag_id)
);

-- =============================================================
-- FLASH SALE / COUPON
-- =============================================================
CREATE TABLE flash_sales (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price INTEGER NOT NULL CHECK (price > 0),
  original_price INTEGER NOT NULL CHECK (original_price > 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sold INTEGER NOT NULL DEFAULT 0 CHECK (sold >= 0),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE coupons (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL DEFAULT '',
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percent','fixed')),
  discount_value INTEGER NOT NULL CHECK (discount_value > 0),
  min_order INTEGER NOT NULL DEFAULT 0,
  max_discount INTEGER,
  quantity INTEGER NOT NULL DEFAULT 0,
  used_count INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE coupon_usage (
  id SERIAL PRIMARY KEY,
  coupon_id INTEGER NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  order_id UUID,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (coupon_id, user_id, order_id)
);

-- =============================================================
-- NEWS / CONTENT
-- =============================================================
CREATE TABLE news_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(140) NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE news (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(550) NOT NULL UNIQUE,
  publish_date DATE NOT NULL,
  img VARCHAR(500) NOT NULL DEFAULT '',
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  author VARCHAR(100) NOT NULL DEFAULT 'NAM QUAN',
  category_id INTEGER REFERENCES news_categories(id) ON DELETE SET NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  views INTEGER NOT NULL DEFAULT 0,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  reading_time INTEGER NOT NULL DEFAULT 1,
  seo_title VARCHAR(255),
  seo_description TEXT,
  seo_keywords TEXT,
  og_image VARCHAR(500),
  status VARCHAR(20) NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published','hidden')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Danh sách công khai lọc theo status rồi sắp xếp theo ngày đăng;
-- dashboard lọc thêm theo danh mục và tag.
CREATE INDEX idx_news_status_publish ON news (status, publish_date DESC, id DESC);
CREATE INDEX idx_news_category       ON news (category_id);
CREATE INDEX idx_news_featured       ON news (featured) WHERE featured = TRUE;
CREATE INDEX idx_news_tags           ON news USING GIN (tags);

-- =============================================================
-- CART / ORDER
-- =============================================================
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cart_items (
  id SERIAL PRIMARY KEY,
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cart_id, product_id)
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  coupon_id INTEGER REFERENCES coupons(id) ON DELETE SET NULL,
  customer_name VARCHAR(100) NOT NULL DEFAULT '',
  customer_email VARCHAR(255) NOT NULL DEFAULT '',
  customer_phone VARCHAR(20) NOT NULL DEFAULT '',
  total INTEGER NOT NULL CHECK (total >= 0),
  shipping_fee INTEGER NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  discount_amount INTEGER NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  final_total INTEGER NOT NULL DEFAULT 0 CHECK (final_total >= 0),
  shipping_address TEXT NOT NULL,
  payment_method VARCHAR(30) NOT NULL DEFAULT 'cod' CHECK (payment_method IN ('cod','bank_transfer','momo','vnpay','cash')),
  payment_status VARCHAR(30) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','paid','refunded','failed')),
  shipping_status VARCHAR(30) NOT NULL DEFAULT 'not_shipped' CHECK (shipping_status IN ('not_shipped','shipping','shipped','delivered','returned')),
  note TEXT NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE coupon_usage ADD CONSTRAINT fk_coupon_usage_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  name VARCHAR(200) NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  img VARCHAR(500) NOT NULL DEFAULT ''
);

-- =============================================================
-- FAVORITE / NOTIFICATION / SEARCH
-- =============================================================
CREATE TABLE favorites (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  type VARCHAR(50) NOT NULL DEFAULT 'system',
  target_url VARCHAR(500) NOT NULL DEFAULT '',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE search_history (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  keyword VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- HOME / MENU / COMPANY / SHOWROOM / CONTACT
-- =============================================================
CREATE TABLE menus (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  url VARCHAR(255) NOT NULL,
  parent_id INTEGER REFERENCES menus(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE banners (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  img VARCHAR(500) NOT NULL,
  mobile_img VARCHAR(500),
  link VARCHAR(500) NOT NULL DEFAULT '',
  button_text VARCHAR(100) NOT NULL DEFAULT '',
  button_link VARCHAR(500) NOT NULL DEFAULT '',
  position VARCHAR(50) NOT NULL DEFAULT 'home' CHECK (position IN ('home','category','collection','about','sale')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE company_info (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  slogan VARCHAR(500) NOT NULL DEFAULT '',
  about TEXT NOT NULL DEFAULT '',
  mission TEXT NOT NULL DEFAULT '',
  vision TEXT NOT NULL DEFAULT '',
  phone VARCHAR(50) NOT NULL DEFAULT '',
  email VARCHAR(255) NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  map_url TEXT NOT NULL DEFAULT '',
  facebook VARCHAR(500) NOT NULL DEFAULT '',
  instagram VARCHAR(500) NOT NULL DEFAULT '',
  youtube VARCHAR(500) NOT NULL DEFAULT '',
  tiktok VARCHAR(500) NOT NULL DEFAULT '',
  logo VARCHAR(500) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE showrooms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL DEFAULT '',
  email VARCHAR(255) NOT NULL DEFAULT '',
  address TEXT NOT NULL,
  map_url TEXT NOT NULL DEFAULT '',
  open_time VARCHAR(255) NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE showroom_images (
  id SERIAL PRIMARY KEY,
  showroom_id INTEGER NOT NULL REFERENCES showrooms(id) ON DELETE CASCADE,
  img VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255) NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL DEFAULT '',
  subject VARCHAR(255) NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  status VARCHAR(30) NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','resolved','spam')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE consultation_requests (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL DEFAULT '',
  service_type VARCHAR(100) NOT NULL DEFAULT '',
  property_type VARCHAR(100) NOT NULL DEFAULT '',
  area VARCHAR(100) NOT NULL DEFAULT '',
  budget VARCHAR(100) NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  status VARCHAR(30) NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','quoted','closed','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE faqs (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('customer','staff','system')),
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- PROJECT / REVIEW / ANALYTICS
-- =============================================================
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(300) NOT NULL UNIQUE,
  client_name VARCHAR(255) NOT NULL DEFAULT '',
  project_type VARCHAR(100) NOT NULL DEFAULT '',
  location VARCHAR(255) NOT NULL DEFAULT '',
  area VARCHAR(100) NOT NULL DEFAULT '',
  year INTEGER CHECK (year IS NULL OR year >= 2000),
  img VARCHAR(500) NOT NULL DEFAULT '',
  excerpt TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  seo_title VARCHAR(255),
  seo_description TEXT,
  seo_keywords TEXT,
  og_image VARCHAR(500),
  status VARCHAR(20) NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published','hidden')),
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE project_images (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  img VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255) NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL DEFAULT '',
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE review_images (
  id SERIAL PRIMARY KEY,
  review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  img VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255) NOT NULL DEFAULT ''
);

CREATE TABLE page_views (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  page_url TEXT NOT NULL,
  ip_address VARCHAR(100) NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- INDEXES
-- =============================================================
--CREATE INDEX idx_users_email ON users(email);
--CREATE INDEX idx_products_slug ON products(slug);
--CREATE INDEX idx_products_category_id ON products(category_id);
--CREATE INDEX idx_products_collection_id ON products(collection_id);
--CREATE INDEX idx_products_brand_id ON products(brand_id);
--CREATE INDEX idx_products_featured ON products(featured) WHERE featured = TRUE;
--CREATE INDEX idx_products_search ON products USING GIN (to_tsvector('simple', unaccent(name || ' ' || type || ' ' || category || ' ' || short_desc)));
--CREATE INDEX idx_news_slug ON news(slug);
--CREATE INDEX idx_orders_user ON orders(user_id);
--CREATE INDEX idx_orders_status ON orders(status);
--CREATE INDEX idx_notifications_user ON notifications(user_id);
--CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);
--CREATE INDEX idx_favorites_user ON favorites(user_id);
--CREATE INDEX idx_search_keyword ON search_history(keyword);
--CREATE INDEX idx_banners_position ON banners(position);
--CREATE INDEX idx_showrooms_active ON showrooms(active);
--CREATE INDEX idx_reviews_product ON reviews(product_id);
--CREATE INDEX idx_page_views_product ON page_views(product_id);

-- =============================================================
-- TRIGGER UPDATED_AT
-- =============================================================
CREATE OR REPLACE FUNCTION trg_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_user_addresses_updated_at BEFORE UPDATE ON user_addresses FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_collections_updated_at BEFORE UPDATE ON collections FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_brands_updated_at BEFORE UPDATE ON brands FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_flash_sales_updated_at BEFORE UPDATE ON flash_sales FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_coupons_updated_at BEFORE UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_news_updated_at BEFORE UPDATE ON news FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_carts_updated_at BEFORE UPDATE ON carts FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_menus_updated_at BEFORE UPDATE ON menus FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_banners_updated_at BEFORE UPDATE ON banners FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_company_info_updated_at BEFORE UPDATE ON company_info FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_showrooms_updated_at BEFORE UPDATE ON showrooms FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_consultation_updated_at BEFORE UPDATE ON consultation_requests FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_faqs_updated_at BEFORE UPDATE ON faqs FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

-- =============================================================
-- SEED DATA
-- =============================================================
INSERT INTO users (id, name, email, phone, password, role, email_verified) VALUES
('11111111-1111-1111-1111-111111111111','Admin Nam Quan','admin@namquan.vn','0900000000','$2a$10$L1YPWvKFccX/CnrvNOw6FOIOYlhGvJrbS/GfV6U9Zn7IqrloOt59C','admin',TRUE),
('22222222-2222-2222-2222-222222222222','Khách hàng Demo','customer@namquan.vn','0911111111','$2a$10$L1YPWvKFccX/CnrvNOw6FOIOYlhGvJrbS/GfV6U9Zn7IqrloOt59C','customer',TRUE);

INSERT INTO user_addresses (user_id, receiver_name, receiver_phone, province, district, ward, address, is_default) VALUES
('22222222-2222-2222-2222-222222222222','Khách hàng Demo','0911111111','TP. Hồ Chí Minh','Quận 1','Phường Bến Nghé','12 Nguyễn Huệ',TRUE);

INSERT INTO categories (id, name, slug, img, description, seo_title) VALUES
(1,'Sofa','sofa','/images/catSofa.jpg','Các mẫu sofa cao cấp cho phòng khách hiện đại.','Sofa cao cấp NAM QUAN'),
(2,'Ghế','ghe','/images/catChair.jpg','Ghế ăn, ghế thư giãn, ghế armchair và ghế làm việc.','Ghế nội thất NAM QUAN'),
(3,'Bàn & Tủ','ban-tu','/images/catTable.jpg','Bàn trà, bàn ăn, bàn làm việc, tủ trang trí và tủ lưu trữ.','Bàn tủ nội thất'),
(4,'Giường','giuong','/images/catBed.jpg','Giường ngủ phong cách hiện đại và tân cổ điển.','Giường ngủ cao cấp'),
(5,'Ngoại trời','ngoai-troi','/images/catOutdoor.jpg','Nội thất ban công, sân vườn và không gian ngoài trời.','Nội thất ngoài trời'),
(6,'Văn phòng','van-phong','/images/catOffice.jpg','Bàn ghế và giải pháp nội thất văn phòng.','Nội thất văn phòng'),
(7,'Trang trí','trang-tri','/images/catDecor.jpg','Đồ decor, bình gốm, tranh và phụ kiện trang trí.','Đồ trang trí nội thất');
SELECT setval('categories_id_seq', 7, TRUE);

INSERT INTO collections (id, name, slug, img, description, seo_title) VALUES
(1,'BST MODERN LIVING','modern-living','/images/modern.jpg','Bộ sưu tập nội thất hiện đại, tinh giản và tiện nghi.','Modern Living'),
(2,'BST LUXURY','luxury','/images/luxury.jpg','Bộ sưu tập cao cấp dành cho không gian sang trọng.','Luxury Collection'),
(3,'BST MINIMALIST','minimalist','/images/minimal.jpg','Bộ sưu tập tối giản, nhẹ nhàng và tinh tế.','Minimalist Collection'),
(4,'BST NATURAL HOME','natural-home','/images/natural.jpg','Nội thất gỗ, mây, vải tự nhiên cho không gian ấm áp.','Natural Home Collection');
SELECT setval('collections_id_seq', 4, TRUE);

INSERT INTO brands (id, name, slug, logo, description) VALUES
(1,'NAM QUAN','nam-quan','/images/logo.png','Thương hiệu nội thất cao cấp NAM QUAN'),
(2,'NQ Luxury','nq-luxury','/images/brand-luxury.png','Dòng sản phẩm cao cấp'),
(3,'NQ Home','nq-home','/images/brand-home.png','Dòng sản phẩm gia đình');
SELECT setval('brands_id_seq', 3, TRUE);

INSERT INTO products (id, name, slug, sku, type, price, sale_price, category_id, collection_id, brand_id, category, img, rating, sold, stock, description, short_desc, featured, seo_title, og_image) VALUES
(1,'Sofa Băng Vải Linen Mây','sofa-bang-vai-linen-may','NQ-SF-001','Ghế Sofa',18900000,NULL,1,1,1,'Phòng khách','/images/sofaBeige.jpg',4.8,124,50,'Sofa băng vải linen thiết kế tối giản, chất liệu cao cấp phù hợp không gian phòng khách hiện đại.','Sofa linen tối giản cho phòng khách hiện đại.',TRUE,'Sofa Băng Vải Linen Mây','/images/sofaBeige.jpg'),
(2,'Bình Gốm Trang Trí Emerald','binh-gom-trang-tri-emerald','NQ-DC-002','Decor',1290000,NULL,7,2,2,'Decor','/images/vaseGreen.jpg',4.9,56,80,'Bình gốm men ngọc lục bảo, điểm nhấn trang trí sang trọng.','Bình gốm emerald sang trọng.',FALSE,'Bình Gốm Trang Trí Emerald','/images/vaseGreen.jpg'),
(3,'Ghế Bành Bọc Nỉ Azure','ghe-banh-boc-ni-azure','NQ-GH-003','Ghế Armchair',6500000,NULL,2,1,1,'Phòng khách','/images/armBlue.jpg',4.7,88,30,'Ghế bành bọc nỉ xanh azure, thiết kế cổ điển thanh lịch.','Ghế bành xanh azure thanh lịch.',TRUE,'Ghế Bành Bọc Nỉ Azure','/images/armBlue.jpg'),
(4,'Ghế Mây Đan Thủ Công','ghe-may-dan-thu-cong','NQ-GH-004','Ghế Thư Giãn',3900000,NULL,5,4,3,'Ngoại trời','/images/rattan.jpg',4.6,41,25,'Ghế mây đan tay thủ công, bền đẹp phù hợp ban công ngoài trời.','Ghế mây thủ công cho ban công.',FALSE,'Ghế Mây Đan Thủ Công','/images/rattan.jpg'),
(5,'Giường Ngủ Tân Cổ Điển','giuong-ngu-tan-co-dien','NQ-BD-005','Giường',24500000,22000000,4,2,2,'Phòng ngủ','/images/bedClassic.jpg',4.9,73,15,'Giường ngủ phong cách tân cổ điển, khung gỗ tự nhiên kết hợp đầu giường bọc nỉ.','Giường ngủ tân cổ điển cao cấp.',TRUE,'Giường Ngủ Tân Cổ Điển','/images/bedClassic.jpg'),
(6,'Bàn Trà Tròn Mặt Gỗ','ban-tra-tron-mat-da','NQ-TB-006','Bàn Trà',5200000,NULL,3,2,2,'Phòng khách','/images/tableBlack.jpg',4.8,102,40,'Bàn trà tròn mặt đá marble đen, chân kim loại mạ vàng sang trọng.','Bàn trà mặt đá marble đen.',TRUE,'Bàn Trà Tròn Mặt Đá','/images/tableBlack.jpg'),
(7,'Sofa Module Vải Bố','sofa-module-vai-bo','NQ-SF-007','Ghế Sofa',22900000,NULL,1,1,1,'Phòng khách','/images/sofaWhite.jpg',4.8,67,20,'Sofa module dạng góc chữ L vải bố, có thể tùy chỉnh layout linh hoạt.','Sofa module linh hoạt cho phòng khách.',TRUE,'Sofa Module Vải Bố','/images/sofaWhite.jpg'),
(8,'Tủ Đầu Giường Gỗ Sồi','tu-dau-giuong-go-soi','NQ-TU-008','Tủ',4100000,NULL,3,3,3,'Phòng ngủ','/images/drawer.jpg',4.7,95,60,'Tủ đầu giường gỗ sồi tự nhiên, 2 ngăn kéo tiện dụng.','Tủ đầu giường gỗ sồi tự nhiên.',FALSE,'Tủ Đầu Giường Gỗ Sồi','/images/drawer.jpg'),
(9,'Bàn Làm Việc Gỗ Tự Nhiên','ban-lam-viec-go-tu-nhien','NQ-BL-009','Bàn',7800000,NULL,6,3,3,'Văn phòng','/images/deskWood.jpg',4.9,58,35,'Bàn làm việc mặt gỗ tự nhiên rộng rãi, chân kim loại vững chắc.','Bàn làm việc gỗ tự nhiên.',FALSE,'Bàn Làm Việc Gỗ Tự Nhiên','/images/deskWood.jpg'),
(10,'Ghế Armchair Bọc Vải Kem','ghe-armchair-boc-vai-kem','NQ-GH-010','Ghế Armchair',5400000,NULL,2,1,1,'Phòng khách','/images/armBeige.jpg',4.6,130,45,'Ghế armchair bọc vải kem tone beige nhẹ nhàng, tạo sự ấm áp cho phòng khách.','Ghế armchair màu kem ấm áp.',FALSE,'Ghế Armchair Bọc Vải Kem','/images/armBeige.jpg'),
(11,'Sofa Băng Da Cao Cấp','sofa-bang-da-cao-cap','NQ-SF-011','Ghế Sofa',29900000,27500000,1,2,2,'Phòng khách','/images/sofaSlate.jpg',4.9,49,10,'Sofa da bò thật màu xám đậm, sang trọng và bền bỉ.','Sofa da cao cấp sang trọng.',TRUE,'Sofa Băng Da Cao Cấp','/images/sofaSlate.jpg'),
(12,'Ghế Bành Tân Cổ Điển Rose','ghe-banh-tan-co-dien-rose','NQ-GH-012','Ghế Armchair',6900000,NULL,2,2,2,'Phòng ngủ','/images/armPink.jpg',4.7,38,20,'Ghế bành hồng phấn phong cách tân cổ điển, điểm nhấn cho phòng ngủ nữ tính.','Ghế bành rose tân cổ điển.',FALSE,'Ghế Bành Tân Cổ Điển Rose','/images/armPink.jpg'),
(13,'Bàn Làm Việc Gỗ Tự Nhiên','ban-lam-viec-go-tu-nhien-2','NQ-BL-013','Bàn',8500000,NULL,6,3,3,'Văn phòng','/images/ban_lam_viec.png',4.8,30,20,'Bàn làm việc chất liệu gỗ tự nhiên cao cấp, thiết kế cổ điển pha nét hiện đại, phù hợp cho không gian làm việc chuyên nghiệp.','Bàn làm việc gỗ tự nhiên.',FALSE,'Bàn Làm Việc Gỗ Tự Nhiên','/images/ban_lam_viec.png'),
(14,'Sofa Góc Hiện Đại','sofa-goc-hien-dai','NQ-SF-014','Ghế Sofa',18500000,NULL,1,1,1,'Phòng khách','/images/sofa_goc.png',4.9,45,15,'Sofa góc bọc vải nỉ cao cấp màu xám xanh, đệm mút êm ái, mang lại không gian phòng khách hiện đại và sang trọng.','Sofa góc bọc vải hiện đại.',FALSE,'Sofa Góc Hiện Đại','/images/sofa_goc.png'),
(15,'Giường Ngủ Bọc Nỉ','giuong-ngu-boc-ni','NQ-BD-015','Giường',15500000,NULL,2,2,2,'Phòng ngủ','/images/giuong_ngu.jpg',4.8,25,25,'Giường ngủ khung gỗ tự nhiên bọc nỉ cao cấp, thiết kế tối giản, đầu giường vuông vắn, mang đến giấc ngủ thư thái.','Giường bọc nỉ cao cấp.',FALSE,'Giường Ngủ Bọc Nỉ','/images/giuong_ngu.jpg'),
(16,'Lọ Hoa Thủy Tinh Xanh','lo-hoa-thuy-tinh-xanh','NQ-DC-016','Decor',1200000,NULL,4,2,2,'Decor','/images/lo_hoa_thuy_tinh.png',4.7,50,40,'Lọ hoa thủy tinh màu xanh ngọc bích độc đáo, với những đường vân uốn lượn nghệ thuật, làm điểm nhấn hoàn hảo cho bàn trà.','Lọ hoa thủy tinh màu xanh.',FALSE,'Lọ Hoa Thủy Tinh Xanh','/images/lo_hoa_thuy_tinh.png'),
(17,'Sofa Băng Bọc Nỉ Kem','sofa-bang-boc-ni-kem','NQ-SF-017','Ghế Sofa',12500000,NULL,1,1,1,'Phòng khách','/images/sofa_bang.png',4.9,60,20,'Sofa băng 2 chỗ bọc nỉ màu kem thanh lịch, kết hợp đệm gối tựa lưng êm ái và điểm nhấn vân gỗ tinh tế.','Sofa băng bọc nỉ 2 chỗ.',FALSE,'Sofa Băng Bọc Nỉ Kem','/images/sofa_bang.png'),
(18,'Tượng Trang Trí Cặp Đôi','tuong-trang-tri-cap-doi','NQ-DC-018','Decor',1500000,NULL,4,2,2,'Decor','/images/tuong_trang_tri.jpg',4.8,35,30,'Tượng trang trí gốm sứ hình cặp đôi màu trắng và be, thiết kế trừu tượng đầy nghệ thuật cho không gian lãng mạn.','Tượng gốm sứ trang trí.',FALSE,'Tượng Trang Trí Cặp Đôi','/images/tuong_trang_tri.jpg'),
(19,'Giường Ngủ Cổ Điển','giuong-ngu-co-dien','NQ-BD-019','Giường',28000000,26500000,2,2,2,'Phòng ngủ','/images/giuong_co_dien.png',4.9,20,10,'Giường ngủ phong cách tân cổ điển hoàng gia, khung viền gỗ điêu khắc tỉ mỉ kết hợp mây đan mộc mạc và sang trọng.','Giường ngủ tân cổ điển hoàng gia.',TRUE,'Giường Ngủ Cổ Điển','/images/giuong_co_dien.png'),
(20,'Bộ Ghế Ngoài Trời Mây Nhựa','bo-ghe-ngoai-troi-may-nhua','NQ-GH-020','Ngoài trời',8500000,NULL,5,4,3,'Ngoài trời','/images/bo_ghe_ngoai_troi.jpg',4.8,40,25,'Bộ 2 ghế thư giãn ngoài trời đan dây mây nhựa cao cấp, khung kim loại chống gỉ và đệm ngồi chống thấm nước.','Bộ ghế ngoài trời đan dây.',FALSE,'Bộ Ghế Ngoài Trời Mây Nhựa','/images/bo_ghe_ngoai_troi.jpg'),
(21,'Kệ Tường Bán Nguyệt','ke-tuong-ban-nguyet','NQ-DC-021','Decor',3500000,NULL,4,2,2,'Decor','/images/ke_tuong_trang_tri.jpg',4.9,75,30,'Kệ tường trang trí hình bán nguyệt bằng gỗ, tích hợp đèn LED hắt sáng ấm áp, thích hợp trưng bày lọ hoa, sách.','Kệ tường gỗ bán nguyệt.',FALSE,'Kệ Tường Bán Nguyệt','/images/ke_tuong_trang_tri.jpg'),
(22,'Giường Ngủ Gỗ Hiện Đại','giuong-ngu-go-hien-dai','NQ-BD-022','Giường',14500000,NULL,2,2,2,'Phòng ngủ','/images/giuong_ngu_hien_dai.jpg',4.7,55,15,'Giường ngủ khung gỗ tự nhiên bo tròn góc cạnh tinh tế, thiết kế liền mạch vững chắc, phong cách tối giản hiện đại.','Giường ngủ gỗ tối giản.',FALSE,'Giường Ngủ Gỗ Hiện Đại','/images/giuong_ngu_hien_dai.jpg'),
(23,'Ghế Thư Giãn Bọc Nỉ Xanh','ghe-thu-gian-boc-ni-xanh','NQ-GH-023','Ghế Armchair',5200000,NULL,1,1,1,'Phòng khách','/images/ghe_thu_gian_xanh.png',4.8,45,20,'Ghế armchair bọc nỉ màu xanh dương nhạt, thiết kế tựa lưng cao đính khuy sang trọng, chân gỗ tự nhiên.','Ghế armchair bọc nỉ.',FALSE,'Ghế Thư Giãn Bọc Nỉ Xanh','/images/ghe_thu_gian_xanh.png'),
(24,'Tủ Để Đồ Cửa Trắng','tu-de-do-cua-trang','NQ-TU-024','Tủ',8900000,NULL,1,2,2,'Phòng khách','/images/tu_de_do_trang.jpg',4.9,30,12,'Tủ console gỗ tự nhiên sơn trắng thanh lịch, mặt gỗ nguyên bản, không gian lưu trữ rộng rãi cho phòng khách hoặc phòng ăn.','Tủ đồ console trắng.',FALSE,'Tủ Để Đồ Cửa Trắng','/images/tu_de_do_trang.jpg'),
(25,'Giường Ngủ Bọc Vải Xám','giuong-ngu-boc-vai-xam','NQ-BD-025','Giường',17000000,NULL,2,2,2,'Phòng ngủ','/images/giuong_ngu_xam.jpg',4.8,35,18,'Giường ngủ bọc vải màu xám thanh nhã, đầu giường thiết kế sọc ngang êm ái, mang đến không gian phòng ngủ hiện đại.','Giường ngủ bọc vải xám.',FALSE,'Giường Ngủ Bọc Vải Xám','/images/giuong_ngu_xam.jpg'),
(26,'Bàn Trà Nhỏ Độc Đáo','ban-tra-nho-doc-dao','NQ-TB-026','Bàn Trà',3200000,NULL,1,2,2,'Phòng khách','/images/ban_tra_nho.jpg',4.7,65,30,'Bàn trà phụ nhỏ gọn với chân đế trụ tròn vân sọc nổi bật, mặt bàn bo cong, thích hợp trang trí góc sofa.','Bàn trà phụ trụ tròn.',FALSE,'Bàn Trà Nhỏ Độc Đáo','/images/ban_tra_nho.jpg'),
(27,'Bàn Tròn Đen Tối Giản','ban-tron-den-toi-gian','NQ-TB-027','Bàn',4500000,NULL,1,3,3,'Phòng khách','/images/ban_tron_den.png',4.8,40,20,'Bàn tròn chân trụ lớn màu đen nhám, phong cách tối giản mạnh mẽ, tạo điểm nhấn ấn tượng cho không gian sống.','Bàn tròn chân trụ đen.',FALSE,'Bàn Tròn Đen Tối Giản','/images/ban_tron_den.png'),
(28,'Giường Ngủ Mút Bọc Kem','giuong-ngu-mut-boc-kem','NQ-BD-028','Giường',19500000,18000000,2,2,2,'Phòng ngủ','/images/giuong_ngu_kem.jpg',4.9,25,12,'Giường ngủ bọc mút toàn diện êm ái, màu kem sáng dịu nhẹ, thiết kế bo cong mềm mại không góc chết an toàn cho gia đình.','Giường ngủ bọc nệm kem.',TRUE,'Giường Ngủ Mút Bọc Kem','/images/giuong_ngu_kem.jpg'),
(29,'Bình Hoa Kim Loại Nghệ Thuật','binh-hoa-kim-loai-nghe-thuat','NQ-DC-029','Decor',2100000,NULL,4,2,2,'Decor','/images/binh_hoa_kim_loai.png',4.9,45,25,'Bình hoa trang trí bằng kim loại cao cấp màu bạc, điểm xuyết cành lá mạ vàng tinh xảo, toát lên vẻ đẹp quý phái.','Bình kim loại mạ vàng.',FALSE,'Bình Hoa Kim Loại Nghệ Thuật','/images/binh_hoa_kim_loai.png'),
(30,'Ghế Sofa Đơn Kem Da','ghe-sofa-don-kem-da','NQ-GH-030','Ghế Armchair',7500000,NULL,1,1,1,'Phòng khách','/images/ghe_sofa_don_kem.png',4.8,30,15,'Ghế armchair bọc da màu kem sang trọng, thiết kế bo tròn liền khối ôm trọn cơ thể, chân gỗ vững chắc.','Ghế armchair da màu kem.',FALSE,'Ghế Sofa Đơn Kem Da','/images/ghe_sofa_don_kem.png'),
(31,'Bàn Tròn Trắng Tinh Khôi','ban-tron-trang-tinh-khoi','NQ-TB-031','Bàn',4500000,NULL,1,3,3,'Phòng khách','/images/ban_tron_trang.jpg',4.7,50,25,'Bàn tròn chân trụ màu trắng tinh khiết với các đường vân nổi dọc tinh tế, thiết kế nhẹ nhàng và sáng bừng không gian.','Bàn tròn chân sọc trắng.',FALSE,'Bàn Tròn Trắng Tinh Khôi','/images/ban_tron_trang.jpg'),
(32,'Sofa Băng Bọc Nỉ Cừu','sofa-bang-boc-ni-cuu','NQ-SF-032','Ghế Sofa',16500000,NULL,1,1,1,'Phòng khách','/images/sofa_bang_kem.jpg',4.9,35,15,'Sofa băng bọc vải nỉ giả lông cừu mềm mại, màu be ấm áp, thiết kế nguyên khối bo góc thư giãn tuyệt đối.','Sofa bọc nỉ cừu mềm mại.',FALSE,'Sofa Băng Bọc Nỉ Cừu','/images/sofa_bang_kem.jpg'),
(33,'Bộ Ghế Armchair Đôi','bo-ghe-armchair-doi','NQ-GH-033','Ghế Armchair',14500000,NULL,1,1,1,'Phòng khách','/images/bo_ghe_sofa_don.jpg',4.8,25,10,'Bộ 2 ghế armchair đơn thiết kế khép kín kén tằm bọc nỉ trắng, mang đến sự êm ái và không gian trò chuyện ấm cúng.','Bộ 2 ghế armchair nỉ.',FALSE,'Bộ Ghế Armchair Đôi','/images/bo_ghe_sofa_don.jpg'),
(34,'Ghế Mây Đan Nhiệt Đới','ghe-may-dan-nhiet-doi','NQ-GH-034','Ngoài trời',3800000,NULL,5,4,3,'Ngoài trời','/images/ghe_may_dan.png',4.7,60,30,'Ghế mây đan thủ công màu ghi trầm, khung ghế thiết kế tinh xảo, chắc chắn, phù hợp phong cách nhiệt đới phóng khoáng.','Ghế mây đan thư giãn.',FALSE,'Ghế Mây Đan Nhiệt Đới','/images/ghe_may_dan.png'),
(35,'Tủ Đầu Giường Tân Cổ Điển','tu-dau-giuong-tan-co-dien','NQ-TU-035','Tủ',4200000,NULL,2,2,2,'Phòng ngủ','/images/tu_dau_giuong.png',4.8,55,20,'Tủ đầu giường gỗ tự nhiên sơn màu kem, thiết kế tân cổ điển với các đường rãnh soi tỉ mỉ, tay nắm kim loại cổ điển.','Tủ đầu giường gỗ kem.',FALSE,'Tủ Đầu Giường Tân Cổ Điển','/images/tu_dau_giuong.png'),
(36, 'Bồn Cầu Laska Họa Tiết Đen', 'bon-cau-laska-hoa-tiet-den', 'NQ-TB-036', 'Thiết Bị Vệ Sinh', 4500000, NULL, 7, 1, 1, 'Phòng tắm', '/images/bon_cau_laska_hoa_tiet_den.jpg', 5.0, 0, 20, 'Bồn cầu Laska cao cấp với họa tiết đen sang trọng, thiết kế hiện đại.', 'Bồn cầu Laska họa tiết đen.', FALSE, 'Bồn Cầu Laska Họa Tiết Đen', '/images/bon_cau_laska_hoa_tiet_den.jpg'),
(37, 'Bồn Cầu Laska Trắng', 'bon-cau-laska-trang', 'NQ-TB-037', 'Thiết Bị Vệ Sinh', 4200000, NULL, 7, 1, 1, 'Phòng tắm', '/images/bon_cau_laska_trang.jpg', 4.9, 0, 20, 'Bồn cầu Laska màu trắng tinh khôi, chất liệu sứ cao cấp chống bám bẩn.', 'Bồn cầu Laska trắng.', FALSE, 'Bồn Cầu Laska Trắng', '/images/bon_cau_laska_trang.jpg'),
(38, 'Bộ Sofa Góc Và Bàn Tròn Đôi Cao Thấp', 'bo-sofa-goc-va-ban-tron-doi-cao-thap', 'NQ-SF-038', 'Bộ Sofa', 25900000, NULL, 1, 1, 1, 'Phòng khách', '/images/bo_sofa_goc_va_ban_tron_doi_cao_thap.jpg', 5.0, 0, 10, 'Bộ sofa góc hiện đại đi kèm bàn trà tròn đôi cao thấp độc đáo.', 'Bộ sofa góc & bàn tròn đôi.', TRUE, 'Bộ Sofa Góc Và Bàn Tròn Đôi Cao Thấp', '/images/bo_sofa_goc_va_ban_tron_doi_cao_thap.jpg'),
(39, 'Bộ Sofa Và Bàn Mặt Đá', 'bo-sofa-va-ban-mat-da', 'NQ-SF-039', 'Bộ Sofa', 28500000, NULL, 1, 2, 2, 'Phòng khách', '/images/bo_sofa_va_ban_mat_da.jpg', 4.8, 0, 10, 'Bộ sofa cao cấp kết hợp bàn trà mặt đá sang trọng, đẳng cấp.', 'Bộ sofa & bàn mặt đá.', TRUE, 'Bộ Sofa Và Bàn Mặt Đá', '/images/bo_sofa_va_ban_mat_da.jpg'),
(40, 'Đồ Decor Phòng Khách Typography Đen Trắng', 'do-decor-phong-khach-typography-den-trang', 'NQ-DC-040', 'Decor', 850000, NULL, 4, 3, 1, 'Decor', '/images/do_decor_phong_khach_typography_dentrang.jpg', 4.7, 0, 50, 'Tranh decor nghệ thuật typography đen trắng tối giản, điểm nhấn ấn tượng.', 'Tranh decor typography đen trắng.', FALSE, 'Đồ Decor Typography Đen Trắng', '/images/do_decor_phong_khach_typography_dentrang.jpg'),
(41, 'Đồ Decor Phòng Khách Typography Nâu Đen', 'do-decor-phong-khach-typography-nau-den', 'NQ-DC-041', 'Decor', 850000, NULL, 4, 3, 1, 'Decor', '/images/do_decor_phong_khach_typography_nauden.jpg', 4.8, 0, 50, 'Tranh decor nghệ thuật typography tông màu nâu đen ấm áp.', 'Tranh decor typography nâu đen.', FALSE, 'Đồ Decor Typography Nâu Đen', '/images/do_decor_phong_khach_typography_nauden.jpg'),
(42, 'Vòi Hoa Sen Toàn Thân Đen Bóng', 'voi-hoa-sen-toan-than-den-bong', 'NQ-TB-042', 'Thiết Bị Vệ Sinh', 2970000, NULL, 7, 1, 1, 'Phòng tắm', '/images/voi_hoa_sen_toan_than_denbong.jpg', 4.9, 0, 30, 'Hệ thống vòi hoa sen đứng toàn thân màu đen bóng hiện đại, bền bỉ.', 'Vòi hoa sen toàn thân đen bóng.', TRUE, 'Vòi Hoa Sen Toàn Thân Đen Bóng', '/images/voi_hoa_sen_toan_than_denbong.jpg'),
(43, 'Vòi Hoa Sen Toàn Thân Vàng Kim', 'voi-hoa-sen-toan-than-vang-kim', 'NQ-TB-043', 'Thiết Bị Vệ Sinh', 2910000, NULL, 7, 2, 2, 'Phòng tắm', '/images/voi_hoa_sen_toan_than_vangkim.jpg', 5.0, 0, 25, 'Hệ thống vòi hoa sen đứng mạ vàng kim sang trọng, đẳng cấp hoàng gia.', 'Vòi hoa sen toàn thân vàng kim.', TRUE, 'Vòi Hoa Sen Toàn Thân Vàng Kim', '/images/voi_hoa_sen_toan_than_vangkim.jpg'),
(44, 'Vòi Rửa Tay Cao Rinto', 'voi-rua-tay-cao-rinto', 'NQ-TB-044', 'Thiết Bị Vệ Sinh', 390000, NULL, 7, 1, 1, 'Phòng tắm', '/images/voi_rua_tay_cao_rinto.jpg', 4.7, 0, 40, 'Vòi rửa tay dáng cao Rinto tinh tế, thích hợp cho lavabo đặt bàn.', 'Vòi rửa tay cao Rinto.', FALSE, 'Vòi Rửa Tay Cao Rinto', '/images/voi_rua_tay_cao_rinto.jpg'),
(45, 'Vòi Rửa Tay Cổ Mềm Rinto', 'voi-rua-tay-co-mem-rinto', 'NQ-TB-045', 'Thiết Bị Vệ Sinh', 215000, NULL, 7, 1, 1, 'Phòng tắm', '/images/voi_rua_tay_co_mem_rinto.jpg', 4.8, 0, 35, 'Vòi rửa tay Rinto với thiết kế cổ mềm linh hoạt, tiện lợi khi sử dụng.', 'Vòi rửa tay cổ mềm Rinto.', FALSE, 'Vòi Rửa Tay Cổ Mềm Rinto', '/images/voi_rua_tay_co_mem_rinto.jpg'),
(46, 'Vòi Rửa Tay Rinto', 'voi-rua-tay-rinto', 'NQ-TB-046', 'Thiết Bị Vệ Sinh', 210000, NULL, 7, 1, 1, 'Phòng tắm', '/images/voi_rua_tay_rinto.jpg', 4.6, 0, 50, 'Vòi rửa tay Rinto tiêu chuẩn, thiết kế tối giản, độ bền cao.', 'Vòi rửa tay Rinto tiêu chuẩn.', FALSE, 'Vòi Rửa Tay Rinto', '/images/voi_rua_tay_rinto.jpg'),
(47, 'Vòi Rửa Tay Rinto Vuông', 'voi-rua-tay-rinto-vuong', 'NQ-TB-047', 'Thiết Bị Vệ Sinh', 220000, NULL, 7, 1, 1, 'Phòng tắm', '/images/voi_rua_tay_rinto_vuong.jpg', 4.8, 0, 45, 'Vòi rửa tay Rinto kiểu dáng vuông vức mạnh mẽ, góc cạnh hiện đại.', 'Vòi rửa tay Rinto vuông.', FALSE, 'Vòi Rửa Tay Rinto Vuông', '/images/voi_rua_tay_rinto_vuong.jpg');
SELECT setval('products_id_seq', 47, TRUE);

UPDATE products p SET category = c.name FROM categories c WHERE p.category_id = c.id;

INSERT INTO product_specs (product_id, material, color, dimensions, warranty, origin, style, room, note) VALUES
(1,'Khung gỗ tự nhiên, vải linen cao cấp','Beige','2200 x 900 x 850 mm','24 tháng','Việt Nam','Hiện đại','Phòng khách','Có thể đặt theo kích thước riêng.'),
(2,'Gốm men cao cấp','Xanh emerald','300 x 300 x 450 mm','6 tháng','Việt Nam','Luxury','Phòng khách, kệ trang trí',''),
(3,'Khung gỗ, nệm mút, vải nỉ','Xanh Azure','800 x 850 x 900 mm','18 tháng','Việt Nam','Cổ điển','Phòng khách, phòng đọc sách',''),
(4,'Mây tự nhiên đan thủ công','Nâu tự nhiên','750 x 800 x 850 mm','12 tháng','Việt Nam','Tropical','Ban công, sân vườn','Nên dùng nơi có mái che.'),
(5,'Gỗ tự nhiên, đầu giường bọc nỉ','Kem','1800 x 2000 mm','36 tháng','Việt Nam','Tân cổ điển','Phòng ngủ','Có thể chọn màu vải đầu giường.'),
(6,'Mặt đá marble, chân kim loại','Đen','800 x 800 x 420 mm','24 tháng','Việt Nam','Luxury','Phòng khách',''),
(7,'Khung gỗ, vải bố, nệm mousse','Trắng kem','2800 x 1800 x 850 mm','24 tháng','Việt Nam','Hiện đại','Phòng khách','Module có thể thay đổi bố cục.'),
(8,'Gỗ sồi tự nhiên','Nâu sáng','500 x 400 x 550 mm','24 tháng','Việt Nam','Minimalist','Phòng ngủ',''),
(9,'Gỗ tự nhiên, chân sắt sơn tĩnh điện','Nâu gỗ','1400 x 700 x 750 mm','24 tháng','Việt Nam','Industrial','Văn phòng, phòng làm việc',''),
(10,'Khung gỗ, vải bố','Kem','780 x 820 x 880 mm','18 tháng','Việt Nam','Hiện đại','Phòng khách, phòng ngủ',''),
(11,'Da bò thật, khung gỗ tự nhiên','Xám đậm','2300 x 950 x 850 mm','36 tháng','Việt Nam','Luxury','Phòng khách',''),
(12,'Khung gỗ, vải nhung','Hồng rose','780 x 820 x 900 mm','18 tháng','Việt Nam','Tân cổ điển','Phòng ngủ','');

INSERT INTO product_images (product_id, img, alt_text, sort_order, is_primary) VALUES
(1,'/images/sofaBeige.jpg','Sofa Băng Vải Linen Mây',1,TRUE),(1,'/images/sofaBeige-2.jpg','Sofa linen góc nghiêng',2,FALSE),
(3,'/images/armBlue.jpg','Ghế Bành Bọc Nỉ Azure',1,TRUE),(5,'/images/bedClassic.jpg','Giường Ngủ Tân Cổ Điển',1,TRUE),
(6,'/images/tableBlack.jpg','Bàn Trà Tròn Mặt Đá',1,TRUE),(7,'/images/sofaWhite.jpg','Sofa Module Vải Bố',1,TRUE),
(11,'/images/sofaSlate.jpg','Sofa Băng Da Cao Cấp',1,TRUE),(12,'/images/armPink.jpg','Ghế Bành Tân Cổ Điển Rose',1,TRUE);

INSERT INTO tags (id, name, slug) VALUES
(1,'Best Seller','best-seller'),(2,'New Arrival','new-arrival'),(3,'Luxury','luxury'),(4,'Modern','modern'),(5,'Minimalist','minimalist'),(6,'Flash Sale','flash-sale');
SELECT setval('tags_id_seq', 6, TRUE);

INSERT INTO product_tags (product_id, tag_id) VALUES
(1,1),(1,4),(3,2),(5,3),(6,1),(6,3),(7,4),(8,5),(11,3),(11,6);

INSERT INTO flash_sales (id, product_id, price, original_price, stock, sold, active) VALUES
(101,5,11000000,16500000,80,64,TRUE),(102,10,7500000,10900000,60,41,TRUE),(103,6,7500000,9800000,95,88,TRUE),(104,3,7500000,9200000,30,22,TRUE),(105,9,11000000,14200000,88,73,TRUE),(106,2,7500000,9900000,45,30,TRUE),(107,8,7500000,10100000,70,55,TRUE),(108,11,7500000,12500000,99,91,TRUE);
SELECT setval('flash_sales_id_seq', 108, TRUE);

INSERT INTO coupons (id, code, name, discount_type, discount_value, min_order, max_discount, quantity, active) VALUES
(1,'WELCOME10','Giảm 10% cho khách mới','percent',10,1000000,500000,100,TRUE),
(2,'NAMQUAN500','Giảm 500K đơn từ 10 triệu','fixed',500000,10000000,NULL,50,TRUE);
SELECT setval('coupons_id_seq', 2, TRUE);

INSERT INTO menus (id, title, url, sort_order, active) VALUES
(1,'Trang chủ','/',1,TRUE),(2,'Mua ngay','/products',2,TRUE),(3,'Bộ sưu tập','/collections',3,TRUE),(4,'Showroom','/showroom',4,TRUE),(5,'Tin tức','/news',5,TRUE),(6,'Liên hệ','/contact',6,TRUE);
SELECT setval('menus_id_seq', 6, TRUE);

INSERT INTO banners (id, title, subtitle, description, img, mobile_img, link, button_text, button_link, position, sort_order, active) VALUES
(1,'Mỗi không gian một câu chuyện riêng','Kiến tạo không gian sống tinh tế với những giải pháp nội thất hiện đại, hài hòa giữa thẩm mỹ, công năng và cảm hứng sống.','Banner chính trang chủ NAM QUAN','/images/banner-home-1.jpg','/images/banner-home-mobile-1.jpg','/products','Khám phá ngay','/products','home',1,TRUE),
(2,'Flash Sale nội thất cao cấp','Ưu đãi giới hạn cho sofa, bàn trà, giường ngủ và decor.','Banner flash sale','/images/banner-sale.jpg','/images/banner-sale-mobile.jpg','/flash-sale','Xem Flash Sale','/flash-sale','sale',1,TRUE),
(3,'BST Modern Living','Tối giản, tinh tế và tiện nghi cho gia đình hiện đại.','Banner bộ sưu tập','/images/banner-modern.jpg','/images/banner-modern-mobile.jpg','/collections/modern-living','Xem bộ sưu tập','/collections/modern-living','collection',1,TRUE);
SELECT setval('banners_id_seq', 3, TRUE);

INSERT INTO news_categories (id, name, slug, description, sort_order) VALUES
(1,'Xu hướng thiết kế','xu-huong-thiet-ke','Phong cách, vật liệu và màu sắc đang dẫn dắt thị trường nội thất.',1),
(2,'Mẹo bài trí','meo-bai-tri','Hướng dẫn sắp đặt không gian sống đẹp và tiện dụng hơn.',2),
(3,'Cẩm nang chọn mua','cam-nang-chon-mua','Kinh nghiệm chọn sản phẩm đúng nhu cầu, đúng ngân sách.',3),
(4,'Bảo quản & vệ sinh','bao-quan-ve-sinh','Giữ đồ nội thất bền đẹp theo thời gian.',4),
(5,'Tin NAM QUAN','tin-cong-ty','Hoạt động, showroom và chương trình của NAM QUAN.',5);
SELECT setval('news_categories_id_seq', 5, TRUE);

-- Nội dung bài viết dùng cú pháp rút gọn để frontend render an toàn (không HTML):
-- "## " tiêu đề mục, "- " gạch đầu dòng, "**...**" in đậm, dòng trống ngăn đoạn.
INSERT INTO news (id, title, slug, publish_date, img, excerpt, content, author, category_id, tags, views, featured, reading_time, status, seo_title, seo_description, seo_keywords, og_image) VALUES
(1,'Xu Hướng Nội Thất 2026 – Tinh Tế & Bền Vững','xu-huong-noi-that-2026-tinh-te-ben-vung','2026-03-11','/images/news1.jpg',
'Vật liệu tái tạo, đường nét tối giản và bảng màu lấy cảm hứng từ thiên nhiên là ba trụ cột định hình nội thất năm 2026.',
$$Năm 2026 đánh dấu giai đoạn người dùng Việt chọn nội thất bằng lý trí nhiều hơn cảm tính. Thay vì chạy theo bộ sưu tập mới mỗi mùa, xu hướng chung là đầu tư vào những món đồ dùng được mười năm, dễ phối và dễ sửa chữa.

## Vật liệu tái tạo lên ngôi

Gỗ có chứng chỉ khai thác bền vững, tre ép khối, vải tái chế từ sợi PET và da thuần chay đang thay thế dần các vật liệu tổng hợp giá rẻ. Điểm chung của nhóm vật liệu này là tuổi thọ cao và ít phát thải trong quá trình sản xuất.

- **Gỗ sồi, tần bì phủ dầu tự nhiên**: giữ được vân gỗ thật, khi xước có thể chà nhám và phủ lại tại nhà.
- **Vải bọc gốc thực vật**: thoáng khí, phù hợp khí hậu nóng ẩm, hạn chế bám mùi.
- **Kim loại sơn tĩnh điện**: khung ghế, chân bàn mảnh nhưng chịu lực tốt, chống gỉ trong môi trường ven biển.

## Đường nét tối giản nhưng ấm

Tối giản của năm 2026 không còn lạnh và trống. Các thiết kế giữ hình khối đơn giản nhưng bổ sung bo góc mềm, chất liệu dệt thô và ánh sáng vàng ấm để không gian bớt khô cứng.

## Bảng màu lấy từ thiên nhiên

Xanh rêu, be cát, nâu đất và trắng ngà là bốn tông màu chủ đạo. Công thức phối an toàn là lấy 60% màu nền trung tính, 30% màu gỗ tự nhiên và 10% màu nhấn đậm ở gối tựa hoặc đồ trang trí.

## Không gian đa công năng

Căn hộ đô thị ngày càng nhỏ nên mỗi món đồ cần làm nhiều hơn một việc: ghế sofa giường cho khách ở lại, bàn ăn mở rộng khi có tiệc, tủ ngăn phòng thay vì xây tường. Đây là nhóm sản phẩm tăng trưởng mạnh nhất tại NAM QUAN trong hai quý gần đây.

Nếu bạn đang lên kế hoạch làm mới nhà trong năm nay, hãy bắt đầu từ những món dùng hằng ngày — sofa, bàn ăn, giường — rồi mới đến đồ trang trí. Đầu tư đúng thứ tự sẽ tiết kiệm đáng kể chi phí về sau.$$,
'NAM QUAN',1,ARRAY['xu hướng','bền vững','2026','tối giản'],412,TRUE,5,'published',
'Xu hướng nội thất 2026: tinh tế và bền vững',
'Ba trụ cột định hình nội thất 2026: vật liệu tái tạo, thiết kế tối giản ấm áp và bảng màu lấy cảm hứng thiên nhiên.',
'xu hướng nội thất 2026, nội thất bền vững, thiết kế tối giản','/images/news1.jpg'),

(2,'Bàn Trà – Điểm Nhấn Hoàn Hảo Cho Phòng Khách','ban-tra-diem-nhan-hoan-hao-cho-phong-khach','2026-02-21','/images/news2.jpg',
'Chọn đúng kích thước, chiều cao và chất liệu bàn trà sẽ quyết định phòng khách của bạn trông rộng rãi hay chật chội.',
$$Bàn trà là món đồ bị chọn vội nhiều nhất trong phòng khách. Người mua thường quyết định theo kiểu dáng mà quên mất ba yếu tố kỹ thuật quyết định trải nghiệm sử dụng: kích thước, chiều cao và khoảng cách tới sofa.

## Kích thước: lấy sofa làm chuẩn

Chiều dài bàn trà nên bằng khoảng hai phần ba chiều dài sofa. Sofa 2,2m thì bàn dài 1,3 – 1,5m là hợp lý. Bàn quá nhỏ khiến bố cục lỏng lẻo, bàn quá lớn làm lối đi bị nghẽn.

## Chiều cao: ngang hoặc thấp hơn mặt ngồi

Mặt bàn nên ngang hoặc thấp hơn mặt ngồi sofa từ 2 đến 5cm. Ở khoảng này, bạn với tay lấy ly nước mà không phải nhoài người.

## Khoảng cách tới sofa: 40 – 45cm

Đây là khoảng đủ để duỗi chân thoải mái nhưng vẫn với tới mặt bàn. Hẹp hơn 35cm sẽ vướng chân khi đứng lên.

## Chọn chất liệu theo nếp sinh hoạt

- **Mặt đá**: sang, chịu nhiệt và chống thấm tốt, phù hợp gia đình hay tiếp khách. Nhược điểm là nặng và dễ mẻ cạnh.
- **Gỗ tự nhiên**: ấm, dễ phối với mọi phong cách. Cần lót ly để tránh vòng nước.
- **Kính cường lực**: tạo cảm giác thoáng cho phòng nhỏ, nhưng lộ vân tay và cần lau thường xuyên.
- **Kim loại kết hợp gỗ**: nhẹ, dễ di chuyển, hợp căn hộ cho thuê.

## Bố trí bàn trà theo nhóm

Xu hướng gần đây là dùng hai bàn tròn cao thấp lệch nhau thay cho một bàn chữ nhật lớn. Cách này linh hoạt hơn khi cần dọn chỗ cho trẻ chơi, đồng thời tạo nhịp thị giác thú vị cho phòng khách.

Trước khi chốt đơn, hãy dán băng keo giấy lên sàn theo đúng kích thước bàn và sống với nó vài ngày. Đây là mẹo đơn giản nhưng giúp tránh gần như mọi sai lầm về tỉ lệ.$$,
'NAM QUAN',2,ARRAY['bàn trà','phòng khách','bài trí'],268,FALSE,4,'published',
'Cách chọn bàn trà chuẩn cho phòng khách',
'Hướng dẫn chọn kích thước, chiều cao, khoảng cách và chất liệu bàn trà để phòng khách cân đối và tiện dùng.',
'bàn trà, chọn bàn trà, nội thất phòng khách','/images/news2.jpg'),

(3,'Giải Pháp Nội Thất Văn Phòng Hiện Đại','giai-phap-noi-that-van-phong-hien-dai','2026-02-23','/images/news3.jpg',
'Từ ghế công thái học đến khu vực làm việc linh hoạt: cách bố trí văn phòng vừa tối ưu diện tích vừa giữ sức khỏe nhân sự.',
$$Một văn phòng tốt không phải là văn phòng đắt tiền, mà là nơi con người ngồi được tám tiếng mỗi ngày mà không đau lưng, mỏi cổ hay mất tập trung.

## Bắt đầu từ ghế, không phải bàn

Ghế là khoản đầu tư đáng tiền nhất. Ba tiêu chí bắt buộc: tựa lưng đỡ được vùng thắt lưng, chiều cao điều chỉnh để chân đặt phẳng trên sàn, và tay vịn ngang tầm khuỷu tay khi gõ phím.

## Bàn nâng hạ không còn là thứ xa xỉ

Chi phí bàn nâng hạ đã giảm mạnh trong ba năm qua. Người dùng chỉ cần đứng làm việc 15 phút mỗi giờ cũng đã cải thiện rõ tuần hoàn máu và độ tỉnh táo buổi chiều.

## Chia khu vực theo tính chất công việc

- **Khu tập trung**: bàn cá nhân, vách ngăn tiêu âm, ánh sáng trực tiếp.
- **Khu cộng tác**: bàn lớn, ghế dễ di chuyển, bảng viết gần kề.
- **Khu thư giãn**: sofa thấp, cây xanh, ánh sáng gián tiếp.

Tỉ lệ tham khảo cho công ty 20 – 50 người là 60% diện tích cho khu tập trung, 25% cộng tác và 15% thư giãn.

## Ánh sáng và âm thanh

Đèn nên đạt 400 – 500 lux tại mặt bàn, tránh đặt màn hình đối diện cửa sổ để không bị chói. Với âm thanh, thảm sàn và trần tiêu âm là hai giải pháp rẻ nhất giúp giảm tiếng ồn văn phòng mở.

## Chừa chỗ cho thay đổi

Đội ngũ luôn thay đổi quy mô. Ưu tiên bàn module ghép được, tủ có bánh xe và hệ dây điện đi âm sàn để việc sắp xếp lại không trở thành một dự án cải tạo.$$,
'NAM QUAN',1,ARRAY['văn phòng','ergonomics','bàn nâng hạ'],197,FALSE,4,'published',
'Giải pháp nội thất văn phòng hiện đại',
'Cách chọn ghế, bàn nâng hạ, chia khu vực và xử lý ánh sáng để văn phòng tối ưu diện tích và tốt cho sức khỏe.',
'nội thất văn phòng, bàn nâng hạ, ghế công thái học','/images/news3.jpg'),

(4,'Chọn Sofa Đúng Chuẩn: 7 Điều Cần Biết Trước Khi Xuống Tiền','chon-sofa-dung-chuan-7-dieu-can-biet','2026-01-18','/images/catSofa.jpg',
'Khung gỗ, mật độ mút, chất liệu bọc và độ sâu lòng ghế — bảy yếu tố quyết định chiếc sofa dùng được ba năm hay mười lăm năm.',
$$Sofa là món nội thất đắt thứ hai trong nhà, chỉ sau hệ tủ bếp. Nhưng phần lớn quyết định mua lại dựa vào cảm giác ngồi thử năm phút tại cửa hàng. Dưới đây là bảy điều nên kiểm tra trước khi chốt.

## 1. Khung ghế

Khung gỗ tự nhiên đã sấy đạt độ ẩm dưới 12% là chuẩn tốt nhất. Gỗ chưa sấy kỹ sẽ cong vênh sau một mùa mưa. Hãy nhấc thử một góc sofa: khung chắc sẽ nâng cả cụm lên gần như nguyên khối.

## 2. Mật độ mút

Mút mật độ 25 – 35 kg/m³ cho tuổi thọ tốt ở điều kiện dùng hằng ngày. Mút dưới 20 kg/m³ rẻ hơn nhưng sẽ xẹp sau 12 – 18 tháng.

## 3. Hệ lò xo hoặc dây đai

Lò xo túi độc lập cho cảm giác êm và phân bổ lực đều. Dây đai đàn hồi rẻ hơn, phù hợp sofa nhỏ ít người ngồi.

## 4. Độ sâu lòng ghế

- **50 – 55cm**: hợp người cao dưới 1m65, ngồi thẳng lưng.
- **56 – 62cm**: đa số người dùng, tư thế thoải mái.
- **Trên 65cm**: kiểu ngồi ngả, cần thêm gối tựa lưng.

## 5. Chất liệu bọc

Vải mang lại cảm giác ấm và thoáng, phù hợp khí hậu Việt Nam nhưng cần vệ sinh định kỳ. Da thật bền và dễ lau nhưng dính khi trời nóng. Da công nghiệp cao cấp là phương án cân bằng nếu nhà có trẻ nhỏ.

## 6. Khả năng tháo giặt

Áo bọc rời tháo giặt được sẽ kéo dài tuổi thọ sofa thêm nhiều năm. Đây là chi tiết hay bị bỏ qua khi so giá.

## 7. Đường may và chi tiết hoàn thiện

Kiểm tra mật độ mũi chỉ, độ thẳng của đường may và cách xử lý mép góc. Chi tiết hoàn thiện phản ánh khá chính xác tiêu chuẩn của xưởng sản xuất.

Cuối cùng, hãy ngồi thử ít nhất mười phút ở đúng tư thế bạn hay ngồi ở nhà — nằm dài xem phim, hay ngồi thẳng tiếp khách. Cảm giác sau mười phút mới là cảm giác thật.$$,
'NAM QUAN',3,ARRAY['sofa','cẩm nang','kinh nghiệm mua'],534,TRUE,6,'published',
'Cách chọn sofa bền đẹp: 7 tiêu chí quan trọng',
'Khung gỗ, mật độ mút, lò xo, độ sâu lòng ghế và chất liệu bọc — checklist đầy đủ trước khi mua sofa.',
'chọn sofa, mua sofa, kinh nghiệm chọn sofa','/images/catSofa.jpg'),

(5,'Bảo Quản Đồ Gỗ Tự Nhiên Trong Khí Hậu Nhiệt Đới','bao-quan-do-go-tu-nhien-khi-hau-nhiet-doi','2025-12-05','/images/bigRoom.jpg',
'Độ ẩm trên 80% và nắng gắt là hai kẻ thù lớn nhất của đồ gỗ. Đây là lịch chăm sóc đơn giản giúp giữ đồ bền đẹp.',
$$Đồ gỗ tự nhiên phản ứng với môi trường suốt vòng đời của nó: hút ẩm khi trời nồm, nhả ẩm khi hanh khô. Hiểu điều này giúp bạn tránh gần như mọi hư hỏng thường gặp.

## Kiểm soát độ ẩm

Khoảng lý tưởng là 45 – 60%. Vào mùa nồm ở miền Bắc hoặc mùa mưa ở miền Nam, độ ẩm có thể vượt 85%. Máy hút ẩm hoặc điều hòa chế độ khô chạy vài giờ mỗi ngày là đủ để giữ đồ gỗ ổn định.

## Tránh nắng trực tiếp

Tia UV làm bạc màu bề mặt và khiến lớp phủ giòn đi. Nếu không đổi được vị trí, hãy dùng rèm lọc sáng hoặc phim cách nhiệt dán kính.

## Lịch vệ sinh gợi ý

- **Hằng tuần**: lau bụi bằng khăn microfiber khô hoặc ẩm nhẹ, lau xuôi theo vân gỗ.
- **Hằng tháng**: kiểm tra và siết lại ốc vít ở ghế, bàn, giường.
- **Sáu tháng một lần**: phủ lại dầu lau gỗ hoặc sáp bảo dưỡng cho bề mặt phủ dầu.

## Những việc nên tránh

Không dùng cồn, nước lau kính hay chất tẩy đa năng lên bề mặt gỗ — chúng phá lớp phủ bảo vệ. Không đặt đồ nóng trực tiếp lên mặt bàn. Không kê sát tường ẩm, hãy chừa khe hở 2 – 3cm cho không khí lưu thông.

## Xử lý vết xước nhẹ

Với gỗ phủ dầu, chà nhẹ bằng giấy nhám mịn P400 theo vân gỗ rồi thoa lại dầu là vết xước gần như biến mất. Với gỗ phủ PU, nên để thợ xử lý vì lớp phủ cần đánh lại toàn bộ mặt.

Chăm đúng cách, một bộ bàn ăn gỗ tự nhiên hoàn toàn có thể theo gia đình bạn qua vài lần chuyển nhà.$$,
'NAM QUAN',4,ARRAY['bảo quản','gỗ tự nhiên','vệ sinh'],321,FALSE,4,'published',
'Bảo quản đồ gỗ tự nhiên trong khí hậu nhiệt đới',
'Kiểm soát độ ẩm, tránh nắng, lịch vệ sinh định kỳ và cách xử lý vết xước cho đồ gỗ tự nhiên.',
'bảo quản đồ gỗ, vệ sinh nội thất gỗ, chống ẩm mốc','/images/bigRoom.jpg'),

(6,'5 Cách Bố Trí Ánh Sáng Giúp Phòng Khách Sang Hơn','5-cach-bo-tri-anh-sang-phong-khach','2025-11-10','/images/living2.jpg',
'Cùng một bộ nội thất, ánh sáng đúng có thể nâng tầm cả căn phòng — mà chi phí thấp hơn nhiều so với thay đồ mới.',
$$Nhiều phòng khách được đầu tư nội thất tốt nhưng vẫn trông phẳng vì chỉ có duy nhất một đèn trần. Ánh sáng nhiều lớp là cách rẻ nhất để thay đổi cảm nhận về không gian.

## 1. Chia ánh sáng thành ba lớp

Lớp nền chiếu sáng tổng thể, lớp chức năng phục vụ đọc sách hay làm việc, lớp nhấn làm nổi tranh, kệ và cây xanh. Có đủ ba lớp, căn phòng lập tức có chiều sâu.

## 2. Giữ nhiệt độ màu thống nhất

Chọn 2700K – 3000K cho phòng khách. Trộn lẫn ánh sáng trắng lạnh và vàng ấm trong cùng một phòng là lỗi phổ biến khiến không gian trông rối.

## 3. Dùng đèn sàn thay vì thêm đèn trần

Một đèn sàn đặt cạnh sofa tạo góc đọc sách ấm cúng và làm mềm bóng đổ trên tường — hiệu quả hơn nhiều so với tăng công suất đèn trần.

## 4. Hắt sáng gián tiếp

Đèn LED giấu sau kệ tivi, sau đầu giường hoặc trong hốc trần tạo hiệu ứng tường phát sáng, giúp phòng trông cao và rộng hơn thực tế.

## 5. Lắp dimmer

Chi phí nhỏ nhưng thay đổi lớn: cùng một hệ đèn có thể sáng rõ khi tiếp khách và dịu lại khi xem phim buổi tối.

Nếu chỉ chọn được một thay đổi, hãy bắt đầu với đèn sàn cạnh sofa. Đây là món tạo khác biệt rõ rệt nhất trên mỗi đồng chi ra.$$,
'NAM QUAN',2,ARRAY['ánh sáng','phòng khách','mẹo'],88,FALSE,3,'hidden',
'5 cách bố trí ánh sáng cho phòng khách',
'Ánh sáng ba lớp, nhiệt độ màu thống nhất, đèn sàn, hắt sáng gián tiếp và dimmer cho phòng khách đẹp hơn.',
'ánh sáng phòng khách, đèn trang trí, bố trí ánh sáng','/images/living2.jpg'),

(7,'NAM QUAN Khai Trương Showroom Thủ Đức','nam-quan-khai-truong-showroom-thu-duc','2026-03-20','/images/showroom.jpg',
'Không gian trưng bày 800m² với đầy đủ các dòng sofa, phòng ngủ và nội thất văn phòng, dự kiến mở cửa cuối tháng 3.',
$$NAM QUAN chuẩn bị đưa vào hoạt động showroom thứ hai tại TP. Thủ Đức, mở rộng khả năng phục vụ khách hàng khu vực phía Đông thành phố.

## Quy mô và bố cục

Showroom rộng 800m², chia thành sáu khu trải nghiệm theo không gian thật: phòng khách, phòng ăn, phòng ngủ, phòng làm việc, ban công và khu đồ trang trí. Khách hàng có thể ngồi thử, mở thử và cảm nhận vật liệu trước khi đặt hàng.

## Dịch vụ tại chỗ

- Tư vấn phối cảnh 3D miễn phí cho đơn hàng trọn gói.
- Đo đạc tận nơi trong bán kính 15km.
- Giao lắp và bảo hành theo tiêu chuẩn chung của NAM QUAN.

## Thông tin dự kiến

Địa chỉ và lịch khai trương chi tiết sẽ được cập nhật trên website và fanpage trước ngày mở cửa. Trong tuần đầu tiên, khách tham quan sẽ nhận được ưu đãi riêng dành cho đơn hàng đặt tại showroom.

Bài viết đang ở trạng thái nháp và sẽ được cập nhật khi có lịch chính thức.$$,
'NAM QUAN',5,ARRAY['showroom','Thủ Đức','khai trương'],0,FALSE,2,'draft',
'NAM QUAN khai trương showroom Thủ Đức',
'Showroom thứ hai của NAM QUAN tại TP. Thủ Đức với 800m² trưng bày và dịch vụ tư vấn phối cảnh 3D.',
'showroom nội thất Thủ Đức, NAM QUAN showroom','/images/showroom.jpg');
SELECT setval('news_id_seq', 7, TRUE);

INSERT INTO company_info (id, company_name, slogan, about, mission, vision, phone, email, address, map_url, facebook, instagram, youtube, tiktok, logo) VALUES
(1,'NAM QUAN','Nội thất cao cấp','NAM QUAN là thương hiệu nội thất cung cấp sản phẩm, giải pháp thiết kế và thi công cho nhà ở, văn phòng và không gian thương mại.','Mang đến sản phẩm nội thất chất lượng, thẩm mỹ và phù hợp nhu cầu sử dụng thực tế.','Trở thành đơn vị nội thất uy tín, đồng hành cùng khách hàng trong việc kiến tạo không gian sống bền vững.','0900 000 000','contact@namquan.vn','TP. Hồ Chí Minh, Việt Nam','','https://facebook.com/namquan','https://instagram.com/namquan','https://youtube.com/@namquan','https://tiktok.com/@namquan','/images/logo.png');
SELECT setval('company_info_id_seq', 1, TRUE);

INSERT INTO showrooms (id, name, phone, email, address, map_url, open_time, active) VALUES
(1,'Showroom NAM QUAN Quận 1','0900 000 000','showroom@namquan.vn','Quận 1, TP. Hồ Chí Minh','','08:30 - 20:30, Thứ 2 - Chủ nhật',TRUE),
(2,'Showroom NAM QUAN Thủ Đức','0900 000 001','thuduc@namquan.vn','TP. Thủ Đức, TP. Hồ Chí Minh','','08:30 - 20:30, Thứ 2 - Chủ nhật',TRUE);
SELECT setval('showrooms_id_seq', 2, TRUE);

INSERT INTO showroom_images (showroom_id, img, alt_text, sort_order) VALUES
(1,'/images/showroom-q1-1.jpg','Không gian showroom Quận 1',1),(1,'/images/showroom-q1-2.jpg','Khu vực sofa showroom Quận 1',2),(2,'/images/showroom-td-1.jpg','Không gian showroom Thủ Đức',1);

INSERT INTO contacts (name, phone, email, subject, message, status) VALUES
('Nguyễn Văn A','0901234567','a@example.com','Tư vấn sofa','Tôi muốn được tư vấn sofa phòng khách.','new');

INSERT INTO consultation_requests (name, phone, email, service_type, property_type, area, budget, address, message) VALUES
('Trần Thị B','0912345678','b@example.com','Thiết kế nội thất','Căn hộ','85m2','200 - 300 triệu','Quận 2','Cần tư vấn thiết kế căn hộ.');

INSERT INTO faqs (id, question, answer, sort_order, active) VALUES
(1,'NAM QUAN có giao hàng toàn quốc không?','Có, NAM QUAN hỗ trợ giao hàng toàn quốc tùy theo sản phẩm và khu vực.',1,TRUE),
(2,'Sản phẩm có bảo hành không?','Có, thời gian bảo hành tùy từng dòng sản phẩm, thường từ 12 đến 36 tháng.',2,TRUE),
(3,'Có nhận thiết kế nội thất trọn gói không?','Có, NAM QUAN nhận tư vấn, thiết kế và thi công nội thất trọn gói.',3,TRUE);
SELECT setval('faqs_id_seq', 3, TRUE);

INSERT INTO projects (id, title, slug, client_name, project_type, location, area, year, img, excerpt, description, status, featured, seo_title) VALUES
(1,'Căn hộ Modern Living Quận 2','can-ho-modern-living-quan-2','Khách hàng cá nhân','Căn hộ','Quận 2, TP.HCM','85m2',2026,'/images/project-1.jpg','Thiết kế nội thất căn hộ theo phong cách hiện đại.','Dự án sử dụng tone màu trung tính, sofa module, bàn trà mặt đá và hệ tủ lưu trữ âm tường.','published',TRUE,'Căn hộ Modern Living Quận 2'),
(2,'Văn phòng tối giản Quận 7','van-phong-toi-gian-quan-7','Doanh nghiệp','Văn phòng','Quận 7, TP.HCM','180m2',2026,'/images/project-2.jpg','Không gian văn phòng hiện đại, linh hoạt.','Dự án tập trung vào công năng sử dụng, bàn làm việc gỗ tự nhiên, ghế ergonomic và hệ tủ lưu trữ đồng bộ.','published',TRUE,'Văn phòng tối giản Quận 7'),
(3,'Nhà phố Luxury Bình Thạnh','nha-pho-luxury-binh-thanh','Khách hàng cá nhân','Nhà phố','Bình Thạnh, TP.HCM','240m2',2025,'/images/project-3.jpg','Thiết kế nhà phố sang trọng.','Không gian phòng khách, phòng ngủ và khu vực sinh hoạt chung được thiết kế đồng bộ theo phong cách luxury.','published',FALSE,'Nhà phố Luxury Bình Thạnh');
SELECT setval('projects_id_seq', 3, TRUE);

INSERT INTO project_images (project_id, img, alt_text, sort_order) VALUES
(1,'/images/project-1-1.jpg','Phòng khách căn hộ Modern Living',1),(1,'/images/project-1-2.jpg','Khu vực bàn ăn căn hộ Modern Living',2),(2,'/images/project-2-1.jpg','Không gian làm việc văn phòng Quận 7',1),(3,'/images/project-3-1.jpg','Phòng khách nhà phố Luxury',1);

INSERT INTO reviews (id, product_id, name, rating, comment, status) VALUES
(1,1,'Minh Anh',5,'Sofa đẹp, chất vải tốt, màu sắc giống hình và rất hợp phòng khách.','approved'),
(2,6,'Hoàng Nam',5,'Bàn trà chắc chắn, mặt đá sang và dễ vệ sinh.','approved'),
(3,5,'Thanh Hương',5,'Giường đẹp, giao hàng đúng hẹn, tư vấn nhiệt tình.','approved');
SELECT setval('reviews_id_seq', 3, TRUE);

INSERT INTO carts (id, user_id) VALUES ('33333333-3333-3333-3333-333333333333','22222222-2222-2222-2222-222222222222');
INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ('33333333-3333-3333-3333-333333333333',1,1),('33333333-3333-3333-3333-333333333333',6,2);

INSERT INTO favorites (user_id, product_id) VALUES
('22222222-2222-2222-2222-222222222222',1),('22222222-2222-2222-2222-222222222222',5),('22222222-2222-2222-2222-222222222222',11);

INSERT INTO notifications (user_id, title, content, type, target_url, is_read) VALUES
('22222222-2222-2222-2222-222222222222','Flash Sale đang diễn ra','Nhiều sản phẩm nội thất cao cấp đang giảm giá.','promotion','/flash-sale',FALSE),
('22222222-2222-2222-2222-222222222222','Sản phẩm yêu thích giảm giá','Sofa Băng Da Cao Cấp trong danh sách yêu thích đang có ưu đãi.','favorite','/products/sofa-bang-da-cao-cap',FALSE),
('22222222-2222-2222-2222-222222222222','Chào mừng bạn đến với NAM QUAN','Khám phá bộ sưu tập nội thất mới nhất.','system','/collections',TRUE);

INSERT INTO search_history (user_id, keyword) VALUES
('22222222-2222-2222-2222-222222222222','sofa'),('22222222-2222-2222-2222-222222222222','bàn trà'),('22222222-2222-2222-2222-222222222222','giường ngủ');

INSERT INTO chat_messages (user_id, sender_type, message, is_read) VALUES
('22222222-2222-2222-2222-222222222222','customer','Tôi cần tư vấn sofa cho phòng khách 25m2.',TRUE),
('22222222-2222-2222-2222-222222222222','staff','NAM QUAN sẽ tư vấn mẫu sofa phù hợp với diện tích và phong cách của anh/chị.',FALSE);

-- =============================================================
-- VIEWS FOR FRONTEND
-- =============================================================
CREATE OR REPLACE VIEW vw_product_detail AS
SELECT
  p.id, p.name, p.slug, p.sku, p.type, p.price, p.sale_price,
  p.category, c.name AS category_name, c.slug AS category_slug,
  col.name AS collection_name, col.slug AS collection_slug,
  b.name AS brand_name, b.slug AS brand_slug,
  p.img, p.rating, p.sold, p.stock, p.description, p.short_desc,
  p.status, p.featured,
  ps.material, ps.color, ps.dimensions, ps.warranty, ps.origin, ps.style, ps.room,
  p.seo_title, p.seo_description, p.seo_keywords, p.og_image,
  p.created_at, p.updated_at
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN collections col ON p.collection_id = col.id
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN product_specs ps ON ps.product_id = p.id;

CREATE OR REPLACE VIEW vw_active_flash_sales AS
SELECT fs.id, fs.product_id, p.name, p.slug, p.img, fs.price, fs.original_price,
       fs.stock, fs.sold, fs.starts_at, fs.ends_at, fs.active
FROM flash_sales fs
JOIN products p ON p.id = fs.product_id
WHERE fs.active = TRUE AND fs.starts_at <= NOW() AND (fs.ends_at IS NULL OR fs.ends_at >= NOW());

CREATE OR REPLACE VIEW vw_home_data AS
SELECT
  (SELECT json_agg(row_to_json(x)) FROM (SELECT * FROM banners WHERE active = TRUE AND position IN ('home','sale') ORDER BY sort_order) x) AS banners,
  (SELECT json_agg(row_to_json(x)) FROM (SELECT id, name, slug, img, description FROM categories WHERE active = TRUE ORDER BY id) x) AS categories,
  (SELECT json_agg(row_to_json(x)) FROM (SELECT id, name, slug, img, description FROM collections WHERE active = TRUE ORDER BY id) x) AS collections,
  (SELECT json_agg(row_to_json(x)) FROM (SELECT id, name, slug, price, sale_price, img, rating, sold, short_desc FROM products WHERE status = 'active' AND featured = TRUE ORDER BY sold DESC LIMIT 8) x) AS featured_products,
  (SELECT json_agg(row_to_json(x)) FROM (SELECT * FROM vw_active_flash_sales ORDER BY sold DESC LIMIT 8) x) AS flash_sales,
  (SELECT json_agg(row_to_json(x)) FROM (SELECT id, title, slug, publish_date, img, excerpt FROM news WHERE status = 'published' ORDER BY publish_date DESC LIMIT 3) x) AS latest_news,
  (SELECT row_to_json(x) FROM (SELECT * FROM company_info LIMIT 1) x) AS company_info;

-- =============================================================
-- CHECK QUERIES
-- =============================================================
-- SELECT COUNT(*) FROM products;        -- 12
-- SELECT COUNT(*) FROM categories;      -- 7
-- SELECT COUNT(*) FROM collections;     -- 4
-- SELECT COUNT(*) FROM favorites;       -- 3
-- SELECT COUNT(*) FROM notifications;   -- 3
-- SELECT * FROM vw_home_data;
-- SELECT * FROM vw_active_flash_sales;
-- SELECT * FROM vw_product_detail WHERE slug = 'sofa-bang-vai-linen-may';
