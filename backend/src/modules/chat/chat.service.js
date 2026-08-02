import db from '../../db/index.js';
import { AppError } from '../../middleware/errorHandler.js';
import { generateReply } from './chat.bot.js';
import { createNotification } from '../notifications/notification.service.js';

function mapMessage(row) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderType: row.sender_type,
    senderName: row.sender_name ?? null,
    message: row.message,
    productId: row.product_id,
    suggestions: row.suggestions ?? [],
    intent: row.intent || '',
    read: row.is_read,
    createdAt: row.created_at,
  };
}

function mapConversation(row) {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name ?? null,
    userEmail: row.user_email ?? null,
    userPhone: row.user_phone ?? null,
    status: row.status,
    aiEnabled: row.ai_enabled,
    lastMessage: row.last_message,
    lastMessageAt: row.last_message_at,
    customerUnread: row.customer_unread,
    staffUnread: row.staff_unread,
    createdAt: row.created_at,
  };
}

const MESSAGE_SELECT = `
  m.id, m.conversation_id, m.sender_type, m.message, m.product_id,
  m.suggestions, m.intent, m.is_read, m.created_at,
  CASE WHEN m.sender_type = 'customer' THEN u.name ELSE NULL END AS sender_name
`;

const WELCOME =
  'Chào anh/chị, em là trợ lý tư vấn của **NAM QUAN**.\n' +
  'Em có thể tra giúp anh/chị **giá, tồn kho, chất liệu, kích thước, bảo hành** của từng sản phẩm, ' +
  'cũng như chính sách **giao hàng, thanh toán, đổi trả**.\n' +
  'Anh/chị cần hỗ trợ gì ạ? Muốn gặp nhân viên tư vấn thì gõ **"gặp nhân viên"** nhé.';

/**
 * Mỗi khách chỉ có một hội thoại tồn tại mãi mãi — kể cả khi đã đóng, ta vẫn
 * trả về chính nó chứ không sinh luồng mới, để lịch sử nằm một chỗ.
 * Ràng buộc UNIQUE(user_id) chặn tạo trùng; nếu 2 tab cùng tạo một lúc thì
 * INSERT thứ hai đụng ràng buộc và ta đọc lại bản ghi tab kia vừa tạo.
 */
export async function getOrCreateConversation(userId) {
  const existing = await db.query(
    `SELECT * FROM chat_conversations WHERE user_id = $1 LIMIT 1`,
    [userId],
  );
  if (existing.rows.length > 0) return existing.rows[0];

  try {
    const created = await db.query(
      `INSERT INTO chat_conversations (user_id, last_message, last_message_at)
       VALUES ($1, $2, NOW()) RETURNING *`,
      [userId, WELCOME],
    );
    const conversation = created.rows[0];

    await db.query(
      `INSERT INTO chat_messages (conversation_id, sender_type, message, intent)
       VALUES ($1, 'ai', $2, 'greeting')`,
      [conversation.id, WELCOME],
    );
    await db.query(
      `UPDATE chat_conversations SET customer_unread = 1 WHERE id = $1`,
      [conversation.id],
    );
    return { ...conversation, customer_unread: 1 };
  } catch (err) {
    if (err.code === '23505') {
      const raced = await db.query(
        `SELECT * FROM chat_conversations WHERE user_id = $1 LIMIT 1`,
        [userId],
      );
      if (raced.rows.length > 0) return raced.rows[0];
    }
    throw err;
  }
}

export async function listMessages(conversationId, afterId = 0) {
  const res = await db.query(
    `SELECT ${MESSAGE_SELECT}
     FROM chat_messages m
     LEFT JOIN users u ON u.id = m.user_id
     WHERE m.conversation_id = $1 AND m.id > $2
     ORDER BY m.id ASC`,
    [conversationId, afterId],
  );
  return res.rows.map(mapMessage);
}

