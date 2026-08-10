import db from '../../db/index.js';
import { dbCache } from '../../db/store.js';
import { AppError } from '../../middleware/errorHandler.js';
import { activeFlashJoin, activeFlashWhere, effectivePriceSQL } from '../../utils/price.js';

const csv = (s) => (s ? s.split(',').map(v => v.trim()).filter(Boolean) : []);

export async function listProducts({
  category, categoryId, type, search, sort = 'newest', page = 1, limit = 12,
  priceMin, priceMax, colors, styles, materials, sizes, brands,
}) {
  const cacheKey = `products:list:${JSON.stringify({
    category, categoryId, type, search, sort, page, limit, priceMin, priceMax, colors, styles, materials, sizes, brands
  })}`;
  const cached = dbCache.get(cacheKey);
  if (cached) return cached;

  const params = [];
  let whereClauses = [];

  if (categoryId) {
    params.push(categoryId);
    whereClauses.push(`p.category_id = $${params.length}`);
  } else if (category) {
    params.push(`%${category.toLowerCase()}%`);
    whereClauses.push(`(LOWER(c.name) LIKE $${params.length} OR LOWER(p.type) LIKE $${params.length})`);
  }
  if (type) {
    params.push(type);
    whereClauses.push(`p.type = $${params.length}`);
  }
  if (search) {
    const q = `%${search.toLowerCase()}%`;
    params.push(q);
    whereClauses.push(`(LOWER(p.name) LIKE $${params.length} OR LOWER(p.type) LIKE $${params.length})`);
  }
  // Lọc theo giá hiệu lực chứ không phải giá niêm yết: khách lọc "dưới 5 triệu"
  // thì sản phẩm 6 triệu đang sale còn 4 triệu phải nằm trong kết quả.
  if (priceMin != null) {
    params.push(priceMin);
    whereClauses.push(`${effectivePriceSQL('p')} >= $${params.length}`);
  }
  if (priceMax != null) {
    params.push(priceMax);
    whereClauses.push(`${effectivePriceSQL('p')} <= $${params.length}`);
  }

  // Join with specs to filter by colors, styles, materials, sizes
  let joinSpecs = false;
  const fColors = csv(colors);
  if (fColors.length) {
    joinSpecs = true;
    whereClauses.push(`ps.color ILIKE ANY (ARRAY[${fColors.map(c => `'%${c}%'`).join(', ')}])`);
  }
  const fStyles = csv(styles);
  if (fStyles.length) {
    joinSpecs = true;
    params.push(fStyles);
    whereClauses.push(`ps.style = ANY($${params.length})`);
  }
  const fMaterials = csv(materials);
  if (fMaterials.length) {
    joinSpecs = true;
    whereClauses.push(`ps.material ILIKE ANY (ARRAY[${fMaterials.map(c => `'%${c}%'`).join(', ')}])`);
  }
  const fSizes = csv(sizes);
  if (fSizes.length) {
    joinSpecs = true;
    whereClauses.push(`ps.dimensions ILIKE ANY (ARRAY[${fSizes.map(c => `'%${c}%'`).join(', ')}])`);
  }
  
  const fBrands = csv(brands);
  let joinBrands = false;
  if (fBrands.length) {
    joinBrands = true;
    params.push(fBrands);
    whereClauses.push(`b.name = ANY($${params.length})`);
  }

  let queryStr = `SELECT p.*, c.name AS category, c.slug AS category_slug,
      active_flash.price AS flash_price,
      ${effectivePriceSQL('p')} AS effective_price
    FROM products p LEFT JOIN categories c ON p.category_id = c.id${activeFlashJoin('p')}`;
  if (joinSpecs) queryStr += ` LEFT JOIN product_specs ps ON p.id = ps.product_id`;
  if (joinBrands) queryStr += ` LEFT JOIN brands b ON p.brand_id = b.id`;
  
  if (whereClauses.length > 0) {
    queryStr += ` WHERE ` + whereClauses.join(' AND ');
  }

  // Sorting
  const sortMap = {
    price_asc:  'effective_price ASC',
    price_desc: 'effective_price DESC',
    rating:     'p.rating DESC',
    sold:       'p.sold DESC',
    newest:     'p.id DESC',
  };
  queryStr += ` ORDER BY ${sortMap[sort] || sortMap.newest}`;

  // Count total for pagination
  const countQuery = `SELECT COUNT(*) FROM (${queryStr}) as t`;
  const countRes = await db.query(countQuery, params);
  const total = parseInt(countRes.rows[0].count, 10);

  // Pagination
  params.push(limit);
  queryStr += ` LIMIT $${params.length}`;
  params.push((page - 1) * limit);
  queryStr += ` OFFSET $${params.length}`;

  const res = await db.query(queryStr, params);
  const totalPages = Math.ceil(total / limit);

  const result = { data: res.rows, meta: { total, page, limit, totalPages } };
  dbCache.set(cacheKey, result);
  return result;
}

