// Sinh tu openapi.js goc - chi la lop tai lieu, khong co business logic.

export const consultationPaths = {
'/api/v1/consultations': {
  post: {
    tags: ['Cửa hàng - Yêu cầu tư vấn'],
    summary: 'Gửi yêu cầu tư vấn',
    description: 'Form "Để lại thông tin" ở cuối trang chủ. Không cần đăng nhập. Cùng một số điện thoại chỉ gửi lại được sau 60 giây (chống bấm trùng và spam).',
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ConsultationInput' } } },
    },
    responses: {
      '201': { description: 'Đã ghi nhận yêu cầu', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/SuccessResponse' }, { properties: { data: { $ref: '#/components/schemas/ConsultationRequest' } } }] } } } },
      '429': { description: 'Gửi lại quá nhanh từ cùng một số điện thoại', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      '422': { $ref: '#/components/responses/ValidationError' },
    },
  },
  get: {
    tags: ['Admin - Yêu cầu tư vấn'],
    summary: '[Admin] Danh sách yêu cầu tư vấn',
    description: 'Mới nhất trước. Lọc theo trạng thái, tìm theo tên (bỏ qua dấu), số điện thoại hoặc email.',
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'page',   in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
      { name: 'limit',  in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
      { name: 'status', in: 'query', schema: { type: 'string', enum: ['new', 'contacted', 'quoted', 'closed', 'cancelled'] } },
      { name: 'search', in: 'query', description: 'Tên, số điện thoại hoặc email', schema: { type: 'string' }, example: 'tran thi' },
      { name: 'sort',   in: 'query', schema: { type: 'string', enum: ['newest', 'oldest'], default: 'newest' } },
    ],
    responses: {
      '200': { description: 'Danh sách yêu cầu (có phân trang)', content: { 'application/json': { schema: { $ref: '#/components/schemas/ConsultationListResponse' } } } },
      '401': { $ref: '#/components/responses/Unauthorized' },
      '403': { $ref: '#/components/responses/Forbidden' },
      '422': { $ref: '#/components/responses/ValidationError' },
    },
  },
},
'/api/v1/consultations/stats': {
  get: {
    tags: ['Admin - Yêu cầu tư vấn'],
    summary: '[Admin] Đếm yêu cầu theo trạng thái',
    description: 'Dùng cho badge "còn N yêu cầu chưa xử lý". Trạng thái không có yêu cầu nào thì không xuất hiện trong kết quả.',
    security: [{ bearerAuth: [] }],
    responses: {
      '200': {
        description: 'Số lượng theo trạng thái',
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
                        total:     { type: 'integer', example: 12 },
                        new:       { type: 'integer', example: 5 },
                        contacted: { type: 'integer', example: 4 },
                        quoted:    { type: 'integer', example: 2 },
                        closed:    { type: 'integer', example: 1 },
                        cancelled: { type: 'integer', example: 0 },
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
'/api/v1/consultations/{id}': {
  get: {
    tags: ['Admin - Yêu cầu tư vấn'],
    summary: '[Admin] Chi tiết một yêu cầu',
    security: [{ bearerAuth: [] }],
    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
    responses: {
      '200': { description: 'Chi tiết yêu cầu', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/SuccessResponse' }, { properties: { data: { $ref: '#/components/schemas/ConsultationRequest' } } }] } } } },
      '401': { $ref: '#/components/responses/Unauthorized' },
      '403': { $ref: '#/components/responses/Forbidden' },
      '404': { $ref: '#/components/responses/NotFound' },
    },
  },
  delete: {
    tags: ['Admin - Yêu cầu tư vấn'],
    summary: '[Admin] Xoá yêu cầu',
    security: [{ bearerAuth: [] }],
    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
    responses: {
      '204': { description: 'Đã xoá' },
      '401': { $ref: '#/components/responses/Unauthorized' },
      '403': { $ref: '#/components/responses/Forbidden' },
      '404': { $ref: '#/components/responses/NotFound' },
    },
  },
},
'/api/v1/consultations/{id}/status': {
  patch: {
    tags: ['Admin - Yêu cầu tư vấn'],
    summary: '[Admin] Đổi trạng thái xử lý',
    description: '`new` chưa xử lý · `contacted` đã liên hệ · `quoted` đã báo giá · `closed` đã chốt/đóng · `cancelled` khách huỷ.',
    security: [{ bearerAuth: [] }],
    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ConsultationStatusBody' } } },
    },
    responses: {
      '200': { description: 'Đã cập nhật', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/SuccessResponse' }, { properties: { data: { $ref: '#/components/schemas/ConsultationRequest' } } }] } } } },
      '401': { $ref: '#/components/responses/Unauthorized' },
      '403': { $ref: '#/components/responses/Forbidden' },
      '404': { $ref: '#/components/responses/NotFound' },
      '422': { $ref: '#/components/responses/ValidationError' },
    },
  },
},
};
