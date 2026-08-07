// Sinh tu openapi.js goc — chi la lop tai lieu, khong co business logic.

export const notificationPaths = {
'/api/v1/notifications': {
  get: {
    tags: ['Tài khoản — Thông báo'],
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
    tags: ['Tài khoản — Thông báo'],
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
    tags: ['Tài khoản — Thông báo'],
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
};
