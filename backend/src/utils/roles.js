// =============================================================
// Vai trò người dùng
//
//   customer — khách mua hàng, không vào được khu quản trị.
//   staff    — nhân viên: CHỈ XEM sản phẩm, danh mục, bộ sưu tập, tin tức,
//              flash sale, người dùng và thống kê; được QUẢN LÝ đơn hàng,
//              yêu cầu tư vấn và chat với khách.
//   admin    — toàn quyền, gồm cả tạo/khoá tài khoản nhân viên.
//
// Quyền chỉ-xem của staff do middleware `readOnly('staff')` giữ (chặn mọi
// method khác GET), nên router chỉ cần liệt kê vai trò được phép vào.
//
// Bảng users còn cho phép 'manager' và 'super_admin' ở ràng buộc CHECK nhưng
// hệ thống chưa dùng tới — không đưa vào đây để tránh cấp quyền nhầm.
// =============================================================

/** Các vai trò làm việc trong khu quản trị (/admin). */
export const BACKOFFICE_ROLES = ['admin', 'staff'];

export function isBackoffice(role) {
  return BACKOFFICE_ROLES.includes(role);
}
