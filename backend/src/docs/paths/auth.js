// Sinh tu openapi.js goc — chi la lop tai lieu, khong co business logic.

export const authPaths = {
'/api/v1/auth/register': {
  post: {
    tags: ['Xác thực'],
    summary: 'Đăng ký tài khoản',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/RegisterBody' },
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
    tags: ['Xác thực'],
    summary: 'Đăng nhập',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/LoginBody' },
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
    tags: ['Tài khoản — Hồ sơ'],
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
    tags: ['Tài khoản — Hồ sơ'],
    summary: 'Cập nhật thông tin cá nhân',
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/UpdateProfileBody' },
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
    tags: ['Tài khoản — Hồ sơ'],
    summary: 'Đổi mật khẩu',
    description: 'Cần mật khẩu hiện tại. Mật khẩu mới phải khác mật khẩu đang dùng.',
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ChangePasswordBody' },
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
    tags: ['Xác thực'],
    summary: 'Đăng xuất',
    security: [{ bearerAuth: [] }],
    responses: {
      '200': { description: 'Đăng xuất thành công', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
      '401': { $ref: '#/components/responses/Unauthorized' },
    },
  },
},
};
