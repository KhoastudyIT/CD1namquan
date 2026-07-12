import * as notificationService from './notification.service.js';
import { ok } from '../../utils/response.js';

export async function list(req, res, next) {
  try {
    ok(res, await notificationService.listNotifications(req.user.id));
  } catch (error) {
    next(error);
  }
}

export async function markRead(req, res, next) {
  try {
    ok(res, await notificationService.markAsRead(req.user.id, req.params.id), 'Đã đánh dấu đã đọc');
  } catch (error) {
    next(error);
  }
}

export async function markAllRead(req, res, next) {
  try {
    ok(res, await notificationService.markAllAsRead(req.user.id), 'Đã đánh dấu tất cả đã đọc');
  } catch (error) {
    next(error);
  }
}
