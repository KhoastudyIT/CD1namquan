import ExcelJS from 'exceljs';

// Bảng màu lấy theo bộ nhận diện của website để file xuất ra nhìn cùng một nhà.
const GREEN = 'FF15803D';
const MINT = 'FFE4F4E6';
const INK = 'FF1D2722';
const MUTED = 'FF6D7B73';

const VND_FMT = '#,##0" đ"';
const INT_FMT = '#,##0';

const ORDER_STATUS_LABEL = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  processing: 'Đang chuẩn bị',
  shipped: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

const RETURN_TYPE_LABEL = { return: 'Trả hàng', exchange: 'Đổi hàng' };

const RETURN_STATUS_LABEL = {
  pending: 'Chờ duyệt', approved: 'Đã duyệt',
  rejected: 'Từ chối', completed: 'Hoàn tất',
};

const CONSULT_STATUS_LABEL = {
  new: 'Chưa xử lý', contacted: 'Đã liên hệ', quoted: 'Đã báo giá',
  closed: 'Đã chốt', cancelled: 'Đã huỷ',
};

const PAYMENT_STATUS_LABEL = {
  unpaid: 'Chưa thanh toán',
  paid: 'Đã thanh toán',
  refunded: 'Đã hoàn tiền',
  failed: 'Thất bại',
};

const dmy = (d) => new Date(d).toLocaleDateString('vi-VN');

/** Hàng tiêu đề cột: nền xanh nhạt, chữ đậm, khoá dòng để cuộn vẫn thấy. */
function styleHeader(sheet, rowNumber = 1) {
  const row = sheet.getRow(rowNumber);
  row.font = { bold: true, color: { argb: INK }, size: 11 };
  row.alignment = { vertical: 'middle' };
  row.height = 22;
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: MINT } };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFDFE7E1' } } };
  });
  sheet.views = [{ state: 'frozen', ySplit: rowNumber }];
}

/**
 * Dựng workbook thống kê nhiều sheet từ dữ liệu đã truy vấn sẵn.
 *
 * Nhận dữ liệu thuần thay vì tự gọi DB — nhờ đó tầng service giữ toàn bộ phần
 * truy vấn, còn file này chỉ lo trình bày.
 *
 * @param {object} data   Kết quả từ statsService.getReportData()
 * @param {object} meta   { from, to, companyName, exportedBy }
 * @returns {ExcelJS.Workbook}
 */
