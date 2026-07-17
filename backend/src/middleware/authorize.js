import { AppError } from './errorHandler.js';

/**
 * Role-based authorization. Must run after `authenticate` (which sets req.user).
 * Usage: router.post('/', authenticate, authorize('admin'), handler)
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
