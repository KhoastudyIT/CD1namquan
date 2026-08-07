import { apiReference } from '@scalar/express-api-reference';

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'NAM QUAN — Furniture Store API',
    version: '1.0.0',
    description: `## API cho ứng dụng thương mại điện tử nội thất **NAM QUAN**

### Tính năng
- Xác thực người dùng với JWT Bearer Token
- Quản lý sản phẩm, danh mục & bộ sưu tập
- Flash sale theo thời gian thực
- Giỏ hàng & đặt hàng
- Tin tức & blog
- Chat tư vấn với bot tự động và nhân viên

### Xác thực
Các endpoint có **khóa** yêu cầu header:
\`\`\`
Authorization: Bearer <token>
\`\`\`
Token nhận được từ \`POST /api/v1/auth/login\` hoặc \`POST /api/v1/auth/register\`.`,
    contact: { name: 'NAM QUAN Support', email: 'support@namquan.vn' },
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Development' },
  ],
  tags: [
    { name: 'Auth',        description: 'Đăng ký, đăng nhập, thông tin tài khoản' },
    { name: 'Products',    description: 'Sản phẩm nội thất — xem & quản lý' },
    { name: 'Categories',  description: 'Danh mục sản phẩm' },
    { name: 'Collections', description: 'Bộ sưu tập nội thất' },
    { name: 'News',        description: 'Tin tức và bài viết — danh mục, tag, trạng thái nháp/đăng/ẩn và SEO' },
    { name: 'Cart',        description: 'Giỏ hàng — yêu cầu đăng nhập' },
    { name: 'Orders',      description: 'Đơn hàng — yêu cầu đăng nhập' },
    { name: 'Notifications', description: 'Thông báo theo từng tài khoản' },
    { name: 'Chat',        description: 'Chat tư vấn — khách hàng nhắn, bot trả lời tự động theo dữ liệu sản phẩm thật, nhân viên tiếp quản khi cần' },
    { name: 'Users',       description: '[Admin] Quản lý người dùng — danh sách, phân quyền, khóa/mở' },
    { name: 'Stats',       description: '[Admin] Thống kê & báo cáo cho dashboard' },
    { name: 'Uploads',     description: '[Admin] Tải ảnh lên MinIO qua URL có chữ ký' },
  ],
  components: {
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
        description: 'Thẻ sản phẩm bot đính kèm câu trả lời — bấm vào mở trang chi tiết.',
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
  },
  paths: {
    // ─── AUTH ────────────────────────────────────────────────────────────────
    '/api/v1/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Đăng ký tài khoản',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name:     { type: 'string', minLength: 2, example: 'Nguyễn Văn An' },
                  email:    { type: 'string', format: 'email', example: 'an@example.com' },
                  password: { type: 'string', minLength: 6, example: 'securepass123' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Đăng ký thành công — trả về user + token',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    { properties: { data: { $ref: '#/components/schemas/AuthResponse' } } },
                  ],
                },
                example: {
                  success: true, message: 'Đăng ký thành công',
                  data: {
                    user: { id: 'uuid', name: 'Nguyễn Văn An', email: 'an@example.com', role: 'customer', createdAt: '2026-06-16T10:00:00.000Z' },
                    token: 'eyJhbGci...',
                  },
                },
              },
            },
          },
          '409': { description: 'Email đã tồn tại', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Đăng nhập',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email:    { type: 'string', format: 'email', example: 'an@example.com' },
                  password: { type: 'string', example: 'securepass123' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Đăng nhập thành công — trả về user + token',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    { properties: { data: { $ref: '#/components/schemas/AuthResponse' } } },
                  ],
                },
              },
            },
          },
          '401': { description: 'Sai email hoặc mật khẩu', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/api/v1/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Lấy thông tin người dùng hiện tại',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Thông tin tài khoản',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    { properties: { data: { $ref: '#/components/schemas/User' } } },
                  ],
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      put: {
        tags: ['Auth'],
        summary: 'Cập nhật thông tin cá nhân',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name:  { type: 'string', minLength: 2, maxLength: 100, example: 'Nguyễn Văn A' },
                  phone: { type: 'string', maxLength: 20, example: '0901234567' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Thông tin sau khi cập nhật',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    { properties: { data: { $ref: '#/components/schemas/User' } } },
                  ],
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/api/v1/auth/password': {
      put: {
        tags: ['Auth'],
        summary: 'Đổi mật khẩu',
        description: 'Cần mật khẩu hiện tại. Mật khẩu mới phải khác mật khẩu đang dùng.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string', example: 'matkhaucu' },
                  newPassword:     { type: 'string', minLength: 6, maxLength: 100, example: 'matkhaumoi123' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Đổi mật khẩu thành công', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          '400': { description: 'Mật khẩu hiện tại sai, hoặc mật khẩu mới trùng mật khẩu cũ', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/api/v1/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Đăng xuất',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Đăng xuất thành công', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    // ─── PRODUCTS ────────────────────────────────────────────────────────────
    '/api/v1/products': {
      get: {
        tags: ['Products'],
        summary: 'Danh sách sản phẩm (có lọc & phân trang)',
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string' },           description: 'Lọc theo danh mục (vd: Phòng khách, Phòng ngủ)' },
          { name: 'type',     in: 'query', schema: { type: 'string' },           description: 'Lọc theo loại sản phẩm (vd: Ghế Sofa, Giường)' },
          { name: 'search',   in: 'query', schema: { type: 'string' },           description: 'Tìm kiếm theo tên sản phẩm' },
          { name: 'sort',     in: 'query', schema: { type: 'string', enum: ['price_asc', 'price_desc', 'rating', 'sold', 'newest'], default: 'newest' }, description: 'Sắp xếp' },
          { name: 'page',     in: 'query', schema: { type: 'integer', minimum: 1, default: 1 },   description: 'Trang hiện tại' },
          { name: 'limit',    in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 12 }, description: 'Số sản phẩm mỗi trang' },
          { name: 'priceMin', in: 'query', schema: { type: 'integer', minimum: 0 }, description: 'Giá tối thiểu (VND)' },
          { name: 'priceMax', in: 'query', schema: { type: 'integer', minimum: 1 }, description: 'Giá tối đa (VND)' },
          { name: 'colors',   in: 'query', schema: { type: 'string' }, description: 'Lọc theo màu, nhiều giá trị cách nhau bởi dấu phẩy (vd: be,nau)' },
          { name: 'styles',   in: 'query', schema: { type: 'string' }, description: 'Lọc theo phong cách, cách nhau bởi dấu phẩy (vd: Luxury,Hiện đại)' },
          { name: 'materials',in: 'query', schema: { type: 'string' }, description: 'Lọc theo chất liệu, cách nhau bởi dấu phẩy' },
          { name: 'sizes',    in: 'query', schema: { type: 'string' }, description: 'Lọc theo kích thước, cách nhau bởi dấu phẩy' },
          { name: 'brands',   in: 'query', schema: { type: 'string' }, description: 'Lọc theo thương hiệu, cách nhau bởi dấu phẩy' },
        ],
        responses: {
          '200': {
            description: 'Danh sách sản phẩm có phân trang',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ProductListResponse' } } },
          },
        },
      },
      post: {
        tags: ['Products'],
        summary: 'Tạo sản phẩm mới',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
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
            },
          },
        },
        responses: {
          '201': {
            description: 'Tạo sản phẩm thành công',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    { properties: { data: { $ref: '#/components/schemas/Product' } } },
                  ],
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/api/v1/products/flash-sales': {
      get: {
        tags: ['Products'],
        summary: 'Sản phẩm flash sale',
        responses: {
          '200': {
            description: 'Danh sách sản phẩm đang flash sale',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    { properties: { data: { type: 'array', items: { $ref: '#/components/schemas/FlashSaleProduct' } } } },
                  ],
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/products/flash-sales/admin': {
      get: {
        tags: ['Products'],
        summary: '[Admin] Danh sách tất cả Flash Sale',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Danh sách toàn bộ Flash Sale (cả active & inactive)',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    { properties: { data: { type: 'array', items: { $ref: '#/components/schemas/AdminFlashSaleProduct' } } } },
                  ],
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        tags: ['Products'],
        summary: '[Admin] Thêm sản phẩm Flash Sale mới',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
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
            },
          },
        },
        responses: {
          '201': {
            description: 'Tạo Flash Sale thành công',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    { properties: { data: { type: 'object', properties: { id: { type: 'integer', example: 101 } } } } },
                  ],
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/api/v1/products/flash-sales/admin/{id}': {
      put: {
        tags: ['Products'],
        summary: '[Admin] Cập nhật chương trình Flash Sale',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 101 }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
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
            },
          },
        },
        responses: {
          '200': {
            description: 'Cập nhật thành công',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    { properties: { data: { type: 'object', properties: { id: { type: 'integer', example: 101 } } } } },
                  ],
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
      delete: {
        tags: ['Products'],
        summary: '[Admin] Xóa chương trình Flash Sale',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 101 }],
        responses: {
          '204': { description: 'Xóa thành công' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/v1/products/{id}': {
      get: {
        tags: ['Products'],
        summary: 'Chi tiết sản phẩm',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1 }],
        responses: {
          '200': {
            description: 'Chi tiết sản phẩm',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    { properties: { data: { $ref: '#/components/schemas/Product' } } },
                  ],
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Products'],
        summary: 'Cập nhật sản phẩm',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1 }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
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
            },
          },
        },
        responses: {
          '200': {
            description: 'Cập nhật thành công',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    { properties: { data: { $ref: '#/components/schemas/Product' } } },
                  ],
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
      delete: {
        tags: ['Products'],
        summary: 'Xóa sản phẩm',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1 }],
        responses: {
          '204': { description: 'Xóa thành công' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ─── CATEGORIES ──────────────────────────────────────────────────────────
    '/api/v1/categories': {
      get: {
        tags: ['Categories'],
        summary: 'Danh sách danh mục',
        responses: {
          '200': {
            description: 'Danh sách danh mục sản phẩm',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    { properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Category' } } } },
                  ],
                },
                example: {
                  success: true, message: 'Success',
                  data: [
                    { id: 1, name: 'Sofa', img: '/images/catSofa.jpg' },
                    { id: 2, name: 'Ghế', img: '/images/catChair.jpg' },
                  ],
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Categories'],
        summary: '[Admin] Tạo danh mục',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'img'],
                properties: {
                  name: { type: 'string', example: 'Đèn trang trí' },
                  img:  { type: 'string', example: '/images/catLamp.jpg' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Đã tạo danh mục', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/SuccessResponse' }, { properties: { data: { $ref: '#/components/schemas/Category' } } }] } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/api/v1/categories/{id}': {
      put: {
        tags: ['Categories'],
        summary: '[Admin] Cập nhật danh mục',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1 }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, img: { type: 'string' } } } } },
        },
        responses: {
          '200': { description: 'Đã cập nhật', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/SuccessResponse' }, { properties: { data: { $ref: '#/components/schemas/Category' } } }] } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Categories'],
        summary: '[Admin] Xóa danh mục',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1 }],
        responses: {
          '204': { description: 'Đã xóa' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ─── COLLECTIONS ─────────────────────────────────────────────────────────
    '/api/v1/collections': {
      get: {
        tags: ['Collections'],
        summary: 'Danh sách bộ sưu tập',
        responses: {
          '200': {
            description: 'Danh sách bộ sưu tập',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    { properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Collection' } } } },
                  ],
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Collections'],
        summary: '[Admin] Tạo bộ sưu tập',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'img'],
                properties: {
                  name: { type: 'string', example: 'BST MODERN LIVING' },
                  img:  { type: 'string', example: '/images/modern.jpg' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Đã tạo bộ sưu tập', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/SuccessResponse' }, { properties: { data: { $ref: '#/components/schemas/Collection' } } }] } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/api/v1/collections/{id}': {
      put: {
        tags: ['Collections'],
        summary: '[Admin] Cập nhật bộ sưu tập',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1 }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, img: { type: 'string' } } } } },
        },
        responses: {
          '200': { description: 'Đã cập nhật', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/SuccessResponse' }, { properties: { data: { $ref: '#/components/schemas/Collection' } } }] } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Collections'],
        summary: '[Admin] Xóa bộ sưu tập',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1 }],
        responses: {
          '204': { description: 'Đã xóa' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ─── NEWS ────────────────────────────────────────────────────────────────
    '/api/v1/news': {
      get: {
        tags: ['News'],
        summary: 'Danh sách bài viết đã đăng',
        description: 'Chỉ trả về bài có `status = published`. Không kèm `content` — dùng `GET /news/{idOrSlug}` để lấy nội dung đầy đủ.',
        parameters: [
          { name: 'page',     in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          { name: 'limit',    in: 'query', schema: { type: 'integer', minimum: 1, maximum: 50, default: 9 } },
          { name: 'search',   in: 'query', description: 'Tìm trong tiêu đề và mô tả ngắn, bỏ qua dấu tiếng Việt', schema: { type: 'string' }, example: 'noi that' },
          { name: 'category', in: 'query', description: 'Slug danh mục', schema: { type: 'string' }, example: 'meo-bai-tri' },
          { name: 'tag',      in: 'query', schema: { type: 'string' }, example: 'sofa' },
          { name: 'featured', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } },
          { name: 'sort',     in: 'query', schema: { type: 'string', enum: ['newest', 'oldest', 'popular'], default: 'newest' } },
        ],
        responses: {
          '200': {
            description: 'Danh sách bài viết (có phân trang)',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/NewsListResponse' } } },
          },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
      post: {
        tags: ['News'],
        summary: '[Admin] Tạo bài viết',
        description: 'Mặc định lưu ở trạng thái `draft` nếu không truyền `status`.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/NewsInput' } } },
        },
        responses: {
          '201': { description: 'Đã tạo bài viết', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/SuccessResponse' }, { properties: { data: { $ref: '#/components/schemas/NewsArticle' } } }] } } } },
          '400': { description: 'Danh mục không tồn tại' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/api/v1/news/categories': {
      get: {
        tags: ['News'],
        summary: 'Danh mục bài viết',
        description: 'Kèm số bài đã đăng theo từng danh mục — dùng cho bộ lọc ở trang tin tức và dropdown ở dashboard.',
        responses: {
          '200': {
            description: 'Danh sách danh mục',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    { properties: { data: { type: 'array', items: { $ref: '#/components/schemas/NewsCategory' } } } },
                  ],
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/news/admin/list': {
      get: {
        tags: ['News'],
        summary: '[Admin] Danh sách bài viết (mọi trạng thái)',
        description: 'Gồm cả bản nháp và bài đã ẩn. Không kèm `content`.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page',     in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          { name: 'limit',    in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 } },
          { name: 'status',   in: 'query', schema: { type: 'string', enum: ['draft', 'published', 'hidden'] } },
          { name: 'search',   in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', description: 'Slug danh mục', schema: { type: 'string' } },
          { name: 'tag',      in: 'query', schema: { type: 'string' } },
          { name: 'featured', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } },
          { name: 'sort',     in: 'query', schema: { type: 'string', enum: ['newest', 'oldest', 'popular'], default: 'newest' } },
        ],
        responses: {
          '200': { description: 'Danh sách bài viết (có phân trang)', content: { 'application/json': { schema: { $ref: '#/components/schemas/NewsListResponse' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/v1/news/admin/{id}': {
      get: {
        tags: ['News'],
        summary: '[Admin] Chi tiết bài viết để chỉnh sửa',
        description: 'Trả về bài ở mọi trạng thái, kèm `content` đầy đủ. Không tăng lượt xem.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1 }],
        responses: {
          '200': { description: 'Chi tiết bài viết', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/SuccessResponse' }, { properties: { data: { $ref: '#/components/schemas/NewsArticle' } } }] } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/v1/news/{idOrSlug}': {
      get: {
        tags: ['News'],
        summary: 'Chi tiết bài viết',
        description: 'Nhận cả id lẫn slug. Chỉ trả bài đã đăng và tự tăng `views` mỗi lượt gọi.',
        parameters: [{ name: 'idOrSlug', in: 'path', required: true, schema: { type: 'string' }, example: 'xu-huong-noi-that-2026-tinh-te-ben-vung' }],
        responses: {
          '200': { description: 'Chi tiết bài viết', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/SuccessResponse' }, { properties: { data: { $ref: '#/components/schemas/NewsArticle' } } }] } } } },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/v1/news/{idOrSlug}/related': {
      get: {
        tags: ['News'],
        summary: 'Bài viết liên quan',
        description: 'Ưu tiên bài cùng danh mục, thiếu thì bù bằng bài mới nhất — luôn trả đủ `limit` bài nếu còn bài khác.',
        parameters: [
          { name: 'idOrSlug', in: 'path', required: true, schema: { type: 'string' }, example: 'xu-huong-noi-that-2026-tinh-te-ben-vung' },
          { name: 'limit',    in: 'query', schema: { type: 'integer', minimum: 1, maximum: 12, default: 3 } },
        ],
        responses: {
          '200': { description: 'Danh sách bài liên quan', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/SuccessResponse' }, { properties: { data: { type: 'array', items: { $ref: '#/components/schemas/NewsArticle' } } } }] } } } },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/v1/news/{id}': {
      put: {
        tags: ['News'],
        summary: '[Admin] Cập nhật bài viết',
        description: 'Cập nhật từng phần — chỉ gửi trường cần đổi. Slug chỉ thay đổi khi truyền `slug` tường minh, đổi tiêu đề không phá URL đã công bố.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1 }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/NewsInput' }, { required: [] }] } } },
        },
        responses: {
          '200': { description: 'Đã cập nhật', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/SuccessResponse' }, { properties: { data: { $ref: '#/components/schemas/NewsArticle' } } }] } } } },
          '400': { description: 'Danh mục không tồn tại' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
      delete: {
        tags: ['News'],
        summary: '[Admin] Xóa bài viết',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1 }],
        responses: {
          '204': { description: 'Đã xóa' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/v1/news/{id}/status': {
      patch: {
        tags: ['News'],
        summary: '[Admin] Đổi trạng thái bài viết',
        description: 'Đăng / gỡ / chuyển về nháp ngay từ bảng danh sách, không cần mở form sửa.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1 }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: { status: { type: 'string', enum: ['draft', 'published', 'hidden'], example: 'published' } },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Đã đổi trạng thái', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/SuccessResponse' }, { properties: { data: { $ref: '#/components/schemas/NewsArticle' } } }] } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },

    // ─── CART ────────────────────────────────────────────────────────────────
    '/api/v1/cart': {
      get: {
        tags: ['Cart'],
        summary: 'Xem giỏ hàng',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Giỏ hàng hiện tại',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    { properties: { data: { $ref: '#/components/schemas/Cart' } } },
                  ],
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      delete: {
        tags: ['Cart'],
        summary: 'Xóa toàn bộ giỏ hàng',
        security: [{ bearerAuth: [] }],
        responses: {
          '204': { description: 'Đã xóa giỏ hàng' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/v1/cart/items': {
      post: {
        tags: ['Cart'],
        summary: 'Thêm sản phẩm vào giỏ',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['productId'],
                properties: {
                  productId: { type: 'integer', example: 1 },
                  quantity:  { type: 'integer', default: 1, example: 2 },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Giỏ hàng sau khi thêm',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    { properties: { data: { $ref: '#/components/schemas/Cart' } } },
                  ],
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/api/v1/cart/items/{productId}': {
      put: {
        tags: ['Cart'],
        summary: 'Cập nhật số lượng sản phẩm trong giỏ',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'integer' }, example: 1 }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['quantity'],
                properties: { quantity: { type: 'integer', minimum: 1, example: 3 } },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Giỏ hàng sau khi cập nhật',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    { properties: { data: { $ref: '#/components/schemas/Cart' } } },
                  ],
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
      delete: {
        tags: ['Cart'],
        summary: 'Xóa một sản phẩm khỏi giỏ',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'integer' }, example: 1 }],
        responses: {
          '200': {
            description: 'Giỏ hàng sau khi xóa',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    { properties: { data: { $ref: '#/components/schemas/Cart' } } },
                  ],
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    // ─── ORDERS ──────────────────────────────────────────────────────────────
    '/api/v1/orders': {
      get: {
        tags: ['Orders'],
        summary: 'Lịch sử đơn hàng của tôi',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Danh sách đơn hàng (mới nhất trước)',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    { properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Order' } } } },
                  ],
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Orders'],
        summary: 'Đặt hàng',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
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
              example: {
                shippingAddress: '123 Nguyễn Trãi, Quận 1, TP.HCM',
                note: 'Giao buổi sáng',
                items: [
                  { productId: 1, quantity: 1 },
                  { productId: 6, quantity: 2 },
                ],
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Đặt hàng thành công',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    { properties: { data: { $ref: '#/components/schemas/Order' } } },
                  ],
                },
              },
            },
          },
          '400': { description: 'Sản phẩm hết hàng hoặc lỗi nghiệp vụ', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/api/v1/orders/{id}': {
      get: {
        tags: ['Orders'],
        summary: 'Chi tiết đơn hàng',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Order UUID' }],
        responses: {
          '200': {
            description: 'Chi tiết đơn hàng',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    { properties: { data: { $ref: '#/components/schemas/Order' } } },
                  ],
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/v1/orders/admin/list': {
      get: {
        tags: ['Orders'],
        summary: '[Admin] Danh sách tất cả đơn hàng',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Tất cả đơn hàng kèm thông tin khách (mới nhất trước)',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    { properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Order' } } } },
                  ],
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/v1/orders/{id}/status': {
      put: {
        tags: ['Orders'],
        summary: '[Admin] Cập nhật trạng thái đơn hàng',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Order UUID' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], example: 'confirmed' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Đã cập nhật trạng thái',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    { properties: { data: { $ref: '#/components/schemas/Order' } } },
                  ],
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    // ─── USERS (Admin) ───────────────────────────────────────────────────────
    '/api/v1/users': {
      get: {
        tags: ['Users'],
        summary: '[Admin] Danh sách người dùng (lọc & phân trang)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Tìm theo tên hoặc email' },
          { name: 'role',   in: 'query', schema: { type: 'string', enum: ['customer', 'admin'] }, description: 'Lọc theo quyền' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'suspended'] }, description: 'Lọc theo trạng thái' },
          { name: 'page',   in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          { name: 'limit',  in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
        ],
        responses: {
          '200': { description: 'Danh sách người dùng có phân trang', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserListResponse' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/v1/users/{id}': {
      get: {
        tags: ['Users'],
        summary: '[Admin] Chi tiết người dùng',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Thông tin người dùng', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/SuccessResponse' }, { properties: { data: { $ref: '#/components/schemas/User' } } }] } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/v1/users/{id}/role': {
      put: {
        tags: ['Users'],
        summary: '[Admin] Phân quyền người dùng (không thể tự đổi quyền mình)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['role'], properties: { role: { type: 'string', enum: ['customer', 'admin'], example: 'admin' } } } } },
        },
        responses: {
          '200': { description: 'Đã cập nhật quyền', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/SuccessResponse' }, { properties: { data: { $ref: '#/components/schemas/User' } } }] } } } },
          '400': { description: 'Không thể tự thay đổi quyền của chính mình', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/api/v1/users/{id}/status': {
      put: {
        tags: ['Users'],
        summary: '[Admin] Khóa/mở khóa tài khoản (không thể tự khóa mình)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['active', 'suspended'], example: 'suspended' } } } } },
        },
        responses: {
          '200': { description: 'Đã cập nhật trạng thái', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/SuccessResponse' }, { properties: { data: { $ref: '#/components/schemas/User' } } }] } } } },
          '400': { description: 'Không thể tự khóa tài khoản của chính mình', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },

    // ─── UPLOADS (Admin) ───────────────────────────────────────────────────────
    '/api/v1/uploads/image-url': {
      post: {
        tags: ['Uploads'],
        summary: '[Admin] Xin URL tải ảnh lên',
        description:
          'Bước 1 của luồng tải ảnh 2 bước, dùng chung cho ảnh bài viết, sản phẩm, danh mục và bộ sưu tập.\n\n'
          + '1. Gọi endpoint này để lấy `uploadUrl` có chữ ký (hết hạn sau 1 giờ).\n'
          + '2. `PUT` file thẳng lên `uploadUrl` với header `Content-Type` **đúng bằng** `mimeType` đã khai báo — '
          + 'file đi trực tiếp lên MinIO, không qua backend.\n'
          + '3. Lưu `publicUrl` vào trường `img` của thực thể tương ứng.\n\n'
          + 'Tên file client gửi lên chỉ dùng để suy ra đuôi file; object key luôn do server sinh bằng UUID '
          + 'nên không thể ghi đè file khác hay thoát ra ngoài thư mục cho phép.\n\n'
          + 'Trả **503** nếu backend chưa cấu hình MinIO (xem `MINIO_*` trong `backend/.env.example`).',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['type', 'mimeType', 'size'],
                properties: {
                  type:         { type: 'string', enum: ['news', 'products', 'categories', 'collections'], description: 'Quyết định thư mục lưu ảnh', example: 'products' },
                  mimeType:     { type: 'string', enum: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'], example: 'image/png' },
                  size:         { type: 'integer', maximum: 5242880, description: 'Kích thước file tính bằng byte, tối đa 5MB', example: 248310 },
                  originalName: { type: 'string', maxLength: 255, example: 'sofa-goc.png' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'URL tải lên đã ký',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            uploadUrl: { type: 'string', description: 'PUT file lên đây', example: 'http://localhost:9000/namquan/products/e066e334-....png?X-Amz-Signature=...' },
                            objectKey: { type: 'string', example: 'products/e066e334-f454-487b-b1cd-c0f94d66be58.png' },
                            publicUrl: { type: 'string', description: 'Lưu giá trị này vào trường `img`', example: 'http://localhost:9000/namquan/products/e066e334-f454-487b-b1cd-c0f94d66be58.png' },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '422': { $ref: '#/components/responses/ValidationError' },
          '503': { description: 'Backend chưa cấu hình MinIO' },
        },
      },
    },

    // ─── STATS (Admin) ─────────────────────────────────────────────────────────
    '/api/v1/stats/overview': {
      get: {
        tags: ['Stats'],
        summary: '[Admin] Số liệu tổng quan cho dashboard',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Thống kê tổng quan', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/SuccessResponse' }, { properties: { data: { $ref: '#/components/schemas/StatsOverview' } } }] } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },

    '/api/v1/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'Danh sách thông báo của tôi',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Thông báo của người dùng (mới nhất trước)',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/v1/notifications/read-all': {
      put: {
        tags: ['Notifications'],
        summary: 'Đánh dấu tất cả đã đọc',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Đã đánh dấu tất cả đã đọc', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/v1/notifications/{id}/read': {
      put: {
        tags: ['Notifications'],
        summary: 'Đánh dấu một thông báo đã đọc',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Notification UUID' }],
        responses: {
          '200': { description: 'Đã đánh dấu đã đọc', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ── Chat: phía khách hàng ────────────────────────────────────────────
    '/api/v1/chat/conversation': {
      get: {
        tags: ['Chat'],
        summary: 'Mở khung chat của tôi',
        description: 'Trả hội thoại duy nhất của khách kèm toàn bộ tin nhắn. Lần đầu gọi sẽ tự tạo hội thoại và lời chào của bot.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Hội thoại và lịch sử tin nhắn',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            conversation: {
                              type: 'object',
                              properties: {
                                id:             { type: 'integer', example: 4 },
                                status:         { type: 'string', enum: ['open', 'closed'], example: 'open' },
                                aiEnabled:      { type: 'boolean', example: true },
                                customerUnread: { type: 'integer', example: 0 },
                              },
                            },
                            messages: { type: 'array', items: { $ref: '#/components/schemas/ChatMessage' } },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/v1/chat/messages': {
      get: {
        tags: ['Chat'],
        summary: 'Lấy tin nhắn mới (polling)',
        description: 'Dùng `after` để chỉ lấy phần tin mới hơn id client đang có. Frontend poll 4 giây khi khung chat mở, 30 giây khi đóng.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'after', in: 'query', required: false, schema: { type: 'integer', default: 0 }, description: 'Id tin nhắn cuối client đang có' },
        ],
        responses: {
          '200': {
            description: 'Tin nhắn mới hơn `after`',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            messages:       { type: 'array', items: { $ref: '#/components/schemas/ChatMessage' } },
                            aiEnabled:      { type: 'boolean', example: true },
                            status:         { type: 'string', enum: ['open', 'closed'], example: 'open' },
                            customerUnread: { type: 'integer', example: 1 },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Chat'],
        summary: 'Khách gửi tin nhắn',
        description: 'Trả về tin của khách, kèm phản hồi bot nếu `aiEnabled` đang bật (khi đó mảng có 2 phần tử). Hội thoại đã đóng sẽ tự mở lại.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: {
                  message:   { type: 'string', minLength: 1, maxLength: 2000, example: 'Vòi Rửa Tay Rinto còn hàng không?' },
                  productId: { type: 'integer', nullable: true, description: 'Sản phẩm khách đang xem — giúp bot hiểu "cái này" là gì', example: 46 },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Đã gửi. Mảng gồm tin của khách và (nếu bot đang bật) tin trả lời của bot.',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            messages: { type: 'array', items: { $ref: '#/components/schemas/ChatMessage' } },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/api/v1/chat/read': {
      put: {
        tags: ['Chat'],
        summary: 'Khách đánh dấu đã đọc',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Đã xoá badge chưa đọc phía khách', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    // ── Chat: phía quản trị ──────────────────────────────────────────────
    '/api/v1/chat/admin/conversations': {
      get: {
        tags: ['Chat'],
        summary: '[Admin] Danh sách hội thoại',
        description: 'Sắp xếp theo tin nhắn mới nhất, tối đa 100 hội thoại.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', required: false, schema: { type: 'string', enum: ['open', 'closed'] }, description: 'Bỏ trống để lấy tất cả' },
          { name: 'search', in: 'query', required: false, schema: { type: 'string' }, description: 'Tìm theo tên hoặc email khách' },
        ],
        responses: {
          '200': {
            description: 'Danh sách hội thoại',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    { properties: { data: { type: 'array', items: { $ref: '#/components/schemas/ChatConversation' } } } },
                  ],
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/v1/chat/admin/conversations/{id}': {
      get: {
        tags: ['Chat'],
        summary: '[Admin] Xem nội dung một hội thoại',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Id hội thoại' },
          { name: 'after', in: 'query', required: false, schema: { type: 'integer', default: 0 }, description: 'Chỉ lấy tin mới hơn id này (polling)' },
        ],
        responses: {
          '200': {
            description: 'Hội thoại và tin nhắn',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            conversation: { $ref: '#/components/schemas/ChatConversation' },
                            messages:     { type: 'array', items: { $ref: '#/components/schemas/ChatMessage' } },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['Chat'],
        summary: '[Admin] Bật/tắt bot hoặc đóng/mở hội thoại',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          description: 'Gửi ít nhất một trong hai trường.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                minProperties: 1,
                properties: {
                  aiEnabled: { type: 'boolean', description: 'Bật/tắt bot trả lời tự động cho hội thoại này', example: false },
                  status:    { type: 'string', enum: ['open', 'closed'], example: 'closed' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Hội thoại sau khi cập nhật',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    { properties: { data: { $ref: '#/components/schemas/ChatConversation' } } },
                  ],
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/api/v1/chat/admin/conversations/{id}/messages': {
      post: {
        tags: ['Chat'],
        summary: '[Admin] Nhân viên trả lời khách',
        description: 'Gửi tin sẽ TỰ ĐỘNG TẮT bot cho hội thoại này (tránh hai bên cùng trả lời một khách) và gửi thông báo cho khách. Bot tự bật lại nếu nhân viên im lặng quá 15 phút.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: {
                  message: { type: 'string', minLength: 1, maxLength: 2000, example: 'Dạ em chào anh/chị, em là tư vấn viên của NAM QUAN ạ.' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Tin nhắn vừa gửi',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    { properties: { data: { $ref: '#/components/schemas/ChatMessage' } } },
                  ],
                },
              },
            },
          },
          '400': { description: 'Hội thoại đã đóng — mở lại trước khi gửi', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/api/v1/chat/admin/conversations/{id}/read': {
      put: {
        tags: ['Chat'],
        summary: '[Admin] Đánh dấu đã đọc tin của khách',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': {
            description: 'Hội thoại sau khi xoá badge',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    { properties: { data: { $ref: '#/components/schemas/ChatConversation' } } },
                  ],
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/v1/chat/admin/unread-count': {
      get: {
        tags: ['Chat'],
        summary: '[Admin] Tổng số tin chưa đọc',
        description: 'Dùng cho badge trên sidebar quản trị. Frontend poll 15 giây.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Số tin và số hội thoại đang chờ trả lời',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            total:         { type: 'integer', description: 'Tổng tin chưa đọc', example: 5 },
                            conversations: { type: 'integer', description: 'Số hội thoại có tin chưa đọc', example: 2 },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
  },
};

export function setupDocs(app) {
  app.get('/openapi.json', (_req, res) => res.json(spec));
  app.use('/api-docs', apiReference({
    spec: { url: '/openapi.json' },
    agent: { disabled: true },
  }));
}
