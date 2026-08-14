// Sinh tu openapi.js goc - chi la lop tai lieu, khong co business logic.

export const returnPaths = {
'/api/v1/returns': {
  post: {
    tags: ['Tài khoản - Trả/đổi hàng'],
    summary: 'Gửi yêu cầu trả hoặc đổi hàng',
    description:
      'Điều kiện: đơn phải ở trạng thái `delivered` và trong vòng 7 ngày kể từ khi giao. '
      + 'Bắt buộc đính kèm 2–5 ảnh tình trạng sản phẩm (xin key ở POST /uploads/image-url với `type=returns`). '
      + 'Mỗi đơn chỉ được có một yêu cầu đang mở (`pending` hoặc `approved`) tại một thời điểm; '
      + 'yêu cầu đã bị từ chối thì gửi lại được. '
      + 'Đơn đã trả xong (`shipping_status = returned`) thì không nhận thêm yêu cầu nào nữa — '
      + 'hàng đã về kho và tiền đã hoàn.',
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateReturnBody' } } },
    },
    responses: {
      '201': { description: 'Đã ghi nhận yêu cầu', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/SuccessResponse' }, { properties: { data: { $ref: '#/components/schemas/OrderReturn' } } }] } } } },
      '400': { description: 'Đơn chưa giao xong, hoặc đã quá 7 ngày kể từ khi giao', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      '401': { $ref: '#/components/responses/Unauthorized' },
      '403': { description: 'Đơn hàng không thuộc về bạn', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      '404': { $ref: '#/components/responses/NotFound' },
      '409': { description: 'Đơn này đang có một yêu cầu chờ xử lý, hoặc đơn đã được trả và hoàn tiền', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      '422': { $ref: '#/components/responses/ValidationError' },
    },
  },
  get: {
    tags: ['Tài khoản - Trả/đổi hàng'],
    summary: 'Lịch sử yêu cầu trả/đổi của tôi',
    description: 'Trang "Trả / đổi hàng" trong khu tài khoản. Mới nhất trước. Chỉ trả về yêu cầu thuộc đơn của chính người đăng nhập.',
    security: [{ bearerAuth: [] }],
    responses: {
      '200': { description: 'Danh sách yêu cầu', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/SuccessResponse' }, { properties: { data: { type: 'array', items: { $ref: '#/components/schemas/OrderReturn' } } } }] } } } },
      '401': { $ref: '#/components/responses/Unauthorized' },
    },
  },
},
'/api/v1/returns/admin/list': {
  get: {
    tags: ['Admin - Trả/đổi hàng'],
    summary: '[Admin · Nhân viên] Danh sách yêu cầu trả/đổi',
    description: 'Tab "Trả hàng" của dashboard. Mới nhất trước. Nhân viên (`staff`) dùng được đầy đủ vì đây là một phần của quản lý đơn hàng.',
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'approved', 'rejected', 'completed'] } },
      { name: 'type',   in: 'query', schema: { type: 'string', enum: ['return', 'exchange'] } },
      { name: 'page',   in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
      { name: 'limit',  in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 15 } },
    ],
    responses: {
      '200': { description: 'Danh sách yêu cầu (có phân trang)', content: { 'application/json': { schema: { $ref: '#/components/schemas/OrderReturnListResponse' } } } },
      '401': { $ref: '#/components/responses/Unauthorized' },
      '403': { $ref: '#/components/responses/Forbidden' },
      '422': { $ref: '#/components/responses/ValidationError' },
    },
  },
},
'/api/v1/returns/admin/stats': {
  get: {
    tags: ['Admin - Trả/đổi hàng'],
    summary: '[Admin · Nhân viên] Đếm yêu cầu theo trạng thái',
    description: 'Dùng cho chip lọc và badge "còn N yêu cầu chờ duyệt" trên sidebar.',
    security: [{ bearerAuth: [] }],
    responses: {
      '200': {
        description: 'Số lượng theo trạng thái',
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
                        total:     { type: 'integer', example: 8 },
                        pending:   { type: 'integer', example: 3 },
                        approved:  { type: 'integer', example: 2 },
                        rejected:  { type: 'integer', example: 1 },
                        completed: { type: 'integer', example: 2 },
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
'/api/v1/returns/admin/{id}': {
  get: {
    tags: ['Admin - Trả/đổi hàng'],
    summary: '[Admin · Nhân viên] Chi tiết một yêu cầu',
    description: 'Không mở tuyến theo id cho khách hàng: khách xem yêu cầu của mình ở GET /api/v1/returns, cho tra theo id sẽ lộ yêu cầu của người khác.',
    security: [{ bearerAuth: [] }],
    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
    responses: {
      '200': { description: 'Chi tiết yêu cầu', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/SuccessResponse' }, { properties: { data: { $ref: '#/components/schemas/OrderReturn' } } }] } } } },
      '401': { $ref: '#/components/responses/Unauthorized' },
      '403': { $ref: '#/components/responses/Forbidden' },
      '404': { $ref: '#/components/responses/NotFound' },
    },
  },
},
'/api/v1/returns/{id}/status': {
  put: {
    tags: ['Admin - Trả/đổi hàng'],
    summary: '[Admin · Nhân viên] Duyệt · từ chối · hoàn tất yêu cầu',
    description:
      'Quy trình CHỈ ĐI TỚI, không lùi:\n\n'
      + '```\n'
      + 'pending ──▶ approved ──▶ completed\n'
      + '   └───────────┴──▶ rejected\n'
      + '```\n\n'
      + '- `rejected` **bắt buộc** kèm `adminNote` — khách phải biết vì sao bị từ chối.\n'
      + '- `completed` + `type=return` sẽ cộng lại tồn kho, trừ `sold`, hoàn suất flash sale, '
      + "đặt `shipping_status='returned'` và chuyển `payment_status` từ `paid` sang `refunded`. "
      + 'Toàn bộ chạy trong một giao dịch có khoá dòng, nên hai người cùng bấm cũng không hoàn kho hai lần.\n'
      + '- `completed` + `type=exchange` KHÔNG đụng kho: khách trả một cái rồi nhận lại một cái cùng loại.\n'
      + '- `completed` và `rejected` là trạng thái chốt sổ, không đổi được nữa.',
    security: [{ bearerAuth: [] }],
    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateReturnStatusBody' } } },
    },
    responses: {
      '200': { description: 'Đã cập nhật yêu cầu', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/SuccessResponse' }, { properties: { data: { $ref: '#/components/schemas/OrderReturn' } } }] } } } },
      '401': { $ref: '#/components/responses/Unauthorized' },
      '403': { $ref: '#/components/responses/Forbidden' },
      '404': { $ref: '#/components/responses/NotFound' },
      '409': { description: 'Bước chuyển không hợp lệ (lùi trạng thái, hoặc yêu cầu đã chốt sổ)', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      '422': { description: 'Dữ liệu không hợp lệ, hoặc từ chối mà không nêu lý do', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
    },
  },
},
};
