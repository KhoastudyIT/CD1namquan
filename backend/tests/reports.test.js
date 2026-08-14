// Kiểm thử hoá đơn PDF và báo cáo Excel — chạy: npm run test:reports
const BASE = process.env.API_BASE_URL ?? 'http://localhost:3000/api/v1';
let pass = 0, fail = 0;

async function req(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { }
  return { status: res.status, json };
}

/** Tải tệp nhị phân và trả kèm vài byte đầu để nhận dạng định dạng. */
async function reqFile(path, token) {
  const res = await fetch(`${BASE}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) return { status: res.status, size: 0, magic: '', type: '', disposition: '' };
  const buf = Buffer.from(await res.arrayBuffer());
  return {
    status: res.status,
    size: buf.length,
    magic: buf.subarray(0, 4).toString('binary'),
    type: res.headers.get('content-type') ?? '',
    disposition: res.headers.get('content-disposition') ?? '',
  };
}

function check(name, actual, expected) {
  if (actual === expected) { pass++; console.log(`  \x1b[32mPASS\x1b[0m ${name} → ${actual}`); }
  else { fail++; console.log(`  \x1b[31mFAIL\x1b[0m ${name} → nhận ${actual}, mong đợi ${expected}`); }
}

function checkTrue(name, cond, info = '') {
  if (cond) { pass++; console.log(`  \x1b[32mPASS\x1b[0m ${name}${info ? ' → ' + info : ''}`); }
  else { fail++; console.log(`  \x1b[31mFAIL\x1b[0m ${name}${info ? ' → ' + info : ''}`); }
}

const login = async (email, password) =>
  (await req('/auth/login', { method: 'POST', body: { email, password } })).json?.data?.token;

const run = async () => {
  const adminToken = await login('admin@namquan.vn', 'admin123');
  const custToken = await login('customer@namquan.vn', 'admin123');
  check('đăng nhập admin', adminToken ? 200 : 0, 200);
  check('đăng nhập khách', custToken ? 200 : 0, 200);

  const staffEmail = 'reports-test-staff@namquan.vn';
  await req('/users', {
    method: 'POST', token: adminToken,
    body: { name: 'Nhân viên Kiểm thử Báo cáo', email: staffEmail, password: 'staff123', role: 'staff' },
  });
  const staffToken = await login(staffEmail, 'staff123');
  check('đăng nhập nhân viên', staffToken ? 200 : 0, 200);

  console.log('\n=== 1. Hoá đơn PDF ===');
  const myOrders = (await req('/orders', { token: custToken })).json?.data ?? [];
  checkTrue('khách có ít nhất một đơn để in', myOrders.length > 0, `${myOrders.length} đơn`);
  const myOrderId = myOrders[0]?.id;

  const pdf = await reqFile(`/orders/${myOrderId}/invoice`, custToken);
  check('khách tải hoá đơn đơn của mình', pdf.status, 200);
  check('  đúng định dạng PDF', pdf.magic, '%PDF');
  check('  đúng content-type', pdf.type, 'application/pdf');
  checkTrue('  tệp có nội dung', pdf.size > 5000, `${pdf.size} bytes`);
  checkTrue('  đặt tên tệp theo mã đơn',
    pdf.disposition.includes(String(myOrderId).split('-')[0].toUpperCase()), pdf.disposition);

  console.log('\n=== 2. Phân quyền hoá đơn ===');
  check('admin in được đơn của khách', (await reqFile(`/orders/${myOrderId}/invoice`, adminToken)).status, 200);
  check('nhân viên in được đơn của khách', (await reqFile(`/orders/${myOrderId}/invoice`, staffToken)).status, 200);
  check('chưa đăng nhập → 401', (await reqFile(`/orders/${myOrderId}/invoice`)).status, 401);

  // Đơn của người khác: lấy một đơn không thuộc về khách demo.
  const allOrders = (await req('/orders/admin/list', { token: adminToken })).json?.data ?? [];
  const myIds = new Set(myOrders.map(o => o.id));
  const otherId = allOrders.find(o => !myIds.has(o.id))?.id;
  if (otherId) {
    check('khách in đơn người khác → 403', (await reqFile(`/orders/${otherId}/invoice`, custToken)).status, 403);
  } else {
    console.log('  \x1b[33mSKIP\x1b[0m không có đơn của người khác để thử');
  }
  check('đơn không tồn tại → 404',
    (await reqFile('/orders/00000000-0000-0000-0000-000000000000/invoice', adminToken)).status, 404);

  console.log('\n=== 3. Báo cáo Excel ===');
  const xlsx = await reqFile('/stats/export?from=2026-01-01&to=2026-12-31', adminToken);
  check('admin tải báo cáo', xlsx.status, 200);
  // Tệp .xlsx là một kho ZIP nên bắt đầu bằng chữ ký PK\x03\x04.
  check('  đúng định dạng XLSX (ZIP)', xlsx.magic.slice(0, 2), 'PK');
  checkTrue('  đúng content-type', xlsx.type.includes('spreadsheetml.sheet'), xlsx.type);
  checkTrue('  tệp có nội dung', xlsx.size > 5000, `${xlsx.size} bytes`);
  checkTrue('  tên tệp kèm khoảng ngày',
    xlsx.disposition.includes('2026-01-01') && xlsx.disposition.includes('2026-12-31'), xlsx.disposition);

  check('nhân viên tải được báo cáo', (await reqFile('/stats/export', staffToken)).status, 200);
  check('khách hàng → 403', (await reqFile('/stats/export', custToken)).status, 403);
  check('chưa đăng nhập → 401', (await reqFile('/stats/export')).status, 401);

  console.log('\n=== 4. Kiểm tra tham số khoảng ngày ===');
  check('không truyền from/to (mặc định 30 ngày)', (await reqFile('/stats/export', adminToken)).status, 200);
  check('from sai định dạng → 422', (await reqFile('/stats/export?from=abc', adminToken)).status, 422);
  check('from muộn hơn to → 422',
    (await reqFile('/stats/export?from=2026-08-14&to=2026-07-01', adminToken)).status, 422);
  check('khoảng ngày không có dữ liệu vẫn ra tệp',
    (await reqFile('/stats/export?from=2000-01-01&to=2000-01-02', adminToken)).status, 200);

  console.log(`\n${'='.repeat(52)}`);
  console.log(fail === 0 ? `\x1b[32m✓ TẤT CẢ ${pass} KIỂM THỬ ĐỀU ĐẠT\x1b[0m` : `\x1b[31m✗ ${fail} thất bại / ${pass} đạt\x1b[0m`);
  console.log('='.repeat(52));
  process.exit(fail === 0 ? 0 : 1);
};

run().catch(e => { console.error('LỖI:', e.message); process.exit(1); });
