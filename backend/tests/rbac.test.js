// Kiểm thử phân quyền nhân viên (staff) — chạy: npm run test:rbac
// Trỏ sang instance khác khi cần: API_BASE_URL=http://localhost:3999/api/v1 npm run test:rbac
const BASE = process.env.API_BASE_URL ?? 'http://localhost:3000/api/v1';
let pass = 0, fail = 0;

async function req(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json };
}

function check(name, actual, expected) {
  if (actual === expected) { pass++; console.log(`  \x1b[32mPASS\x1b[0m ${name} → ${actual}`); }
  else { fail++; console.log(`  \x1b[31mFAIL\x1b[0m ${name} → nhận ${actual}, mong đợi ${expected}`); }
}

const login = async (email, password) => (await req('/auth/login', { method: 'POST', body: { email, password } })).json?.data?.token;

const run = async () => {
  console.log('\n=== 1. Đăng nhập admin ===');
  const adminToken = await login('admin@namquan.vn', 'admin123');
  check('login admin', adminToken ? 200 : 0, 200);

  console.log('\n=== 2. Admin tạo tài khoản nhân viên ===');
  // Email cố định để chạy lại nhiều lần không sinh thêm tài khoản rác. Lần chạy
  // sau gặp 409 thì lấy lại tài khoản cũ và đưa về trạng thái chuẩn.
  const email = 'rbac-test@namquan.vn';
  const created = await req('/users', { method: 'POST', token: adminToken, body: { name: 'Nhân viên Kiểm thử', email, phone: '0912345678', password: 'staff123', role: 'staff' } });
  let staffId;
  if (created.status === 201) {
    check('POST /users (admin tạo staff)', created.status, 201);
    staffId = created.json?.data?.id;
  } else {
    console.log('  \x1b[33mSKIP\x1b[0m POST /users — tài khoản kiểm thử đã tồn tại, dùng lại');
    const found = await req(`/users?role=staff,admin,customer&search=${encodeURIComponent(email)}`, { token: adminToken });
    staffId = found.json?.data?.find(u => u.email === email)?.id;
    await req(`/users/${staffId}/role`, { method: 'PUT', token: adminToken, body: { role: 'staff' } });
    await req(`/users/${staffId}/status`, { method: 'PUT', token: adminToken, body: { status: 'active' } });
  }
  check('có id tài khoản kiểm thử', staffId ? 'có' : 'không', 'có');

  console.log('\n=== 3. Email trùng phải bị chặn ===');
  check('POST /users email trùng', (await req('/users', { method: 'POST', token: adminToken, body: { name: 'Người khác', email, password: 'staff123' } })).status, 409);

  console.log('\n=== 4. Nhân viên đăng nhập ===');
  const staffToken = await login(email, 'staff123');
  check('login staff', staffToken ? 200 : 0, 200);

  console.log('\n=== 5. Quyền ĐƯỢC PHÉP của nhân viên ===');
  check('GET /orders/admin/list      (xem đơn)',      (await req('/orders/admin/list', { token: staffToken })).status, 200);
  check('GET /stats/overview         (xem thống kê)', (await req('/stats/overview', { token: staffToken })).status, 200);
  check('GET /consultations          (xem tư vấn)',   (await req('/consultations', { token: staffToken })).status, 200);
  check('GET /chat/admin/conversations (xem chat)',   (await req('/chat/admin/conversations', { token: staffToken })).status, 200);
  check('GET /users                  (tra cứu KH)',   (await req('/users', { token: staffToken })).status, 200);
  check('GET /products/flash-sales/admin',            (await req('/products/flash-sales/admin', { token: staffToken })).status, 200);

  console.log('\n=== 6. Quyền BỊ CHẶN của nhân viên (403) ===');
  check('POST /products            (thêm SP)',    (await req('/products', { method: 'POST', token: staffToken, body: { name: 'X', price: 1000 } })).status, 403);
  check('POST /categories          (thêm DM)',    (await req('/categories', { method: 'POST', token: staffToken, body: { name: 'X' } })).status, 403);
  check('POST /collections         (thêm BST)',   (await req('/collections', { method: 'POST', token: staffToken, body: { name: 'X' } })).status, 403);
  check('POST /news                (viết bài)',   (await req('/news', { method: 'POST', token: staffToken, body: { title: 'X' } })).status, 403);
  check('POST /products/flash-sales/admin',       (await req('/products/flash-sales/admin', { method: 'POST', token: staffToken, body: {} })).status, 403);
  check('PUT  /settings            (TT công ty)', (await req('/settings', { method: 'PUT', token: staffToken, body: { companyName: 'X' } })).status, 403);
  check('POST /users               (tạo TK)',     (await req('/users', { method: 'POST', token: staffToken, body: { name: 'Hack', email: 'h@h.vn', password: '123456' } })).status, 403);
  check('PUT  /users/:id/role      (đổi quyền)',  (await req(`/users/${staffId}/role`, { method: 'PUT', token: staffToken, body: { role: 'admin' } })).status, 403);
  check('PUT  /users/:id/status    (khóa TK)',    (await req(`/users/${staffId}/status`, { method: 'PUT', token: staffToken, body: { status: 'blocked' } })).status, 403);
  check('POST /uploads/image-url   (tải ảnh)',    (await req('/uploads/image-url', { method: 'POST', token: staffToken, body: { type: 'news', mimeType: 'image/png', size: 100 } })).status, 403);
  check('DELETE /consultations/:id (xóa tư vấn)', (await req('/consultations/999999', { method: 'DELETE', token: staffToken })).status, 403);

  console.log('\n=== 7. Khách hàng vẫn không vào được khu quản trị ===');
  const custToken = await login('customer@namquan.vn', 'admin123');
  if (custToken) {
    check('GET /orders/admin/list (customer)', (await req('/orders/admin/list', { token: custToken })).status, 403);
    check('GET /stats/overview    (customer)', (await req('/stats/overview', { token: custToken })).status, 403);
    check('GET /users             (customer)', (await req('/users', { token: custToken })).status, 403);
  } else console.log('  (bỏ qua — không đăng nhập được customer)');

  console.log('\n=== 8. Lọc danh sách theo vai trò ===');
  const filtered = await req('/users?role=staff,admin', { token: adminToken });
  check('GET /users?role=staff,admin', filtered.status, 200);
  const roles = [...new Set((filtered.json?.data ?? []).map(u => u.role))].sort();
  check('  chỉ trả về staff+admin', JSON.stringify(roles), JSON.stringify(['admin', 'staff']));
  check('GET /users?role=badrole (422)', (await req('/users?role=badrole', { token: adminToken })).status, 422);

  console.log('\n=== 9. Khóa tài khoản có hiệu lực NGAY (token cũ hết dùng) ===');
  check('admin khóa staff', (await req(`/users/${staffId}/status`, { method: 'PUT', token: adminToken, body: { status: 'blocked' } })).status, 200);
  const afterBlock = await req('/orders/admin/list', { token: staffToken });
  check('  token cũ của staff bị chặn', afterBlock.status, 403);
  console.log('       thông báo:', afterBlock.json?.message);
  check('  staff đăng nhập lại cũng bị chặn', (await req('/auth/login', { method: 'POST', body: { email, password: 'staff123' } })).status, 403);

  console.log('\n=== 10. Mở khóa rồi hạ vai trò → quyền đổi ngay ===');
  await req(`/users/${staffId}/status`, { method: 'PUT', token: adminToken, body: { status: 'active' } });
  const staffToken2 = await login(email, 'staff123');
  check('  đăng nhập lại OK', (await req('/orders/admin/list', { token: staffToken2 })).status, 200);
  check('admin hạ staff → customer', (await req(`/users/${staffId}/role`, { method: 'PUT', token: adminToken, body: { role: 'customer' } })).status, 200);
  check('  token cũ mất quyền quản trị', (await req('/orders/admin/list', { token: staffToken2 })).status, 403);

  console.log('\n=== 11. Admin không tự hạ quyền / tự khóa mình ===');
  const me = (await req('/auth/me', { token: adminToken })).json?.data;
  check('PUT /users/:me/role   (400)',   (await req(`/users/${me.id}/role`, { method: 'PUT', token: adminToken, body: { role: 'customer' } })).status, 400);
  check('PUT /users/:me/status (400)',   (await req(`/users/${me.id}/status`, { method: 'PUT', token: adminToken, body: { status: 'blocked' } })).status, 400);

  console.log('\n=== 12. Giá trị status phải khớp CHECK của DB ===');
  check('status=suspended bị từ chối (422)', (await req(`/users/${staffId}/status`, { method: 'PUT', token: adminToken, body: { status: 'suspended' } })).status, 422);
  check('status=blocked được chấp nhận',     (await req(`/users/${staffId}/status`, { method: 'PUT', token: adminToken, body: { status: 'blocked' } })).status, 200);

  // Trả tài khoản kiểm thử về trạng thái chuẩn cho lần chạy sau.
  await req(`/users/${staffId}/role`, { method: 'PUT', token: adminToken, body: { role: 'staff' } });
  await req(`/users/${staffId}/status`, { method: 'PUT', token: adminToken, body: { status: 'active' } });

  console.log(`\n${'='.repeat(50)}`);
  console.log(fail === 0 ? `\x1b[32m✓ TẤT CẢ ${pass} KIỂM THỬ ĐỀU ĐẠT\x1b[0m` : `\x1b[31m✗ ${fail} thất bại / ${pass} đạt\x1b[0m`);
  console.log('='.repeat(50));
  process.exit(fail === 0 ? 0 : 1);
};

run().catch(e => { console.error('LỖI:', e); process.exit(1); });
