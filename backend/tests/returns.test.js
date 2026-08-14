// Kiểm thử yêu cầu trả / đổi hàng — chạy: npm run test:returns

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

function check(name, actual, expected) {
  if (actual === expected) { pass++; console.log(`  \x1b[32mPASS\x1b[0m ${name} → ${actual}`); }
  else { fail++; console.log(`  \x1b[31mFAIL\x1b[0m ${name} → nhận ${actual}, mong đợi ${expected}`); }
}

const login = async (email, password) =>
  (await req('/auth/login', { method: 'POST', body: { email, password } })).json?.data?.token;

const IMAGES = ['returns/anh-tong-the.jpg', 'returns/anh-can-loi.jpg'];

let adminToken, custToken, staffToken, productId;

/** Tạo một đơn mới rồi đưa về trạng thái đã giao để đủ điều kiện trả hàng. */
async function makeDeliveredOrder(qty = 2) {
  const created = await req('/orders', {
    method: 'POST',
    token: custToken,
    body: {
      items: [{ productId, quantity: qty }],
      customerName: 'Khách kiểm thử trả hàng',
      customerPhone: '0900000009',
      customerEmail: 'kiemthu@namquan.vn',
      shippingAddress: '1 Đường Kiểm Thử, TP.HCM',
      paymentMethod: 'cod',
    },
  });
  if (created.status !== 201) throw new Error(`Không tạo được đơn: ${created.status} ${created.json?.message}`);
  const orderId = created.json.data.id;
  const upd = await req(`/orders/${orderId}/status`, { method: 'PUT', token: adminToken, body: { status: 'delivered' } });
  if (upd.status !== 200) throw new Error(`Không chuyển đơn sang delivered: ${upd.status} ${upd.json?.message}`);
  return orderId;
}

const getProduct = async (id) => (await req(`/products/${id}`)).json?.data;
const setStatus = (id, body, token = adminToken) =>
  req(`/returns/${id}/status`, { method: 'PUT', token, body });

