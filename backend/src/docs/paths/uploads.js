// Sinh tu openapi.js goc - chi la lop tai lieu, khong co business logic.

export const uploadPaths = {
'/api/v1/uploads/image-url': {
  post: {
    tags: ['Admin - Tải ảnh'],
    summary: '[Admin · Khách hàng] Xin URL tải ảnh lên',
    description:
      'Bước 1 của luồng tải ảnh 2 bước, dùng chung cho ảnh bài viết, sản phẩm, danh mục, bộ sưu tập '
      + 'và ảnh đính kèm yêu cầu trả hàng.\n\n'
      + '**Phân quyền theo thư mục:** admin tải được mọi `type`; khách hàng đã đăng nhập chỉ tải được '
      + '`type=returns`, các thư mục còn lại trả **403**.\n\n'
      + '1. Gọi endpoint này để lấy `uploadUrl` có chữ ký (hết hạn sau 1 giờ).\n'
      + '2. `PUT` file thẳng lên `uploadUrl` với header `Content-Type` **đúng bằng** `mimeType` đã khai báo - '
      + 'file đi trực tiếp lên MinIO, không qua backend.\n'
      + '3. Lưu `publicUrl` vào trường `img` của thực thể tương ứng — riêng yêu cầu trả hàng lưu '
      + '`objectKey` (`returns/uuid.jpg`) để đổi tên miền MinIO thì ảnh cũ vẫn xem được.\n\n'
      + 'Tên file client gửi lên chỉ dùng để suy ra đuôi file; object key luôn do server sinh bằng UUID '
      + 'nên không thể ghi đè file khác hay thoát ra ngoài thư mục cho phép.\n\n'
      + 'Trả **503** nếu backend chưa cấu hình MinIO (xem `MINIO_*` trong `backend/.env.example`).',
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/UploadUrlBody' },
        },
      },
    },
    responses: {
      '200': {
        description: 'URL tải lên đã ký',
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
                        uploadUrl: { type: 'string', description: 'PUT file lên đây', example: 'http://localhost:9000/namquan/products/e066e334-....png?X-Amz-Signature=...' },
                        objectKey: { type: 'string', example: 'products/e066e334-f454-487b-b1cd-c0f94d66be58.png' },
                        publicUrl: { type: 'string', description: 'Lưu giá trị này vào trường `img`', example: 'http://localhost:9000/namquan/products/e066e334-f454-487b-b1cd-c0f94d66be58.png' },
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
      '422': { $ref: '#/components/responses/ValidationError' },
      '503': { description: 'Backend chưa cấu hình MinIO' },
    },
  },
},
};
