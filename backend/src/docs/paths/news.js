// Sinh tu openapi.js goc — chi la lop tai lieu, khong co business logic.

export const newsPaths = {
'/api/v1/news': {
  get: {
    tags: ['Cửa hàng — Tin tức'],
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
    tags: ['Admin — Tin tức'],
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
    tags: ['Cửa hàng — Tin tức'],
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
    tags: ['Admin — Tin tức'],
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
    tags: ['Admin — Tin tức'],
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
    tags: ['Cửa hàng — Tin tức'],
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
    tags: ['Cửa hàng — Tin tức'],
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
    tags: ['Admin — Tin tức'],
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
    tags: ['Admin — Tin tức'],
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
    tags: ['Admin — Tin tức'],
    summary: '[Admin] Đổi trạng thái bài viết',
    description: 'Đăng / gỡ / chuyển về nháp ngay từ bảng danh sách, không cần mở form sửa.',
    security: [{ bearerAuth: [] }],
    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1 }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/NewsStatusBody' },
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
};
