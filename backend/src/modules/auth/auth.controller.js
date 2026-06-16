import * as authService from './auth.service.js';
import { ok, created } from '../../utils/response.js';

export async function register(req, res) {
  const result = await authService.register(req.body);
  created(res, result, 'Đăng ký thành công');
}

export async function login(req, res) {
  const result = await authService.login(req.body);
  ok(res, result, 'Đăng nhập thành công');
}

export function getMe(req, res) {
  const user = authService.getMe(req.user.id);
  ok(res, user);
}

export function logout(_req, res) {
  ok(res, null, 'Đăng xuất thành công');
}
