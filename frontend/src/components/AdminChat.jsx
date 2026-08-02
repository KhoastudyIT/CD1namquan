import { useState, useEffect, useRef, useCallback } from "react";
import { Icon, toast } from "./ui.jsx";
import { api } from "../api.js";
import { timeAgo } from "../utils/notif.js";

const POLL_MS = 5000;

/**
 * Câu trả lời mẫu cho nhân viên. Bấm vào là CHÈN vào ô soạn chứ không gửi
 * ngay — nhân viên gần như luôn cần sửa tên khách hoặc thêm chi tiết đơn hàng.
 */
const STAFF_QUICK = [
  { label: "Chào hỏi", text: "Dạ em chào anh/chị, em là tư vấn viên của NAM QUAN. Em có thể hỗ trợ gì cho mình ạ?" },
  { label: "Xin số điện thoại", text: "Anh/chị để lại giúp em số điện thoại và khung giờ tiện nghe máy, em sẽ gọi tư vấn chi tiết hơn ạ." },
  { label: "Đang kiểm tra", text: "Em đang kiểm tra thông tin này giúp anh/chị, mình đợi em một chút nhé ạ." },
  { label: "Còn hàng", text: "Dạ sản phẩm này bên em còn hàng ạ. Anh/chị cho em xin địa chỉ để em báo thời gian giao dự kiến nhé." },
  { label: "Hết hàng", text: "Dạ mẫu này hiện đã hết hàng ạ. Em xin phép gợi ý anh/chị vài mẫu tương tự cùng tầm giá nhé?" },
  { label: "Báo giá", text: "Dạ em gửi anh/chị báo giá chi tiết kèm chi phí vận chuyển và lắp đặt ạ." },
  { label: "Hẹn xem showroom", text: "Anh/chị có thể ghé showroom để xem trực tiếp ạ. Mình dự kiến ghé hôm nào để em sắp lịch đón tiếp nhé?" },
  { label: "Cảm ơn / kết thúc", text: "Em cảm ơn anh/chị đã quan tâm tới NAM QUAN ạ. Có gì cần hỗ trợ thêm mình cứ nhắn em nhé!" },
];

const SENDER_LABEL = {
  customer: "Khách hàng",
  ai: "Trợ lý tự động",
  staff: "Nhân viên",
  system: "Hệ thống",
};

/** Bot dùng **in đậm** + xuống dòng; parse thủ công thay vì nhét HTML thô. */
function RichText({ text }) {
  return (
    <>
      {String(text).split("\n").map((line, li) => (
        <span key={li}>
          {li > 0 && <br />}
          {line.split("**").map((part, pi) =>
            pi % 2 === 1 ? <strong key={pi}>{part}</strong> : <span key={pi}>{part}</span>
          )}
        </span>
      ))}
    </>
  );
}

