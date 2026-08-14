import * as consultationService from './consultation.service.js';
import { createConsultationSchema, updateConsultationStatusSchema } from './consultation.schema.js';
import { ok, created, paginated, noContent } from '../../utils/response.js';
import { AppError } from '../../middleware/errorHandler.js';

// Body parse ngay tại controller để giữ kết quả biến đổi của zod — số điện thoại
// được chuẩn hoá (bỏ dấu cách/chấm) trong schema, dùng bản đã gọn để lưu.

function parseId(req) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) throw new AppError('ID yêu cầu tư vấn không hợp lệ', 400);
  return id;
}

// ── Public ───────────────────────────────────────────────────────────────────

// POST /consultations — form "Để lại thông tin" ở trang chủ
export async function create(req, res, next) {
  try {
    const body = createConsultationSchema.parse(req.body);
    const request = await consultationService.createConsultation(body);
    created(res, request, 'Đã gửi yêu cầu, Nam Quan sẽ liên hệ tư vấn sớm nhất.');
  } catch (error) {
    next(error);
  }
}

// ── Admin ────────────────────────────────────────────────────────────────────

export async function list(req, res, next) {
  try {
    const { data, meta } = await consultationService.listConsultations(req.query);
    paginated(res, data, meta);
  } catch (error) {
    next(error);
  }
}

// GET /consultations/stats — số lượng theo từng trạng thái
export async function stats(_req, res, next) {
  try {
    ok(res, await consultationService.countConsultationsByStatus());
  } catch (error) {
    next(error);
  }
}

export async function getOne(req, res, next) {
  try {
    ok(res, await consultationService.getConsultationById(parseId(req)));
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const { status } = updateConsultationStatusSchema.parse(req.body);
    const request = await consultationService.updateConsultationStatus(parseId(req), status);
    const labels = {
      contacted: 'Đã đánh dấu liên hệ',
      quoted:    'Đã đánh dấu báo giá',
      closed:    'Đã đóng yêu cầu',
      cancelled: 'Đã huỷ yêu cầu',
    };
    ok(res, request, labels[status] ?? 'Đã cập nhật trạng thái');
  } catch (error) {
    next(error);
  }
}

export async function remove(req, res, next) {
  try {
    await consultationService.deleteConsultation(parseId(req));
    noContent(res);
  } catch (error) {
    next(error);
  }
}
