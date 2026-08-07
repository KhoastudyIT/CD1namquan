// Sinh tu openapi.js goc - chi la lop tai lieu, khong co business logic.

export const userPaths = {
'/api/v1/users': {
  get: {
    tags: ['Admin - Người dùng'],
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
    tags: ['Admin - Người dùng'],
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
    tags: ['Admin - Người dùng'],
    summary: '[Admin] Phân quyền người dùng (không thể tự đổi quyền mình)',
    security: [{ bearerAuth: [] }],
    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/UserRoleBody' } } },
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
    tags: ['Admin - Người dùng'],
    summary: '[Admin] Khóa/mở khóa tài khoản (không thể tự khóa mình)',
    security: [{ bearerAuth: [] }],
    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/UserStatusBody' } } },
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
};
