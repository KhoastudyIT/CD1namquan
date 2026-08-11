import { Router } from 'express';
import * as consultationController from './consultation.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validateQuery } from '../../middleware/validate.js';
import { consultationListQuerySchema } from './consultation.schema.js';

export const consultationRouter = Router();

const adminOnly = [authenticate, authorize('admin')];

// ── Public ───────────────────────────────────────────────────────────────────
// Khách để lại thông tin ở trang chủ — không cần đăng nhập.
consultationRouter.post('/', consultationController.create);

// ── Admin ────────────────────────────────────────────────────────────────────
// '/stats' phải đứng trước '/:id', nếu không sẽ bị nuốt thành id.
consultationRouter.get('/stats', ...adminOnly, consultationController.stats);
consultationRouter.get('/', ...adminOnly, validateQuery(consultationListQuerySchema), consultationController.list);
consultationRouter.get('/:id', ...adminOnly, consultationController.getOne);
consultationRouter.patch('/:id/status', ...adminOnly, consultationController.updateStatus);
consultationRouter.delete('/:id', ...adminOnly, consultationController.remove);
