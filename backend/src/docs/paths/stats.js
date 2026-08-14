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
'/api/v1/stats/export': {
  get: {
    tags: ['Admin - Tổng quan'],
    summary: '[Admin · Nhân viên] Xuất báo cáo thống kê ra tệp Excel',
    description:
      'Trả về tệp `.xlsx` gồm 6 trang tính: Tổng quan · Doanh thu theo ngày · Sản phẩm bán chạy '
      + '· Đơn hàng · Đơn theo trạng thái · Sắp hết hàng.\n\n'
      + 'Bỏ trống `from` và `to` thì lấy 30 ngày gần nhất. Ngày ở `to` được tính TRỌN NGÀY: '
      + 'chọn đến 14/08 là gồm cả những đơn đặt trong ngày 14/08.\n\n'
      + 'Phản hồi là dữ liệu nhị phân kèm `Content-Disposition: attachment`, nên client phải tải '
      + 'bằng fetch có gắn Bearer token rồi tạo blob — thẻ `<a href>` thường sẽ thiếu header xác thực.',
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'from', in: 'query', schema: { type: 'string', format: 'date' }, example: '2026-07-01', description: 'Ngày bắt đầu (YYYY-MM-DD)' },
      { name: 'to',   in: 'query', schema: { type: 'string', format: 'date' }, example: '2026-08-14', description: 'Ngày kết thúc (YYYY-MM-DD), tính trọn ngày' },
    ],
    responses: {
      '200': {
        description: 'Tệp Excel báo cáo thống kê',
        content: {
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
            schema: { type: 'string', format: 'binary' },
          },
        },
      },
      '401': { $ref: '#/components/responses/Unauthorized' },
      '403': { $ref: '#/components/responses/Forbidden' },
      '422': { description: 'Ngày sai định dạng, hoặc ngày bắt đầu muộn hơn ngày kết thúc', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
    },
  },
},
};
