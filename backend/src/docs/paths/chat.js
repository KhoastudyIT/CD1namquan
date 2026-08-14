// Sinh tu openapi.js goc - chi la lop tai lieu, khong co business logic.

export const chatPaths = {
'/api/v1/chat/conversation': {
  get: {
    tags: ['Tài khoản - Tin nhắn'],
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
    tags: ['Tài khoản - Tin nhắn'],
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
    tags: ['Tài khoản - Tin nhắn'],
    summary: 'Khách gửi tin nhắn',
    description: 'Trả về tin của khách, kèm phản hồi bot nếu `aiEnabled` đang bật (khi đó mảng có 2 phần tử). Hội thoại đã đóng sẽ tự mở lại.',
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ChatSendBody' },
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
    tags: ['Tài khoản - Tin nhắn'],
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
    tags: ['Admin - Tin nhắn'],
    summary: '[Admin · Nhân viên] Danh sách hội thoại',
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
    tags: ['Admin - Tin nhắn'],
    summary: '[Admin · Nhân viên] Xem nội dung một hội thoại',
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
    tags: ['Admin - Tin nhắn'],
    summary: '[Admin · Nhân viên] Bật/tắt bot hoặc đóng/mở hội thoại',
    security: [{ bearerAuth: [] }],
    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
    requestBody: {
      required: true,
      description: 'Gửi ít nhất một trong hai trường.',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ChatConversationPatchBody' },
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
    tags: ['Admin - Tin nhắn'],
    summary: '[Admin · Nhân viên] Nhân viên trả lời khách',
    description: 'Gửi tin sẽ TỰ ĐỘNG TẮT bot cho hội thoại này (tránh hai bên cùng trả lời một khách) và gửi thông báo cho khách. Bot tự bật lại nếu nhân viên im lặng quá 15 phút.',
    security: [{ bearerAuth: [] }],
    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ChatStaffReplyBody' },
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
      '400': { description: 'Hội thoại đã đóng - mở lại trước khi gửi', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      '401': { $ref: '#/components/responses/Unauthorized' },
      '403': { $ref: '#/components/responses/Forbidden' },
      '404': { $ref: '#/components/responses/NotFound' },
      '422': { $ref: '#/components/responses/ValidationError' },
    },
  },
},
'/api/v1/chat/admin/conversations/{id}/read': {
  put: {
    tags: ['Admin - Tin nhắn'],
    summary: '[Admin · Nhân viên] Đánh dấu đã đọc tin của khách',
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
    tags: ['Admin - Tin nhắn'],
    summary: '[Admin · Nhân viên] Tổng số tin chưa đọc',
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
};
