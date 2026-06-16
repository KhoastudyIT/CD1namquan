import { Router } from 'express';
import * as productController from './product.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validate, validateQuery } from '../../middleware/validate.js';
import { createProductSchema, updateProductSchema, productQuerySchema } from './product.schema.js';

export const productRouter = Router();

// Public routes (order matters: specific before parameterized)
productRouter.get('/',            validateQuery(productQuerySchema), productController.list);
productRouter.get('/flash-sales', productController.listFlashSales);
productRouter.get('/:id',         productController.getById);

// Protected routes (admin)
productRouter.post('/',    authenticate, validate(createProductSchema), productController.create);
productRouter.put('/:id',  authenticate, validate(updateProductSchema), productController.update);
productRouter.delete('/:id', authenticate,                              productController.remove);
