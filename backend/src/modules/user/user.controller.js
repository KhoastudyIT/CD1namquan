import * as userService from './user.service.js';
import { ok, created, paginated } from '../../utils/response.js';

export async function list(req, res, next) {
  try {
    const { data, meta } = await userService.listUsers(req.query);
    paginated(res, data, meta);
  } catch(err) { next(err); }
}

export async function create(req, res, next) {
  try {
    const user = await userService.createUser(req.body);
    const msg = user.role === 'staff' ? 'Đã tạo tài khoản nhân viên' : 'Đã tạo tài khoản';
    created(res, user, msg);
  } catch(err) { next(err); }
}

export async function getById(req, res, next) {
  try {
    const user = await userService.getUser(req.params.id);
    ok(res, user);
  } catch(err) { next(err); }
}

export async function updateRole(req, res, next) {
  try {
    const user = await userService.updateUserRole(req.user.id, req.params.id, req.body.role);
    ok(res, user, 'Đã cập nhật quyền người dùng');
  } catch(err) { next(err); }
}

export async function updateStatus(req, res, next) {
  try {
    const user = await userService.updateUserStatus(req.user.id, req.params.id, req.body.status);
    const msg = req.body.status === 'suspended' ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản';
    ok(res, user, msg);
  } catch(err) { next(err); }
}