export async function getProductById(id) {
  const cacheKey = `products:id:${id}`;
  const cached = dbCache.get(cacheKey);
  if (cached) return cached;

  const res = await db.query(`
    SELECT p.*, c.name AS category, c.slug AS category_slug,
      ps.material, ps.color, ps.dimensions, ps.warranty, ps.origin, ps.style, ps.room, ps.note,
      active_flash.price AS flash_price,
      ${effectivePriceSQL('p')} AS effective_price
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN product_specs ps ON p.id = ps.product_id ${activeFlashJoin('p')}
    WHERE p.id = $1
  `, [id]);
  
  if (res.rows.length === 0) throw new AppError('Không tìm thấy sản phẩm', 404);
  const product = res.rows[0];
  dbCache.set(cacheKey, product);
  return product;
}

export async function listFlashSales() {
  const cacheKey = 'products:flash_sales';
  const cached = dbCache.get(cacheKey);
  if (cached) return cached;

  // Cùng điều kiện hiệu lực với effectivePriceSQL, nếu không trang chủ sẽ quảng cáo
  // một chương trình mà lúc thanh toán hệ thống không áp dụng.
  // product_price là giá niêm yết hiện tại — cơ sở duy nhất để tính % giảm.
  const res = await db.query(`
    SELECT fs.*, p.name, p.img, p.rating, p.type, p.price AS product_price
    FROM flash_sales fs
    JOIN products p ON fs.product_id = p.id
    WHERE ${activeFlashWhere('fs')}
  `);
  
  const result = res.rows;
  dbCache.set(cacheKey, result);
  return result;
}

async function ensureCategoryExists(categoryId) {
  const result = await db.query('SELECT 1 FROM categories WHERE id = $1', [categoryId]);
  if (result.rows.length === 0) {
    throw new AppError('Danh mục đã chọn không tồn tại', 400);
  }
}

const toSlug = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/\u0111/g, 'd')
  .replace(/\u0110/g, 'D')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '') || 'san-pham';

async function generateUniqueSlug(name) {
  const base = toSlug(name);
  let slug = base;
  let suffix = 2;

  while ((await db.query('SELECT 1 FROM products WHERE slug = $1', [slug])).rows.length > 0) {
    slug = `${base}-${suffix++}`;
  }

  return slug;
}

export async function createProduct(data) {
  const { name, type, price, categoryId, img, stock, description, sku } = data;
  await ensureCategoryExists(categoryId);
  const slug = data.slug || await generateUniqueSlug(name);
  const res = await db.query(`
    INSERT INTO products (name, slug, type, price, category_id, img, stock, description, sku)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
  `, [name, slug, type, price, categoryId, img, stock, description, sku || null]);

  dbCache.deletePattern('products:');
  return getProductById(res.rows[0].id);
}

export async function updateProduct(id, data) {
  if (data.categoryId !== undefined) await ensureCategoryExists(data.categoryId);

  const fields = [
    ['name', 'name'],
    ['type', 'type'],
    ['price', 'price'],
    ['categoryId', 'category_id'],
    ['img', 'img'],
    ['stock', 'stock'],
    ['description', 'description'],
    ['sku', 'sku'],
  ].filter(([key]) => data[key] !== undefined);

  if (fields.length === 0) return getProductById(id);

  const values = fields.map(([key]) => data[key]);
  const assignments = fields.map(([, column], index) => `${column} = $${index + 1}`);
  const result = await db.query(
    `UPDATE products SET ${assignments.join(', ')} WHERE id = $${values.length + 1} RETURNING id`,
    [...values, id]
  );
  if (result.rows.length === 0) throw new AppError('Không tìm thấy sản phẩm', 404);

  dbCache.deletePattern('products:');
  return getProductById(id);
}
export async function deleteProduct(id) {
  const res = await db.query(`DELETE FROM products WHERE id = $1 RETURNING *`, [id]);
  if (res.rows.length === 0) throw new AppError('Không tìm thấy sản phẩm', 404);

  // Invalidate cache
  dbCache.deletePattern('products:');
}

