import db from '../../db/index.js';
import { dbCache } from '../../db/store.js';
import { AppError } from '../../middleware/errorHandler.js';

const csv = (s) => (s ? s.split(',').map(v => v.trim()).filter(Boolean) : []);

export async function listProducts({
  category, type, search, sort = 'newest', page = 1, limit = 12,
  priceMin, priceMax, colors, styles, materials, sizes, brands,
}) {
  const cacheKey = `products:list:${JSON.stringify({
    category, type, search, sort, page, limit, priceMin, priceMax, colors, styles, materials, sizes, brands
  })}`;
  const cached = dbCache.get(cacheKey);
  if (cached) return cached;

  const params = [];
  let whereClauses = [];

  if (category) {
    params.push(category);
    whereClauses.push(`p.category = $${params.length}`);
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

  let queryStr = `SELECT p.* FROM products p`;
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
    SELECT p.*, 
      ps.material, ps.color, ps.dimensions, ps.warranty, ps.origin, ps.style, ps.room, ps.note
    FROM products p 
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

export async function createProduct(data) {
  // Simplistic implementation for admin
  const { name, slug, sku, type, price, category_id, img, description } = data;
  const res = await db.query(`
    INSERT INTO products (name, slug, sku, type, price, category_id, img, description) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
  `, [name, slug, sku, type, price, category_id, img, description]);

  // Invalidate cache
  dbCache.deletePattern('products:');

  return res.rows[0];
}

export async function updateProduct(id, data) {
  // Very simplistic update for admin
  let updatedProduct;
  if (data.price) {
    const res = await db.query(`UPDATE products SET price = $1 WHERE id = $2 RETURNING *`, [data.price, id]);
    if (res.rows.length === 0) throw new AppError('Không tìm thấy sản phẩm', 404);
    updatedProduct = res.rows[0];
  } else {
    updatedProduct = await getProductById(id);
  }

  // Invalidate cache
  dbCache.deletePattern('products:');

  return updatedProduct;
}

export async function deleteProduct(id) {
  const res = await db.query(`DELETE FROM products WHERE id = $1 RETURNING *`, [id]);
  if (res.rows.length === 0) throw new AppError('Không tìm thấy sản phẩm', 404);

  // Invalidate cache
  dbCache.deletePattern('products:');
}
