// Kiểm thử luồng trạng thái yêu cầu tư vấn — chạy: npm run test:consult
// Quy trình chỉ đi tới: new → contacted → quoted → closed, huỷ được từ mọi
// bước chưa kết thúc, và closed/cancelled là chốt sổ.
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

let token;
// Service chặn trùng số điện thoại trong một khoảng thời gian (chống spam form),
// nên mỗi yêu cầu kiểm thử phải mang một số riêng.
let phoneSeq = 0;
const nextPhone = () => `09${String(Date.now() % 100000000).padStart(8, '0').slice(0, 6)}${String(phoneSeq++).padStart(2, '0')}`;

/** Tạo một yêu cầu tư vấn mới rồi đưa tới đúng trạng thái cần thử. */
async function makeRequest(at = 'new') {
  const created = await req('/consultations', {
    method: 'POST',
    body: { name: 'Khách kiểm thử luồng', phone: nextPhone(), serviceType: 'Thi công nội thất' },
  });
  if (created.status !== 201) throw new Error(`Không tạo được yêu cầu mẫu: ${created.status} ${created.json?.message}`);
  const id = created.json.data.id;

  // Đi tuần tự tới trạng thái đích để chính máy trạng thái không chặn bước dựng dữ liệu.
  const steps = { new: [], contacted: ['contacted'], quoted: ['contacted', 'quoted'],
                  closed: ['contacted', 'quoted', 'closed'], cancelled: ['cancelled'] };
  for (const s of steps[at]) {
    const r = await req(`/consultations/${id}/status`, { method: 'PATCH', token, body: { status: s } });
    if (r.status !== 200) throw new Error(`Dựng trạng thái ${at} thất bại ở bước ${s}: ${r.status} ${r.json?.message}`);
  }
  return id;
}

const setStatus = (id, status) => req(`/consultations/${id}/status`, { method: 'PATCH', token, body: { status } });

const run = async () => {
  token = (await req('/auth/login', { method: 'POST', body: { email: 'admin@namquan.vn', password: 'admin123' } })).json?.data?.token;
  check('đăng nhập admin', token ? 200 : 0, 200);

  const ids = [];

  console.log('\n=== 1. Đi tới từng bước một ===');
  const a = await makeRequest('new'); ids.push(a);
  check('new → contacted',       (await setStatus(a, 'contacted')).status, 200);
  check('contacted → quoted',    (await setStatus(a, 'quoted')).status, 200);
  check('quoted → closed',       (await setStatus(a, 'closed')).status, 200);

  console.log('\n=== 2. Nhảy cóc về phía trước vẫn hợp lệ ===');
  const b = await makeRequest('new'); ids.push(b);
  check('new → quoted (bỏ qua contacted)', (await setStatus(b, 'quoted')).status, 200);
  const c = await makeRequest('new'); ids.push(c);
  check('new → closed',                    (await setStatus(c, 'closed')).status, 200);

  console.log('\n=== 3. KHÔNG lùi được (409) ===');
  const d = await makeRequest('quoted'); ids.push(d);
  const back1 = await setStatus(d, 'contacted');
  check('quoted → contacted', back1.status, 409);
  console.log('       ', back1.json?.message);
  check('quoted → new',       (await setStatus(d, 'new')).status, 409);

  const e = await makeRequest('contacted'); ids.push(e);
  check('contacted → new',    (await setStatus(e, 'new')).status, 409);

  console.log('\n=== 4. Trạng thái kết thúc là chốt sổ ===');
  const f = await makeRequest('closed'); ids.push(f);
  const afterClosed = await setStatus(f, 'quoted');
  check('closed → quoted',    afterClosed.status, 409);
  console.log('       ', afterClosed.json?.message);
  check('closed → cancelled', (await setStatus(f, 'cancelled')).status, 409);

  const g = await makeRequest('cancelled'); ids.push(g);
  check('cancelled → contacted', (await setStatus(g, 'contacted')).status, 409);
  check('cancelled → closed',    (await setStatus(g, 'closed')).status, 409);

  console.log('\n=== 5. Huỷ được từ mọi bước chưa kết thúc ===');
  const h = await makeRequest('new');       ids.push(h);
  check('new → cancelled',       (await setStatus(h, 'cancelled')).status, 200);
  const i = await makeRequest('contacted'); ids.push(i);
  check('contacted → cancelled', (await setStatus(i, 'cancelled')).status, 200);
  const j = await makeRequest('quoted');    ids.push(j);
  check('quoted → cancelled',    (await setStatus(j, 'cancelled')).status, 200);

  console.log('\n=== 6. Bấm lại trạng thái hiện tại — không lỗi, không đổi gì ===');
  const k = await makeRequest('contacted'); ids.push(k);
  const same = await setStatus(k, 'contacted');
  check('contacted → contacted', same.status, 200);
  check('  trạng thái giữ nguyên', same.json?.data?.status, 'contacted');

  console.log('\n=== 7. Giá trị lạ vẫn bị schema chặn ===');
  check('status=done (422)', (await setStatus(k, 'done')).status, 422);

  // Dọn dữ liệu kiểm thử
  for (const id of ids) await req(`/consultations/${id}`, { method: 'DELETE', token });

  console.log(`\n${'='.repeat(50)}`);
  console.log(fail === 0 ? `\x1b[32m✓ TẤT CẢ ${pass} KIỂM THỬ ĐỀU ĐẠT\x1b[0m` : `\x1b[31m✗ ${fail} thất bại / ${pass} đạt\x1b[0m`);
  console.log('='.repeat(50));
  process.exit(fail === 0 ? 0 : 1);
};

run().catch(e => { console.error('LỖI:', e); process.exit(1); });
