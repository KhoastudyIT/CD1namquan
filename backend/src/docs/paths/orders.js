// Sinh tu openapi.js goc - chi la lop tai lieu, khong co business logic.

export const orderPaths = {
'/api/v1/orders': {
  get: {
    tags: ['Tài khoản - Đơn hàng'],
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
    tags: ['Tài khoản - Đơn hàng'],
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
    tags: ['Tài khoản - Đơn hàng'],
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
    tags: ['Admin - Đơn hàng'],
    summary: '[Admin · Nhân viên] Danh sách tất cả đơn hàng',
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
    tags: ['Admin - Đơn hàng'],
    summary: '[Admin · Nhân viên] Cập nhật trạng thái đơn hàng',
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
'/api/v1/orders/{id}/invoice': {
  get: {
    tags: ['Tài khoản - Đơn hàng'],
    summary: '[Khách hàng · Admin · Nhân viên] Tải hoá đơn PDF',
    description:
      'Sinh hoá đơn dạng PDF cho một đơn hàng, gồm thông tin cửa hàng, người nhận, phương thức '
      + 'và trạng thái thanh toán, bảng sản phẩm kèm đơn giá, và phần tổng kết tiền.\n\n'
      + 'Khách hàng chỉ tải được hoá đơn đơn hàng của chính mình; admin và nhân viên tải được mọi đơn '
      + '(cần khi khách gọi lên nhờ gửi lại hoá đơn).\n\n'
      + 'Tệp được tạo bằng thư viện pdfkit với phông Be Vietnam Pro nhúng sẵn — phông mặc định của '
      + 'pdfkit không có glyph tiếng Việt nên chữ có dấu sẽ bị mất.\n\n'
      + 'Phản hồi là dữ liệu nhị phân kèm `Content-Disposition: inline`, client cần fetch có gắn '
      + 'Bearer token rồi mở blob.',
    security: [{ bearerAuth: [] }],
    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
    responses: {
      '200': {
        description: 'Tệp PDF hoá đơn',
        content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } },
      },
      '401': { $ref: '#/components/responses/Unauthorized' },
      '403': { description: 'Đơn hàng không thuộc về bạn', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      '404': { $ref: '#/components/responses/NotFound' },
    },
  },
},
};
