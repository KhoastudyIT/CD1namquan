// Tài khoản mẫu và sổ địa chỉ.


export const users = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Admin Nam Quan',
    email: 'admin@namquan.vn',
    phone: '0900000000',
    password: '$2a$10$L1YPWvKFccX/CnrvNOw6FOIOYlhGvJrbS/GfV6U9Zn7IqrloOt59C',
    role: 'admin',
    email_verified: true,
  },
  {
    // Tài khoản nhân viên mẫu để thử phân quyền: vào được /admin nhưng chỉ
    // xử lý đơn hàng, tư vấn, chat; các mục còn lại chỉ xem (xem utils/roles.js).
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Nhân viên Demo',
    email: 'nhanvien@namquan.vn',
    phone: '0922222222',
    password: '$2a$10$Nm2ODF5Qce0rJgciddML9ufL14Ebms35UW5y9SJkamAoKcaRoIjVG',
    role: 'staff',
    email_verified: true,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Khách hàng Demo',
    email: 'customer@namquan.vn',
    phone: '0911111111',
    password: '$2a$10$L1YPWvKFccX/CnrvNOw6FOIOYlhGvJrbS/GfV6U9Zn7IqrloOt59C',
    role: 'customer',
    email_verified: true,
  },
];

export const userAddresses = [
  {
    user_id: '22222222-2222-2222-2222-222222222222',
    receiver_name: 'Khách hàng Demo',
    receiver_phone: '0911111111',
    province: 'TP. Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    address: '12 Nguyễn Huệ',
    is_default: true,
  },
];
