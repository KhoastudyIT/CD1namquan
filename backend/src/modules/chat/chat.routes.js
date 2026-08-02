import { Router } from 'express';
import * as chatController from './chat.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { sendMessageSchema, staffReplySchema, updateConversationSchema } from './chat.schema.js';

export const chatRouter = Router();

chatRouter.use(authenticate);

// ── Quản trị (đặt trước các route của khách để '/admin' không bị nuốt) ──────
const adminOnly = [authorize('admin')];

chatRouter.get('/admin/unread-count',          adminOnly, chatController.unreadCount);
chatRouter.get('/admin/conversations',         adminOnly, chatController.listConversations);
chatRouter.get('/admin/conversations/:id',     adminOnly, chatController.getConversationDetail);
chatRouter.post('/admin/conversations/:id/messages', adminOnly, validate(staffReplySchema), chatController.replyAsStaff);
chatRouter.patch('/admin/conversations/:id',   adminOnly, validate(updateConversationSchema), chatController.patchConversation);
chatRouter.put('/admin/conversations/:id/read', adminOnly, chatController.markConversationRead);

// ── Khách hàng ──────────────────────────────────────────────────────────────
chatRouter.get('/conversation', chatController.getMyConversation);
chatRouter.get('/messages',     chatController.getMyMessages);
chatRouter.post('/messages',    validate(sendMessageSchema), chatController.sendMessage);
chatRouter.put('/read',         chatController.markRead);
