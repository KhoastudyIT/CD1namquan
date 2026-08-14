// Nhãn tiếng Việt cho trạng thái đơn hàng.
//
// Danh sách phải khớp ràng buộc CHECK của cột orders.status trong
// backend/database/nam_quan_database.sql:
//   pending · confirmed · processing · shipped · delivered · cancelled
// Thiếu một giá trị là giao diện lòi mã tiếng Anh ra cho khách xem.
export const ORDER_STATUS_LABEL = {
  pending:    "Chờ xác nhận",
  confirmed:  "Đã xác nhận",
  processing: "Đang chuẩn bị",
  shipped:    "Đang giao",
  delivered:  "Đã giao",
  cancelled:  "Đã hủy",
};

// Trạng thái vận chuyển — chỉ 'returned' cần hiện cho khách, các giá trị còn
// lại đã phản ánh trong orders.status nên hiện thêm chỉ gây rối.
export const SHIPPING_STATUS_LABEL = {
  returned: "Đã trả hàng",
};

/**
 * Nhãn cuối cùng hiển thị cho một đơn. Đơn đã trả hàng thì ưu tiên hiện việc đó,
 * vì orders.status vẫn là 'delivered' — CHECK của bảng không có giá trị
 * 'returned' nên việc trả hàng được ghi ở shipping_status.
 */
export function orderStatusLabel(order) {
  if (order?.shippingStatus === "returned") return SHIPPING_STATUS_LABEL.returned;
  return ORDER_STATUS_LABEL[order?.status] ?? order?.status ?? "—";
}

/** Hậu tố class CSS (.acc-status-*) tương ứng với nhãn ở trên. */
export function orderStatusClass(order) {
  if (order?.shippingStatus === "returned") return "returned";
  return order?.status ?? "pending";
}
