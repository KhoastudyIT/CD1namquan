import * as newsService from './news.service.js';
import { createNewsSchema, updateNewsSchema, updateNewsStatusSchema } from './news.schema.js';
import { ok, created, paginated, noContent } from '../../utils/response.js';
import { AppError } from '../../middleware/errorHandler.js';

// Body được parse ngay tại controller (thay vì middleware validate) để giữ được
// kết quả ép kiểu của zod — categoryId từ form là chuỗi, cần thành số.

function parseId(req) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) throw new AppError('ID bài viết không hợp lệ', 400);
  return id;
}

// ── Public ───────────────────────────────────────────────────────────────────

// GET /news — chỉ bài đã đăng, có phân trang/lọc/tìm kiếm
export async function list(req, res, next) {
  try {
    const { data, meta } = await newsService.listPublishedNews(req.query);
    paginated(res, data, meta);
  } catch (error) {
    next(error);
  }
}

// GET /news/categories
export async function listCategories(_req, res, next) {
  try {
    ok(res, await newsService.listNewsCategories());
  } catch (error) {
    next(error);
  }
}

// GET /news/:idOrSlug — nhận cả id lẫn slug, tự tăng lượt xem
export async function getOne(req, res, next) {
  try {
    ok(res, await newsService.getPublishedNews(req.params.idOrSlug));
  } catch (error) {
    next(error);
  }
}

// GET /news/:idOrSlug/related
export async function listRelated(req, res, next) {
  try {
    ok(res, await newsService.listRelatedNews(req.params.idOrSlug, req.query.limit));
  } catch (error) {
    next(error);
  }
}

// ── Admin ────────────────────────────────────────────────────────────────────

// GET /news/admin/list — mọi trạng thái, lọc theo status/danh mục/từ khoá
export async function adminList(req, res, next) {
  try {
    const { data, meta } = await newsService.listNewsAdmin(req.query);
    paginated(res, data, meta);
  } catch (error) {
    next(error);
  }
}

// GET /news/admin/:id — chi tiết đầy đủ (kể cả nháp/ẩn) để mở form sửa
export async function adminGetById(req, res, next) {
  try {
    ok(res, await newsService.getNewsAdminById(parseId(req)));
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    const body = createNewsSchema.parse(req.body);
    created(res, await newsService.createNews(body), 'Tạo bài viết thành công');
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    const body = updateNewsSchema.parse(req.body);
    ok(res, await newsService.updateNews(parseId(req), body), 'Cập nhật bài viết thành công');
  } catch (error) {
    next(error);
  }
}

// PATCH /news/:id/status — đăng / gỡ / chuyển nháp nhanh từ bảng danh sách
export async function updateStatus(req, res, next) {
  try {
    const { status } = updateNewsStatusSchema.parse(req.body);
    const article = await newsService.updateNewsStatus(parseId(req), status);
    const labels = { published: 'Đã đăng bài viết', draft: 'Đã chuyển về bản nháp', hidden: 'Đã ẩn bài viết' };
    ok(res, article, labels[status]);
  } catch (error) {
    next(error);
  }
}

export async function remove(req, res, next) {
  try {
    await newsService.deleteNews(parseId(req));
    noContent(res);
  } catch (error) {
    next(error);
  }
}
