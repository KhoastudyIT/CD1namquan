// Trỏ sang instance khác khi cần: API_BASE_URL=http://localhost:3999/api/v1 npm test
const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000/api/v1';

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
      testEndpoint('Lấy tin tức', '/news'),
      testEndpoint('Lấy danh mục bài viết', '/news/categories')
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

    // 4. Vòng đời bài viết: tạo nháp -> đăng -> đọc công khai -> sửa -> xóa
    console.log('\x1b[36m--- Khởi động Nhóm 3: Vòng đời bài viết (Tuần tự) ---\x1b[0m');

    const newsCreateRes = await testEndpoint('Tạo bài viết (nháp)', '/news', 'POST', {
      headers,
      body: {
        title: `Bài kiểm thử tự động ${Date.now()}`,
        img: '/images/news1.jpg',
        excerpt: 'Bài viết do bộ kiểm thử tạo ra, sẽ được xóa ở cuối quy trình.',
        content: 'Đoạn mở đầu.\n\n## Mục kiểm thử\n\n- **Ý một**: nội dung kiểm thử.',
        tags: ['kiểm thử'],
        status: 'draft'
      }
    });
    const newsId = newsCreateRes?.data?.id;
    const newsSlug = newsCreateRes?.data?.slug;
    if (!newsId) throw new Error('Không tạo được bài viết');
    if (newsCreateRes.data.status !== 'draft') throw new Error('Bài mới phải ở trạng thái nháp');

    // Bài nháp không được lộ ra API công khai
    const draftRes = await fetch(`${BASE_URL}/news/${newsSlug}`);
    if (draftRes.status !== 404) throw new Error(`Bài nháp bị lộ ra public (status ${draftRes.status})`);
    console.log('\x1b[32m[PASS]\x1b[0m GET /news/:slug với bài nháp trả về 404 đúng như mong đợi');

    await testEndpoint('Đăng bài viết', `/news/${newsId}/status`, 'PATCH', {
      headers,
      body: { status: 'published' }
    });
    await testEndpoint('Đọc bài viết công khai theo slug', `/news/${newsSlug}`);
    await testEndpoint('Lấy bài viết liên quan', `/news/${newsSlug}/related?limit=3`);
    await testEndpoint('Cập nhật bài viết', `/news/${newsId}`, 'PUT', {
      headers,
      body: { excerpt: 'Mô tả ngắn đã được cập nhật bởi bộ kiểm thử.', featured: true }
    });
    await testEndpoint('Lấy chi tiết bài viết cho Admin', `/news/admin/${newsId}`, 'GET', { headers });
    await testEndpoint('Xóa bài viết', `/news/${newsId}`, 'DELETE', { headers });
    console.log(`\n\x1b[32m✔ Nhóm 3 hoàn thành vòng đời bài viết.\x1b[0m\n`);

    // 5. Bộ sưu tập: từng làm sập server vì controller không await service
    //    (response trả Promise rỗng + unhandled rejection). Giữ test này để không tái diễn.
    console.log('\x1b[36m--- Khởi động Nhóm 4: Vòng đời bộ sưu tập (Tuần tự) ---\x1b[0m');

    const collRes = await testEndpoint('Tạo bộ sưu tập', '/collections', 'POST', {
      headers,
      body: { name: `BST kiểm thử ${Date.now()}`, img: '/images/catSofa.jpg' }
    });
    const collId = collRes?.data?.id;
    if (!collId) throw new Error('Tạo bộ sưu tập không trả về id — controller có thể thiếu await');
    if (!collRes.data.slug) throw new Error('Bộ sưu tập được tạo mà không có slug');

    await testEndpoint('Cập nhật bộ sưu tập', `/collections/${collId}`, 'PUT', {
      headers,
      body: { img: '/images/catTable.jpg' }
    });
    await testEndpoint('Xóa bộ sưu tập', `/collections/${collId}`, 'DELETE', { headers });

    // Server phải còn sống sau chuỗi thao tác trên
    await testEndpoint('Lấy bộ sưu tập sau khi xóa', '/collections');
    console.log(`\n\x1b[32m✔ Nhóm 4 hoàn thành vòng đời bộ sưu tập.\x1b[0m\n`);

    // 6. Chạy song song các API quản trị và cá nhân khác
    console.log('\x1b[36m--- Khởi động Nhóm 5: Kiểm thử các API Quản trị & Cá nhân song song ---\x1b[0m');
    await Promise.all([
      testEndpoint('Lấy thông tin cá nhân me', '/auth/me', 'GET', { headers }),
      testEndpoint('Lấy danh sách Flash Sale cho Admin', '/products/flash-sales/admin', 'GET', { headers }),
      testEndpoint('Lấy số liệu thống kê Dashboard', '/stats/overview', 'GET', { headers }),
      testEndpoint('Lấy danh sách thông báo của tôi', '/notifications', 'GET', { headers }),
      testEndpoint('Lấy danh sách bài viết cho Admin', '/news/admin/list', 'GET', { headers }),
      testEndpoint('Lọc bài viết theo trạng thái nháp', '/news/admin/list?status=draft', 'GET', { headers })
    ]);

    // 7. Upload ảnh — chỉ chạy khi backend có cấu hình MinIO
    console.log('\n\x1b[36m--- Khởi động Nhóm 6: Tải ảnh lên (bỏ qua nếu chưa bật MinIO) ---\x1b[0m');
    const uploadProbe = await fetch(`${BASE_URL}/uploads/image-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ type: 'news', mimeType: 'image/png', size: 1024, originalName: 'test.png' })
    });

    if (uploadProbe.status === 503) {
      console.log('\x1b[33m[SKIP]\x1b[0m POST /uploads/image-url — backend chưa cấu hình MinIO');
    } else {
      const uploadJson = await uploadProbe.json();
      if (!uploadProbe.ok || !uploadJson.data?.uploadUrl) {
        throw new Error(`Xin URL upload thất bại: ${uploadProbe.status} ${uploadJson.message}`);
      }
      if (!uploadJson.data.objectKey.startsWith('news/')) {
        throw new Error(`Object key sai thư mục: ${uploadJson.data.objectKey}`);
      }
      console.log('\x1b[32m[PASS]\x1b[0m POST /uploads/image-url →', uploadJson.data.objectKey);

      // Loại ảnh không nằm trong danh sách cho phép phải bị từ chối
      const badType = await fetch(`${BASE_URL}/uploads/image-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ type: '../secrets', mimeType: 'image/png', size: 1024 })
      });
      if (badType.status !== 422) throw new Error(`type không hợp lệ phải trả 422, nhận ${badType.status}`);
      console.log('\x1b[32m[PASS]\x1b[0m POST /uploads/image-url với type không hợp lệ → 422');
    }

    const totalDuration = Date.now() - globalStart;
    console.log(`\n\x1b[32m🎉 TẤT CẢ BÀI KIỂM THỬ ĐÃ VƯỢT QUA THÀNH CÔNG! (Tổng thời gian: ${totalDuration}ms)\x1b[0m\n`);
  } catch (err) {
    console.error(`\n\x1b[31m❌ BỘ KIỂM THỬ THẤT BẠI: ${err.message}\x1b[0m\n`);
    process.exit(1);
  }
}

run();
