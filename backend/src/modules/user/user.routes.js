import { Router } from 'express';
import * as userController from './user.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate, validateQuery } from '../../middleware/validate.js';
import { listUsersQuerySchema, updateRoleSchema, updateStatusSchema } from './user.schema.js';

export const userRouter = Router();

// Admin only — user management
userRouter.use(authenticate, authorize('admin'));

userRouter.get('/',            validateQuery(listUsersQuerySchema), userController.list);
userRouter.get('/:id',                                             userController.getById);
userRouter.put('/:id/role',    validate(updateRoleSchema),         userController.updateRole);
userRouter.put('/:id/status',  validate(updateStatusSchema),       userController.updateStatus);
