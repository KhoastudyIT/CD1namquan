import * as orderService from './order.service.js';
import { ok, created } from '../../utils/response.js';

export function list(req, res) {
  ok(res, orderService.listOrders(req.user.id));
}

export function getById(req, res) {
  ok(res, orderService.getOrderById(req.user.id, req.params.id));
}

export function create(req, res) {
  const order = orderService.createOrder(req.user.id, req.body);
  created(res, order, 'Đặt hàng thành công');
}

export function listAll(_req, res) {
  ok(res, orderService.listAllOrders());
}

export function updateStatus(req, res) {
  const order = orderService.updateOrderStatus(req.params.id, req.body.status);
  ok(res, order, 'Đã cập nhật trạng thái đơn hàng');
}
