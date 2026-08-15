import * as orderService from './order.service.js';
import * as settingsService from '../settings/settings.service.js';
import { buildInvoicePdf, invoiceCode } from '../../services/pdf/invoice.js';
import { storage } from '../../services/storage/index.js';
import { isBackoffice } from '../../utils/roles.js';
import { AppError } from '../../middleware/errorHandler.js';
import { ok, created, paginated } from '../../utils/response.js';

/**
 * Tải logo cửa hàng về dạng Buffer để in chìm lên hoá đơn.
 *
 * Đọc thẳng từ MinIO bằng object key thay vì tải qua URL công khai: bên trong
 * container, publicUrl (localhost:9000) trỏ về chính backend chứ không phải
 * MinIO. Logo hỏng hay chưa cấu hình lưu trữ đều không được chặn việc in hoá
 * đơn — khi đó hàm trả null và hình chìm rơi về dạng chữ.
 */
async function loadCompanyLogo(logoUrl) {
  if (!logoUrl || !storage) return null;
  try {
    const key = storage.keyFromPublicUrl(logoUrl);
    if (!key) return null;                       // ảnh tĩnh trong frontend, không nằm ở MinIO
    if (!/\.(png|jpe?g)$/i.test(key)) return null; // pdfkit chỉ đọc được PNG và JPEG
    return await storage.getObjectBuffer(key);
  } catch {
    return null;
  }
}

/**
 * GET /orders/:id/invoice — tải hoá đơn PDF.
 *
 * Khách in được hoá đơn đơn hàng của mình; admin và nhân viên in được mọi đơn
 * (cần khi khách gọi lên nhờ gửi lại hoá đơn).
 */
export async function invoice(req, res, next) {
  try {
    const order = await orderService.getOrderForInvoice(req.params.id);

    if (!isBackoffice(req.user.role) && order.userId !== req.user.id) {
      throw new AppError('Bạn không có quyền xem đơn hàng này', 403);
    }

    // Thông tin công ty in ở đầu hoá đơn; thiếu cũng không chặn việc in.
    let company = {};
    try { company = await settingsService.getCompanyInfo(); } catch { /* dùng mặc định */ }

    const logoBuffer = await loadCompanyLogo(company.logo);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="hoa-don-${invoiceCode(order.id)}.pdf"`);

    // Nối thẳng stream vào response: file không cần nằm trọn trong bộ nhớ.
    buildInvoicePdf(order, company, logoBuffer).pipe(res);
  } catch (error) {
    next(error);
  }
}

export async function list(req, res, next) {
  try {
    ok(res, await orderService.listOrders(req.user.id));
  } catch (error) {
    next(error);
  }
}

export async function getById(req, res, next) {
  try {
    ok(res, await orderService.getOrderById(req.user.id, req.params.id));
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    const order = await orderService.createOrder(req.user.id, req.body);
    created(res, order, 'Đặt hàng thành công');
  } catch (error) {
    next(error);
  }
}

export async function listAll(req, res, next) {
  try {
    const { data, meta } = await orderService.listAllOrders(req.query);
    paginated(res, data, meta);
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const order = await orderService.updateOrderStatus(req.params.id, req.body.status);
    ok(res, order, 'Đã cập nhật trạng thái đơn hàng');
  } catch (error) {
    next(error);
  }
}

export async function cancelMyOrder(req, res, next) {
  try {
    const order = await orderService.cancelMyOrder(req.user.id, req.params.id);
    ok(res, order, 'Đã hủy đơn hàng thành công');
  } catch (error) {
    next(error);
  }
}
