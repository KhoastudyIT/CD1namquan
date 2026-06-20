import * as notificationService from './notification.service.js';
import { ok } from '../../utils/response.js';

export function list(req, res) {
  ok(res, notificationService.listNotifications(req.user.id));
}

export function markRead(req, res) {
  ok(res, notificationService.markAsRead(req.user.id, req.params.id), 'Đã đánh dấu đã đọc');
}

export function markAllRead(req, res) {
  ok(res, notificationService.markAllAsRead(req.user.id), 'Đã đánh dấu tất cả đã đọc');
}
