import * as orderService from './order.service.js';
import { ok, created } from '../../utils/response.js';

export async function list(req, res, next) {
  try {
    ok(res, await orderService.listOrders(req.user.id));
  } catch (error) {
    next(error);
  }
}

export async function getById(req, res, next) {
  try {
    ok(res, await orderService.getOrderById(req.user.id, req.params.id));
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    const order = await orderService.createOrder(req.user.id, req.body);
    created(res, order, 'Đặt hàng thành công');
  } catch (error) {
    next(error);
  }
}

export async function listAll(_req, res, next) {
  try {
    ok(res, await orderService.listAllOrders());
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const order = await orderService.updateOrderStatus(req.params.id, req.body.status);
    ok(res, order, 'Đã cập nhật trạng thái đơn hàng');
  } catch (error) {
    next(error);
  }
}
