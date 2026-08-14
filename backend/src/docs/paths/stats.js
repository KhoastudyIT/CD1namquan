// Sinh tu openapi.js goc - chi la lop tai lieu, khong co business logic.

export const statsPaths = {
'/api/v1/stats/overview': {
  get: {
    tags: ['Admin - Tổng quan'],
    summary: '[Admin · Nhân viên] Số liệu tổng quan cho dashboard',
    security: [{ bearerAuth: [] }],
    responses: {
      '200': { description: 'Thống kê tổng quan', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/SuccessResponse' }, { properties: { data: { $ref: '#/components/schemas/StatsOverview' } } }] } } } },
      '401': { $ref: '#/components/responses/Unauthorized' },
      '403': { $ref: '#/components/responses/Forbidden' },
    },
  },
},
};
