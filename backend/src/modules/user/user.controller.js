import * as userService from './user.service.js';
import { ok, paginated } from '../../utils/response.js';

export function list(req, res) {
  const { data, meta } = userService.listUsers(req.query);
  paginated(res, data, meta);
}

export function getById(req, res) {
  const user = userService.getUser(req.params.id);
  ok(res, user);
}

export function updateRole(req, res) {
  const user = userService.updateUserRole(req.user.id, req.params.id, req.body.role);
  ok(res, user, 'Đã cập nhật quyền người dùng');
}

export function updateStatus(req, res) {
  const user = userService.updateUserStatus(req.user.id, req.params.id, req.body.status);
  const msg = req.body.status === 'suspended' ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản';
  ok(res, user, msg);
}
