import * as returnService from './return.service.js';
import { RETURN_STATUS_LABEL } from './return.schema.js';
import { ok, created, paginated } from '../../utils/response.js';
import { AppError } from '../../middleware/errorHandler.js';

function parseId(req) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) throw new AppError('Mã yêu cầu trả hàng không hợp lệ', 400);
  return id;
}

// ─── Khách hàng ──────────────────────────────────────────────────────────────

export async function create(req, res, next) {
  try {
    const item = await returnService.createReturn(req.user.id, req.body);
    created(res, item, 'Đã gửi yêu cầu, Nam Quan sẽ phản hồi sớm nhất.');
  } catch (error) {
    next(error);
  }
}

export async function listMine(req, res, next) {
  try {
    ok(res, await returnService.listMyReturns(req.user.id));
  } catch (error) {
    next(error);
  }
}

export async function cancelMine(req, res, next) {
  try {
    const id = parseId(req);
    ok(res, await returnService.cancelMyReturn(req.user.id, id), 'Đã hủy yêu cầu trả / đổi hàng');
  } catch (error) {
    next(error);
  }
}

// ─── Admin / nhân viên ───────────────────────────────────────────────────────

export async function list(req, res, next) {
  try {
    const { data, meta } = await returnService.listReturns(req.query);
    paginated(res, data, meta);
  } catch (error) {
    next(error);
  }
}

export async function stats(_req, res, next) {
  try {
    ok(res, await returnService.countReturnsByStatus());
  } catch (error) {
    next(error);
  }
}

export async function getOne(req, res, next) {
  try {
    ok(res, await returnService.getReturnById(parseId(req)));
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const item = await returnService.updateReturnStatus(parseId(req), req.body);
    const messages = {
      approved:  'Đã duyệt yêu cầu',
      rejected:  'Đã từ chối yêu cầu',
      completed: item.type === 'return'
        ? 'Đã hoàn tất trả hàng — tồn kho và thanh toán đã được cập nhật'
        : 'Đã hoàn tất đổi hàng',
    };
    ok(res, item, messages[req.body.status] ?? 'Đã cập nhật yêu cầu');
  } catch (error) {
    next(error);
  }
}

export { RETURN_STATUS_LABEL };
