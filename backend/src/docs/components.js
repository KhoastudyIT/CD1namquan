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
        role:      { type: 'string', enum: ['customer', 'admin'], example: 'customer' },
        status:    { type: 'string', enum: ['active', 'suspended'], example: 'active' },
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
        status:          { type: 'string', enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], example: 'pending' },
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
    UserRoleBody: { type: 'object', required: ['role'], properties: { role: { type: 'string', enum: ['customer', 'admin'], example: 'admin' } } },
    UserStatusBody: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['active', 'suspended'], example: 'suspended' } } },
    UploadUrlBody: {
      type: 'object',
      required: ['type', 'mimeType', 'size'],
      properties: {
        type:         { type: 'string', enum: ['news', 'products', 'categories', 'collections'], description: 'Quyết định thư mục lưu ảnh', example: 'products' },
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
