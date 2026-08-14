import { Router } from 'express';
import * as orderController from './order.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createOrderSchema, updateOrderStatusSchema } from './order.schema.js';

export const orderRouter = Router();

orderRouter.use(authenticate);

// Admin routes (specific paths before parameterized ones)
// Xử lý đơn hàng là nghiệp vụ chính của nhân viên: staff được xem toàn bộ đơn
// và cập nhật trạng thái giao hàng như admin.
const backoffice = authorize('admin', 'staff');

orderRouter.get('/admin/list',     backoffice, orderController.listAll);
orderRouter.put('/:id/status',     backoffice, validate(updateOrderStatusSchema), orderController.updateStatus);

// Customer routes
orderRouter.get('/',    orderController.list);
orderRouter.post('/',   validate(createOrderSchema), orderController.create);
orderRouter.get('/:id', orderController.getById);
