// Sinh tu openapi.js goc — chi la lop tai lieu, khong co business logic.

export const productPaths = {
'/api/v1/products': {
  get: {
    tags: ['Cửa hàng — Sản phẩm'],
    summary: 'Danh sách sản phẩm (có lọc & phân trang)',
    parameters: [
      { name: 'category', in: 'query', schema: { type: 'string' },           description: 'Lọc theo danh mục (vd: Phòng khách, Phòng ngủ)' },
      { name: 'type',     in: 'query', schema: { type: 'string' },           description: 'Lọc theo loại sản phẩm (vd: Ghế Sofa, Giường)' },
      { name: 'search',   in: 'query', schema: { type: 'string' },           description: 'Tìm kiếm theo tên sản phẩm' },
      { name: 'sort',     in: 'query', schema: { type: 'string', enum: ['price_asc', 'price_desc', 'rating', 'sold', 'newest'], default: 'newest' }, description: 'Sắp xếp' },
      { name: 'page',     in: 'query', schema: { type: 'integer', minimum: 1, default: 1 },   description: 'Trang hiện tại' },
      { name: 'limit',    in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 12 }, description: 'Số sản phẩm mỗi trang' },
      { name: 'priceMin', in: 'query', schema: { type: 'integer', minimum: 0 }, description: 'Giá tối thiểu (VND)' },
      { name: 'priceMax', in: 'query', schema: { type: 'integer', minimum: 1 }, description: 'Giá tối đa (VND)' },
      { name: 'colors',   in: 'query', schema: { type: 'string' }, description: 'Lọc theo màu, nhiều giá trị cách nhau bởi dấu phẩy (vd: be,nau)' },
      { name: 'styles',   in: 'query', schema: { type: 'string' }, description: 'Lọc theo phong cách, cách nhau bởi dấu phẩy (vd: Luxury,Hiện đại)' },
      { name: 'materials',in: 'query', schema: { type: 'string' }, description: 'Lọc theo chất liệu, cách nhau bởi dấu phẩy' },
      { name: 'sizes',    in: 'query', schema: { type: 'string' }, description: 'Lọc theo kích thước, cách nhau bởi dấu phẩy' },
      { name: 'brands',   in: 'query', schema: { type: 'string' }, description: 'Lọc theo thương hiệu, cách nhau bởi dấu phẩy' },
    ],
    responses: {
      '200': {
        description: 'Danh sách sản phẩm có phân trang',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ProductListResponse' } } },
      },
    },
  },
  post: {
    tags: ['Admin — Sản phẩm'],
    summary: 'Tạo sản phẩm mới',
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ProductCreateBody' },
        },
      },
    },
    responses: {
      '201': {
        description: 'Tạo sản phẩm thành công',
        content: {
          'application/json': {
            schema: {
              allOf: [
                { $ref: '#/components/schemas/SuccessResponse' },
                { properties: { data: { $ref: '#/components/schemas/Product' } } },
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
'/api/v1/products/flash-sales': {
  get: {
    tags: ['Cửa hàng — Sản phẩm'],
    summary: 'Sản phẩm flash sale',
    responses: {
      '200': {
        description: 'Danh sách sản phẩm đang flash sale',
        content: {
          'application/json': {
            schema: {
              allOf: [
                { $ref: '#/components/schemas/SuccessResponse' },
                { properties: { data: { type: 'array', items: { $ref: '#/components/schemas/FlashSaleProduct' } } } },
              ],
            },
          },
        },
      },
    },
  },
},
'/api/v1/products/flash-sales/admin': {
  get: {
    tags: ['Admin — Flash sale'],
    summary: '[Admin] Danh sách tất cả Flash Sale',
    security: [{ bearerAuth: [] }],
    responses: {
      '200': {
        description: 'Danh sách toàn bộ Flash Sale (cả active & inactive)',
        content: {
          'application/json': {
            schema: {
              allOf: [
                { $ref: '#/components/schemas/SuccessResponse' },
                { properties: { data: { type: 'array', items: { $ref: '#/components/schemas/AdminFlashSaleProduct' } } } },
              ],
            },
          },
        },
      },
      '401': { $ref: '#/components/responses/Unauthorized' },
      '403': { $ref: '#/components/responses/Forbidden' },
    },
  },
  post: {
    tags: ['Admin — Flash sale'],
    summary: '[Admin] Thêm sản phẩm Flash Sale mới',
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/FlashSaleCreateBody' },
        },
      },
    },
    responses: {
      '201': {
        description: 'Tạo Flash Sale thành công',
        content: {
          'application/json': {
            schema: {
              allOf: [
                { $ref: '#/components/schemas/SuccessResponse' },
                { properties: { data: { type: 'object', properties: { id: { type: 'integer', example: 101 } } } } },
              ],
            },
          },
        },
      },
      '401': { $ref: '#/components/responses/Unauthorized' },
      '403': { $ref: '#/components/responses/Forbidden' },
      '422': { $ref: '#/components/responses/ValidationError' },
    },
  },
},
'/api/v1/products/flash-sales/admin/{id}': {
  put: {
    tags: ['Admin — Flash sale'],
    summary: '[Admin] Cập nhật chương trình Flash Sale',
    security: [{ bearerAuth: [] }],
    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 101 }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/FlashSaleUpdateBody' },
        },
      },
    },
    responses: {
      '200': {
        description: 'Cập nhật thành công',
        content: {
          'application/json': {
            schema: {
              allOf: [
                { $ref: '#/components/schemas/SuccessResponse' },
                { properties: { data: { type: 'object', properties: { id: { type: 'integer', example: 101 } } } } },
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
  delete: {
    tags: ['Admin — Flash sale'],
    summary: '[Admin] Xóa chương trình Flash Sale',
    security: [{ bearerAuth: [] }],
    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 101 }],
    responses: {
      '204': { description: 'Xóa thành công' },
      '401': { $ref: '#/components/responses/Unauthorized' },
      '403': { $ref: '#/components/responses/Forbidden' },
      '404': { $ref: '#/components/responses/NotFound' },
    },
  },
},
'/api/v1/products/{id}': {
  get: {
    tags: ['Cửa hàng — Sản phẩm'],
    summary: 'Chi tiết sản phẩm',
    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1 }],
    responses: {
      '200': {
        description: 'Chi tiết sản phẩm',
        content: {
          'application/json': {
            schema: {
              allOf: [
                { $ref: '#/components/schemas/SuccessResponse' },
                { properties: { data: { $ref: '#/components/schemas/Product' } } },
              ],
            },
          },
        },
      },
      '404': { $ref: '#/components/responses/NotFound' },
    },
  },
  put: {
    tags: ['Admin — Sản phẩm'],
    summary: 'Cập nhật sản phẩm',
    security: [{ bearerAuth: [] }],
    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1 }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ProductUpdateBody' },
        },
      },
    },
    responses: {
      '200': {
        description: 'Cập nhật thành công',
        content: {
          'application/json': {
            schema: {
              allOf: [
                { $ref: '#/components/schemas/SuccessResponse' },
                { properties: { data: { $ref: '#/components/schemas/Product' } } },
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
    tags: ['Admin — Sản phẩm'],
    summary: 'Xóa sản phẩm',
    security: [{ bearerAuth: [] }],
    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1 }],
    responses: {
      '204': { description: 'Xóa thành công' },
      '401': { $ref: '#/components/responses/Unauthorized' },
      '404': { $ref: '#/components/responses/NotFound' },
    },
  },
},
};
