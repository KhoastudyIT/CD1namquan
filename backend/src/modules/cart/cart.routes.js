import { Router } from 'express';
import * as cartController from './cart.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { addItemSchema, updateItemSchema } from './cart.schema.js';

export const cartRouter = Router();

cartRouter.use(authenticate);

cartRouter.get('/',                                              cartController.getCart);
cartRouter.post('/items',            validate(addItemSchema),   cartController.addItem);
cartRouter.put('/items/:productId',  validate(updateItemSchema), cartController.updateItem);
cartRouter.delete('/items/:productId',                           cartController.removeItem);
cartRouter.delete('/',                                           cartController.clearCart);
