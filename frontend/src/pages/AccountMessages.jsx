import { useState, useEffect, useRef, useCallback } from "react";
import { Icon } from "../components/ui.jsx";
import { AccountHeader } from "../components/AccountLayout.jsx";
import { api } from "../api.js";

/** Trang này luôn hiển thị nên poll đều tay, không cần nhịp thưa như widget nổi. */
const POLL_MS = 4000;

const SENDER_META = {
  ai: { label: "Trợ lý NAM QUAN", icon: "leaf" },
  staff: { label: "Nhân viên tư vấn", icon: "user" },
  system: { label: "Hệ thống", icon: "bell" },
};

/** Bot trả lời có **in đậm** và xuống dòng — parse tay để không nhét HTML thô. */
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

export function AccountMessages() {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const lastIdRef = useRef(0);
  const listRef = useRef(null);

  const pushMessages = useCallback((incoming) => {
    if (!incoming || incoming.length === 0) return;
    setMessages((prev) => {
      // POST trả tin ngay, poll có thể trả lại chính nó → lọc trùng theo id.
      const seen = new Set(prev.map((m) => m.id));
      const fresh = incoming.filter((m) => !seen.has(m.id));
      return fresh.length ? [...prev, ...fresh] : prev;
    });
    lastIdRef.current = Math.max(lastIdRef.current, ...incoming.map((m) => m.id));
  }, []);

  useEffect(() => {
    let stale = false;
    api.getChatConversation()
      .then((data) => {
        if (stale) return;
        const list = data.messages || [];
        setMessages(list);
        if (list.length) lastIdRef.current = list[list.length - 1].id;
        return api.markChatRead();
      })
      .catch((err) => { if (!stale) setError(err.message || "Không tải được hội thoại"); })
      .finally(() => { if (!stale) setLoading(false); });
    return () => { stale = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const id = setInterval(() => {
      api.pollChatMessages(lastIdRef.current)
        .then((data) => {
          if (cancelled) return;
          const incoming = data.messages || [];
          if (incoming.length === 0) return;
          pushMessages(incoming);
          api.markChatRead().catch(() => {});
        })
        .catch(() => {}); // lỗi mạng tạm thời: nhịp sau thử lại
    }, POLL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, [pushMessages]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, loading]);

  const send = async (e) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;

    setSending(true);
    setError("");
    setDraft("");
    try {
      const data = await api.sendChatMessage(content, null);
      pushMessages(data.messages || []);
    } catch (err) {
      setError(err.message || "Gửi tin nhắn thất bại");
      setDraft(content); // trả lại nội dung để khách không phải gõ lại
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <AccountHeader title="Tin nhắn" desc="Trao đổi trực tiếp với tư vấn viên NAM QUAN" />

      <div className="acc-card acc-chat">
        <div className="acc-chat-body" ref={listRef}>
          {loading && <p className="acc-muted">Đang tải hội thoại…</p>}

          {!loading && messages.length === 0 && (
            <div className="acc-empty">
              <Icon name="chat" size={34} />
              <p>Chưa có tin nhắn nào. Gửi câu hỏi đầu tiên của bạn nhé.</p>
            </div>
          )}

          {messages.map((m) => {
            const mine = m.senderType === "customer";
            const meta = SENDER_META[m.senderType];
            return (
              <div key={m.id} className={"chat-row" + (mine ? " mine" : "")}>
                {!mine && (
                  <div className="chat-avatar">
                    <Icon name={meta?.icon || "bell"} size={14} />
                  </div>
                )}
                <div className="chat-bubble-wrap">
                  {!mine && <span className="chat-sender">{meta?.label || "NAM QUAN"}</span>}
                  <div className={"chat-bubble" + (mine ? " mine" : "")}>
                    <RichText text={m.message} />
                  </div>
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

        {error && <div className="chat-error">{error}</div>}

        <form className="acc-chat-input" onSubmit={send}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Nhập tin nhắn…"
            disabled={sending}
          />
          <button type="submit" className="btn-pill" disabled={sending || !draft.trim()}>
            <Icon name="arrowR" size={16} /> Gửi
          </button>
        </form>
      </div>
    </>
  );
}
