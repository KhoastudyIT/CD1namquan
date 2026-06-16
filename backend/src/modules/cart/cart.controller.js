import * as cartService from './cart.service.js';
import { ok, noContent } from '../../utils/response.js';

export function getCart(req, res) {
  ok(res, cartService.getCart(req.user.id));
}

export function addItem(req, res) {
  ok(res, cartService.addItem(req.user.id, req.body), 'Đã thêm vào giỏ hàng');
}

export function updateItem(req, res) {
  ok(res, cartService.updateItem(req.user.id, req.params.productId, req.body.quantity), 'Đã cập nhật giỏ hàng');
}

export function removeItem(req, res) {
  ok(res, cartService.removeItem(req.user.id, req.params.productId), 'Đã xóa khỏi giỏ hàng');
}

export function clearCart(req, res) {
  cartService.clearCart(req.user.id);
  noContent(res);
}
