import { Router } from 'express';
import * as userController from './user.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize, readOnly } from '../../middleware/authorize.js';
import { validate, validateQuery } from '../../middleware/validate.js';
import { listUsersQuerySchema, createUserSchema, updateRoleSchema, updateStatusSchema } from './user.schema.js';

export const userRouter = Router();

// Nhân viên được XEM danh sách người dùng để tra cứu khi xử lý đơn và trả lời
// khách; mọi thao tác ghi (tạo tài khoản, đổi vai trò, khoá/mở khoá) là đặc
// quyền của admin — readOnly('staff') chặn sạch nên không cần lặp lại ở từng tuyến.
userRouter.use(authenticate, authorize('admin', 'staff'), readOnly('staff'));

userRouter.get('/',            validateQuery(listUsersQuerySchema), userController.list);
userRouter.post('/',           validate(createUserSchema),          userController.create);
userRouter.get('/:id',                                              userController.getById);
userRouter.put('/:id/role',    validate(updateRoleSchema),          userController.updateRole);
userRouter.put('/:id/status',  validate(updateStatusSchema),        userController.updateStatus);
