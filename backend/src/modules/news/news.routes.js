import { Router } from 'express';
import * as newsController from './news.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createNewsSchema, updateNewsSchema } from './news.schema.js';

export const newsRouter = Router();

// Public
newsRouter.get('/',    newsController.list);
newsRouter.get('/:id', newsController.getById);

// Admin only
newsRouter.post('/',      authenticate, authorize('admin'), validate(createNewsSchema), newsController.create);
newsRouter.put('/:id',    authenticate, authorize('admin'), validate(updateNewsSchema), newsController.update);
newsRouter.delete('/:id', authenticate, authorize('admin'),                             newsController.remove);
