import { Router } from 'express';
import * as orderController from './order.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { createOrderSchema } from './order.schema.js';

export const orderRouter = Router();

orderRouter.use(authenticate);

orderRouter.get('/',    orderController.list);
orderRouter.post('/',   validate(createOrderSchema), orderController.create);
orderRouter.get('/:id', orderController.getById);
