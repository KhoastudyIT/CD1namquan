import db from '../../db/index.js';
import { AppError } from '../../middleware/errorHandler.js';

const toSlug = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/\u0111/g, 'd')
  .replace(/\u0110/g, 'D')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '') || 'tin-tuc';

async function generateUniqueSlug(title) {
  const base = toSlug(title);
  let slug = base;
  let suffix = 2;
  while ((await db.query('SELECT 1 FROM news WHERE slug = $1', [slug])).rows.length > 0) {
    slug = `${base}-${suffix++}`;
  }
  return slug;
}

function parseDMY(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

export async function listNews() {
  const res = await db.query('SELECT * FROM news ORDER BY publish_date DESC, id DESC');
  return res.rows.map(row => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    img: row.img,
    excerpt: row.excerpt,
    content: row.content,
    seo_title: row.seo_title,
    date: row.publish_date ? new Date(row.publish_date).toLocaleDateString('vi-VN') : '',
  }));
}

export async function getNewsById(id) {
  const res = await db.query('SELECT * FROM news WHERE id = $1', [id]);
  if (res.rows.length === 0) throw new AppError('Không tìm thấy bài viết', 404);
  const row = res.rows[0];
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    img: row.img,
    excerpt: row.excerpt,
    content: row.content,
    seo_title: row.seo_title,
    date: row.publish_date ? new Date(row.publish_date).toLocaleDateString('vi-VN') : '',
  };
}

export async function createNews(data) {
  const { title, img, excerpt, content, seo_title } = data;
  const slug = data.slug || await generateUniqueSlug(title);
  const publishDate = parseDMY(data.date) || new Date();

  const res = await db.query(
    `INSERT INTO news (title, slug, img, excerpt, content, seo_title, publish_date) 
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [title, slug, img || '', excerpt || '', content || '', seo_title || null, publishDate]
  );
  
  const row = res.rows[0];
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    img: row.img,
    excerpt: row.excerpt,
    content: row.content,
    seo_title: row.seo_title,
    date: row.publish_date ? new Date(row.publish_date).toLocaleDateString('vi-VN') : '',
  };
}

export async function updateNews(id, data) {
  const existing = await db.query('SELECT * FROM news WHERE id = $1', [id]);
  if (existing.rows.length === 0) throw new AppError('Không tìm thấy bài viết', 404);

  const title = data.title ?? existing.rows[0].title;
  const img = data.img ?? existing.rows[0].img;
  const excerpt = data.excerpt ?? existing.rows[0].excerpt;
  const content = data.content ?? existing.rows[0].content;
  const seo_title = data.seo_title ?? existing.rows[0].seo_title;
  const slug = data.title ? await generateUniqueSlug(title) : existing.rows[0].slug;
  const publishDate = data.date !== undefined ? (parseDMY(data.date) || new Date()) : existing.rows[0].publish_date;

  const res = await db.query(
    `UPDATE news SET title = $1, slug = $2, img = $3, excerpt = $4, content = $5, seo_title = $6, publish_date = $7 WHERE id = $8 RETURNING *`,
    [title, slug, img, excerpt, content, seo_title, publishDate, id]
  );
  
  const row = res.rows[0];
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    img: row.img,
    excerpt: row.excerpt,
    content: row.content,
    seo_title: row.seo_title,
    date: row.publish_date ? new Date(row.publish_date).toLocaleDateString('vi-VN') : '',
  };
}

export async function deleteNews(id) {
  const res = await db.query('DELETE FROM news WHERE id = $1 RETURNING *', [id]);
  if (res.rows.length === 0) throw new AppError('Không tìm thấy bài viết', 404);
}