export async function listFlashSalesAdmin() {
  // order_item_count để dashboard biết trước chương trình nào đã bị khoá phần
  // giá (xem assertPricingNotLocked) mà vô hiệu hoá ô nhập, thay vì để admin
  // gõ xong bấm lưu rồi mới nhận lỗi.
  const res = await db.query(`
    SELECT fs.*, p.name AS product_name, p.price AS product_price, p.img AS product_img,
           (SELECT COUNT(*)::INT FROM order_items oi WHERE oi.flash_sale_id = fs.id) AS order_item_count
    FROM flash_sales fs
    JOIN products p ON fs.product_id = p.id
    ORDER BY fs.id DESC
  `);
  return res.rows;
}

export async function createFlashSale(data) {
  const { productId, price, originalPrice, stock, sold, startsAt, endsAt, active } = data;
  const from = startsAt || new Date();
  const to = endsAt || null;
  const isActive = active !== false;

  if (isActive) await assertNoOverlappingFlashSale({ productId, startsAt: from, endsAt: to });

  const res = await db.query(`
    INSERT INTO flash_sales (product_id, price, original_price, stock, sold, starts_at, ends_at, active)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
  `, [productId, price, originalPrice, stock || 0, sold || 0, from, to, isActive]);
  // Phải xoá cả cache danh sách/chi tiết sản phẩm, không chỉ khoá flash_sales:
  // từ khi có giá hiệu lực, flash sale quyết định luôn effective_price của
  // /products và /products/:id.
  dbCache.deletePattern('products:');
  return res.rows[0];
}

/**
 * Chặn hai chương trình flash sale cùng sản phẩm chạy chồng khung thời gian.
 *
 * Không chặn thì engine giá âm thầm chọn chương trình rẻ hơn
 * (activeFlashJoin dùng ORDER BY price ASC), chương trình vừa tạo bị vô hiệu mà
 * dashboard vẫn báo "Đang chạy" — admin không có cách nào biết.
 *
 * Chỉ xét các chương trình đang bật (active = TRUE); đã tắt hoặc đã hết hạn thì
 * không cản. Chương trình hết suất VẪN cản, vì chỉ cần sửa lại `stock` là nó
 * sống dậy và lập tức chồng lên chương trình mới.
 */
async function assertNoOverlappingFlashSale({ productId, startsAt, endsAt, excludeId = null }) {
  const res = await db.query(`
    SELECT id, price, starts_at, ends_at
    FROM flash_sales
    WHERE product_id = $1
      AND active = TRUE
      AND ($4::INT IS NULL OR id <> $4)
      -- Hai khoảng [s,e) giao nhau khi mỗi khoảng bắt đầu trước khi khoảng kia kết thúc.
      -- ends_at NULL nghĩa là không giới hạn -> coi như vô cực.
      AND starts_at < COALESCE($3::TIMESTAMPTZ, 'infinity')
      AND $2::TIMESTAMPTZ < COALESCE(ends_at, 'infinity')
    ORDER BY starts_at
    LIMIT 1
  `, [productId, startsAt, endsAt, excludeId]);

  if (res.rows.length === 0) return;

  const c = res.rows[0];
  const until = c.ends_at
    ? new Date(c.ends_at).toLocaleString('vi-VN')
    : 'không giới hạn';
  throw new AppError(
    `Sản phẩm này đã có chương trình flash sale #${c.id} đang bật ` +
    `(từ ${new Date(c.starts_at).toLocaleString('vi-VN')} đến ${until}) trùng khung thời gian. ` +
    `Hãy dừng hoặc tạm ngưng chương trình #${c.id} trước khi tạo chương trình mới.`,
    409
  );
}

/**
 * Các trường định nghĩa "đơn hàng này đã mua gì, với giá nào". Khi chương trình
 * đã phát sinh đơn thì khoá lại: sửa giá sale của chương trình sẽ khiến bản ghi
 * mâu thuẫn với order_items.price đã chốt, không tra ngược được nữa.
 *
 * Các trường vận hành (ends_at, stock, active) vẫn cho sửa — vẫn phải dừng,
 * gia hạn hay nâng số suất được.
 */
const PRICING_FIELDS = [
  ['price', 'price', 'giá sale'],
  ['originalPrice', 'original_price', 'giá gốc'],
  ['productId', 'product_id', 'sản phẩm áp dụng'],
];

