export const HOTLINE = "0976237648";
export const HOTLINE_DISPLAY = "0976 237 648";

/**
 * Backend gắn link này cho thông báo phản hồi chat. Frontend nhận ra nó để mở
 * thẳng khung chat tại chỗ thay vì điều hướng — khách đang xem sản phẩm mà bị
 * đá về trang chủ chỉ để đọc một tin nhắn là rất khó chịu.
 */
export const CHAT_LINK = "/?chat=1";
export const isChatLink = (link) => !!link && link.split("#")[0] === CHAT_LINK;

export const ICON_BY_TYPE = {
  welcome: "user",
  order: "cart",
  order_status: "truck",
  promo: "star",
};

export function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
}
