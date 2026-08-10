// Dữ liệu minh hoạ cho luồng khách hàng: liên hệ, đánh giá, giỏ, thông báo, chat.


export const contacts = [
  {
    name: 'Nguyễn Văn A',
    phone: '0901234567',
    email: 'a@example.com',
    subject: 'Tư vấn sofa',
    message: 'Tôi muốn được tư vấn sofa phòng khách.',
    status: 'new',
  },
];

export const consultationRequests = [
  {
    name: 'Trần Thị B',
    phone: '0912345678',
    email: 'b@example.com',
    service_type: 'Thiết kế nội thất',
    property_type: 'Căn hộ',
    area: '85m2',
    budget: '200 - 300 triệu',
    address: 'Quận 2',
    message: 'Cần tư vấn thiết kế căn hộ.',
  },
];

export const reviews = [
  { id: 1, product_id: 1, name: 'Minh Anh', rating: 5, comment: 'Sofa đẹp, chất vải tốt, màu sắc giống hình và rất hợp phòng khách.', status: 'approved' },
  { id: 2, product_id: 6, name: 'Hoàng Nam', rating: 5, comment: 'Bàn trà chắc chắn, mặt đá sang và dễ vệ sinh.', status: 'approved' },
  { id: 3, product_id: 5, name: 'Thanh Hương', rating: 5, comment: 'Giường đẹp, giao hàng đúng hẹn, tư vấn nhiệt tình.', status: 'approved' },
];

export const carts = [
  { id: '33333333-3333-3333-3333-333333333333', user_id: '22222222-2222-2222-2222-222222222222' },
];

export const cartItems = [
  { cart_id: '33333333-3333-3333-3333-333333333333', product_id: 1, quantity: 1 },
  { cart_id: '33333333-3333-3333-3333-333333333333', product_id: 6, quantity: 2 },
];

export const favorites = [
  { user_id: '22222222-2222-2222-2222-222222222222', product_id: 1 },
  { user_id: '22222222-2222-2222-2222-222222222222', product_id: 5 },
  { user_id: '22222222-2222-2222-2222-222222222222', product_id: 11 },
];

export const notifications = [
  {
    user_id: '22222222-2222-2222-2222-222222222222',
    title: 'Flash Sale đang diễn ra',
    content: 'Nhiều sản phẩm nội thất cao cấp đang giảm giá.',
    type: 'promotion',
    target_url: '/flash-sale',
    is_read: false,
  },
  {
    user_id: '22222222-2222-2222-2222-222222222222',
    title: 'Sản phẩm yêu thích giảm giá',
    content: 'Sofa Băng Da Cao Cấp trong danh sách yêu thích đang có ưu đãi.',
    type: 'favorite',
    target_url: '/products/sofa-bang-da-cao-cap',
    is_read: false,
  },
  {
    user_id: '22222222-2222-2222-2222-222222222222',
    title: 'Chào mừng bạn đến với NAM QUAN',
    content: 'Khám phá bộ sưu tập nội thất mới nhất.',
    type: 'system',
    target_url: '/collections',
    is_read: true,
  },
];

export const searchHistory = [
  { user_id: '22222222-2222-2222-2222-222222222222', keyword: 'sofa' },
  { user_id: '22222222-2222-2222-2222-222222222222', keyword: 'bàn trà' },
  { user_id: '22222222-2222-2222-2222-222222222222', keyword: 'giường ngủ' },
];

export const chatConversations = [
  {
    id: 1,
    user_id: '22222222-2222-2222-2222-222222222222',
    ai_enabled: true,
    last_message: 'NAM QUAN sẽ tư vấn mẫu sofa phù hợp với diện tích và phong cách của anh/chị.',
    staff_unread: 0,
  },
];

export const chatMessages = [
  {
    conversation_id: 1,
    user_id: '22222222-2222-2222-2222-222222222222',
    sender_type: 'customer',
    message: 'Tôi cần tư vấn sofa cho phòng khách 25m2.',
    is_read: true,
  },
  {
    conversation_id: 1,
    user_id: null,
    sender_type: 'staff',
    message: 'NAM QUAN sẽ tư vấn mẫu sofa phù hợp với diện tích và phong cách của anh/chị.',
    is_read: false,
  },
];
