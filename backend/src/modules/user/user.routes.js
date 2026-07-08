import { Router } from 'express';
import * as userController from './user.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

export const userRouter = Router();

// Tất cả routes đều yêu cầu admin
userRouter.use(authenticate, authorize('admin'));

userRouter.get('/',           userController.list);
userRouter.get('/:id',        userController.getById);
userRouter.put('/:id/role',   userController.updateRole);
userRouter.put('/:id/status', userController.updateStatus);
