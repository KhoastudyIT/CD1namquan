import { Router } from 'express';
import * as notificationController from './notification.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

export const notificationRouter = Router();

notificationRouter.use(authenticate);

notificationRouter.get('/',          notificationController.list);
notificationRouter.put('/read-all',  notificationController.markAllRead);
notificationRouter.put('/:id/read',  notificationController.markRead);
