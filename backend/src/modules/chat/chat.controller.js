import * as chatService from './chat.service.js';
import { ok, created } from '../../utils/response.js';

// ── Khách hàng ──────────────────────────────────────────────────────────────

export async function getMyConversation(req, res, next) {
  try {
    const conversation = await chatService.getOrCreateConversation(req.user.id);
    const messages = await chatService.listMessages(conversation.id);
    ok(res, {
      conversation: {
        id: conversation.id,
        status: conversation.status,
        aiEnabled: conversation.ai_enabled,
        customerUnread: conversation.customer_unread,
      },
      messages,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyMessages(req, res, next) {
  try {
    const conversation = await chatService.getOrCreateConversation(req.user.id);
    const afterId = Number(req.query.after) || 0;
    const messages = await chatService.listMessages(conversation.id, afterId);
    ok(res, {
      messages,
      aiEnabled: conversation.ai_enabled,
      status: conversation.status,
      customerUnread: conversation.customer_unread,
    });
  } catch (error) {
    next(error);
  }
}

export async function sendMessage(req, res, next) {
  try {
    const messages = await chatService.sendCustomerMessage(req.user.id, req.body);
    created(res, { messages }, 'Đã gửi tin nhắn');
  } catch (error) {
    next(error);
  }
}

export async function markRead(req, res, next) {
  try {
    const conversation = await chatService.getOrCreateConversation(req.user.id);
    await chatService.markCustomerRead(conversation.id);
    ok(res, { conversationId: conversation.id }, 'Đã đánh dấu đã đọc');
  } catch (error) {
    next(error);
  }
}

// ── Quản trị ────────────────────────────────────────────────────────────────

export async function listConversations(req, res, next) {
  try {
    const conversations = await chatService.listConversations({
      status: req.query.status || '',
      search: req.query.search || '',
    });
    ok(res, conversations);
  } catch (error) {
    next(error);
  }
}

export async function getConversationDetail(req, res, next) {
  try {
    const conversation = await chatService.getConversation(req.params.id);
    const afterId = Number(req.query.after) || 0;
    const messages = await chatService.listMessages(conversation.id, afterId);
    ok(res, { conversation, messages });
  } catch (error) {
    next(error);
  }
}

export async function replyAsStaff(req, res, next) {
  try {
    const message = await chatService.sendStaffMessage(req.params.id, req.user.id, req.body);
    created(res, message, 'Đã gửi phản hồi');
  } catch (error) {
    next(error);
  }
}

export async function patchConversation(req, res, next) {
  try {
    const conversation = await chatService.updateConversation(req.params.id, req.body);
    ok(res, conversation, 'Đã cập nhật hội thoại');
  } catch (error) {
    next(error);
  }
}

export async function markConversationRead(req, res, next) {
  try {
    await chatService.markStaffRead(req.params.id);
    ok(res, await chatService.getConversation(req.params.id), 'Đã đánh dấu đã đọc');
  } catch (error) {
    next(error);
  }
}

export async function unreadCount(_req, res, next) {
  try {
    ok(res, await chatService.countStaffUnread());
  } catch (error) {
    next(error);
  }
}
