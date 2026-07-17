import db from '../../db/index.js';
import { dbCache } from '../../db/store.js';
import { AppError } from '../../middleware/errorHandler.js';

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
    // Backwards-compatible filtering by name. The authoritative value remains category_id.
    params.push(category);
    whereClauses.push(`c.name = $${params.length}`);
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
  if (priceMin != null) {
    params.push(priceMin);
    whereClauses.push(`p.price >= $${params.length}`);
  }
  if (priceMax != null) {
    params.push(priceMax);
    whereClauses.push(`p.price <= $${params.length}`);
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

  let queryStr = `SELECT p.*, c.name AS category, c.slug AS category_slug FROM products p LEFT JOIN categories c ON p.category_id = c.id`;
  if (joinSpecs) queryStr += ` LEFT JOIN product_specs ps ON p.id = ps.product_id`;
  if (joinBrands) queryStr += ` LEFT JOIN brands b ON p.brand_id = b.id`;
  
  if (whereClauses.length > 0) {
    queryStr += ` WHERE ` + whereClauses.join(' AND ');
  }

  // Sorting
  const sortMap = {
    price_asc:  'p.price ASC',
    price_desc: 'p.price DESC',
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
      ps.material, ps.color, ps.dimensions, ps.warranty, ps.origin, ps.style, ps.room, ps.note
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN product_specs ps ON p.id = ps.product_id 
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

  const res = await db.query(`
    SELECT fs.*, p.name, p.img, p.rating, p.type 
    FROM flash_sales fs 
    JOIN products p ON fs.product_id = p.id 
    WHERE fs.active = true
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
