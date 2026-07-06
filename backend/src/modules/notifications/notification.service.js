import db from '../../db/index.js';
import { AppError } from '../../middleware/errorHandler.js';

export async function createNotification(userId, { type = 'system', title, message, link = '' }) {
  const res = await db.query(
    'INSERT INTO notifications (user_id, type, title, content, target_url, is_read) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [userId, type, title, message, link, false]
  );
  const n = res.rows[0];
  // Convert column names back to what frontend expects
  return {
    id: n.id,
    userId: n.user_id,
    type: n.type,
    title: n.title,
    message: n.content,
    link: n.target_url,
    read: n.is_read,
    createdAt: n.created_at
  };
}

export async function listNotifications(userId) {
  const res = await db.query(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return res.rows.map(n => ({
    id: n.id,
    userId: n.user_id,
    type: n.type,
    title: n.title,
    message: n.content,
    link: n.target_url,
    read: n.is_read,
    createdAt: n.created_at
  }));
}

export async function markAsRead(userId, id) {
  const res = await db.query(
    'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
    [id, userId]
  );
  if (res.rows.length === 0) throw new AppError('Không tìm thấy thông báo hoặc bạn không có quyền', 404);
  const n = res.rows[0];
  return {
    id: n.id,
    userId: n.user_id,
    type: n.type,
    title: n.title,
    message: n.content,
    link: n.target_url,
    read: n.is_read,
    createdAt: n.created_at
  };
}

export async function markAllAsRead(userId) {
  await db.query(
    'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
    [userId]
  );
  return await listNotifications(userId);
}
