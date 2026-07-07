import { Router } from 'express';
import * as collectionController from './collection.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createCollectionSchema, updateCollectionSchema } from './collection.schema.js';

export const collectionRouter = Router();

// Public
collectionRouter.get('/', collectionController.list);

// Admin only
collectionRouter.post('/',      authenticate, authorize('admin'), validate(createCollectionSchema), collectionController.create);
collectionRouter.put('/:id',    authenticate, authorize('admin'), validate(updateCollectionSchema), collectionController.update);
collectionRouter.delete('/:id', authenticate, authorize('admin'),                                   collectionController.remove);
