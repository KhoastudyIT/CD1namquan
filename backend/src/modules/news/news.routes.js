import { Router } from 'express';
import * as newsController from './news.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validateQuery } from '../../middleware/validate.js';
import {
  newsListQuerySchema,
  adminNewsListQuerySchema,
  relatedQuerySchema,
} from './news.schema.js';

export const newsRouter = Router();

const adminOnly = [authenticate, authorize('admin')];

// ── Public ───────────────────────────────────────────────────────────────────
// Các route tĩnh phải khai báo trước '/:idOrSlug', nếu không 'categories' sẽ bị
// nuốt thành slug bài viết.
newsRouter.get('/categories', newsController.listCategories);

// ── Admin ────────────────────────────────────────────────────────────────────
newsRouter.get('/admin/list', ...adminOnly, validateQuery(adminNewsListQuerySchema), newsController.adminList);
newsRouter.get('/admin/:id',  ...adminOnly, newsController.adminGetById);

// ── Public (tiếp) ────────────────────────────────────────────────────────────
newsRouter.get('/',                  validateQuery(newsListQuerySchema), newsController.list);
newsRouter.get('/:idOrSlug/related', validateQuery(relatedQuerySchema), newsController.listRelated);
newsRouter.get('/:idOrSlug',         newsController.getOne);

// ── Admin — thao tác ghi ─────────────────────────────────────────────────────
newsRouter.post('/',             ...adminOnly, newsController.create);
newsRouter.put('/:id',           ...adminOnly, newsController.update);
newsRouter.patch('/:id/status',  ...adminOnly, newsController.updateStatus);
newsRouter.delete('/:id',        ...adminOnly, newsController.remove);
