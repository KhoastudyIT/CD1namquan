import * as userService from './user.service.js';

export function list(req, res) {
  const { search, role, status, page = '1', limit = '10' } = req.query;
  const result = userService.listUsers({
    search,
    role,
    status,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  });
  res.json({ success: true, message: 'Success', ...result });
}

export function getById(req, res) {
  const user = userService.getUserById(req.params.id);
  res.json({ success: true, message: 'Success', data: user });
}

export function updateRole(req, res) {
  const { role } = req.body;
  const user = userService.updateUserRole(req.params.id, role, req.user.id);
  res.json({ success: true, message: 'Cập nhật quyền thành công', data: user });
}

export function updateStatus(req, res) {
  const { status } = req.body;
  const user = userService.updateUserStatus(req.params.id, status, req.user.id);
  res.json({ success: true, message: 'Cập nhật trạng thái thành công', data: user });
}
