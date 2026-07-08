import { Router } from 'express';
import * as categoryController from './category.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createCategorySchema, updateCategorySchema } from './category.schema.js';

export const categoryRouter = Router();

categoryRouter.get('/', categoryController.list);

// Admin routes
categoryRouter.post('/', authenticate, authorize('admin'), validate(createCategorySchema), categoryController.create);
categoryRouter.put('/:id', authenticate, authorize('admin'), validate(updateCategorySchema), categoryController.update);
categoryRouter.delete('/:id', authenticate, authorize('admin'), categoryController.remove);
