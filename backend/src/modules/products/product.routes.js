import { Router } from 'express';
import * as productController from './product.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate, validateQuery } from '../../middleware/validate.js';
import { createProductSchema, updateProductSchema, productQuerySchema, createFlashSaleSchema, updateFlashSaleSchema } from './product.schema.js';

export const productRouter = Router();

// Public routes (order matters: specific before parameterized)
productRouter.get('/',            validateQuery(productQuerySchema), productController.list);
productRouter.get('/flash-sales', productController.listFlashSales);

// Admin Flash Sales routes
// Nhân viên chỉ được XEM danh sách đợt sale (để tư vấn giá cho khách); tạo,
// sửa, xoá đợt sale vẫn là đặc quyền của admin.
productRouter.get('/flash-sales/admin',      authenticate, authorize('admin', 'staff'),                       productController.listFlashSalesAdmin);
productRouter.post('/flash-sales/admin',     authenticate, authorize('admin'), validate(createFlashSaleSchema), productController.createFlashSaleAdmin);
productRouter.put('/flash-sales/admin/:id',  authenticate, authorize('admin'), validate(updateFlashSaleSchema), productController.updateFlashSaleAdmin);
productRouter.delete('/flash-sales/admin/:id', authenticate, authorize('admin'),                               productController.deleteFlashSaleAdmin);

productRouter.get('/:id',         productController.getById);

// Protected routes (admin only)
productRouter.post('/',      authenticate, authorize('admin'), validate(createProductSchema), productController.create);
productRouter.put('/:id',    authenticate, authorize('admin'), validate(updateProductSchema), productController.update);
productRouter.delete('/:id', authenticate, authorize('admin'),                                productController.remove);
