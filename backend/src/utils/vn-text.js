/**
 * Chuẩn hoá tiếng Việt để so khớp không phân biệt dấu và hoa thường.
 *
 * Dùng cho bộ lọc trang cửa hàng: người dùng chọn mã màu không dấu (`nau`,
 * `den`) trong khi product_specs.color ghi có dấu và mô tả tự do ("Nâu gỗ",
 * "Nâu sáng", "Đen"). So trực tiếp bằng ILIKE sẽ không bao giờ khớp vì
 * ILIKE chỉ bỏ qua hoa/thường chứ không bỏ dấu.
 *
 * Không dùng extension `unaccent` để biểu thức chạy được kể cả trên những
 * database chưa nạp extension đó; đổi lại phải liệt kê bảng ký tự bên dưới.
 */

const VN_ACCENTED =
  'áàảãạăắằẳẵặâấầẩẫậ' +
  'éèẻẽẹêếềểễệ' +
  'íìỉĩị' +
  'óòỏõọôốồổỗộơớờởỡợ' +
  'úùủũụưứừửữự' +
  'ýỳỷỹỵ' +
  'đ';

const VN_PLAIN =
  'aaaaaaaaaaaaaaaaa' +
  'eeeeeeeeeee' +
  'iiiii' +
  'ooooooooooooooooo' +
  'uuuuuuuuuuu' +
  'yyyyy' +
  'd';

// Lệch độ dài là translate() âm thầm xoá ký tự thừa — chặn ngay lúc nạp module.
if (VN_ACCENTED.length !== VN_PLAIN.length) {
  throw new Error(
    `vn-text: bảng ký tự lệch nhau (${VN_ACCENTED.length} vs ${VN_PLAIN.length})`,
  );
}

/**
 * Biểu thức SQL trả về chuỗi đã hạ chữ thường và bỏ dấu của một cột.
 * `col` là tên cột do lập trình viên viết ra, không phải dữ liệu người dùng.
 */
export const unaccentSQL = (col) =>
  `translate(lower(${col}), '${VN_ACCENTED}', '${VN_PLAIN}')`;

/** Bản JavaScript của cùng phép biến đổi, dùng để dựng chuỗi mẫu so khớp. */
export function unaccentVN(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd');
}