export function buildStatsWorkbook(data, meta = {}) {
  const wb = new ExcelJS.Workbook();
  wb.creator = meta.companyName || 'NAM QUAN';
  wb.created = new Date();

  const range = `${dmy(meta.from)} – ${dmy(meta.to)}`;

  // ── Sheet 1: Tổng quan ────────────────────────────────────────────────────
  const s1 = wb.addWorksheet('Tổng quan', { properties: { tabColor: { argb: GREEN } } });
  s1.columns = [
    { key: 'label', width: 34 },
    { key: 'value', width: 22 },
  ];

  s1.mergeCells('A1:B1');
  const title = s1.getCell('A1');
  title.value = `BÁO CÁO THỐNG KÊ — ${meta.companyName || 'NAM QUAN'}`;
  title.font = { bold: true, size: 15, color: { argb: GREEN } };
  title.alignment = { vertical: 'middle' };
  s1.getRow(1).height = 28;

  s1.mergeCells('A2:B2');
  s1.getCell('A2').value = `Kỳ báo cáo: ${range}`;
  s1.getCell('A2').font = { color: { argb: MUTED }, size: 10 };

  s1.mergeCells('A3:B3');
  s1.getCell('A3').value = `Xuất lúc ${new Date().toLocaleString('vi-VN')}`
    + (meta.exportedBy ? ` bởi ${meta.exportedBy}` : '');
  s1.getCell('A3').font = { color: { argb: MUTED }, size: 10 };

  const rows = [
    ['Chỉ tiêu', 'Giá trị'],
    ['Doanh thu trong kỳ', data.summary.revenue],
    ['Số đơn trong kỳ', data.summary.orders],
    ['Giá trị đơn trung bình', data.summary.avgOrderValue],
    ['Số sản phẩm đã bán', data.summary.itemsSold],
    ['Đơn bị hủy', data.summary.cancelledOrders],
    ['Khách hàng mới trong kỳ', data.summary.newCustomers],
    [],
    ['Tổng số sản phẩm đang bán', data.summary.totalProducts],
    ['Sản phẩm sắp hết hàng (< 10)', data.summary.lowStockCount],
    ['Tổng số khách hàng', data.summary.totalCustomers],
  ];
  rows.forEach((r) => s1.addRow(r));

  styleHeader(s1, 5);
  // Định dạng tiền cho ba dòng số tiền, còn lại là số nguyên.
  ['B6', 'B8'].forEach((a) => { s1.getCell(a).numFmt = VND_FMT; });
  ['B7', 'B9', 'B10', 'B11', 'B13', 'B14', 'B15'].forEach((a) => { s1.getCell(a).numFmt = INT_FMT; });
  s1.getColumn('value').alignment = { horizontal: 'right' };

  // ── Sheet 2: Doanh thu theo ngày ──────────────────────────────────────────
  const s2 = wb.addWorksheet('Doanh thu theo ngày');
  s2.columns = [
    { header: 'Ngày', key: 'date', width: 14 },
    { header: 'Số đơn', key: 'orders', width: 12, style: { numFmt: INT_FMT } },
    { header: 'Doanh thu', key: 'revenue', width: 18, style: { numFmt: VND_FMT } },
  ];
  data.revenueByDay.forEach((r) => s2.addRow({ date: dmy(r.date), orders: r.orders, revenue: r.revenue }));
  styleHeader(s2);
  if (data.revenueByDay.length) {
    // Phải chốt số dòng dữ liệu TRƯỚC khi ghi dòng tổng: ghi vào ô của dòng mới
    // làm rowCount tăng ngay, nếu đọc lại sau đó thì công thức SUM sẽ trùm lên
    // chính dòng tổng và Excel báo lỗi tham chiếu vòng.
    const lastData = s2.rowCount;
    const totalRow = lastData + 1;
    s2.getCell(`A${totalRow}`).value = 'Tổng cộng';
    s2.getCell(`B${totalRow}`).value = { formula: `SUM(B2:B${lastData})` };
    s2.getCell(`C${totalRow}`).value = { formula: `SUM(C2:C${lastData})` };
    s2.getRow(totalRow).font = { bold: true };
    s2.getCell(`B${totalRow}`).numFmt = INT_FMT;
    s2.getCell(`C${totalRow}`).numFmt = VND_FMT;
  }

  // ── Sheet 3: Sản phẩm bán chạy ────────────────────────────────────────────
  const s3 = wb.addWorksheet('Sản phẩm bán chạy');
  s3.columns = [
    { header: '#', key: 'idx', width: 6 },
    { header: 'Sản phẩm', key: 'name', width: 42 },
    { header: 'Danh mục', key: 'category', width: 20 },
    { header: 'Đã bán trong kỳ', key: 'sold', width: 16, style: { numFmt: INT_FMT } },
    { header: 'Doanh thu', key: 'revenue', width: 18, style: { numFmt: VND_FMT } },
    { header: 'Tồn kho', key: 'stock', width: 12, style: { numFmt: INT_FMT } },
  ];
  data.topProducts.forEach((p, i) => s3.addRow({ idx: i + 1, ...p }));
  styleHeader(s3);

  // ── Sheet 4: Đơn hàng trong kỳ ────────────────────────────────────────────
  const s4 = wb.addWorksheet('Đơn hàng');
  s4.columns = [
    { header: 'Mã đơn', key: 'code', width: 12 },
    { header: 'Ngày đặt', key: 'createdAt', width: 18 },
    { header: 'Khách hàng', key: 'customerName', width: 26 },
    { header: 'Điện thoại', key: 'customerPhone', width: 15 },
    { header: 'Số SP', key: 'itemCount', width: 9, style: { numFmt: INT_FMT } },
    { header: 'Thành tiền', key: 'total', width: 16, style: { numFmt: VND_FMT } },
    { header: 'Trạng thái', key: 'status', width: 16 },
    { header: 'Thanh toán', key: 'paymentStatus', width: 18 },
  ];
  data.orders.forEach((o) => s4.addRow({
    code: String(o.id).split('-')[0].toUpperCase(),
    createdAt: new Date(o.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }),
    customerName: o.customerName || 'Khách mua lẻ',
    customerPhone: o.customerPhone || '',
    itemCount: o.itemCount,
    total: o.total,
    status: ORDER_STATUS_LABEL[o.status] ?? o.status,
    paymentStatus: PAYMENT_STATUS_LABEL[o.paymentStatus] ?? o.paymentStatus,
  }));
  styleHeader(s4);
  s4.autoFilter = { from: 'A1', to: `H${Math.max(1, s4.rowCount)}` };

  // ── Sheet 5: Đơn theo trạng thái ──────────────────────────────────────────
  const s5 = wb.addWorksheet('Đơn theo trạng thái');
  s5.columns = [
    { header: 'Trạng thái', key: 'status', width: 22 },
    { header: 'Số đơn', key: 'count', width: 12, style: { numFmt: INT_FMT } },
  ];
  data.ordersByStatus.forEach((r) => s5.addRow({
    status: ORDER_STATUS_LABEL[r.status] ?? r.status,
    count: r.count,
  }));
  styleHeader(s5);

  // ── Sheet: Doanh thu theo danh mục ────────────────────────────────────────
  const sCat = wb.addWorksheet('Doanh thu theo danh mục');
  sCat.columns = [
    { header: 'Danh mục', key: 'category', width: 26 },
    { header: 'Số lượng bán', key: 'sold', width: 15, style: { numFmt: INT_FMT } },
    { header: 'Doanh thu', key: 'revenue', width: 18, style: { numFmt: VND_FMT } },
    { header: 'Tỷ trọng', key: 'share', width: 12, style: { numFmt: '0.0"%"' } },
  ];
  const catTotal = (data.revenueByCategory ?? []).reduce((s, r) => s + r.revenue, 0);
  (data.revenueByCategory ?? []).forEach(r => sCat.addRow({
    ...r, share: catTotal > 0 ? (r.revenue / catTotal) * 100 : 0,
  }));
  styleHeader(sCat);

  // ── Sheet: Khách hàng mua nhiều nhất ──────────────────────────────────────
  const sCus = wb.addWorksheet('Khách hàng');
  sCus.columns = [
    { header: '#', key: 'idx', width: 6 },
    { header: 'Khách hàng', key: 'name', width: 28 },
    { header: 'Điện thoại', key: 'phone', width: 15 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Số đơn', key: 'orders', width: 10, style: { numFmt: INT_FMT } },
    { header: 'Tổng chi tiêu', key: 'spent', width: 18, style: { numFmt: VND_FMT } },
  ];
  (data.topCustomers ?? []).forEach((c, i) => sCus.addRow({ idx: i + 1, ...c }));
  styleHeader(sCus);

  // ── Sheet: Yêu cầu trả / đổi hàng ─────────────────────────────────────────
  const sRet = wb.addWorksheet('Trả đổi hàng');
  sRet.columns = [
    { header: 'Ngày gửi', key: 'createdAt', width: 18 },
    { header: 'Khách hàng', key: 'customerName', width: 26 },
    { header: 'Loại', key: 'type', width: 12 },
    { header: 'Lý do', key: 'reason', width: 42 },
    { header: 'Trạng thái', key: 'status', width: 14 },
    { header: 'Phản hồi cửa hàng', key: 'adminNote', width: 38 },
    { header: 'Giá trị đơn', key: 'orderTotal', width: 16, style: { numFmt: VND_FMT } },
  ];
  (data.returns ?? []).forEach(r => sRet.addRow({
    ...r,
    createdAt: new Date(r.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }),
    type: RETURN_TYPE_LABEL[r.type] ?? r.type,
    status: RETURN_STATUS_LABEL[r.status] ?? r.status,
  }));
  styleHeader(sRet);

  // ── Sheet: Yêu cầu tư vấn ─────────────────────────────────────────────────
  const sCon = wb.addWorksheet('Yêu cầu tư vấn');
  sCon.columns = [
    { header: 'Ngày gửi', key: 'createdAt', width: 18 },
    { header: 'Khách hàng', key: 'name', width: 24 },
    { header: 'Điện thoại', key: 'phone', width: 15 },
    { header: 'Email', key: 'email', width: 26 },
    { header: 'Dịch vụ', key: 'serviceType', width: 22 },
    { header: 'Loại công trình', key: 'propertyType', width: 20 },
    { header: 'Diện tích', key: 'area', width: 14 },
    { header: 'Ngân sách', key: 'budget', width: 18 },
    { header: 'Trạng thái', key: 'status', width: 14 },
  ];
  (data.consultations ?? []).forEach(c => sCon.addRow({
    ...c,
    createdAt: new Date(c.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }),
    status: CONSULT_STATUS_LABEL[c.status] ?? c.status,
  }));
  styleHeader(sCon);

  // ── Sheet 6: Sản phẩm sắp hết hàng ────────────────────────────────────────
  const s6 = wb.addWorksheet('Sắp hết hàng');
  s6.columns = [
    { header: 'Sản phẩm', key: 'name', width: 42 },
    { header: 'Mã SKU', key: 'sku', width: 16 },
    { header: 'Danh mục', key: 'category', width: 20 },
    { header: 'Tồn kho', key: 'stock', width: 12, style: { numFmt: INT_FMT } },
    { header: 'Đã bán', key: 'sold', width: 12, style: { numFmt: INT_FMT } },
  ];
  data.lowStock.forEach((p) => s6.addRow(p));
  styleHeader(s6);
  // Tô đỏ ô tồn kho để người đọc thấy ngay mặt hàng cần nhập thêm.
  for (let i = 2; i <= s6.rowCount; i++) {
    s6.getCell(`D${i}`).font = { bold: true, color: { argb: 'FFB91C1C' } };
  }

  return wb;
}
