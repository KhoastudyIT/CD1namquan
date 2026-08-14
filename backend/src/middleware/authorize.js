import { AppError } from './errorHandler.js';

/**
 * Phân quyền theo vai trò. Phải chạy sau `authenticate` (đã gán req.user).
 * Dùng: router.post('/', authenticate, authorize('admin'), handler)
 */
export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    if (roles.length && !roles.includes(req.user.role)) {
      return next(new AppError('Bạn không có quyền thực hiện thao tác này', 403));
    }
    next();
  };
}

/**
 * Hạ các vai trò truyền vào xuống quyền CHỈ ĐỌC: cho GET đi qua, chặn mọi
 * method ghi (POST/PUT/PATCH/DELETE).
 *
 * Đặt ngay sau `authorize` để router chỉ phải khai báo một lần thay vì tách
 * đôi từng tuyến đọc/ghi:
 *   router.use(authenticate, authorize('admin', 'staff'), readOnly('staff'))
 */
export function readOnly(...roles) {
  return (req, _res, next) => {
    if (roles.includes(req.user?.role) && req.method !== 'GET') {
      return next(new AppError('Tài khoản của bạn chỉ được phép xem mục này', 403));
    }
    next();
  };
}