/** Ghi một tin nhắn và đồng bộ metadata hội thoại trong cùng một lượt. */
async function insertMessage(conversationId, {
  senderType, message, userId = null, productId = null,
  suggestions = [], intent = '',
}) {
  const res = await db.query(
    `INSERT INTO chat_messages
       (conversation_id, user_id, sender_type, message, product_id, suggestions, intent)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
     RETURNING *`,
    [conversationId, userId, senderType, message, productId, JSON.stringify(suggestions), intent],
  );

  const unreadColumn = senderType === 'customer' ? 'staff_unread' : 'customer_unread';
  await db.query(
    `UPDATE chat_conversations
     SET last_message = $2,
         last_message_at = NOW(),
         ${unreadColumn} = ${unreadColumn} + 1,
         last_product_id = COALESCE($3, last_product_id)
     WHERE id = $1`,
    [conversationId, message, productId],
  );

  return mapMessage(res.rows[0]);
}

async function notifyAdminsHandoff(conversationId, customerName) {
  const admins = await db.query(`SELECT id FROM users WHERE role = 'admin' AND status = 'active'`);
  await Promise.all(admins.rows.map(admin =>
    createNotification(admin.id, {
      type: 'system',
      title: 'Khách hàng cần tư vấn viên',
      message: `${customerName || 'Một khách hàng'} vừa yêu cầu gặp nhân viên trong khung chat.`,
      link: `/admin#chat`,
    }).catch(() => {}) // thông báo hỏng không được làm hỏng luồng chat
  ));
}

/**
 * Nhân viên im lặng quá lâu thì coi như đã rời đi và bot nhận lại việc trả lời.
 * Không có mốc này, chỉ một câu của nhân viên là bot tắt vĩnh viễn — khách hỏi
 * tiếp lúc nửa đêm sẽ không ai đáp.
 */
const STAFF_IDLE_MS = 15 * 60 * 1000;

/**
 * Chỉ áp dụng khi hội thoại ĐÃ có tin của nhân viên. Trường hợp khách vừa gõ
 * "gặp nhân viên" mà chưa ai vào thì giữ nguyên bot tắt — đó là yêu cầu rõ
 * ràng của khách, không được tự ý đè lên.
 */
async function maybeReviveBot(conversation) {
  if (conversation.ai_enabled) return conversation;

  const lastStaff = await db.query(
    `SELECT created_at FROM chat_messages
     WHERE conversation_id = $1 AND sender_type = 'staff'
     ORDER BY id DESC LIMIT 1`,
    [conversation.id],
  );
  if (lastStaff.rows.length === 0) return conversation;

  const idleMs = Date.now() - new Date(lastStaff.rows[0].created_at).getTime();
  if (idleMs < STAFF_IDLE_MS) return conversation;

  await db.query(`UPDATE chat_conversations SET ai_enabled = TRUE WHERE id = $1`, [conversation.id]);
  return { ...conversation, ai_enabled: true };
}

export async function sendCustomerMessage(userId, { message, productId = null }) {
  let conversation = await getOrCreateConversation(userId);

  // Nhân viên đóng hội thoại nghĩa là "đã xử lý xong". Khách nhắn lại thì mở
  // chính luồng đó ra, không tạo luồng mới — lịch sử vẫn liền mạch.
  if (conversation.status === 'closed') {
    await db.query(`UPDATE chat_conversations SET status = 'open' WHERE id = $1`, [conversation.id]);
    conversation.status = 'open';
  }

  conversation = await maybeReviveBot(conversation);

  const customerMessage = await insertMessage(conversation.id, {
    senderType: 'customer',
    message,
    userId,
    productId,
  });

  const result = [customerMessage];
  if (!conversation.ai_enabled) return result;

  const bot = await generateReply({
    text: message,
    productId,
    lastProductId: conversation.last_product_id,
  });

  const botMessage = await insertMessage(conversation.id, {
    senderType: 'ai',
    message: bot.message,
    productId: bot.productId,
    suggestions: bot.suggestions,
    intent: bot.intent,
  });
  result.push(botMessage);

  if (bot.handoff) {
    await db.query(`UPDATE chat_conversations SET ai_enabled = FALSE WHERE id = $1`, [conversation.id]);
    const user = await db.query(`SELECT name FROM users WHERE id = $1`, [userId]);
    await notifyAdminsHandoff(conversation.id, user.rows[0]?.name);
  }

  return result;
}