async function assertPricingNotLocked(id, data, current) {
  // Form sửa gửi lên toàn bộ trường mỗi lần lưu, nên phải so GIÁ TRỊ chứ không
  // chặn theo việc trường có mặt — nếu không mọi lần lưu đều bị từ chối.
  const changed = PRICING_FIELDS.filter(
    ([key, column]) => data[key] !== undefined && Number(data[key]) !== Number(current[column])
  );
  if (changed.length === 0) return;

  const used = await db.query('SELECT COUNT(*)::INT AS n FROM order_items WHERE flash_sale_id = $1', [id]);
  if (used.rows[0].n === 0) return;

  throw new AppError(
    `Không thể đổi ${changed.map(([, , label]) => label).join(', ')}: ` +
    `đã có ${used.rows[0].n} dòng đơn hàng mua theo chương trình này. ` +
    `Muốn áp mức giá khác thì dừng chương trình và tạo chương trình mới.`,
    409
  );
}

export async function updateFlashSale(id, data) {
  const fields = [
    ['productId', 'product_id'],
    ['price', 'price'],
    ['originalPrice', 'original_price'],
    ['stock', 'stock'],
    ['sold', 'sold'],
    ['startsAt', 'starts_at'],
    ['endsAt', 'ends_at'],
    ['active', 'active'],
  ].filter(([key]) => data[key] !== undefined);

  if (fields.length === 0) return { id };

  // Kiểm tra chồng lấn trên trạng thái SAU khi ghép thay đổi: sửa ngày hoặc bật
  // lại một chương trình cũ cũng có thể đè lên chương trình đang chạy.
  const currentRes = await db.query('SELECT * FROM flash_sales WHERE id = $1', [id]);
  if (currentRes.rows.length === 0) throw new AppError('Không tìm thấy flash sale', 404);
  const current = currentRes.rows[0];

  const merged = {
    productId: data.productId ?? current.product_id,
    startsAt: data.startsAt ?? current.starts_at,
    endsAt: data.endsAt !== undefined ? data.endsAt : current.ends_at,
    active: data.active !== undefined ? data.active : current.active,
  };
  if (merged.active) {
    await assertNoOverlappingFlashSale({ ...merged, excludeId: id });
  }

  await assertPricingNotLocked(id, data, current);

  const values = fields.map(([key]) => data[key]);
  const assignments = fields.map(([, column], index) => `${column} = $${index + 1}`);
  const result = await db.query(
    `UPDATE flash_sales SET ${assignments.join(', ')} WHERE id = $${values.length + 1} RETURNING id`,
    [...values, id]
  );
  if (result.rows.length === 0) throw new AppError('Không tìm thấy flash sale', 404);
  // Phải xoá cả cache danh sách/chi tiết sản phẩm, không chỉ khoá flash_sales:
  // từ khi có giá hiệu lực, flash sale quyết định luôn effective_price của
  // /products và /products/:id.
  dbCache.deletePattern('products:');
  return result.rows[0];
}

export async function deleteFlashSale(id) {
  // Dashboard đã bỏ nút xoá, nhưng endpoint vẫn gọi được. Chặn ở đây để không ai
  // xoá mất dấu vết khuyến mãi của đơn hàng cũ: order_items.flash_sale_id khai
  // ON DELETE SET NULL, xoá xong là không tra được vì sao đơn giá thấp hơn giá
  // niêm yết. Muốn kết thúc chương trình thì đặt ends_at, đừng xoá.
  const used = await db.query('SELECT COUNT(*)::INT AS n FROM order_items WHERE flash_sale_id = $1', [id]);
  if (used.rows[0].n > 0) {
    throw new AppError(
      `Không thể xoá: đã có ${used.rows[0].n} dòng đơn hàng mua theo chương trình này. ` +
      `Hãy dừng chương trình (đặt thời gian kết thúc) thay vì xoá.`,
      409
    );
  }

  const result = await db.query('DELETE FROM flash_sales WHERE id = $1 RETURNING id', [id]);
  if (result.rows.length === 0) throw new AppError('Không tìm thấy flash sale', 404);
  // Phải xoá cả cache danh sách/chi tiết sản phẩm, không chỉ khoá flash_sales:
  // từ khi có giá hiệu lực, flash sale quyết định luôn effective_price của
  // /products và /products/:id.
  dbCache.deletePattern('products:');
  return result.rows[0];
}
