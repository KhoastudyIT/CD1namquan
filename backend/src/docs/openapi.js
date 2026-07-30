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
    { name: 'News',        description: 'Tin tức và bài viết' },
    { name: 'Cart',        description: 'Giỏ hàng — yêu cầu đăng nhập' },
    { name: 'Orders',      description: 'Đơn hàng — yêu cầu đăng nhập' },
    { name: 'Notifications', description: 'Thông báo theo từng tài khoản' },
    { name: 'Users',       description: '[Admin] Quản lý người dùng — danh sách, phân quyền, khóa/mở' },
    { name: 'Stats',       description: '[Admin] Thống kê & báo cáo cho dashboard' },
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
      NewsArticle: {
        type: 'object',
        properties: {
          id:      { type: 'integer', example: 1 },
          title:   { type: 'string', example: 'Xu Hướng Nội Thất 2026 – Tinh Tế & Bền Vững' },
          date:    { type: 'string', example: '11/03/2026' },
          img:     { type: 'string', example: '/images/news1.jpg' },
          excerpt: { type: 'string', example: 'Khám phá những phong cách thiết kế nổi bật...' },
          content: { type: 'string', example: 'Năm 2026 chứng kiến sự trỗi dậy mạnh mẽ...' },
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
        summary: 'Danh sách tin tức',
        responses: {
          '200': {
            description: 'Danh sách bài viết',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    { properties: { data: { type: 'array', items: { $ref: '#/components/schemas/NewsArticle' } } } },
                  ],
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['News'],
        summary: '[Admin] Tạo bài viết',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'img', 'excerpt', 'content'],
                properties: {
                  title:   { type: 'string', example: 'Xu Hướng Nội Thất 2026' },
                  img:     { type: 'string', example: '/images/news1.jpg' },
                  excerpt: { type: 'string', example: 'Mô tả ngắn cho bài viết...' },
                  content: { type: 'string', example: 'Nội dung đầy đủ của bài viết...' },
                  date:    { type: 'string', description: 'Tùy chọn — mặc định ngày hiện tại', example: '11/03/2026' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Đã tạo bài viết', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/SuccessResponse' }, { properties: { data: { $ref: '#/components/schemas/NewsArticle' } } }] } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/api/v1/news/{id}': {
      get: {
        tags: ['News'],
        summary: 'Chi tiết bài viết',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1 }],
        responses: {
          '200': {
            description: 'Chi tiết bài viết',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    { properties: { data: { $ref: '#/components/schemas/NewsArticle' } } },
                  ],
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['News'],
        summary: '[Admin] Cập nhật bài viết',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1 }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { title: { type: 'string' }, img: { type: 'string' }, excerpt: { type: 'string' }, content: { type: 'string' }, date: { type: 'string' } } } } },
        },
        responses: {
          '200': { description: 'Đã cập nhật', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/SuccessResponse' }, { properties: { data: { $ref: '#/components/schemas/NewsArticle' } } }] } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
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
  },
};

export function setupDocs(app) {
  app.get('/openapi.json', (_req, res) => res.json(spec));
  app.use('/api-docs', apiReference({
    spec: { url: '/openapi.json' },
    agent: { disabled: true },
  }));
}
