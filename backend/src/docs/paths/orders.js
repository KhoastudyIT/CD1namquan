// Sinh tu openapi.js goc — chi la lop tai lieu, khong co business logic.

export const orderPaths = {
'/api/v1/orders': {
  get: {
    tags: ['Tài khoản — Đơn hàng'],
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
    tags: ['Tài khoản — Đơn hàng'],
    summary: 'Đặt hàng',
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/OrderCreateBody' },
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
    tags: ['Tài khoản — Đơn hàng'],
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
    tags: ['Admin — Đơn hàng'],
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
    tags: ['Admin — Đơn hàng'],
    summary: '[Admin] Cập nhật trạng thái đơn hàng',
    security: [{ bearerAuth: [] }],
    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Order UUID' }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/OrderStatusBody' },
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
};
