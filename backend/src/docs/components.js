// Sinh tu openapi.js goc - chi la lop tai lieu, khong co business logic.

export const components = {
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'JWT access token nhận từ /auth/login',
    },
  },
  schemas: {
    User: {
      type: 'object',
      properties: {
        id:        { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
        name:      { type: 'string', example: 'Nguyễn Văn An' },
        email:     { type: 'string', format: 'email', example: 'an@example.com' },
        phone:     { type: 'string', example: '0901234567' },
        role:      { type: 'string', enum: ['customer', 'staff', 'admin'], description: 'customer = khách mua hàng · staff = nhân viên (chỉ xem nội dung, xử lý đơn/tư vấn/chat) · admin = toàn quyền', example: 'customer' },
        status:    { type: 'string', enum: ['active', 'blocked'], description: 'blocked chặn đăng nhập ngay lập tức, kể cả token còn hạn', example: 'active' },
        createdAt: { type: 'string', format: 'date-time', example: '2026-06-16T10:00:00.000Z' },
      },
    },
    UserWithStats: {
      allOf: [
        { $ref: '#/components/schemas/User' },
        {
          type: 'object',
          properties: {
            orderCount: { type: 'integer', description: 'Số đơn hàng đã đặt', example: 3 },
          },
        },
      ],
    },
    UserListResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data:    { type: 'array', items: { $ref: '#/components/schemas/UserWithStats' } },
        meta: {
          type: 'object',
          properties: {
            total:      { type: 'integer', example: 42 },
            page:       { type: 'integer', example: 1 },
            limit:      { type: 'integer', example: 20 },
            totalPages: { type: 'integer', example: 3 },
          },
        },
      },
    },
    StatsOverview: {
      type: 'object',
      properties: {
        totalRevenue:   { type: 'integer', description: 'Doanh thu (đơn chưa hủy, VND)', example: 125000000 },
        totalOrders:    { type: 'integer', example: 87 },
        totalProducts:  { type: 'integer', example: 12 },
        totalUsers:     { type: 'integer', example: 42 },
        totalCustomers: { type: 'integer', example: 41 },
        lowStockCount:  { type: 'integer', description: 'Số sản phẩm tồn kho < 10', example: 3 },
        avgOrderValue:  { type: 'integer', description: 'Giá trị đơn trung bình (VND)', example: 1436781 },
        ordersByStatus: {
          type: 'object',
          properties: {
            pending:   { type: 'integer', example: 10 },
            confirmed: { type: 'integer', example: 20 },
            shipped:   { type: 'integer', example: 15 },
            delivered: { type: 'integer', example: 40 },
            cancelled: { type: 'integer', example: 2 },
          },
        },
        revenueByDay: {
          type: 'array',
          description: 'Doanh thu 7 ngày gần nhất (cũ → mới)',
          items: {
            type: 'object',
            properties: {
              date:    { type: 'string', format: 'date', example: '2026-07-06' },
              revenue: { type: 'integer', example: 12500000 },
              orders:  { type: 'integer', example: 4 },
            },
          },
        },
        topProducts: {
          type: 'array',
          description: 'Top 5 sản phẩm bán chạy',
          items: {
            type: 'object',
            properties: {
              id:      { type: 'integer', example: 5 },
              name:    { type: 'string', example: 'Giường Ngủ Tân Cổ Điển' },
              img:     { type: 'string', example: '/images/bedClassic.jpg' },
              sold:    { type: 'integer', example: 73 },
              revenue: { type: 'integer', example: 1788500000 },
            },
          },
        },
      },
    },
    AuthResponse: {
      type: 'object',
      properties: {
        user:  { $ref: '#/components/schemas/User' },
        token: { type: 'string', description: 'JWT Bearer token', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
      },
    },
    Product: {
      type: 'object',
      properties: {
        id:          { type: 'integer', example: 1 },
        name:        { type: 'string', example: 'Sofa Băng Vải Linen Mây' },
        type:        { type: 'string', example: 'Ghế Sofa' },
        price:       { type: 'integer', description: 'Giá (VND)', example: 18900000 },
        category:    { type: 'string', example: 'Phòng khách' },
        img:         { type: 'string', example: '/images/sofaBeige.jpg' },
        rating:      { type: 'number', format: 'float', example: 4.8 },
        sold:        { type: 'integer', example: 124 },
        stock:       { type: 'integer', example: 50 },
        description: { type: 'string', example: 'Sofa băng vải linen thiết kế tối giản...' },
      },
    },
    FlashSaleProduct: {
      type: 'object',
      properties: {
        id:            { type: 'integer', example: 101 },
        productId:     { type: 'integer', example: 5 },
        name:          { type: 'string', example: 'Giường Ngủ Tân Cổ Điển' },
        type:          { type: 'string', example: 'Giường' },
        price:         { type: 'integer', description: 'Giá flash sale (VND)', example: 11000000 },
        originalPrice: { type: 'integer', description: 'Giá gốc (VND)', example: 16500000 },
        img:           { type: 'string', example: '/images/bedClassic.jpg' },
        rating:        { type: 'number', format: 'float', example: 4.8 },
        sold:          { type: 'integer', example: 64 },
        stock:         { type: 'integer', example: 80 },
      },
    },
    AdminFlashSaleProduct: {
      type: 'object',
      properties: {
        id:             { type: 'integer', example: 101 },
        product_id:     { type: 'integer', example: 5 },
        price:          { type: 'integer', description: 'Giá flash sale (VND)', example: 11000000 },
        original_price: { type: 'integer', description: 'Giá gốc (VND)', example: 16500000 },
        stock:          { type: 'integer', example: 80 },
        sold:           { type: 'integer', example: 64 },
        starts_at:      { type: 'string', format: 'date-time', example: '2026-07-07T03:20:56.731Z' },
        ends_at:        { type: 'string', format: 'date-time', nullable: true, example: null },
        active:         { type: 'boolean', example: true },
        created_at:     { type: 'string', format: 'date-time', example: '2026-07-07T03:20:56.731Z' },
        updated_at:     { type: 'string', format: 'date-time', example: '2026-07-07T03:20:56.731Z' },
        product_name:   { type: 'string', example: 'Giường Ngủ Tân Cổ Điển' },
        product_price:  { type: 'integer', example: 16500000 },
        product_img:    { type: 'string', example: '/images/bedClassic.jpg' },
      },
    },
    ProductListResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data:    { type: 'array', items: { $ref: '#/components/schemas/Product' } },
        meta: {
          type: 'object',
          properties: {
            total:      { type: 'integer', example: 12 },
            page:       { type: 'integer', example: 1 },
            limit:      { type: 'integer', example: 12 },
            totalPages: { type: 'integer', example: 1 },
          },
        },
      },
    },
    Category: {
      type: 'object',
      properties: {
        id:   { type: 'integer', example: 1 },
        name: { type: 'string', example: 'Sofa' },
        img:  { type: 'string', example: '/images/catSofa.jpg' },
      },
    },
    Collection: {
      type: 'object',
      properties: {
        id:   { type: 'integer', example: 1 },
        name: { type: 'string', example: 'BST MODERN LIVING' },
        img:  { type: 'string', example: '/images/modern.jpg' },
      },
    },
    CompanyInfo: {
      type: 'object',
      description: 'Một dòng duy nhất (id = 1) mô tả chính cửa hàng.',
      properties: {
        id:          { type: 'integer', example: 1 },
        companyName: { type: 'string', example: 'NAM QUAN' },
        slogan:      { type: 'string', example: 'Nội thất cao cấp' },
        about:       { type: 'string', example: 'NAM QUAN là thương hiệu nội thất...' },
        mission:     { type: 'string', example: 'Mang đến sản phẩm nội thất chất lượng...' },
        vision:      { type: 'string', example: 'Trở thành đơn vị nội thất uy tín...' },
        phone:       { type: 'string', description: 'Hotline hiện ở Header, Footer và menu mobile', example: '0900 000 000' },
        email:       { type: 'string', example: 'contact@namquan.vn' },
        address:     { type: 'string', example: 'TP. Hồ Chí Minh, Việt Nam' },
        mapUrl:      { type: 'string', description: 'Mã nhúng Google Maps (https://www.google.com/maps/embed?pb=...). Bỏ trống thì Footer không hiện bản đồ.', example: '' },
        facebook:    { type: 'string', example: 'https://facebook.com/namquan' },
        instagram:   { type: 'string', example: 'https://instagram.com/namquan' },
        youtube:     { type: 'string', example: 'https://youtube.com/@namquan' },
        tiktok:      { type: 'string', example: 'https://tiktok.com/@namquan' },
        logo:        { type: 'string', description: 'URL ảnh logo; bỏ trống thì web dùng dấu hiệu chữ mặc định', example: '/images/logo.png' },
        updatedAt:   { type: 'string', format: 'date-time' },
      },
    },
    NewsCategory: {
      type: 'object',
      properties: {
        id:           { type: 'integer', example: 1 },
        name:         { type: 'string', example: 'Xu hướng thiết kế' },
        slug:         { type: 'string', example: 'xu-huong-thiet-ke' },
        description:  { type: 'string', example: 'Phong cách, vật liệu và màu sắc đang dẫn dắt thị trường nội thất.' },
        sortOrder:    { type: 'integer', example: 1 },
        articleCount: { type: 'integer', description: 'Số bài đã đăng thuộc danh mục', example: 2 },
      },
    },
    NewsArticle: {
      type: 'object',
      description: 'Bài viết. Danh sách (`GET /news`, `GET /news/admin/list`) không kèm `content`; chi tiết thì có.',
      properties: {
        id:      { type: 'integer', example: 1 },
        title:   { type: 'string', example: 'Xu Hướng Nội Thất 2026 – Tinh Tế & Bền Vững' },
        slug:    { type: 'string', example: 'xu-huong-noi-that-2026-tinh-te-ben-vung' },
        img:     { type: 'string', example: '/images/news1.jpg' },
        excerpt: { type: 'string', example: 'Vật liệu tái tạo, đường nét tối giản và bảng màu lấy cảm hứng từ thiên nhiên...' },
        content: {
          type: 'string',
          description: 'Văn bản thuần. Cú pháp rút gọn: `## ` tiêu đề mục, `- ` gạch đầu dòng, `**...**` in đậm, dòng trống ngăn đoạn. Thẻ HTML bị gỡ khi lưu.',
          example: 'Năm 2026 đánh dấu giai đoạn...\n\n## Vật liệu tái tạo lên ngôi\n\n- **Gỗ sồi**: giữ được vân gỗ thật.',
        },
        author:      { type: 'string', example: 'NAM QUAN' },
        category:    { allOf: [{ $ref: '#/components/schemas/NewsCategory' }], nullable: true, description: 'null nếu bài chưa gán danh mục' },
        tags:        { type: 'array', items: { type: 'string' }, example: ['xu hướng', 'bền vững'] },
        status:      { type: 'string', enum: ['draft', 'published', 'hidden'], example: 'published' },
        featured:    { type: 'boolean', example: true },
        views:       { type: 'integer', example: 412 },
        readingTime: { type: 'integer', description: 'Phút đọc ước tính (~200 từ/phút)', example: 5 },
        publishedAt: { type: 'string', format: 'date', description: 'Ngày đăng dạng yyyy-mm-dd (dùng cho input date)', example: '2026-03-11' },
        date:        { type: 'string', description: 'Ngày đăng đã format để hiển thị', example: '11/03/2026' },
        seo: {
          type: 'object',
          properties: {
            title:       { type: 'string', nullable: true, example: 'Xu hướng nội thất 2026: tinh tế và bền vững' },
            description: { type: 'string', nullable: true, example: 'Ba trụ cột định hình nội thất 2026...' },
            keywords:    { type: 'string', nullable: true, example: 'xu hướng nội thất 2026, nội thất bền vững' },
            ogImage:     { type: 'string', nullable: true, example: '/images/news1.jpg' },
          },
        },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    NewsInput: {
      type: 'object',
      required: ['title', 'img', 'excerpt', 'content'],
      properties: {
        title:      { type: 'string', maxLength: 500, example: 'Xu Hướng Nội Thất 2026' },
        slug:       { type: 'string', description: 'Bỏ trống = tự sinh từ tiêu đề. Trùng thì tự thêm hậu tố -2, -3…', example: 'xu-huong-noi-that-2026' },
        img:        { type: 'string', example: '/images/news1.jpg' },
        excerpt:    { type: 'string', maxLength: 500, example: 'Mô tả ngắn hiển thị ở card tin tức...' },
        content:    { type: 'string', example: 'Nội dung bài viết...\n\n## Mục đầu tiên\n\n- **Ý chính**: diễn giải.' },
        author:     { type: 'string', example: 'NAM QUAN' },
        categoryId: { type: 'integer', nullable: true, example: 1 },
        tags:       { type: 'array', maxItems: 10, items: { type: 'string' }, example: ['xu hướng', '2026'] },
        status:     { type: 'string', enum: ['draft', 'published', 'hidden'], default: 'draft' },
        featured:   { type: 'boolean', default: false },
        date:       { type: 'string', description: 'Ngày đăng, nhận `dd/mm/yyyy` hoặc `yyyy-mm-dd`. Bỏ trống = hôm nay.', example: '11/03/2026' },
        seoTitle:       { type: 'string', maxLength: 255 },
        seoDescription: { type: 'string', maxLength: 500 },
        seoKeywords:    { type: 'string', maxLength: 500 },
        ogImage:        { type: 'string', maxLength: 500 },
      },
    },
    NewsListResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data:    { type: 'array', items: { $ref: '#/components/schemas/NewsArticle' } },
        meta: {
          type: 'object',
          properties: {
            total:      { type: 'integer', example: 6 },
            page:       { type: 'integer', example: 1 },
            limit:      { type: 'integer', example: 9 },
            totalPages: { type: 'integer', example: 1 },
          },
        },
      },
    },
    CartItemEnriched: {
      type: 'object',
      properties: {
        productId: { type: 'integer', example: 1 },
        quantity:  { type: 'integer', example: 2 },
        product:   { $ref: '#/components/schemas/Product' },
      },
    },
    Cart: {
      type: 'object',
      properties: {
        items:     { type: 'array', items: { $ref: '#/components/schemas/CartItemEnriched' } },
        total:     { type: 'integer', description: 'Tổng tiền (VND)', example: 37800000 },
        itemCount: { type: 'integer', description: 'Tổng số lượng sản phẩm', example: 3 },
      },
    },
    OrderItem: {
      type: 'object',
      properties: {
        productId: { type: 'integer', example: 1 },
        quantity:  { type: 'integer', example: 2 },
        name:      { type: 'string', example: 'Sofa Băng Vải Linen Mây' },
        price:     { type: 'integer', example: 18900000 },
        img:       { type: 'string', example: '/images/sofaBeige.jpg' },
      },
    },
    Order: {
      type: 'object',
      properties: {
        id:              { type: 'string', format: 'uuid', example: 'ord-uuid-here' },
        userId:          { type: 'string', format: 'uuid' },
        items:           { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
        total:           { type: 'integer', description: 'Tổng tiền (VND)', example: 37800000 },
        shippingAddress: { type: 'string', example: '123 Nguyễn Trãi, Quận 1, TP.HCM' },
        note:            { type: 'string', example: 'Giao buổi sáng' },
        status:          { type: 'string', enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'], example: 'pending' },
        shippingStatus:  { type: 'string', enum: ['not_shipped', 'shipping', 'shipped', 'delivered', 'returned'], description: "Đơn đã trả hàng được ghi ở đây ('returned') vì orders.status không có giá trị đó.", example: 'not_shipped' },
        paymentStatus:   { type: 'string', enum: ['unpaid', 'paid', 'refunded', 'failed'], description: "Chuyển sang 'refunded' khi một yêu cầu TRẢ hàng được hoàn tất.", example: 'unpaid' },
        createdAt:       { type: 'string', format: 'date-time', example: '2026-06-16T10:00:00.000Z' },
      },
    },
    ChatProductCard: {
      type: 'object',
      description: 'Thẻ sản phẩm bot đính kèm câu trả lời - bấm vào mở trang chi tiết.',
      properties: {
        id:        { type: 'integer', example: 46 },
        name:      { type: 'string', example: 'Vòi Rửa Tay Rinto' },
        slug:      { type: 'string', example: 'voi-rua-tay-rinto' },
        price:     { type: 'integer', description: 'Giá niêm yết (VND)', example: 1290000 },
        salePrice: { type: 'integer', nullable: true, description: 'Giá ưu đãi, null nếu không giảm', example: null },
        img:       { type: 'string', example: '/images/voiRinto.jpg' },
      },
    },
    ChatMessage: {
      type: 'object',
      properties: {
        id:             { type: 'integer', example: 128 },
        conversationId: { type: 'integer', example: 4 },
        senderType:     { type: 'string', enum: ['customer', 'ai', 'staff', 'system'], example: 'ai' },
        senderName:     { type: 'string', nullable: true, description: 'Tên khách; null với tin của bot và nhân viên', example: null },
        message:        { type: 'string', description: 'Nội dung. Bot dùng **in đậm** và xuống dòng.', example: '**Vòi Rửa Tay Rinto**\nGiá niêm yết: **1.290.000 đ**.' },
        productId:      { type: 'integer', nullable: true, description: 'Sản phẩm tin nhắn này nói tới', example: 46 },
        suggestions:    { type: 'array', items: { $ref: '#/components/schemas/ChatProductCard' }, description: 'Thẻ sản phẩm bot gợi ý; rỗng với tin của người' },
        intent:         { type: 'string', description: 'Ý định bot nhận ra: price, stock, material, size, color, warranty, origin, shipping, payment, returns, promo, showroom, contact, suggest, handoff, greeting, thanks, unknown. Rỗng với tin của người.', example: 'price' },
        read:           { type: 'boolean', example: false },
        createdAt:      { type: 'string', format: 'date-time', example: '2026-08-02T04:30:00.000Z' },
      },
    },
    ChatConversation: {
      type: 'object',
      description: 'Mỗi khách hàng có ĐÚNG MỘT hội thoại, tồn tại vĩnh viễn.',
      properties: {
        id:             { type: 'integer', example: 4 },
        userId:         { type: 'string', format: 'uuid' },
        userName:       { type: 'string', example: 'Nguyễn Văn An' },
        userEmail:      { type: 'string', format: 'email', example: 'an@example.com' },
        userPhone:      { type: 'string', example: '0901234567' },
        status:         { type: 'string', enum: ['open', 'closed'], description: '"closed" = nhân viên đã xử lý xong. Khách nhắn tiếp sẽ tự mở lại chính hội thoại này.', example: 'open' },
        aiEnabled:      { type: 'boolean', description: 'Bot có tự trả lời không. Tự tắt khi khách xin gặp nhân viên hoặc nhân viên vào trả lời; tự bật lại sau 15 phút nhân viên im lặng.', example: true },
        lastMessage:    { type: 'string', example: 'Dạ sản phẩm này bên em còn hàng ạ.' },
        lastMessageAt:  { type: 'string', format: 'date-time' },
        customerUnread: { type: 'integer', description: 'Số tin khách chưa đọc', example: 0 },
        staffUnread:    { type: 'integer', description: 'Số tin nhân viên chưa đọc', example: 2 },
        createdAt:      { type: 'string', format: 'date-time' },
      },
    },
    SuccessResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Success' },
        data:    {},
      },
    },
    ErrorResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Mô tả lỗi' },
      },
    },
    ValidationErrorResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Validation failed' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path:    { type: 'string', example: 'email' },
              message: { type: 'string', example: 'Invalid email' },
            },
          },
        },
      },
    },

    // ─── Request bodies ──────────────────────────────────────────────────
    // Tach rieng de Scalar hien san body demo o nut Test Request, va de
    // cac endpoint dung chung mot dinh nghia thay vi chep lai inline.
    RegisterBody: {
      type: 'object',
      required: ['name', 'email', 'password'],
      properties: {
        name:     { type: 'string', minLength: 2, example: 'Nguyễn Văn An' },
        email:    { type: 'string', format: 'email', example: 'an@example.com' },
        password: { type: 'string', minLength: 6, example: 'securepass123' },
      },
    },
    LoginBody: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email:    { type: 'string', format: 'email', example: 'an@example.com' },
        password: { type: 'string', example: 'securepass123' },
      },
    },
    UpdateProfileBody: {
      type: 'object',
      required: ['name'],
      properties: {
        name:  { type: 'string', minLength: 2, maxLength: 100, example: 'Nguyễn Văn A' },
        phone: { type: 'string', maxLength: 20, example: '0901234567' },
      },
    },
    ChangePasswordBody: {
      type: 'object',
      required: ['currentPassword', 'newPassword'],
      properties: {
        currentPassword: { type: 'string', example: 'matkhaucu' },
        newPassword:     { type: 'string', minLength: 6, maxLength: 100, example: 'matkhaumoi123' },
      },
    },
    ProductCreateBody: {
      type: 'object',
      required: ['name', 'type', 'price', 'category'],
      properties: {
        name:        { type: 'string', example: 'Sofa Module Mới' },
        type:        { type: 'string', example: 'Ghế Sofa' },
        price:       { type: 'integer', example: 15000000 },
        category:    { type: 'string', example: 'Phòng khách' },
        img:         { type: 'string', example: '/images/sofa-new.jpg' },
        stock:       { type: 'integer', example: 20, default: 0 },
        description: { type: 'string', example: 'Mô tả chi tiết sản phẩm...' },
      },
    },
    ProductUpdateBody: {
      type: 'object',
      properties: {
        name:        { type: 'string' },
        type:        { type: 'string' },
        price:       { type: 'integer' },
        category:    { type: 'string' },
        img:         { type: 'string' },
        stock:       { type: 'integer' },
        description: { type: 'string' },
      },
    },
    FlashSaleCreateBody: {
      type: 'object',
      required: ['productId', 'price', 'originalPrice'],
      properties: {
        productId:     { type: 'integer', example: 5 },
        price:         { type: 'integer', description: 'Giá bán flash sale (VND)', example: 11000000 },
        originalPrice: { type: 'integer', description: 'Giá gốc (VND)', example: 16500000 },
        stock:         { type: 'integer', default: 0, example: 80 },
        sold:          { type: 'integer', default: 0, example: 0 },
        startsAt:      { type: 'string', format: 'date-time', example: '2026-07-07T03:20:56.731Z' },
        endsAt:        { type: 'string', format: 'date-time', nullable: true, example: null },
        active:        { type: 'boolean', default: true, example: true },
      },
    },
    FlashSaleUpdateBody: {
      type: 'object',
      properties: {
        productId:     { type: 'integer' },
        price:         { type: 'integer' },
        originalPrice: { type: 'integer' },
        stock:         { type: 'integer' },
        sold:          { type: 'integer' },
        startsAt:      { type: 'string', format: 'date-time' },
        endsAt:        { type: 'string', format: 'date-time', nullable: true },
        active:        { type: 'boolean' },
      },
    },
    CategoryCreateBody: {
      type: 'object',
      required: ['name', 'img'],
      properties: {
        name: { type: 'string', example: 'Đèn trang trí' },
        img:  { type: 'string', example: '/images/catLamp.jpg' },
      },
    },
    CategoryUpdateBody: { type: 'object', properties: { name: { type: 'string' }, img: { type: 'string' } } },
    CollectionCreateBody: {
      type: 'object',
      required: ['name', 'img'],
      properties: {
        name: { type: 'string', example: 'BST MODERN LIVING' },
        img:  { type: 'string', example: '/images/modern.jpg' },
      },
    },
    CollectionUpdateBody: { type: 'object', properties: { name: { type: 'string' }, img: { type: 'string' } } },
    CompanyInfoUpdateBody: {
      type: 'object',
      description: 'Mọi field đều tuỳ chọn — chỉ field có mặt mới được ghi đè. Các URL mạng xã hội nhận chuỗi rỗng để xoá.',
      properties: {
        companyName: { type: 'string', example: 'NAM QUAN' },
        slogan:      { type: 'string', example: 'Nội thất cao cấp' },
        about:       { type: 'string' },
        mission:     { type: 'string' },
        vision:      { type: 'string' },
        phone:       { type: 'string', example: '1900 6789' },
        email:       { type: 'string', format: 'email', example: 'contact@namquan.vn' },
        address:     { type: 'string', example: 'Số 90 Hương Lộ 2, Xã Tân Phú Trung, Huyện Củ Chi, TP. HCM' },
        mapUrl:      {
          type: 'string',
          description: 'Chỉ nhận link /maps/embed (link chia sẻ thường bị Google chặn nhúng). Dán cả đoạn <iframe> Google cho sẵn cũng được — server tự rút src.',
          example: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4',
        },
        facebook:    { type: 'string', example: 'https://facebook.com/namquan' },
        instagram:   { type: 'string', example: 'https://instagram.com/namquan' },
        youtube:     { type: 'string', example: 'https://youtube.com/@namquan' },
        tiktok:      { type: 'string', example: 'https://tiktok.com/@namquan' },
        logo:        { type: 'string', example: '/images/logo.png' },
      },
    },
    NewsStatusBody: {
      type: 'object',
      required: ['status'],
      properties: { status: { type: 'string', enum: ['draft', 'published', 'hidden'], example: 'published' } },
    },
    CartAddBody: {
      type: 'object',
      required: ['productId'],
      properties: {
        productId: { type: 'integer', example: 1 },
        quantity:  { type: 'integer', default: 1, example: 2 },
      },
    },
    CartQuantityBody: {
      type: 'object',
      required: ['quantity'],
      properties: { quantity: { type: 'integer', minimum: 1, example: 3 } },
    },
    OrderCreateBody: {
      type: 'object',
      required: ['shippingAddress', 'items'],
      properties: {
        shippingAddress: { type: 'string', minLength: 10, example: '123 Nguyễn Trãi, Quận 1, TP.HCM' },
        note:  { type: 'string', example: 'Giao buổi sáng, gọi trước 30 phút' },
        items: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['productId', 'quantity'],
            properties: {
              productId: { type: 'integer', example: 1 },
              quantity:  { type: 'integer', minimum: 1, example: 2 },
            },
          },
        },
      },
    },
    OrderStatusBody: {
      type: 'object',
      required: ['status'],
      properties: {
        status: { type: 'string', enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], example: 'confirmed' },
      },
    },
    UserRoleBody: { type: 'object', required: ['role'], properties: { role: { type: 'string', enum: ['customer', 'staff', 'admin'], example: 'staff' } } },
    UserStatusBody: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['active', 'blocked'], example: 'blocked' } } },
    CreateUserBody: {
      type: 'object',
      required: ['name', 'email', 'password'],
      description: 'Quản trị viên tạo sẵn tài khoản rồi bàn giao mật khẩu. Nhân viên không tự đăng ký được vì /auth/register luôn tạo vai trò customer.',
      properties: {
        name:     { type: 'string', minLength: 2, maxLength: 100, example: 'Trần Thị Bình' },
        email:    { type: 'string', format: 'email', example: 'binh.nv@namquan.vn' },
        phone:    { type: 'string', maxLength: 20, example: '0901234567' },
        password: { type: 'string', minLength: 6, maxLength: 100, example: 'namquan@2026' },
        role:     { type: 'string', enum: ['customer', 'staff', 'admin'], default: 'staff', example: 'staff' },
      },
    },
    UploadUrlBody: {
      type: 'object',
      required: ['type', 'mimeType', 'size'],
      properties: {
        type:         { type: 'string', enum: ['news', 'products', 'categories', 'collections', 'settings', 'returns'], description: 'Quyết định thư mục lưu ảnh. Khách hàng chỉ được dùng `returns`.', example: 'products' },
        mimeType:     { type: 'string', enum: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'], example: 'image/png' },
        size:         { type: 'integer', maximum: 5242880, description: 'Kích thước file tính bằng byte, tối đa 5MB', example: 248310 },
        originalName: { type: 'string', maxLength: 255, example: 'sofa-goc.png' },
      },
    },
    ChatSendBody: {
      type: 'object',
      required: ['message'],
      properties: {
        message:   { type: 'string', minLength: 1, maxLength: 2000, example: 'Vòi Rửa Tay Rinto còn hàng không?' },
        productId: { type: 'integer', nullable: true, description: 'Sản phẩm khách đang xem - giúp bot hiểu "cái này" là gì', example: 46 },
      },
    },
    ChatConversationPatchBody: {
      type: 'object',
      minProperties: 1,
      properties: {
        aiEnabled: { type: 'boolean', description: 'Bật/tắt bot trả lời tự động cho hội thoại này', example: false },
        status:    { type: 'string', enum: ['open', 'closed'], example: 'closed' },
      },
    },
    ChatStaffReplyBody: {
      type: 'object',
      required: ['message'],
      properties: {
        message: { type: 'string', minLength: 1, maxLength: 2000, example: 'Dạ em chào anh/chị, em là tư vấn viên của NAM QUAN ạ.' },
      },
    },
    ConsultationRequest: {
      type: 'object',
      description: 'Một yêu cầu tư vấn khách để lại ở form "Để lại thông tin" trang chủ.',
      properties: {
        id:           { type: 'integer', example: 1 },
        name:         { type: 'string', example: 'Trần Thị B' },
        phone:        { type: 'string', description: 'Đã bỏ dấu cách/chấm/gạch khi lưu', example: '0912345678' },
        email:        { type: 'string', description: 'Có thể là chuỗi rỗng nếu khách không nhập', example: 'b@example.com' },
        serviceType:  { type: 'string', example: 'Thiết kế nội thất' },
        propertyType: { type: 'string', example: 'Căn hộ' },
        area:         { type: 'string', example: '85m2' },
        budget:       { type: 'string', example: '200 - 300 triệu' },
        address:      { type: 'string', example: 'Quận 2, TP. Hồ Chí Minh' },
        message:      { type: 'string', example: 'Cần tư vấn thiết kế căn hộ.' },
        status:       { type: 'string', enum: ['new', 'contacted', 'quoted', 'closed', 'cancelled'], example: 'new' },
        createdAt:    { type: 'string', format: 'date-time' },
        updatedAt:    { type: 'string', format: 'date-time' },
      },
    },
    ConsultationInput: {
      type: 'object',
      required: ['name', 'phone'],
      description: 'Chỉ họ tên và số điện thoại là bắt buộc; các trường còn lại bỏ trống sẽ lưu chuỗi rỗng.',
      properties: {
        name:         { type: 'string', minLength: 2, maxLength: 100, example: 'Trần Thị B' },
        phone:        { type: 'string', description: 'Chấp nhận dấu cách/chấm/gạch, server tự chuẩn hoá. 9-15 chữ số.', example: '0912 345 678' },
        email:        { type: 'string', maxLength: 255, example: 'b@example.com' },
        serviceType:  { type: 'string', maxLength: 100, example: 'Thiết kế nội thất' },
        propertyType: { type: 'string', maxLength: 100, example: 'Căn hộ' },
        area:         { type: 'string', maxLength: 100, example: '85m2' },
        budget:       { type: 'string', maxLength: 100, example: '200 - 300 triệu' },
        address:      { type: 'string', maxLength: 500, example: 'Quận 2, TP. Hồ Chí Minh' },
        message:      { type: 'string', maxLength: 2000, example: 'Cần tư vấn thiết kế căn hộ.' },
      },
    },
    ConsultationStatusBody: {
      type: 'object',
      required: ['status'],
      properties: {
        status: { type: 'string', enum: ['new', 'contacted', 'quoted', 'closed', 'cancelled'], example: 'contacted' },
      },
    },
    OrderReturn: {
      type: 'object',
      properties: {
        id:        { type: 'integer', example: 12 },
        orderId:   { type: 'string', format: 'uuid', example: 'ord-uuid-here' },
        type:      { type: 'string', enum: ['return', 'exchange'], description: 'return = trả hàng lấy lại tiền · exchange = đổi sang sản phẩm khác', example: 'return' },
        reason:    { type: 'string', example: 'Ghế bị gãy chân khi nhận hàng' },
        images:    { type: 'array', items: { type: 'string' }, description: 'Object key trong MinIO', example: ['returns/9f1c.jpg', 'returns/2a7d.jpg'] },
        imageUrls: { type: 'array', items: { type: 'string' }, description: 'URL công khai ghép sẵn từ images — dùng để hiển thị', example: ['http://localhost:9000/namquan/returns/9f1c.jpg'] },
        status:    { type: 'string', enum: ['pending', 'approved', 'rejected', 'completed'], example: 'pending' },
        adminNote: { type: 'string', description: 'Phản hồi của cửa hàng, khách đọc được. Bắt buộc khi từ chối.', example: '' },
        resolvedAt: { type: 'string', format: 'date-time', nullable: true, description: 'Thời điểm chốt (completed hoặc rejected); null nghĩa là còn đang xử lý', example: null },
        createdAt: { type: 'string', format: 'date-time', example: '2026-08-14T10:00:00.000Z' },
        updatedAt: { type: 'string', format: 'date-time', example: '2026-08-14T10:00:00.000Z' },
        orderTotal:         { type: 'integer', description: 'Kèm sẵn thông tin đơn để trang quản trị khỏi gọi thêm API', example: 37800000 },
        orderStatus:        { type: 'string', example: 'delivered' },
        orderPaymentStatus: { type: 'string', example: 'paid' },
        orderCreatedAt:     { type: 'string', format: 'date-time' },
        customerName:       { type: 'string', example: 'Nguyễn Văn An' },
        customerEmail:      { type: 'string', format: 'email', example: 'an@example.com' },
        customerPhone:      { type: 'string', example: '0901234567' },
      },
    },
    CreateReturnBody: {
      type: 'object',
      required: ['orderId', 'type', 'reason', 'images'],
      properties: {
        orderId: { type: 'string', format: 'uuid', example: 'ord-uuid-here' },
        type:    { type: 'string', enum: ['return', 'exchange'], example: 'return' },
        reason:  { type: 'string', minLength: 10, maxLength: 500, example: 'Ghế bị gãy chân khi nhận hàng' },
        images: {
          type: 'array',
          minItems: 2,
          maxItems: 5,
          description: 'Object key lấy từ POST /uploads/image-url với type=returns. Chỉ nhận key thuộc thư mục returns/, không nhận URL ngoài.',
          items: { type: 'string', pattern: '^returns/[\\w.-]+$' },
          example: ['returns/9f1c.jpg', 'returns/2a7d.jpg'],
        },
      },
    },
    UpdateReturnStatusBody: {
      type: 'object',
      description: 'Cần ít nhất một trong hai trường. Từ chối thì adminNote là bắt buộc.',
      properties: {
        status:    { type: 'string', enum: ['approved', 'rejected', 'completed'], example: 'approved' },
        adminNote: { type: 'string', maxLength: 500, example: 'Đã xác minh ảnh, hàng lỗi do vận chuyển' },
      },
    },
    OrderReturnListResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data:    { type: 'array', items: { $ref: '#/components/schemas/OrderReturn' } },
        meta: {
          type: 'object',
          properties: {
            total:      { type: 'integer', example: 1 },
            page:       { type: 'integer', example: 1 },
            limit:      { type: 'integer', example: 15 },
            totalPages: { type: 'integer', example: 1 },
          },
        },
      },
    },
    ConsultationListResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data:    { type: 'array', items: { $ref: '#/components/schemas/ConsultationRequest' } },
        meta: {
          type: 'object',
          properties: {
            total:      { type: 'integer', example: 1 },
            page:       { type: 'integer', example: 1 },
            limit:      { type: 'integer', example: 20 },
            totalPages: { type: 'integer', example: 1 },
          },
        },
      },
    },
  },
  responses: {
    Unauthorized: {
      description: 'Chưa đăng nhập hoặc token không hợp lệ',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
    },
    Forbidden: {
      description: 'Không có quyền truy cập',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
    },
    NotFound: {
      description: 'Không tìm thấy tài nguyên',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
    },
    ValidationError: {
      description: 'Dữ liệu không hợp lệ',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationErrorResponse' } } },
    },
  },
};
