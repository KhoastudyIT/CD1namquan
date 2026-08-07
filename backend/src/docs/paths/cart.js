// Sinh tu openapi.js goc - chi la lop tai lieu, khong co business logic.

export const cartPaths = {
'/api/v1/cart': {
  get: {
    tags: ['Tài khoản - Giỏ hàng'],
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
    tags: ['Tài khoản - Giỏ hàng'],
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
    tags: ['Tài khoản - Giỏ hàng'],
    summary: 'Thêm sản phẩm vào giỏ',
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/CartAddBody' },
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
    tags: ['Tài khoản - Giỏ hàng'],
    summary: 'Cập nhật số lượng sản phẩm trong giỏ',
    security: [{ bearerAuth: [] }],
    parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'integer' }, example: 1 }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/CartQuantityBody' },
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
    tags: ['Tài khoản - Giỏ hàng'],
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
};
