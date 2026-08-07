// Sinh tu openapi.js goc — chi la lop tai lieu, khong co business logic.

export const collectionPaths = {
'/api/v1/collections': {
  get: {
    tags: ['Cửa hàng — Danh mục & Bộ sưu tập'],
    summary: 'Danh sách bộ sưu tập',
    responses: {
      '200': {
        description: 'Danh sách bộ sưu tập',
        content: {
          'application/json': {
            schema: {
              allOf: [
                { $ref: '#/components/schemas/SuccessResponse' },
                { properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Collection' } } } },
              ],
            },
          },
        },
      },
    },
  },
  post: {
    tags: ['Admin — Danh mục & Bộ sưu tập'],
    summary: '[Admin] Tạo bộ sưu tập',
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/CollectionCreateBody' },
        },
      },
    },
    responses: {
      '201': { description: 'Đã tạo bộ sưu tập', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/SuccessResponse' }, { properties: { data: { $ref: '#/components/schemas/Collection' } } }] } } } },
      '401': { $ref: '#/components/responses/Unauthorized' },
      '403': { $ref: '#/components/responses/Forbidden' },
      '422': { $ref: '#/components/responses/ValidationError' },
    },
  },
},
'/api/v1/collections/{id}': {
  put: {
    tags: ['Admin — Danh mục & Bộ sưu tập'],
    summary: '[Admin] Cập nhật bộ sưu tập',
    security: [{ bearerAuth: [] }],
    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1 }],
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/CollectionUpdateBody' } } },
    },
    responses: {
      '200': { description: 'Đã cập nhật', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/SuccessResponse' }, { properties: { data: { $ref: '#/components/schemas/Collection' } } }] } } } },
      '401': { $ref: '#/components/responses/Unauthorized' },
      '403': { $ref: '#/components/responses/Forbidden' },
      '404': { $ref: '#/components/responses/NotFound' },
    },
  },
  delete: {
    tags: ['Admin — Danh mục & Bộ sưu tập'],
    summary: '[Admin] Xóa bộ sưu tập',
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