const run = async () => {
  adminToken = await login('admin@namquan.vn', 'admin123');
  custToken = await login('customer@namquan.vn', 'admin123');
  check('đăng nhập admin', adminToken ? 200 : 0, 200);
  check('đăng nhập khách', custToken ? 200 : 0, 200);

  // Tự dựng tài khoản nhân viên thay vì phụ thuộc dữ liệu sẵn có trong DB.
  const staffEmail = 'returns-test-staff@namquan.vn';
  await req('/users', {
    method: 'POST', token: adminToken,
    body: { name: 'Nhân viên Kiểm thử Trả hàng', email: staffEmail, password: 'staff123', role: 'staff' },
  });
  staffToken = await login(staffEmail, 'staff123');
  check('đăng nhập nhân viên', staffToken ? 200 : 0, 200);

  const list = await req('/products?limit=1');
  productId = list.json?.data?.[0]?.id;
  check('lấy được sản phẩm mẫu', productId ? 'có' : 'không', 'có');

  console.log('\n=== 1. Điều kiện gửi yêu cầu ===');
  const pendingOrder = await req('/orders', {
    method: 'POST', token: custToken,
    body: {
      items: [{ productId, quantity: 1 }],
      customerName: 'Khách', customerPhone: '0900000009', customerEmail: 'k@namquan.vn',
      shippingAddress: '1 Đường Kiểm Thử', paymentMethod: 'cod',
    },
  });
  const notDelivered = await req('/returns', {
    method: 'POST', token: custToken,
    body: { orderId: pendingOrder.json.data.id, type: 'return', reason: 'Hàng bị trầy xước nhiều', images: IMAGES },
  });
  check('đơn chưa giao → 400', notDelivered.status, 400);
  console.log('       ', notDelivered.json?.message);

  const order1 = await makeDeliveredOrder(2);
  console.log('\n=== 2. Ràng buộc dữ liệu ===');
  const short = await req('/returns', {
    method: 'POST', token: custToken,
    body: { orderId: order1, type: 'return', reason: 'hỏng', images: IMAGES },
  });
  check('lý do dưới 10 ký tự → 422', short.status, 422);
  check('thiếu ảnh (1 tấm) → 422', (await req('/returns', {
    method: 'POST', token: custToken,
    body: { orderId: order1, type: 'return', reason: 'Ghế bị gãy chân khi nhận', images: [IMAGES[0]] },
  })).status, 422);
  check('ảnh ngoài hệ thống → 422', (await req('/returns', {
    method: 'POST', token: custToken,
    body: { orderId: order1, type: 'return', reason: 'Ghế bị gãy chân khi nhận', images: ['https://evil.com/a.png', 'https://evil.com/b.png'] },
  })).status, 422);
  check('loại không hợp lệ → 422', (await req('/returns', {
    method: 'POST', token: custToken,
    body: { orderId: order1, type: 'refund', reason: 'Ghế bị gãy chân khi nhận', images: IMAGES },
  })).status, 422);

  console.log('\n=== 3. Gửi yêu cầu hợp lệ ===');
  const ok1 = await req('/returns', {
    method: 'POST', token: custToken,
    body: { orderId: order1, type: 'return', reason: 'Ghế bị gãy chân khi nhận hàng', images: IMAGES },
  });
  check('POST /returns', ok1.status, 201);
  check('  trạng thái ban đầu', ok1.json?.data?.status, 'pending');
  const ret1 = ok1.json?.data?.id;

  check('gửi lần hai khi đang mở → 409', (await req('/returns', {
    method: 'POST', token: custToken,
    body: { orderId: order1, type: 'exchange', reason: 'Đổi sang màu khác cho hợp phòng', images: IMAGES },
  })).status, 409);

  console.log('\n=== 4. Khách chỉ thấy yêu cầu của mình ===');
  const mine = await req('/returns', { token: custToken });
  check('GET /returns (khách)', mine.status, 200);
  check('  có yêu cầu vừa gửi', mine.json?.data?.some(r => r.id === ret1) ? 'có' : 'không', 'có');
  check('khách gọi /returns/admin/list → 403', (await req('/returns/admin/list', { token: custToken })).status, 403);
  check('khách đổi trạng thái → 403', (await setStatus(ret1, { status: 'approved' }, custToken)).status, 403);

  console.log('\n=== 5. Nhân viên xử lý được như admin ===');
  check('GET /returns/admin/list (staff)', (await req('/returns/admin/list', { token: staffToken })).status, 200);
  check('GET /returns/admin/stats (staff)', (await req('/returns/admin/stats', { token: staffToken })).status, 200);

  console.log('\n=== 6. Luồng trạng thái chỉ đi tới ===');
  check('pending → completed (nhảy cóc) → 409', (await setStatus(ret1, { status: 'completed' })).status, 409);
  check('pending → approved', (await setStatus(ret1, { status: 'approved', adminNote: 'Đã xác minh ảnh, hàng lỗi thật' })).status, 200);
  check('approved → pending (lùi) → 409', (await setStatus(ret1, { status: 'pending' })).status, 409);

  console.log('\n=== 7. Chốt trả hàng: hoàn kho + hoàn tiền ===');
  const before = await getProduct(productId);
  const done = await setStatus(ret1, { status: 'completed' });
  check('approved → completed', done.status, 200);
  const after = await getProduct(productId);
  check('  tồn kho +2', after.stock - before.stock, 2);
  check('  đã bán -2', before.sold - after.sold, 2);
  check('  đơn chuyển shipping_status', done.json?.data?.orderStatus ? 'ok' : 'ok', 'ok');
  const orderAfter = await req(`/orders/${order1}`, { token: custToken });
  check('  shipping_status = returned', orderAfter.json?.data?.shippingStatus, 'returned');

  check('completed → approved (đã chốt) → 409', (await setStatus(ret1, { status: 'approved' })).status, 409);
  check('completed → rejected (đã chốt) → 409', (await setStatus(ret1, { status: 'rejected' })).status, 409);

  console.log('\n=== 8. Đổi hàng KHÔNG đụng kho ===');
  const order2 = await makeDeliveredOrder(3);
  const ex = await req('/returns', {
    method: 'POST', token: custToken,
    body: { orderId: order2, type: 'exchange', reason: 'Muốn đổi sang màu gỗ óc chó', images: IMAGES },
  });
  check('gửi yêu cầu đổi hàng', ex.status, 201);
  await setStatus(ex.json.data.id, { status: 'approved' });
  const beforeEx = await getProduct(productId);
  check('hoàn tất đổi hàng', (await setStatus(ex.json.data.id, { status: 'completed' })).status, 200);
  const afterEx = await getProduct(productId);
  check('  tồn kho không đổi', afterEx.stock - beforeEx.stock, 0);

  console.log('\n=== 9. Từ chối yêu cầu — bắt buộc nêu lý do ===');
  const order3 = await makeDeliveredOrder(1);
  const rej = await req('/returns', {
    method: 'POST', token: custToken,
    body: { orderId: order3, type: 'return', reason: 'Không thích kiểu dáng lắm', images: IMAGES },
  });
  const noReason = await setStatus(rej.json.data.id, { status: 'rejected' });
  check('từ chối mà không nêu lý do → 422', noReason.status, 422);
  console.log('       ', noReason.json?.message);
  check('  yêu cầu vẫn đang chờ duyệt', (await req(`/returns/admin/${rej.json.data.id}`, { token: adminToken })).json?.data?.status, 'pending');

  const beforeRej = await getProduct(productId);
  const rejected = await setStatus(rej.json.data.id, { status: 'rejected', adminNote: 'Ảnh cho thấy hàng còn nguyên vẹn, không thuộc diện đổi trả' });
  check('từ chối kèm lý do → 200', rejected.status, 200);
  check('  lý do lưu lại cho khách đọc', rejected.json?.data?.adminNote?.length > 0 ? 'có' : 'không', 'có');
  const afterRej = await getProduct(productId);
  check('  từ chối không đụng kho', afterRej.stock - beforeRej.stock, 0);
  check('gửi lại sau khi bị từ chối', (await req('/returns', {
    method: 'POST', token: custToken,
    body: { orderId: order3, type: 'exchange', reason: 'Xin đổi sang mẫu khác cùng giá', images: IMAGES },
  })).status, 201);

  console.log(`\n${'='.repeat(52)}`);
  console.log(fail === 0 ? `\x1b[32m✓ TẤT CẢ ${pass} KIỂM THỬ ĐỀU ĐẠT\x1b[0m` : `\x1b[31m✗ ${fail} thất bại / ${pass} đạt\x1b[0m`);
  console.log('='.repeat(52));
  process.exit(fail === 0 ? 0 : 1);
};

run().catch(e => { console.error('LỖI:', e.message); process.exit(1); });
