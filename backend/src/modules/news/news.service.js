import db from '../../db/index.js';
import { dbCache } from '../../db/store.js';
import { AppError } from '../../middleware/errorHandler.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

const toSlug = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/\u0111/g, 'd')
  .replace(/\u0110/g, 'D')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '') || 'bai-viet';

// excludeId: khi cập nhật, bài viết không được coi chính nó là trùng slug.
async function ensureUniqueSlug(base, excludeId = null) {
  let slug = base;
  let suffix = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const res = await db.query(
      'SELECT 1 FROM news WHERE slug = $1 AND ($2::int IS NULL OR id <> $2)',
      [slug, excludeId],
    );
    if (res.rows.length === 0) return slug;
    slug = `${base}-${suffix++}`;
  }
}

const pad = (n) => String(n).padStart(2, '0');

// Cột publish_date là DATE — truyền/nhận chuỗi 'yyyy-mm-dd' để không bị lệch
// ngày do chuyển đổi múi giờ.
function parseDateInput(value) {
  if (!value) return null;
  const dmy = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${pad(Number(m))}-${pad(Number(d))}`;
  }
  const iso = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    const [, y, m, d] = iso;
    return `${y}-${pad(Number(m))}-${pad(Number(d))}`;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
}

const todayIso = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

function isoDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function viDate(value) {
  const iso = isoDate(value);
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// Nội dung lưu dạng văn bản thuần (cú pháp rút gọn "## ", "- ", "**...**").
// Gỡ toàn bộ thẻ HTML khi ghi để frontend render mà không cần dangerouslySetInnerHTML.
// Đồng thời chuẩn hoá CRLF/CR về LF: frontend tách đoạn bằng /\n{2,}/, nếu để
// lọt \r\n\r\n (admin dán từ Word/Windows) thì cả bài sẽ dồn thành một khối.
const normalizeContent = (text) => text
  .replace(/\r\n?/g, '\n')
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<style[\s\S]*?<\/style>/gi, '')
  .replace(/<[^>]*>/g, '')
  .trim();

const estimateReadingTime = (content) => {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200)); // ~200 từ/phút
};

const normalizeTags = (tags) => {
  if (!Array.isArray(tags)) return [];
  const seen = new Set();
  return tags
    .map(t => String(t).trim())
    .filter(t => t && !seen.has(t.toLowerCase()) && seen.add(t.toLowerCase()));
};

// Chuỗi rỗng từ form dashboard = "không có giá trị" → lưu NULL.
const emptyToNull = (value) => {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
};

function mapRow(row, { withContent = true } = {}) {
  const article = {
    id:          row.id,
    title:       row.title,
    slug:        row.slug,
    img:         row.img,
    excerpt:     row.excerpt,
    author:      row.author,
    category:    row.category_id
      ? { id: row.category_id, name: row.category_name, slug: row.category_slug }
      : null,
    tags:        row.tags || [],
    status:      row.status,
    featured:    row.featured,
    views:       row.views,
    readingTime: row.reading_time,
    publishedAt: isoDate(row.publish_date), // 'yyyy-mm-dd' — dùng cho input date
    date:        viDate(row.publish_date),  // 'dd/mm/yyyy' — dùng để hiển thị
    seo: {
      title:       row.seo_title,
      description: row.seo_description,
      keywords:    row.seo_keywords,
      ogImage:     row.og_image,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (withContent) article.content = row.content;
  return article;
}

const SELECT_BASE = `
  SELECT n.*, c.name AS category_name, c.slug AS category_slug
  FROM news n
  LEFT JOIN news_categories c ON n.category_id = c.id
`;

const SORT_SQL = {
  newest:  'n.publish_date DESC, n.id DESC',
  oldest:  'n.publish_date ASC, n.id ASC',
  popular: 'n.views DESC, n.publish_date DESC, n.id DESC',
};

// Gom điều kiện lọc dùng chung cho cả danh sách công khai và dashboard.
function buildFilters({ status, search, category, tag, featured }) {
  const params = [];
  const where  = [];

  if (status) {
    params.push(status);
    where.push(`n.status = $${params.length}`);
  }
  if (search) {
    // unaccent: tìm "noi that" vẫn ra "nội thất" (extension khai báo trong file SQL).
    params.push(`%${search}%`);
    where.push(`(
      unaccent(lower(n.title))   LIKE unaccent(lower($${params.length}))
      OR unaccent(lower(n.excerpt)) LIKE unaccent(lower($${params.length}))
    )`);
  }
  if (category) {
    params.push(category);
    where.push(`c.slug = $${params.length}`);
  }
  if (tag) {
    params.push(tag);
    where.push(`$${params.length} = ANY(n.tags)`);
  }
  if (featured !== undefined) {
    params.push(featured);
    where.push(`n.featured = $${params.length}`);
  }

  return { params, whereSql: where.length ? ` WHERE ${where.join(' AND ')}` : '' };
}

async function queryList({ filters, sort, page, limit, withContent }) {
  const { params, whereSql } = buildFilters(filters);

  const countRes = await db.query(
    `SELECT COUNT(*) FROM news n LEFT JOIN news_categories c ON n.category_id = c.id${whereSql}`,
    params,
  );
  const total = parseInt(countRes.rows[0].count, 10);

  const listParams = [...params, limit, (page - 1) * limit];
  const res = await db.query(
    `${SELECT_BASE}${whereSql}
     ORDER BY ${SORT_SQL[sort] || SORT_SQL.newest}
     LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
    listParams,
  );

  return {
    data: res.rows.map(row => mapRow(row, { withContent })),
    meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

// ── Public ───────────────────────────────────────────────────────────────────

export async function listPublishedNews(query) {
  const cacheKey = `news:public:${JSON.stringify(query)}`;
  const cached = dbCache.get(cacheKey);
  if (cached) return cached;

  const { page, limit, sort, ...filters } = query;
  const result = await queryList({
    filters: { ...filters, status: 'published' },
    sort, page, limit,
    withContent: false, // danh sách không cần nội dung đầy đủ
  });

  dbCache.set(cacheKey, result);
  return result;
}

// idOrSlug: hỗ trợ cả /news/12 lẫn /news/xu-huong-noi-that-2026 (SEO-friendly).
async function findPublished(idOrSlug) {
  const numericId = /^\d+$/.test(String(idOrSlug)) ? Number(idOrSlug) : null;
  const res = await db.query(
    `${SELECT_BASE} WHERE n.status = 'published' AND (n.id = $1 OR n.slug = $2) LIMIT 1`,
    [numericId, String(idOrSlug)],
  );
  if (res.rows.length === 0) throw new AppError('Không tìm thấy bài viết', 404);
  return res.rows[0];
}

export async function getPublishedNews(idOrSlug) {
  const row = await findPublished(idOrSlug);

  // RETURNING để lấy đúng số sau khi cộng. Tự tính `row.views + 1` thì hai
  // request đồng thời cùng đọc số cũ rồi cùng trả về một giá trị, lệch với DB.
  const updated = await db.query(
    'UPDATE news SET views = views + 1 WHERE id = $1 RETURNING views',
    [row.id],
  );

  // Danh sách công khai có hiển thị lượt xem và có kiểu sắp xếp "xem nhiều
  // nhất", nên phải bỏ cache — không thì con số đứng yên tới 5 phút. Chỉ xoá
  // 'news:public:', giữ 'news:categories' vì nó không chứa lượt xem.
  dbCache.deletePattern('news:public:');

  return mapRow({ ...row, views: updated.rows[0]?.views ?? row.views + 1 });
}

// Ưu tiên bài cùng danh mục, thiếu thì bù bằng bài mới nhất — luôn đủ `limit` bài.
export async function listRelatedNews(idOrSlug, limit) {
  const row = await findPublished(idOrSlug);
  const res = await db.query(
    `${SELECT_BASE}
     WHERE n.status = 'published' AND n.id <> $1
     ORDER BY (n.category_id IS NOT DISTINCT FROM $2) DESC, n.publish_date DESC, n.id DESC
     LIMIT $3`,
    [row.id, row.category_id, limit],
  );
  return res.rows.map(r => mapRow(r, { withContent: false }));
}

export async function listNewsCategories() {
  const cached = dbCache.get('news:categories');
  if (cached) return cached;

  const res = await db.query(`
    SELECT c.id, c.name, c.slug, c.description, c.sort_order,
           COUNT(n.id) FILTER (WHERE n.status = 'published') AS article_count
    FROM news_categories c
    LEFT JOIN news n ON n.category_id = c.id
    GROUP BY c.id
    ORDER BY c.sort_order ASC, c.id ASC
  `);

  const result = res.rows.map(r => ({
    id:           r.id,
    name:         r.name,
    slug:         r.slug,
    description:  r.description,
    sortOrder:    r.sort_order,
    articleCount: parseInt(r.article_count, 10),
  }));

  dbCache.set('news:categories', result);
  return result;
}

// ── Admin ────────────────────────────────────────────────────────────────────

export async function listNewsAdmin(query) {
  const { page, limit, sort, ...filters } = query;
  return queryList({ filters, sort, page, limit, withContent: false });
}

export async function getNewsAdminById(id) {
  const res = await db.query(`${SELECT_BASE} WHERE n.id = $1`, [id]);
  if (res.rows.length === 0) throw new AppError('Không tìm thấy bài viết', 404);
  return mapRow(res.rows[0]);
}

async function ensureCategoryExists(categoryId) {
  if (categoryId === null || categoryId === undefined) return;
  const res = await db.query('SELECT 1 FROM news_categories WHERE id = $1', [categoryId]);
  if (res.rows.length === 0) throw new AppError('Danh mục bài viết không tồn tại', 400);
}

export async function createNews(data) {
  await ensureCategoryExists(data.categoryId);

  const content = normalizeContent(data.content);
  if (!content) throw new AppError('Nội dung là bắt buộc', 422);

  const slug = await ensureUniqueSlug(data.slug ? toSlug(data.slug) : toSlug(data.title));

  const res = await db.query(
    `INSERT INTO news (
       title, slug, publish_date, img, excerpt, content, author,
       category_id, tags, status, featured, reading_time,
       seo_title, seo_description, seo_keywords, og_image
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     RETURNING id`,
    [
      data.title,
      slug,
      parseDateInput(data.date) || todayIso(),
      data.img,
      data.excerpt,
      content,
      emptyToNull(data.author) || 'NAM QUAN',
      data.categoryId ?? null,
      normalizeTags(data.tags),
      data.status || 'draft',
      data.featured ?? false,
      estimateReadingTime(content),
      emptyToNull(data.seoTitle),
      emptyToNull(data.seoDescription),
      emptyToNull(data.seoKeywords),
      emptyToNull(data.ogImage),
    ],
  );

  dbCache.deletePattern('news:');
  return getNewsAdminById(res.rows[0].id);
}

export async function updateNews(id, data) {
  const existing = await db.query('SELECT id FROM news WHERE id = $1', [id]);
  if (existing.rows.length === 0) throw new AppError('Không tìm thấy bài viết', 404);

  if (data.categoryId !== undefined) await ensureCategoryExists(data.categoryId);

  const updates = [];

  const push = (column, value) => updates.push([column, value]);

  if (data.title !== undefined)   push('title', data.title);
  if (data.img !== undefined)     push('img', data.img);
  if (data.excerpt !== undefined) push('excerpt', data.excerpt);

  if (data.content !== undefined) {
    const content = normalizeContent(data.content);
    if (!content) throw new AppError('Nội dung là bắt buộc', 422);
    push('content', content);
    push('reading_time', estimateReadingTime(content));
  }

  // Slug chỉ đổi khi admin sửa tay — đổi tiêu đề không phá URL đã public.
  if (data.slug !== undefined) {
    push('slug', await ensureUniqueSlug(toSlug(data.slug), id));
  }

  if (data.author !== undefined)     push('author', emptyToNull(data.author) || 'NAM QUAN');
  if (data.categoryId !== undefined) push('category_id', data.categoryId ?? null);
  if (data.tags !== undefined)       push('tags', normalizeTags(data.tags));
  if (data.status !== undefined)     push('status', data.status);
  if (data.featured !== undefined)   push('featured', data.featured);

  if (data.date !== undefined) {
    push('publish_date', parseDateInput(data.date) || todayIso());
  }

  if (data.seoTitle !== undefined)       push('seo_title', emptyToNull(data.seoTitle));
  if (data.seoDescription !== undefined) push('seo_description', emptyToNull(data.seoDescription));
  if (data.seoKeywords !== undefined)    push('seo_keywords', emptyToNull(data.seoKeywords));
  if (data.ogImage !== undefined)        push('og_image', emptyToNull(data.ogImage));

  if (updates.length === 0) return getNewsAdminById(id);

  const values = updates.map(([, value]) => value);
  const assignments = updates.map(([column], index) => `${column} = $${index + 1}`);
  assignments.push('updated_at = NOW()');

  await db.query(
    `UPDATE news SET ${assignments.join(', ')} WHERE id = $${values.length + 1}`,
    [...values, id],
  );

  dbCache.deletePattern('news:');
  return getNewsAdminById(id);
}

export async function updateNewsStatus(id, status) {
  const res = await db.query(
    'UPDATE news SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id',
    [status, id],
  );
  if (res.rows.length === 0) throw new AppError('Không tìm thấy bài viết', 404);

  dbCache.deletePattern('news:');
  return getNewsAdminById(id);
}

export async function deleteNews(id) {
  const res = await db.query('DELETE FROM news WHERE id = $1 RETURNING id', [id]);
  if (res.rows.length === 0) throw new AppError('Không tìm thấy bài viết', 404);
  dbCache.deletePattern('news:');
}
