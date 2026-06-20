import { randomUUID } from 'crypto';
import { notifications } from '../../db/store.js';
import { AppError } from '../../middleware/errorHandler.js';

/**
 * Create a notification for a user. Called by other modules when events
 * happen (registration, new order, order status change, ...).
 */
export function createNotification(userId, { type = 'system', title, message, link = '' }) {
  const notification = {
    id: randomUUID(),
    userId,
    type,
    title,
    message,
    link,
    read: false,
    createdAt: new Date().toISOString(),
  };
  notifications.set(notification.id, notification);
  return notification;
}

export function listNotifications(userId) {
  return [...notifications.values()]
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function markAsRead(userId, id) {
  const n = notifications.get(id);
  if (!n) throw new AppError('Không tìm thấy thông báo', 404);
  if (n.userId !== userId) throw new AppError('Bạn không có quyền', 403);
  n.read = true;
  return n;
}

export function markAllAsRead(userId) {
  [...notifications.values()]
    .filter(n => n.userId === userId)
    .forEach(n => { n.read = true; });
  return listNotifications(userId);
}
