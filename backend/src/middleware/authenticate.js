import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { AppError } from './errorHandler.js';
import db from '../db/index.js';

/**
 * Xác thực JWT kèm kiểm tra lại trong DB.
 *
 * Chỉ đọc chữ ký token là chưa đủ: token có hạn 7 ngày, nên nếu quản trị viên
 * đổi vai trò hoặc khoá tài khoản một nhân viên, người đó vẫn giữ nguyên quyền
 * cũ cho tới khi token hết hạn. Vì vậy mỗi request đều đọc lại vai trò và
 * trạng thái hiện tại từ bảng users — thao tác khoá/đổi quyền có hiệu lực ngay.
 *
 * Quy ước mã lỗi:
 *   401 — thiếu token / token sai / hết hạn / tài khoản không còn tồn tại
 *   403 — token hợp lệ nhưng tài khoản đang bị khoá
 */
export async function authenticate(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(new AppError('Authentication required', 401));
    }

    const token = authHeader.slice(7);
    let payload;
    try {
      payload = jwt.verify(token, config.jwtSecret);
    } catch {
      return next(new AppError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 401));
    }

    const { rows } = await db.query(
      'SELECT id, name, email, role, COALESCE(status, $2) AS status FROM users WHERE id = $1',
      [payload.id, 'active'],
    );
    const user = rows[0];

    if (!user) {
      return next(new AppError('Tài khoản không còn tồn tại. Vui lòng đăng nhập lại.', 401));
    }
    if (user.status !== 'active') {
      return next(new AppError('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.', 403));
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
