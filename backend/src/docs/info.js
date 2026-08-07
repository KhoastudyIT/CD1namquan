// Sinh tu openapi.js goc — chi la lop tai lieu, khong co business logic.

export const meta = {
info: {
  title: 'NAM QUAN — Furniture Store API',
  version: '1.0.0',
  description: `## API cho ứng dụng thương mại điện tử nội thất **NAM QUAN**

### Tính năng
- Xác thực người dùng với JWT Bearer Token
- Quản lý sản phẩm, danh mục & bộ sưu tập
- Flash sale theo thời gian thực
- Giỏ hàng & đặt hàng
- Tin tức & blog
- Chat tư vấn với bot tự động và nhân viên

### Xác thực
Các endpoint có **khóa** yêu cầu header:
\`\`\`
Authorization: Bearer <token>
\`\`\`
Token nhận được từ \`POST /api/v1/auth/login\` hoặc \`POST /api/v1/auth/register\`.`,
  contact: { name: 'NAM QUAN Support', email: 'support@namquan.vn' },
},
servers: [
  { url: 'http://localhost:3000', description: 'Development' },
],
// Gom theo MÀN HÌNH trong app chứ không theo bảng dữ liệu: mở đúng mục là thấy
// đủ API của trang đó, khỏi phải nhặt từ nhiều nơi khi test. Thứ tự ở đây cũng
// là thứ tự hiển thị trên sidebar Scalar — đi từ công khai → tài khoản → admin.
tags: [
  // ── Khách chưa đăng nhập ───────────────────────────────────────────────
  { name: 'Cửa hàng — Sản phẩm',            description: 'Trang chủ & Cửa hàng — danh sách, chi tiết, flash sale đang chạy. Không cần đăng nhập.' },
  { name: 'Cửa hàng — Tin tức',             description: 'Trang Tin tức — danh sách, chi tiết theo id hoặc slug, bài liên quan. Không cần đăng nhập.' },
  { name: 'Cửa hàng — Danh mục & Bộ sưu tập', description: 'Dữ liệu cho bộ lọc danh mục ở trang chủ và trang Cửa hàng. Không cần đăng nhập.' },

  // ── Khu vực tài khoản (/account) ───────────────────────────────────────
  { name: 'Xác thực',                       description: 'Đăng ký · Đăng nhập · Đăng xuất — lấy Bearer token dùng cho mọi mục bên dưới' },
  { name: 'Tài khoản — Hồ sơ',              description: 'Trang Hồ sơ & Cài đặt — xem thông tin, đổi tên/SĐT, đổi mật khẩu' },
  { name: 'Tài khoản — Giỏ hàng',           description: 'Trang Giỏ hàng — thêm, sửa số lượng, xoá từng món hoặc xoá sạch' },
  { name: 'Tài khoản — Đơn hàng',           description: 'Trang Đơn hàng — đặt hàng, xem lịch sử và chi tiết từng đơn' },
  { name: 'Tài khoản — Thông báo',          description: 'Chuông thông báo và trang Thông báo — đọc từng cái hoặc đánh dấu đã đọc tất cả' },
  { name: 'Tài khoản — Tin nhắn',           description: 'Trang Tin nhắn và khung chat nổi — khách nhắn, bot trả lời tự động theo dữ liệu sản phẩm thật' },

  // ── Admin dashboard ────────────────────────────────────────────────────
  { name: 'Admin — Tổng quan',              description: 'Thẻ số liệu trên trang tổng quan của dashboard quản trị' },
  { name: 'Admin — Sản phẩm',               description: 'Tab Sản phẩm — thêm, sửa, xoá' },
  { name: 'Admin — Flash sale',             description: 'Tab Flash sale — lên lịch và quản lý chương trình giảm giá' },
  { name: 'Admin — Danh mục & Bộ sưu tập',  description: 'Tab Danh mục và Bộ sưu tập — thêm, sửa, xoá' },
  { name: 'Admin — Tin tức',                description: 'Tab Tin tức — soạn bài, xem cả bản nháp, đổi trạng thái nháp/đăng/ẩn, SEO' },
  { name: 'Admin — Đơn hàng',               description: 'Tab Đơn hàng — xem toàn bộ đơn và cập nhật trạng thái' },
  { name: 'Admin — Người dùng',             description: 'Tab Người dùng — danh sách, phân quyền, khoá/mở tài khoản' },
  { name: 'Admin — Tin nhắn',               description: 'Tab Tin nhắn — xem hội thoại, nhân viên tiếp quản trả lời thay bot' },
  { name: 'Admin — Tải ảnh',                description: 'Dùng chung cho mọi form có ảnh — xin URL có chữ ký rồi PUT thẳng lên MinIO' },
],
};
