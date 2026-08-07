// Sinh tu openapi.js goc — chi la lop tai lieu, khong co business logic.

export const categoryPaths = {
'/api/v1/categories': {
  get: {
    tags: ['Cửa hàng — Danh mục & Bộ sưu tập'],
    summary: 'Danh sách danh mục',
    responses: {
      '200': {
        description: 'Danh sách danh mục sản phẩm',
        content: {
          'application/json': {
            schema: {
              allOf: [
                { $ref: '#/components/schemas/SuccessResponse' },
                { properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Category' } } } },
              ],
            },
            example: {
              success: true, message: 'Success',
              data: [
                { id: 1, name: 'Sofa', img: '/images/catSofa.jpg' },
                { id: 2, name: 'Ghế', img: '/images/catChair.jpg' },
              ],
            },
          },
        },
      },
    },
  },
  post: {
    tags: ['Admin — Danh mục & Bộ sưu tập'],
    summary: '[Admin] Tạo danh mục',
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/CategoryCreateBody' },
        },
      },
    },
    responses: {
      '201': { description: 'Đã tạo danh mục', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/SuccessResponse' }, { properties: { data: { $ref: '#/components/schemas/Category' } } }] } } } },
      '401': { $ref: '#/components/responses/Unauthorized' },
      '403': { $ref: '#/components/responses/Forbidden' },
      '422': { $ref: '#/components/responses/ValidationError' },
    },
  },
},
'/api/v1/categories/{id}': {
  put: {
    tags: ['Admin — Danh mục & Bộ sưu tập'],
    summary: '[Admin] Cập nhật danh mục',
    security: [{ bearerAuth: [] }],
    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1 }],
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/CategoryUpdateBody' } } },
    },
    responses: {
      '200': { description: 'Đã cập nhật', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/SuccessResponse' }, { properties: { data: { $ref: '#/components/schemas/Category' } } }] } } } },
      '401': { $ref: '#/components/responses/Unauthorized' },
      '403': { $ref: '#/components/responses/Forbidden' },
      '404': { $ref: '#/components/responses/NotFound' },
    },
  },
  delete: {
    tags: ['Admin — Danh mục & Bộ sưu tập'],
    summary: '[Admin] Xóa danh mục',
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
};
