import { Router } from 'express';
import * as statsController from './stats.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validateQuery } from '../../middleware/validate.js';
import { reportQuerySchema } from './stats.schema.js';

export const statsRouter = Router();

// Khu thống kê của dashboard — nhân viên xem được để nắm tình hình đơn hàng,
// tồn kho; toàn bộ tuyến ở đây đều là GET nên không cần readOnly.
statsRouter.use(authenticate, authorize('admin', 'staff'));

statsRouter.get('/overview', validateQuery(reportQuerySchema), statsController.overview);
statsRouter.get('/export', validateQuery(reportQuerySchema), statsController.exportExcel);
