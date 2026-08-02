import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Icon, vnd, Img } from "./ui.jsx";
import { useAppContext } from "../context.js";
import { api } from "../api.js";
import { HOTLINE, HOTLINE_DISPLAY } from "../utils/notif.js";

/** Khoảng poll khi khung chat đang mở. Đủ nhanh để cảm giác gần realtime. */
const POLL_OPEN_MS = 4000;
/** Khi đóng chỉ cần biết có tin mới hay không → thưa hơn nhiều cho nhẹ server. */
const POLL_CLOSED_MS = 30000;

const QUICK_REPLIES = [
  "Giá bao nhiêu?",
  "Còn hàng không?",
  "Chất liệu là gì?",
  "Kích thước thế nào?",
  "Bảo hành bao lâu?",
  "Chính sách giao hàng",
  "Hình thức thanh toán",
  "Chính sách đổi trả",
  "Ưu đãi đang có",
  "Xem showroom ở đâu",
  "Gặp nhân viên",
];

/**
 * Bot trả lời có dùng **in đậm** và xuống dòng. Tự parse thay vì nhét HTML thô
 * để nội dung tin nhắn không bao giờ trở thành vector XSS.
 */
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

function ProductCards({ items, onPick }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="chat-cards">
      {items.map((p) => (
        <button key={p.id} className="chat-card" onClick={() => onPick(p)}>
          <div className="chat-card-img">
            <Img src={p.img} alt={p.name} label="ảnh" />
          </div>
          <div className="chat-card-info">
            <span className="chat-card-name">{p.name}</span>
            <span className="chat-card-price">
              {p.salePrice != null && p.salePrice < p.price ? (
                <>
                  <b>{vnd(p.salePrice)} đ</b>
                  <s>{vnd(p.price)} đ</s>
                </>
              ) : (
                <b>{vnd(p.price)} đ</b>
              )}
            </span>
          </div>
          <Icon name="arrowR" size={15} />
        </button>
      ))}
    </div>
  );
}

const SENDER_META = {
  ai:     { label: "Trợ lý NAM QUAN", icon: "leaf" },
  staff:  { label: "Nhân viên tư vấn", icon: "user" },
  system: { label: "Hệ thống", icon: "bell" },
};

