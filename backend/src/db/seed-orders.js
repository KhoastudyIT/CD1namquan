import 'dotenv/config';
import db from './index.js';

async function seedOrders() {
  console.log('Seeding demo orders...');
  const userRes = await db.query("SELECT id FROM users WHERE email = 'customer@namquan.vn' LIMIT 1");
  const userId = userRes.rows[0]?.id || '22222222-2222-2222-2222-222222222222';

  const demoOrders = [
    {
      user_id: userId,
      customer_name: 'Nguyễn Văn An',
      customer_email: 'customer@namquan.vn',
      customer_phone: '0912345678',
      total: 18500000,
      final_total: 18500000,
      shipping_address: '142 Nguyễn Văn Cừ, Quận 5, TP. Hồ Chí Minh',
      payment_method: 'cod',
      payment_status: 'paid',
      shipping_status: 'delivered',
      status: 'delivered',
      note: 'Giao giờ hành chính',
      items: [
        { product_id: 1, name: 'Sofa Băng Da Bò Cao Cấp Milano', quantity: 1, price: 18500000 }
      ]
    },
    {
      user_id: userId,
      customer_name: 'Trần Thị Mai',
      customer_email: 'mai.tran@gmail.com',
      customer_phone: '0987654321',
      total: 24200000,
      final_total: 24200000,
      shipping_address: 'Số 88 Võ Văn Tần, Quận 3, TP. Hồ Chí Minh',
      payment_method: 'bank_transfer',
      payment_status: 'paid',
      shipping_status: 'shipping',
      status: 'shipped',
      note: 'Gọi trước khi giao 30 phút',
      items: [
        { product_id: 5, name: 'Giường Bọc Nệm Phong Cách Scandinavian', quantity: 1, price: 14500000 },
        { product_id: 6, name: 'Bàn Trà Mặt Đá Cẩm Thạch Elegance', quantity: 1, price: 9700000 }
      ]
    },
    {
      user_id: userId,
      customer_name: 'Lê Hoàng Nam',
      customer_email: 'nam.le@gmail.com',
      customer_phone: '0903112233',
      total: 36000000,
      final_total: 36000000,
      shipping_address: 'Số 45 Đường số 7, KĐT An Phú, TP. Thủ Đức',
      payment_method: 'vnpay',
      payment_status: 'paid',
      shipping_status: 'not_shipped',
      status: 'processing',
      note: 'Giao nguyên kiện gỗ bảo vệ',
      items: [
        { product_id: 10, name: 'Bộ Bàn Ăn Gỗ Sồi 6 Ghế Bọc Nệm', quantity: 1, price: 36000000 }
      ]
    },
    {
      user_id: userId,
      customer_name: 'Phạm Thu Thảo',
      customer_email: 'thao.pham@gmail.com',
      customer_phone: '0938445566',
      total: 8200000,
      final_total: 8200000,
      shipping_address: 'Shophouse B12, Vinhomes Central Park, Bình Thạnh',
      payment_method: 'cod',
      payment_status: 'unpaid',
      shipping_status: 'not_shipped',
      status: 'pending',
      note: 'Tư vấn thêm về màu sắc',
      items: [
        { product_id: 12, name: 'Tủ Kệ Tivi Gỗ Tự Nhiên Hiện Đại', quantity: 1, price: 8200000 }
      ]
    }
  ];

  for (const o of demoOrders) {
    const res = await db.query(
      `INSERT INTO orders 
        (user_id, customer_name, customer_email, customer_phone, total, final_total, shipping_address, payment_method, payment_status, shipping_status, status, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [o.user_id, o.customer_name, o.customer_email, o.customer_phone, o.total, o.final_total, o.shipping_address, o.payment_method, o.payment_status, o.shipping_status, o.status, o.note]
    );
    const orderId = res.rows[0].id;
    for (const item of o.items) {
      await db.query(
        `INSERT INTO order_items (order_id, product_id, name, quantity, price)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, item.product_id, item.name, item.quantity, item.price]
      );
    }
  }

  console.log('Seed demo orders completed successfully!');
  process.exit(0);
}

seedOrders().catch(err => { console.error('Seed orders failed:', err); process.exit(1); });
