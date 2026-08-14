import * as statsService from './stats.service.js';
import * as settingsService from '../settings/settings.service.js';
import { buildStatsWorkbook } from '../../services/excel/stats-report.js';
import { DEFAULT_REPORT_DAYS, DEFAULT_OVERVIEW_DAYS } from './stats.schema.js';
import { ok } from '../../utils/response.js';

/** Quy đổi from/to (YYYY-MM-DD) thành khoảng nửa mở [start, end). */
function parseRange(query, defaultDays) {
  const today = new Date();
  const toStr = query.to ?? today.toISOString().slice(0, 10);
  const fromStr = query.from
    ?? new Date(today.getTime() - (defaultDays - 1) * 86_400_000).toISOString().slice(0, 10);

  const start = new Date(`${fromStr}T00:00:00`);
  // Cộng thêm một ngày: khách chọn "đến 14/08" là muốn tính cả đơn trong ngày 14/08.
  const end = new Date(`${toStr}T00:00:00`);
  end.setDate(end.getDate() + 1);
  return { start, end, fromStr, toStr };
}

export async function overview(req, res, next) {
  try {
    const { start, end } = parseRange(req.query, DEFAULT_OVERVIEW_DAYS);
    ok(res, await statsService.getOverview({ from: start, to: end }));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /stats/export — tải báo cáo thống kê dạng Excel.
 *
 * Không truyền from/to thì lấy 30 ngày gần nhất. Ngày kết thúc được cộng thêm
 * một ngày trước khi truy vấn: khách chọn "đến 14/08" là muốn tính cả các đơn
 * đặt trong ngày 14/08, không phải dừng lúc 00:00 ngày đó.
 */
export async function exportExcel(req, res, next) {
  try {
    const { start: from, end: toExclusive, fromStr, toStr } = parseRange(req.query, DEFAULT_REPORT_DAYS);
    const data = await statsService.getReportData({ from, to: toExclusive });

    let company = {};
    try { company = await settingsService.getCompanyInfo(); } catch { /* dùng mặc định */ }

    const workbook = buildStatsWorkbook(data, {
      from,
      to: new Date(`${toStr}T00:00:00`),
      companyName: company.companyName,
      exportedBy: req.user?.name,
    });

    const fileName = `thong-ke-${fromStr}-den-${toStr}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
}
