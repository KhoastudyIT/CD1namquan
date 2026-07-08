import { Router } from 'express';
import * as statsController from './stats.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

export const statsRouter = Router();

// GET /api/v1/stats/overview — chỉ admin
statsRouter.get('/overview', authenticate, authorize('admin'), statsController.overview);
