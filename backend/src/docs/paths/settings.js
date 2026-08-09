// Sinh tu openapi.js goc - chi la lop tai lieu, khong co business logic.

export const settingsPaths = {
'/api/v1/settings': {
  get: {
    tags: ['Cửa hàng - Thông tin công ty'],
    summary: 'Thông tin công ty',
    description: 'Logo, tên, slogan, hotline, email, địa chỉ và mạng xã hội. Header, Footer và menu mobile của web khách đọc từ đây. Không cần đăng nhập.',
    responses: {
      '200': {
        description: 'Thông tin công ty',
        content: {
          'application/json': {
            schema: {
              allOf: [
                { $ref: '#/components/schemas/SuccessResponse' },
                { properties: { data: { $ref: '#/components/schemas/CompanyInfo' } } },
              ],
            },
          },
        },
      },
    },
  },
  put: {
    tags: ['Admin - Thông tin công ty'],
    summary: '[Admin] Cập nhật thông tin công ty',
    description: 'Chỉ ghi những field được gửi lên; field bỏ qua giữ nguyên giá trị cũ.',
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/CompanyInfoUpdateBody' } } },
    },
    responses: {
      '200': { description: 'Đã cập nhật', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/SuccessResponse' }, { properties: { data: { $ref: '#/components/schemas/CompanyInfo' } } }] } } } },
      '401': { $ref: '#/components/responses/Unauthorized' },
      '403': { $ref: '#/components/responses/Forbidden' },
      '422': { $ref: '#/components/responses/ValidationError' },
    },
  },
},
};
