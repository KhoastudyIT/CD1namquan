import { Router } from 'express';
import * as settingsController from './settings.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { updateCompanyInfoSchema } from './settings.schema.js';

export const settingsRouter = Router();
settingsRouter.get('/', settingsController.get);

// Admin only
settingsRouter.put('/', authenticate, authorize('admin'), validate(updateCompanyInfoSchema), settingsController.update);
