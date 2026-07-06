import * as cartService from './cart.service.js';
import { ok, noContent } from '../../utils/response.js';

export async function getCart(req, res, next) {
  try {
    ok(res, await cartService.getCart(req.user.id));
  } catch (error) {
    next(error);
  }
}

export async function addItem(req, res, next) {
  try {
    ok(res, await cartService.addItem(req.user.id, req.body), 'Đã thêm vào giỏ hàng');
  } catch (error) {
    next(error);
  }
}

export async function updateItem(req, res, next) {
  try {
    ok(res, await cartService.updateItem(req.user.id, req.params.productId, req.body.quantity), 'Đã cập nhật giỏ hàng');
  } catch (error) {
    next(error);
  }
}

export async function removeItem(req, res, next) {
  try {
    ok(res, await cartService.removeItem(req.user.id, req.params.productId), 'Đã xóa khỏi giỏ hàng');
  } catch (error) {
    next(error);
  }
}

export async function clearCart(req, res, next) {
  try {
    await cartService.clearCart(req.user.id);
    noContent(res);
  } catch (error) {
    next(error);
  }
}
