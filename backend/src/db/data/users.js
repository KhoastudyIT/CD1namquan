// Tài khoản mẫu và sổ địa chỉ.

export const users = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Admin Nam Quan',
    email: 'admin@namquan.vn',
    phone: '0900000000',
    password: '$2a$10$bfBx.cL06GIeXWXLInMCUO7y8pwyzI9lH1GZLzdvOLZmqQkq/kn0i',
    role: 'admin',
    email_verified: true,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Khách hàng Demo',
    email: 'customer@namquan.vn',
    phone: '0911111111',
    password: '$2a$10$Dtgk9zfYZvMwo3Ao5yc51etbehlpuQ.kwTK9hIbNVM7h6gJUFrfw.',
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