export async function markCustomerRead(conversationId) {
  await db.query(
    `UPDATE chat_messages SET is_read = TRUE
     WHERE conversation_id = $1 AND sender_type <> 'customer' AND is_read = FALSE`,
    [conversationId],
  );
  await db.query(
    `UPDATE chat_conversations SET customer_unread = 0 WHERE id = $1`,
    [conversationId],
  );
}

// ── Phía quản trị ───────────────────────────────────────────────────────────

export async function listConversations({ status = '', search = '' } = {}) {
  const params = [];
  const where = [];

  if (status) {
    params.push(status);
    where.push(`c.status = $${params.length}`);
  }
  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    where.push(`(LOWER(u.name) LIKE $${params.length} OR LOWER(u.email) LIKE $${params.length})`);
  }

  const res = await db.query(
    `SELECT c.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
     FROM chat_conversations c
     JOIN users u ON u.id = c.user_id
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY c.last_message_at DESC
     LIMIT 100`,
    params,
  );
  return res.rows.map(mapConversation);
}

export async function getConversation(conversationId) {
  const res = await db.query(
    `SELECT c.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
     FROM chat_conversations c
     JOIN users u ON u.id = c.user_id
     WHERE c.id = $1`,
    [conversationId],
  );
  if (res.rows.length === 0) throw new AppError('Không tìm thấy hội thoại', 404);
  return mapConversation(res.rows[0]);
}

export async function countStaffUnread() {
  const res = await db.query(
    `SELECT COALESCE(SUM(staff_unread), 0) AS total,
            COUNT(*) FILTER (WHERE staff_unread > 0) AS conversations
     FROM chat_conversations WHERE status = 'open'`,
  );
  return {
    total: Number(res.rows[0].total),
    conversations: Number(res.rows[0].conversations),
  };
}

/** Nhân viên nhắn cũng tự động TẮT bot — hai bên cùng trả lời một khách sẽ rối. */
export async function sendStaffMessage(conversationId, staffId, { message }) {
  const conversation = await getConversation(conversationId);
  if (conversation.status === 'closed') {
    throw new AppError('Hội thoại đã đóng, không thể gửi tin nhắn', 400);
  }

  const staffMessage = await insertMessage(conversationId, {
    senderType: 'staff',
    message,
    userId: staffId,
  });

  await db.query(
    `UPDATE chat_conversations SET ai_enabled = FALSE, staff_unread = 0 WHERE id = $1`,
    [conversationId],
  );

  await createNotification(conversation.userId, {
    type: 'system',
    title: 'Nhân viên NAM QUAN đã phản hồi',
    message: message.length > 120 ? `${message.slice(0, 117)}...` : message,
    // ?chat=1 để App bật sẵn khung chat khi khách bấm vào thông báo —
    // trỏ về '/' thì khách chỉ thấy trang chủ và không biết đọc trả lời ở đâu.
    link: '/?chat=1',
  }).catch(() => {});

  return staffMessage;
}

export async function updateConversation(conversationId, { aiEnabled, status }) {
  const current = await getConversation(conversationId);

  const sets = [];
  const params = [conversationId];

  if (aiEnabled !== undefined) {
    params.push(aiEnabled);
    sets.push(`ai_enabled = $${params.length}`);
  }
  if (status !== undefined) {
    params.push(status);
    sets.push(`status = $${params.length}`);
  }
  if (sets.length === 0) return current;

  const res = await db.query(
    `UPDATE chat_conversations SET ${sets.join(', ')} WHERE id = $1 RETURNING id`,
    params,
  );
  if (res.rows.length === 0) throw new AppError('Không tìm thấy hội thoại', 404);

  return getConversation(conversationId);
}

export async function markStaffRead(conversationId) {
  await db.query(
    `UPDATE chat_messages SET is_read = TRUE
     WHERE conversation_id = $1 AND sender_type = 'customer' AND is_read = FALSE`,
    [conversationId],
  );
  await db.query(
    `UPDATE chat_conversations SET staff_unread = 0 WHERE id = $1`,
    [conversationId],
  );
}
