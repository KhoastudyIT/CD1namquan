// Sinh tu openapi.js goc - chi la lop tai lieu, khong co business logic.

export const userPaths = {
'/api/v1/users': {
  get: {
    tags: ['Admin - Người dùng'],
    summary: '[Admin · Nhân viên] Danh sách người dùng (lọc & phân trang)',
    description:
      'Nhân viên (`staff`) CHỈ XEM được danh sách để tra cứu khi xử lý đơn; mọi thao tác ghi ở '
      + 'nhóm này là đặc quyền của admin (middleware `readOnly(\'staff\')` chặn mọi method khác GET).\n\n'
      + 'Tab "Người dùng" của dashboard gọi `?role=customer`, tab "Nhân viên" gọi `?role=staff,admin` — '
      + 'hai nhóm tài khoản tách bạch nhau.',
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Tìm theo tên hoặc email' },
      { name: 'role',   in: 'query', schema: { type: 'string', example: 'staff,admin' }, description: 'Lọc theo vai trò, nhiều giá trị phân tách bằng dấu phẩy: customer | staff | admin' },
      { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'blocked'] }, description: 'Lọc theo trạng thái' },
      { name: 'page',   in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
      { name: 'limit',  in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
    ],
    responses: {
      '200': { description: 'Danh sách người dùng có phân trang', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserListResponse' } } } },
      '401': { $ref: '#/components/responses/Unauthorized' },
      '403': { $ref: '#/components/responses/Forbidden' },
      '422': { $ref: '#/components/responses/ValidationError' },
    },
  },
  post: {
    tags: ['Admin - Người dùng'],
    summary: '[Admin] Tạo tài khoản nhân viên',
    description:
      'Nhân viên không tự đăng ký được — `/auth/register` luôn tạo vai trò `customer`. '
      + 'Quản trị viên tạo sẵn tài khoản ở đây rồi bàn giao email + mật khẩu. '
      + 'Bỏ trống `role` thì mặc định là `staff`.',
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateUserBody' } } },
    },
    responses: {
      '201': { description: 'Đã tạo tài khoản', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/SuccessResponse' }, { properties: { data: { $ref: '#/components/schemas/User' } } }] } } } },
      '401': { $ref: '#/components/responses/Unauthorized' },
      '403': { $ref: '#/components/responses/Forbidden' },
      '409': { description: 'Email đã được sử dụng', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      '422': { $ref: '#/components/responses/ValidationError' },
    },
  },
},
'/api/v1/users/{id}': {
  get: {
    tags: ['Admin - Người dùng'],
    summary: '[Admin · Nhân viên] Chi tiết người dùng',
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
    summary: '[Admin] Đổi vai trò (không thể tự đổi quyền mình)',
    description: 'Đổi giữa customer · staff · admin. Có hiệu lực NGAY trên token đang dùng: middleware authenticate đọc lại vai trò từ DB mỗi request thay vì tin vào payload trong token.',
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
    description: "Khóa (status='blocked') chặn đăng nhập ngay lập tức, kể cả token cũ còn hạn. Nhân viên nghỉ việc dùng thao tác này, không hạ vai trò xuống customer — hồ sơ nhân sự cần giữ nguyên để đối chiếu đơn hàng và tin nhắn họ đã xử lý.",
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
