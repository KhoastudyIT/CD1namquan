const BASE_URL = 'http://localhost:3000/api/v1';

async function testEndpoint(name, path, method = 'GET', options = {}) {
  const start = Date.now();
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const duration = Date.now() - start;
    
    let json = null;
    if (res.status !== 204) {
      json = await res.json();
    }
    
    if (res.ok && (res.status === 204 || json?.success)) {
      console.log(`\x1b[32m[PASS]\x1b[0m ${method} ${path} (${duration}ms)`);
      return json;
    } else {
      console.log(`\x1b[31m[FAIL]\x1b[0m ${method} ${path} (${duration}ms) - Status: ${res.status}, Msg: ${json?.message || 'Unknown'}`);
      throw new Error(`Test failed for ${method} ${path}`);
    }
  } catch (err) {
    const duration = Date.now() - start;
    console.log(`\x1b[31m[FAIL]\x1b[0m ${method} ${path} (${duration}ms) - Error: ${err.message}`);
    throw err;
  }
}

async function run() {
  console.log('\n\x1b[36m🚀 Bắt đầu chạy Parallel API Integration Tests...\x1b[0m\n');
  const globalStart = Date.now();
  
  try {
    // 1. Chạy song song các API công khai
    console.log('\x1b[36m--- Khởi động Nhóm 1: Kiểm thử các API công khai song song ---\x1b[0m');
    const publicResults = await Promise.all([
      testEndpoint('Lấy danh sách sản phẩm', '/products'),
      testEndpoint('Lấy sản phẩm flash sale', '/products/flash-sales'),
      testEndpoint('Lấy danh mục', '/categories'),
      testEndpoint('Lấy bộ sưu tập', '/collections'),
      testEndpoint('Lấy tin tức', '/news')
    ]);
    
    const productsList = publicResults[0]?.data?.products || publicResults[0]?.data || [];
    if (!productsList.length) {
      throw new Error('Không tìm thấy sản phẩm nào trong hệ thống để tiếp tục kiểm thử');
    }
    const testProductId = productsList[0].id;
    const testOriginalPrice = productsList[0].price;
    console.log(`\n\x1b[32m✔ Nhóm 1 hoàn thành. Sử dụng Product ID ${testProductId} để chạy tiếp.\x1b[0m\n`);

    // 2. Xác thực (Đăng nhập Admin)
    console.log('\x1b[36m--- Đăng nhập tài khoản quản trị để lấy token ---\x1b[0m');
    const authRes = await testEndpoint('Đăng nhập Admin', '/auth/login', 'POST', {
      body: { email: 'admin@namquan.vn', password: 'admin123' }
    });
    const token = authRes?.data?.token;
    if (!token) throw new Error('Không lấy được auth token');
    const headers = { Authorization: `Bearer ${token}` };
    console.log(`\n\x1b[32m✔ Đăng nhập thành công.\x1b[0m\n`);

    // 3. Thực hiện kiểm thử Admin Flash Sale tuần tự để bảo vệ tính toàn vẹn (tạo -> sửa -> xóa)
    console.log('\x1b[36m--- Khởi động Nhóm 2: Quy trình quản lý Flash Sale Admin (Tuần tự) ---\x1b[0m');
    
    // Tạo Flash Sale
    const createRes = await testEndpoint('Tạo Flash Sale', '/products/flash-sales/admin', 'POST', {
      headers,
      body: {
        productId: testProductId,
        price: Math.round(testOriginalPrice * 0.8),
        originalPrice: testOriginalPrice,
        stock: 10,
        sold: 0,
        startsAt: new Date().toISOString(),
        active: true
      }
    });
    const flashSaleId = createRes?.data?.id;
    if (!flashSaleId) throw new Error('Không tạo được Flash Sale ID');
    
    // Cập nhật Flash Sale
    await testEndpoint('Cập nhật Flash Sale', `/products/flash-sales/admin/${flashSaleId}`, 'PUT', {
      headers,
      body: {
        price: Math.round(testOriginalPrice * 0.7),
        stock: 15,
        active: false
      }
    });
    
    // Xóa Flash Sale
    await testEndpoint('Xóa Flash Sale', `/products/flash-sales/admin/${flashSaleId}`, 'DELETE', { headers });
    console.log(`\n\x1b[32m✔ Nhóm 2 hoàn thành quy trình quản lý Flash Sale.\x1b[0m\n`);

    // 4. Chạy song song các API quản trị và cá nhân khác
    console.log('\x1b[36m--- Khởi động Nhóm 3: Kiểm thử các API Quản trị & Cá nhân song song ---\x1b[0m');
    await Promise.all([
      testEndpoint('Lấy thông tin cá nhân me', '/auth/me', 'GET', { headers }),
      testEndpoint('Lấy danh sách Flash Sale cho Admin', '/products/flash-sales/admin', 'GET', { headers }),
      testEndpoint('Lấy số liệu thống kê Dashboard', '/stats/overview', 'GET', { headers }),
      testEndpoint('Lấy danh sách thông báo của tôi', '/notifications', 'GET', { headers })
    ]);

    const totalDuration = Date.now() - globalStart;
    console.log(`\n\x1b[32m🎉 TẤT CẢ BÀI KIỂM THỬ ĐÃ VƯỢT QUA THÀNH CÔNG! (Tổng thời gian: ${totalDuration}ms)\x1b[0m\n`);
  } catch (err) {
    console.error(`\n\x1b[31m❌ BỘ KIỂM THỬ THẤT BẠI: ${err.message}\x1b[0m\n`);
    process.exit(1);
  }
}

run();