export function AdminChat() {
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [showQuick, setShowQuick] = useState(false);
  const draftRef = useRef(null);

  const lastIdRef = useRef(0);
  const threadRef = useRef(null);

  const fetchConversations = useCallback(() => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (search.trim()) params.search = search.trim();
    return api.getChatConversations(params)
      .then((data) => setConversations(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingList(false));
  }, [statusFilter, search]);

  useEffect(() => {
    setLoadingList(true);
    fetchConversations();
    const id = setInterval(fetchConversations, POLL_MS);
    return () => clearInterval(id);
  }, [fetchConversations]);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;

    setLoadingThread(true);
    lastIdRef.current = 0;
    api.getChatConversationDetail(selectedId)
      .then((data) => {
        if (cancelled) return;
        setDetail(data.conversation);
        setMessages(data.messages || []);
        if (data.messages?.length) {
          lastIdRef.current = data.messages[data.messages.length - 1].id;
        }
        return api.markChatConversationRead(selectedId);
      })
      .then(() => { if (!cancelled) fetchConversations(); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingThread(false); });

    return () => { cancelled = true; };
  }, [selectedId, fetchConversations]);

  useEffect(() => {
    if (!selectedId) return;
    const id = setInterval(() => {
      api.getChatConversationDetail(selectedId, lastIdRef.current)
        .then((data) => {
          setDetail(data.conversation);
          const incoming = data.messages || [];
          if (incoming.length === 0) return;
          setMessages((prev) => {
            const seen = new Set(prev.map((m) => m.id));
            const fresh = incoming.filter((m) => !seen.has(m.id));
            return fresh.length ? [...prev, ...fresh] : prev;
          });
          lastIdRef.current = Math.max(lastIdRef.current, ...incoming.map((m) => m.id));
          api.markChatConversationRead(selectedId).catch(() => {});
        })
        .catch(() => {});
    }, POLL_MS);
    return () => clearInterval(id);
  }, [selectedId]);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages, loadingThread]);

  const sendReply = async (e) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content || sending || !selectedId) return;

    setSending(true);
    try {
      const message = await api.replyChatAsStaff(selectedId, content);
      setMessages((prev) => [...prev, message]);
      lastIdRef.current = Math.max(lastIdRef.current, message.id);
      setDraft("");
      // Trả lời thủ công sẽ tắt bot ở backend — đồng bộ lại trạng thái hiển thị.
      setDetail((d) => (d ? { ...d, aiEnabled: false } : d));
      fetchConversations();
    } catch (err) {
      toast(err.message || "Gửi phản hồi thất bại", "error");
      setDraft(content);
    } finally {
      setSending(false);
    }
  };

  const patchConversation = async (patch, successMessage) => {
    try {
      const updated = await api.updateChatConversation(selectedId, patch);
      setDetail(updated);
      fetchConversations();
      toast(successMessage);
    } catch (err) {
      toast(err.message || "Cập nhật thất bại", "error");
    }
  };

  const totalUnread = conversations.reduce((sum, c) => sum + c.staffUnread, 0);

  return (
    <div>
      <div className="admin-sec-header">
        <h2>Chat với khách hàng</h2>
        <span style={{ fontSize: 14, color: "var(--muted)" }}>
          {totalUnread > 0 ? `${totalUnread} tin chưa đọc` : "Đã đọc hết"}
        </span>
      </div>

      <div className="admin-chat">
        <aside className="admin-chat-list">
          <div className="admin-chat-filters">
            <input
              className="admin-input"
              placeholder="Tìm theo tên hoặc email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="admin-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="open">Đang mở</option>
              <option value="closed">Đã đóng</option>
              <option value="">Tất cả</option>
            </select>
          </div>

          <div className="admin-chat-items">
            {loadingList && <div className="admin-chat-empty">Đang tải…</div>}
            {!loadingList && conversations.length === 0 && (
              <div className="admin-chat-empty">Chưa có hội thoại nào</div>
            )}
            {conversations.map((c) => (
              <button
                key={c.id}
                className={`admin-chat-item ${selectedId === c.id ? "active" : ""}`}
                onClick={() => setSelectedId(c.id)}
              >
                <div className="admin-chat-item-top">
                  <span className="admin-chat-item-name">{c.userName}</span>
                  {c.staffUnread > 0 && <span className="admin-chat-dot">{c.staffUnread}</span>}
                </div>
                <span className="admin-chat-item-preview">{c.lastMessage}</span>
                <div className="admin-chat-item-meta">
                  <span>{timeAgo(c.lastMessageAt)}</span>
                  <span className={`admin-chat-tag ${c.aiEnabled ? "bot" : "human"}`}>
                    {c.aiEnabled ? "Bot" : "Nhân viên"}
                  </span>
                  {c.status === "closed" && <span className="admin-chat-tag closed">Đã đóng</span>}
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="admin-chat-thread">
          {!selectedId ? (
            <div className="admin-chat-empty tall">
              <Icon name="chat" size={30} />
              <p>Chọn một hội thoại bên trái để xem và trả lời khách hàng.</p>
            </div>
          ) : (
            <>
              <header className="admin-chat-thread-head">
                <div>
                  <strong>{detail?.userName || "Khách hàng"}</strong>
                  <span>{detail?.userEmail}{detail?.userPhone ? ` · ${detail.userPhone}` : ""}</span>
                </div>
                <div className="admin-chat-actions">
                  <button
                    className={`admin-chat-toggle ${detail?.aiEnabled ? "on" : ""}`}
                    onClick={() => patchConversation(
                      { aiEnabled: !detail?.aiEnabled },
                      detail?.aiEnabled ? "Đã tắt trả lời tự động" : "Đã bật trả lời tự động",
                    )}
                    title="Bật/tắt bot trả lời tự động cho hội thoại này"
                  >
                    <Icon name="leaf" size={14} />
                    {detail?.aiEnabled ? "Bot đang bật" : "Bot đang tắt"}
                  </button>
                  <button
                    className="admin-chat-close-btn"
                    onClick={() => patchConversation(
                      { status: detail?.status === "open" ? "closed" : "open" },
                      detail?.status === "open" ? "Đã đóng hội thoại" : "Đã mở lại hội thoại",
                    )}
                  >
                    {detail?.status === "open" ? "Đóng hội thoại" : "Mở lại"}
                  </button>
                </div>
              </header>

              <div className="admin-chat-messages" ref={threadRef}>
                {loadingThread && <div className="admin-chat-empty">Đang tải tin nhắn…</div>}
                {messages.map((m) => (
                  <div key={m.id} className={`admin-chat-msg ${m.senderType}`}>
                    <div className="admin-chat-msg-head">
                      <span>{SENDER_LABEL[m.senderType] || m.senderType}</span>
                      <span>{timeAgo(m.createdAt)}</span>
                    </div>
                    <div className="admin-chat-msg-body">
                      <RichText text={m.message} />
                    </div>
                    {m.suggestions?.length > 0 && (
                      <div className="admin-chat-msg-refs">
                        {m.suggestions.map((p) => (
                          <span key={p.id}>{p.name}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {detail?.status === "closed" ? (
                <div className="admin-chat-locked">
                  Hội thoại đã đóng. Mở lại để tiếp tục trả lời khách hàng.
                </div>
              ) : (
                <>
                  {showQuick && (
                    <div className="admin-chat-quick">
                      {STAFF_QUICK.map((q) => (
                        <button
                          key={q.label}
                          type="button"
                          title={q.text}
                          onClick={() => {
                            // Nối tiếp nội dung đang gõ dở thay vì ghi đè.
                            setDraft((d) => (d.trim() ? `${d.trim()} ${q.text}` : q.text));
                            setShowQuick(false);
                            draftRef.current?.focus();
                          }}
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <form className="admin-chat-reply" onSubmit={sendReply}>
                    <button
                      type="button"
                      className={`admin-chat-quick-toggle ${showQuick ? "on" : ""}`}
                      onClick={() => setShowQuick((v) => !v)}
                      title="Câu trả lời mẫu"
                      aria-label="Câu trả lời mẫu"
                      aria-expanded={showQuick}
                    >
                      <Icon name={showQuick ? "close" : "plus"} size={17} />
                    </button>
                    <textarea
                      ref={draftRef}
                      className="admin-textarea"
                      rows={2}
                      placeholder="Nhập phản hồi gửi khách hàng… (Enter để gửi, Shift+Enter xuống dòng)"
                      value={draft}
                      maxLength={2000}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) sendReply(e);
                      }}
                    />
                    <button type="submit" className="btn-pill" disabled={sending || !draft.trim()}>
                      <Icon name="arrow" size={16} />
                      {sending ? "Đang gửi…" : "Gửi"}
                    </button>
                  </form>
                </>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
