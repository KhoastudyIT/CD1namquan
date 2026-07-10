import { Router } from 'express';
import * as statsController from './stats.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

export const statsRouter = Router();

// Admin only — dashboard analytics
statsRouter.use(authenticate, authorize('admin'));

statsRouter.get('/overview', statsController.overview);
