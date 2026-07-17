import * as authService from './auth.service.js';
import { ok, created } from '../../utils/response.js';

export async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    created(res, result, 'Đăng ký thành công');
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    ok(res, result, 'Đăng nhập thành công');
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res, next) {
  try {
    const user = await authService.getMe(req.user.id);
    ok(res, user);
  } catch (error) {
    next(error);
  }
}

export function logout(_req, res) {
  ok(res, null, 'Đăng xuất thành công');
}
