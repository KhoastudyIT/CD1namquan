/**
 * Giá hiệu lực của một sản phẩm — nguồn sự thật duy nhất cho toàn hệ thống.
 *
 * Thứ tự ưu tiên:
 *   1. flash sale đang chạy  (rẻ nhất trong các chương trình còn hiệu lực)
 *   2. sale_price            (chỉ khi thực sự thấp hơn giá niêm yết)
 *   3. price                 (giá niêm yết)
 *
 * Mọi nơi hiển thị giá và mọi nơi tính tiền đều phải đi qua đây, nếu không
 * khách sẽ thấy một giá trên trang chủ và bị tính một giá khác lúc thanh toán.
 */

/**
 * Điều kiện "chương trình flash sale còn hiệu lực".
 *
 * Dùng CHUNG cho mọi nơi: engine tính giá, danh sách flash sale ngoài trang chủ,
 * và lúc chốt đơn. Nếu ba nơi này dùng ba điều kiện khác nhau thì trang chủ sẽ
 * quảng cáo một chương trình mà lúc thanh toán hệ thống không áp dụng.
 *
 * `sold < stock` là phần hay bị bỏ sót: hết suất thì chương trình phải dừng,
 * không thì flash sale biến thành giảm giá vĩnh viễn.
 */
export const activeFlashWhere = (flashAlias = 'fs') => `
  ${flashAlias}.active = TRUE
  AND ${flashAlias}.starts_at <= NOW()
  AND (${flashAlias}.ends_at IS NULL OR ${flashAlias}.ends_at >= NOW())
  AND ${flashAlias}.sold < ${flashAlias}.stock`;

/**
 * LEFT JOIN LATERAL lấy giá flash sale rẻ nhất đang có hiệu lực của sản phẩm.
 * Bí danh bảng sản phẩm mặc định là `p`; đổi qua tham số nếu query dùng tên khác.
 */
export const activeFlashJoin = (productAlias = 'p') => `
  LEFT JOIN LATERAL (
    SELECT fs.id, fs.price, fs.stock - fs.sold AS remaining
    FROM flash_sales fs
    WHERE fs.product_id = ${productAlias}.id
      AND ${activeFlashWhere('fs')}
    ORDER BY fs.price ASC
    LIMIT 1
  ) active_flash ON TRUE`;

/**
 * Biểu thức SQL tính giá hiệu lực. Dùng kèm activeFlashJoin().
 */
export const effectivePriceSQL = (productAlias = 'p') => `
  COALESCE(
    active_flash.price,
    CASE
      WHEN ${productAlias}.sale_price IS NOT NULL
       AND ${productAlias}.sale_price < ${productAlias}.price
      THEN ${productAlias}.sale_price
    END,
    ${productAlias}.price
  )`;

/**
 * Phần trăm giảm giá, luôn tính trên GIÁ NIÊM YẾT HIỆN TẠI (products.price).
 *
 * Không dùng flash_sales.original_price: cột đó là ảnh chụp lúc tạo chương trình,
 * admin sửa giá sản phẩm sau đó là nó lệch ngay — dashboard và trang public sẽ
 * hiện hai con số khác nhau cho cùng một sản phẩm.
 */
export function discountPercent(listPrice, salePrice) {
  const list = Number(listPrice ?? 0);
  const sale = Number(salePrice ?? 0);
  if (!(list > 0) || !(sale > 0) || sale >= list) return 0;
  return Math.round((1 - sale / list) * 100);
}

/**
 * Bản JavaScript của cùng quy tắc, cho các chỗ đã có sẵn dữ liệu trong bộ nhớ.
 * Nhận cả khoá snake_case (từ Postgres) lẫn camelCase (từ body request).
 */
export function effectivePrice(row = {}) {
  const price = Number(row.price ?? 0);
  const flash = row.flash_price ?? row.flashPrice;
  if (flash != null && Number(flash) > 0) return Number(flash);

  const sale = row.sale_price ?? row.salePrice;
  if (sale != null && Number(sale) > 0 && Number(sale) < price) return Number(sale);

  return price;
}
