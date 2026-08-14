-- =============================================================
-- NAM QUAN — COMPLETE DATABASE V2
-- PostgreSQL 14+
-- Includes: home, products, collections, favorites, login/users,
-- news, contact, cart, orders, search, notifications, showroom,
-- SEO, menus, coupons, admin support.
--
-- File này CHỈ chứa schema (bảng, index, trigger, view).
-- Dữ liệu mẫu nằm ở backend/src/db/data/*.js, nạp bằng `npm run seed`.
--
-- Run: psql -U <user> -d <database> -f nam_quan_database.sql
--      npm run seed
-- =============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "unaccent";
-- Cho phép trộn cột thường (product_id) với toán tử phạm vi trong ràng buộc
-- EXCLUDE ở bảng flash_sales.
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- =============================================================
-- DROP TABLES
-- =============================================================
DROP TABLE IF EXISTS page_views CASCADE;
DROP TABLE IF EXISTS product_tags CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS coupon_usage CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_conversations CASCADE;
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
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Lưới an toàn cuối cùng cho quy tắc "một sản phẩm chỉ có một chương trình
  -- đang bật tại mỗi thời điểm". Service đã chặn trước và báo lỗi dễ hiểu hơn;
  -- ràng buộc này chặn cả những đường ghi không đi qua service (sửa tay bằng
  -- psql, script import...).
  --
  -- Dùng EXCLUDE chứ không phải UNIQUE: UNIQUE trên product_id sẽ cấm luôn việc
  -- chạy các đợt sale nối tiếp nhau, còn ở đây chỉ cấm khi KHUNG THỜI GIAN giao
  -- nhau. ends_at NULL -> tstzrange coi là vô cực.
  CONSTRAINT flash_sales_no_overlap EXCLUDE USING gist (
    product_id WITH =,
    tstzrange(starts_at, ends_at) WITH &&
  ) WHERE (active)
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
  -- Giá niêm yết tại thời điểm đặt, chụp lại cùng lúc với `price`. Nhờ nó chi
  -- tiết đơn hàng tính được số tiền đã giảm mà không phải đọc products.price
  -- hiện tại — giá sản phẩm đổi về sau sẽ làm sai lệch đơn cũ.
  -- NULL = đơn đặt trước khi có cột này, không suy ra được mức giảm.
  list_price INTEGER CHECK (list_price >= 0),
  img VARCHAR(500) NOT NULL DEFAULT '',
  -- Chương trình flash sale đã áp cho dòng này (NULL = mua giá thường).
  -- Cần lưu để hoàn lại suất khi đơn bị huỷ, và để biết vì sao đơn giá lại thấp
  -- hơn giá niêm yết khi tra cứu về sau.
  flash_sale_id INTEGER REFERENCES flash_sales(id) ON DELETE SET NULL
);

-- Yêu cầu trả hàng / đổi hàng của khách sau khi đơn đã giao.
--
-- Vòng đời: pending → approved → completed, và có thể rejected ở hai bước đầu.
-- Chỉ khi CHỐT trả hàng (completed + type='return') hệ thống mới đụng tới kho và
-- tiền; đổi hàng không đụng kho vì khách trả một cái rồi nhận lại một cái cùng
-- loại, số lượng ròng không đổi.
CREATE TABLE order_returns (
  id SERIAL PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('return','exchange')),
  reason VARCHAR(500) NOT NULL,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
         CHECK (status IN ('pending','approved','rejected','completed')),
  admin_note VARCHAR(500) NOT NULL DEFAULT '',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_order_returns_one_open
  ON order_returns (order_id) WHERE status IN ('pending','approved');

CREATE INDEX idx_order_returns_order  ON order_returns (order_id);
CREATE INDEX idx_order_returns_status ON order_returns (status, created_at DESC);

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

-- Mỗi khách hàng có ĐÚNG MỘT hội thoại duy nhất, tồn tại mãi mãi (xem ràng
-- buộc UNIQUE bên dưới). 'closed' chỉ nghĩa là nhân viên đã xử lý xong, không
-- sinh luồng mới — khách nhắn tiếp thì chính luồng này mở lại, giữ nguyên
-- toàn bộ lịch sử ở một chỗ.
CREATE TABLE chat_conversations (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  -- FALSE khi khách xin gặp người thật hoặc nhân viên đã vào trả lời: bot
  -- ngừng tự động đáp để không cướp lời nhân viên.
  ai_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  -- Sản phẩm khách nhắc tới gần nhất. Nhờ nó mà câu "giá bao nhiêu?" đi ngay
  -- sau "sofa Milano còn hàng không?" vẫn được hiểu là đang hỏi về Milano.
  last_product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  last_message TEXT NOT NULL DEFAULT '',
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  customer_unread INTEGER NOT NULL DEFAULT 0,
  staff_unread INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_conversations_recent
  ON chat_conversations(last_message_at DESC);

CREATE TABLE chat_messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  -- Tác giả tin nhắn. NULL với tin của bot và tin hệ thống.
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('customer','staff','ai','system')),
  message TEXT NOT NULL,
  -- Sản phẩm mà tin nhắn này nói tới (khách hỏi từ trang chi tiết, hoặc bot
  -- đã nhận diện được tên sản phẩm trong câu hỏi).
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  -- Thẻ sản phẩm bot đính kèm câu trả lời: [{id,name,slug,price,salePrice,img}, ...]
  suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Ý định bot nhận ra (price, stock, material...). Rỗng với tin của người.
  intent VARCHAR(40) NOT NULL DEFAULT '',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id, id);

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
CREATE TRIGGER trg_order_returns_updated_at BEFORE UPDATE ON order_returns FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_menus_updated_at BEFORE UPDATE ON menus FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_banners_updated_at BEFORE UPDATE ON banners FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_company_info_updated_at BEFORE UPDATE ON company_info FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_showrooms_updated_at BEFORE UPDATE ON showrooms FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_consultation_updated_at BEFORE UPDATE ON consultation_requests FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_faqs_updated_at BEFORE UPDATE ON faqs FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_chat_conversations_updated_at BEFORE UPDATE ON chat_conversations FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

-- =============================================================
-- SEED DATA
-- =============================================================
-- Dữ liệu mẫu đã chuyển sang backend/src/db/data/*.js.
-- Nạp bằng:  npm run seed        (bỏ qua bảng đã có dữ liệu)
--            npm run seed -- --force   (nạp cả khi bảng đã có)
-- File này chỉ còn schema: bảng, index, trigger và view.

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
-- Số liệu kỳ vọng sau khi chạy `npm run seed`:
-- SELECT COUNT(*) FROM products;        -- 47
-- SELECT COUNT(*) FROM categories;      -- 8
-- SELECT COUNT(*) FROM collections;     -- 4
-- SELECT COUNT(*) FROM favorites;       -- 3
-- SELECT COUNT(*) FROM notifications;   -- 3
-- SELECT * FROM vw_home_data;
-- SELECT * FROM vw_active_flash_sales;
-- SELECT * FROM vw_product_detail WHERE slug = 'sofa-bang-vai-linen-may';