export function ChatWidget({ open, setOpen, product, clearProduct }) {
  const { user, requireLogin } = useAppContext();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState("");
  const [showQuick, setShowQuick] = useState(false);

  // Id tin nhắn mới nhất đã nhận — mốc để poll phần tăng thêm.
  const lastIdRef = useRef(0);
  const listRef = useRef(null);
  const loadedRef = useRef(false);

  const pushMessages = useCallback((incoming) => {
    if (!incoming || incoming.length === 0) return;
    setMessages((prev) => {
      // Tin gửi đi đã được thêm ngay khi POST trả về; poll có thể trả lại
      // chính nó nếu hai luồng chạy chen nhau nên phải lọc trùng theo id.
      const seen = new Set(prev.map((m) => m.id));
      const fresh = incoming.filter((m) => !seen.has(m.id));
      return fresh.length ? [...prev, ...fresh] : prev;
    });
    lastIdRef.current = Math.max(lastIdRef.current, ...incoming.map((m) => m.id));
  }, []);

  useEffect(() => {
    if (!open || !user || loadedRef.current) return;
    loadedRef.current = true;
    setLoading(true);
    api.getChatConversation()
      .then((data) => {
        setMessages(data.messages || []);
        setAiEnabled(data.conversation?.aiEnabled ?? true);
        // Hội thoại mới thì mở sẵn gợi ý để khách biết hỏi được những gì.
        setShowQuick((data.messages || []).length <= 1);
        if (data.messages?.length) {
          lastIdRef.current = data.messages[data.messages.length - 1].id;
        }
        return api.markChatRead();
      })
      .then(() => setUnread(0))
      .catch((err) => setError(err.message || "Không tải được hội thoại"))
      .finally(() => setLoading(false));
  }, [open, user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const tick = () => {
      api.pollChatMessages(lastIdRef.current)
        .then((data) => {
          if (cancelled) return;
          const incoming = data.messages || [];
          setAiEnabled(data.aiEnabled ?? true);
          if (incoming.length === 0) return;

          if (open) {
            pushMessages(incoming);
            api.markChatRead().catch(() => {});
          } else {
            // Khung đang đóng: chỉ nhớ mốc để hiện badge, tin sẽ được nạp
            // đầy đủ khi khách mở lại.
            setUnread((n) => n + incoming.filter((m) => m.senderType !== "customer").length);
            lastIdRef.current = Math.max(lastIdRef.current, ...incoming.map((m) => m.id));
            loadedRef.current = false;
          }
        })
        .catch(() => {}); // lỗi mạng tạm thời: bỏ qua, nhịp sau thử lại
    };

    const id = setInterval(tick, open ? POLL_OPEN_MS : POLL_CLOSED_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, [open, user, pushMessages]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, loading]);

  const send = async (text) => {
    const content = (text ?? draft).trim();
    if (!content || sending) return;

    setSending(true);
    setError("");
    setDraft("");
    try {
      // productId chỉ đi kèm tin ĐẦU TIÊN sau khi khách bấm "Hỏi về sản phẩm
      // này" — các câu sau bot tự nhớ qua last_product_id ở server.
      const data = await api.sendChatMessage(content, product?.id ?? null);
      pushMessages(data.messages || []);
      clearProduct?.();
    } catch (err) {
      setError(err.message || "Gửi tin nhắn thất bại");
      setDraft(content); // trả lại nội dung để khách không phải gõ lại
    } finally {
      setSending(false);
    }
  };

  const pickProduct = (p) => {
    setOpen(false);
    navigate(`/product/${p.id}`);
  };

  // Khách chưa đăng nhập vẫn thấy bong bóng — ẩn hẳn thì không ai biết shop có
  // hỗ trợ chat. Bấm vào sẽ hiện popup đăng nhập thay vì mở khung.
  const toggle = () => {
    if (!user) {
      requireLogin("Vui lòng đăng nhập để chat với tư vấn viên NAM QUAN.", "/");
      return;
    }
    setOpen(!open);
  };

  return (
    <>
      {/* Gọi hotline — đứng trên bong bóng chat, ẩn đi khi khung chat mở ra
          để không che nội dung. Trên điện thoại tel: bấm là gọi luôn. */}
      {!open && (
        <a
          className="chat-fab hotline"
          href={`tel:${HOTLINE}`}
          aria-label={`Gọi hotline ${HOTLINE_DISPLAY}`}
          title={`Gọi hotline ${HOTLINE_DISPLAY}`}
        >
          <Icon name="phone" size={22} />
        </a>
      )}

      <button
        className={`chat-fab ${open ? "open" : ""}`}
        onClick={toggle}
        aria-label={open ? "Đóng khung chat" : "Mở khung chat tư vấn"}
        aria-expanded={open}
      >
        <Icon name={open ? "close" : "chat"} size={22} />
        {!open && unread > 0 && <span className="chat-fab-badge">{unread}</span>}
      </button>

      {open && user && (
        <section className="chat-panel" role="dialog" aria-label="Chat tư vấn NAM QUAN">
          <header className="chat-head">
            <div className="chat-head-avatar">
              <Icon name={aiEnabled ? "leaf" : "user"} size={18} />
            </div>
            <div className="chat-head-info">
              <strong>Tư vấn NAM QUAN</strong>
              <span>{aiEnabled ? "Trợ lý tự động · trả lời ngay" : "Nhân viên đang hỗ trợ bạn"}</span>
            </div>
            <button className="chat-head-close" onClick={() => setOpen(false)} aria-label="Đóng">
              <Icon name="close" size={18} />
            </button>
          </header>

          {product && (
            <div className="chat-context">
              <Icon name="cart" size={14} />
              <span>Đang hỏi về: <strong>{product.name}</strong></span>
              <button onClick={clearProduct} aria-label="Bỏ gắn sản phẩm">
                <Icon name="close" size={13} />
              </button>
            </div>
          )}

          <div className="chat-body" ref={listRef}>
            {loading && <div className="chat-empty">Đang tải hội thoại…</div>}

            {messages.map((m) => {
              const mine = m.senderType === "customer";
              const meta = SENDER_META[m.senderType];
              return (
                <div key={m.id} className={`chat-row ${mine ? "mine" : ""}`}>
                  {!mine && (
                    <div className="chat-avatar">
                      <Icon name={meta?.icon || "bell"} size={14} />
                    </div>
                  )}
                  <div className="chat-bubble-wrap">
                    {!mine && <span className="chat-sender">{meta?.label || "NAM QUAN"}</span>}
                    <div className={`chat-bubble ${mine ? "mine" : ""}`}>
                      <RichText text={m.message} />
                    </div>
                    <ProductCards items={m.suggestions} onPick={pickProduct} />
                  </div>
                </div>
              );
            })}

            {sending && (
              <div className="chat-row">
                <div className="chat-avatar"><Icon name="leaf" size={14} /></div>
                <div className="chat-bubble typing"><span /><span /><span /></div>
              </div>
            )}
          </div>

          {showQuick && !loading && (
            <div className="chat-quick">
              {QUICK_REPLIES.map((q) => (
                <button
                  key={q}
                  onClick={() => { setShowQuick(false); send(q); }}
                  disabled={sending}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {error && <div className="chat-error">{error}</div>}

          <form
            className="chat-input"
            onSubmit={(e) => { e.preventDefault(); send(); }}
          >
            <button
              type="button"
              className={`chat-quick-toggle ${showQuick ? "on" : ""}`}
              onClick={() => setShowQuick((v) => !v)}
              aria-label="Câu hỏi gợi ý"
              aria-expanded={showQuick}
            >
              <Icon name={showQuick ? "close" : "plus"} size={18} />
            </button>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Nhập câu hỏi của bạn…"
              maxLength={2000}
              disabled={sending}
              aria-label="Nội dung tin nhắn"
            />
            <button type="submit" disabled={sending || !draft.trim()} aria-label="Gửi">
              <Icon name="arrow" size={18} />
            </button>
          </form>
        </section>
      )}
    </>
  );
}
