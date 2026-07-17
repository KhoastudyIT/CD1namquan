import db from '../../db/index.js';
import { AppError } from '../../middleware/errorHandler.js';

async function getOrCreateCart(userId) {
  const res = await db.query('SELECT id FROM carts WHERE user_id = $1', [userId]);
  if (res.rows.length > 0) return res.rows[0].id;

  const insert = await db.query('INSERT INTO carts (user_id) VALUES ($1) RETURNING id', [userId]);
  return insert.rows[0].id;
}

export async function getCart(userId) {
  const cartId = await getOrCreateCart(userId);
  
  const res = await db.query(`
    SELECT ci.id, ci.product_id, ci.quantity, 
           p.name as product_name, p.price as product_price, p.img as product_img
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.cart_id = $1
    ORDER BY ci.created_at ASC
  `, [cartId]);

  const items = res.rows.map(r => ({
    id: r.id,
    productId: r.product_id,
    quantity: r.quantity,
    product: {
      id: r.product_id,
      name: r.product_name,
      price: r.product_price,
      img: r.product_img
    }
  }));

  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return { items, total, itemCount };
}

export async function addItem(userId, { productId, quantity }) {
  const check = await db.query('SELECT id FROM products WHERE id = $1', [productId]);
  if (check.rows.length === 0) throw new AppError('Không tìm thấy sản phẩm', 404);

  const cartId = await getOrCreateCart(userId);
  
  const existing = await db.query('SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2', [cartId, productId]);
  
  if (existing.rows.length > 0) {
    await db.query('UPDATE cart_items SET quantity = quantity + $1 WHERE id = $2', [quantity, existing.rows[0].id]);
  } else {
    await db.query('INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3)', [cartId, productId, quantity]);
  }

  return await getCart(userId);
}

export async function updateItem(userId, productId, quantity) {
  const cartId = await getOrCreateCart(userId);
  
  const res = await db.query('UPDATE cart_items SET quantity = $1 WHERE cart_id = $2 AND product_id = $3 RETURNING id', [quantity, cartId, productId]);
  if (res.rows.length === 0) throw new AppError('Sản phẩm không có trong giỏ hàng', 404);
  
  return await getCart(userId);
}

export async function removeItem(userId, productId) {
  const cartId = await getOrCreateCart(userId);
  await db.query('DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2', [cartId, productId]);
  return await getCart(userId);
}

export async function clearCart(userId) {
  const cartId = await getOrCreateCart(userId);
  await db.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
}
