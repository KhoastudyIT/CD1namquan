/**
 * Từ điển dùng chung cho bộ lọc trang cửa hàng.
 *
 * Ba cột `color`, `material`, `dimensions` trong product_specs là mô tả tự do do
 * người nhập liệu gõ ("Nâu gỗ", "Khung gỗ tự nhiên, vải linen cao cấp",
 * "2200 x 900 x 850 mm"), nên không thể lấy DISTINCT ra làm nút lọc — mỗi sản
 * phẩm sẽ đẻ ra một nút riêng. Ở đây định nghĩa sẵn các nhóm có nhãn sạch, còn
 * việc nhóm nào ĐƯỢC HIỆN thì do dữ liệu quyết định: endpoint /products/filters
 * đếm số sản phẩm khớp và loại bỏ nhóm rỗng.
 *
 * Ngược lại, `style` và `brands` là giá trị đơn sạch sẽ nên lấy thẳng DISTINCT.
 *
 * Từ khoá viết KHÔNG DẤU vì cả hai vế đều được bỏ dấu trước khi so khớp.
 */

/** Bảng màu: `hex` dùng cho chấm màu ngoài thẻ sản phẩm và ô chọn trong bộ lọc. */
export const COLORS = [
  { key: 'trang',     label: 'Trắng',     hex: '#f5f5f0', border: '#dddddd', keywords: ['trang'] },
  { key: 'be',        label: 'Be / Kem',  hex: '#e8d9b5', border: '#c9b88a', keywords: ['be', 'kem', 'beige'] },
  { key: 'nau',       label: 'Nâu gỗ',    hex: '#8b5e3c', border: '#6b4020', keywords: ['nau'] },
  { key: 'den',       label: 'Đen',       hex: '#1a1a1a', border: '#555555', keywords: ['den'] },
  { key: 'xanh-la',   label: 'Xanh lá',   hex: '#2d7a4f', border: '#1f5a38', keywords: ['xanh la', 'xanh luc', 'xanh reu', 'emerald', 'green'] },
  { key: 'xanh-lam',  label: 'Xanh lam',  hex: '#3a6b9f', border: '#2a5080', keywords: ['xanh lam', 'xanh duong', 'xanh bien', 'azure', 'navy', 'blue'] },
  { key: 'vang',      label: 'Vàng đồng', hex: '#c9a843', border: '#9a7c28', keywords: ['vang', 'dong', 'gold'] },
  { key: 'hong',      label: 'Hồng',      hex: '#e8a0a8', border: '#c47880', keywords: ['hong', 'rose', 'pink'] },
  { key: 'xam',       label: 'Xám',       hex: '#9da8b0', border: '#6e7c87', keywords: ['xam', 'ghi', 'grey', 'gray'] },
];

/**
 * Chất liệu. Dữ liệu ghi cả cụm ("Da bò thật", "Mây tự nhiên đan thủ công") nên
 * từ khoá phải là phần lõi chứ không phải cả cụm, nếu không sẽ không khớp gì.
 */
export const MATERIALS = [
  { key: 'go-tu-nhien', label: 'Gỗ tự nhiên',    keywords: ['go tu nhien', 'go soi', 'go oc cho', 'go xoan'] },
  { key: 'go-cong-nghiep', label: 'Gỗ công nghiệp', keywords: ['mdf', 'hdf', 'go cong nghiep', 'melamine'] },
  { key: 'da',          label: 'Da',             keywords: ['da bo', 'da that', 'da pu', 'da microfiber'] },
  // Không dùng từ khoá trần 'bo' hay 'ni': "da bo that" sẽ bị xếp nhầm sang vải.
  { key: 'vai',         label: 'Vải',            keywords: ['vai', 'linen', 'nhung'] },
  { key: 'may-tre',     label: 'Mây tre',        keywords: ['may tu nhien', 'may dan', 'song may', 'tre dan'] },
  { key: 'kim-loai',    label: 'Kim loại',       keywords: ['kim loai', 'sat', 'thep', 'inox', 'nhom', 'dong thau'] },
  { key: 'da-kinh',     label: 'Đá / Kính',      keywords: ['marble', 'da tu nhien', 'kinh', 'gom', 'ceramic'] },
];

/**
 * Nhóm kích thước, phân theo cạnh dài nhất đọc được trong chuỗi `dimensions`
 * (đơn vị mm). Cột này chỉ chứa số đo thô nên không có cách nào khác để lọc.
 */
export const SIZE_BUCKETS = [
  { key: 'nho', label: 'Nhỏ (dưới 1m)',  min: 0,    max: 999 },
  { key: 'vua', label: 'Vừa (1 – 2m)',   min: 1000, max: 1999 },
  { key: 'lon', label: 'Lớn (trên 2m)',  min: 2000, max: null },
];

/**
 * Cạnh dài nhất trong chuỗi số đo, tính bằng SQL.
 * Trả NULL khi cột rỗng hoặc không chứa chữ số nào.
 */
export const maxDimensionSQL = (col) => `(
  SELECT MAX(t::int)
  FROM unnest(regexp_split_to_array(regexp_replace(${col}, '[^0-9]+', ' ', 'g'), ' +')) AS t
  WHERE t <> ''
)`;

export const COLOR_BY_KEY = new Map(COLORS.map(c => [c.key, c]));
export const MATERIAL_BY_KEY = new Map(MATERIALS.map(m => [m.key, m]));
export const SIZE_BY_KEY = new Map(SIZE_BUCKETS.map(s => [s.key, s]));
