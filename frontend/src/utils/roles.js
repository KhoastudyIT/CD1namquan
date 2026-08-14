// Bản sao rút gọn của backend/src/utils/roles.js — giữ hai phía nói cùng ngôn
// ngữ về quyền. Đây chỉ là lớp che giao diện cho gọn; chốt chặn thật nằm ở
// middleware authorize/readOnly phía server.
//
//   customer — khách mua hàng, không vào khu quản trị.
//   staff    — nhân viên: CHỈ XEM sản phẩm, danh mục, bộ sưu tập, tin tức,
//              flash sale, người dùng, thống kê; QUẢN LÝ đơn hàng, tư vấn, chat.
//   admin    — toàn quyền, gồm tạo và khoá tài khoản nhân viên.

export const BACKOFFICE_ROLES = ['admin', 'staff'];

/** Có được vào /admin hay không. */
export const isBackoffice = (role) => BACKOFFICE_ROLES.includes(role);

export const isAdmin = (role) => role === 'admin';
export const isStaff = (role) => role === 'staff';

/** Nhãn hiển thị cho từng vai trò. */
export const ROLE_LABEL = {
  customer: 'Khách hàng',
  staff: 'Nhân viên',
  admin: 'Quản trị viên',
};

/** Các tab trong dashboard mà nhân viên KHÔNG được mở. */
export const STAFF_HIDDEN_TABS = ['staff', 'settings'];

/** Các tab nhân viên chỉ được xem, không được thêm/sửa/xoá. */
export const STAFF_READONLY_TABS = ['products', 'categories', 'collections', 'news', 'flash_sales', 'users'];
