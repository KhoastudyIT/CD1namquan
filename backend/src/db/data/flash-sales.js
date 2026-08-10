// Chương trình flash sale và mã giảm giá.


export const flashSales = [
  { id: 101, product_id: 5, price: 16330000, original_price: 24500000, stock: 15, sold: 12, active: true },
  { id: 102, product_id: 10, price: 3720000, original_price: 5400000, stock: 45, sold: 31, active: true },
  { id: 103, product_id: 6, price: 3980000, original_price: 5200000, stock: 40, sold: 37, active: true },
  { id: 104, product_id: 3, price: 5300000, original_price: 6500000, stock: 30, sold: 22, active: true },
  { id: 105, product_id: 9, price: 6040000, original_price: 7800000, stock: 35, sold: 29, active: true },
  { id: 106, product_id: 2, price: 980000, original_price: 1290000, stock: 45, sold: 30, active: true },
  { id: 107, product_id: 8, price: 3040000, original_price: 4100000, stock: 60, sold: 47, active: true },
  { id: 108, product_id: 11, price: 17940000, original_price: 29900000, stock: 10, sold: 9, active: true },
];

export const coupons = [
  {
    id: 1,
    code: 'WELCOME10',
    name: 'Giảm 10% cho khách mới',
    discount_type: 'percent',
    discount_value: 10,
    min_order: 1000000,
    max_discount: 500000,
    quantity: 100,
    active: true,
  },
  {
    id: 2,
    code: 'NAMQUAN500',
    name: 'Giảm 500K đơn từ 10 triệu',
    discount_type: 'fixed',
    discount_value: 500000,
    min_order: 10000000,
    max_discount: null,
    quantity: 50,
    active: true,
  },
];
