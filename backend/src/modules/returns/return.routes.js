import { Router } from 'express';
import * as returnController from './return.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate, validateQuery } from '../../middleware/validate.js';
import { createReturnSchema, updateReturnStatusSchema, returnQuerySchema } from './return.schema.js';

export const returnRouter = Router();

returnRouter.use(authenticate);

// ── Quản trị (đặt trước route của khách để '/admin' không bị '/:id' nuốt) ────
// Nhân viên xử lý trả/đổi như admin, vì đây là một phần của quản lý đơn hàng.
const backoffice = authorize('admin', 'staff');

returnRouter.get('/admin/stats',  backoffice, returnController.stats);
returnRouter.get('/admin/list',   backoffice, validateQuery(returnQuerySchema), returnController.list);
returnRouter.get('/admin/:id',    backoffice, returnController.getOne);
returnRouter.put('/:id/status',   backoffice, validate(updateReturnStatusSchema), returnController.updateStatus);

// ── Khách hàng ───────────────────────────────────────────────────────────────
// Không mở GET /:id cho khách: xem chi tiết yêu cầu của mình đã có trong
// danh sách trả về ở GET /, còn cho tra theo id sẽ lộ yêu cầu của người khác.
returnRouter.post('/', validate(createReturnSchema), returnController.create);
returnRouter.get('/',                                returnController.listMine);
