import { useState, useEffect } from "react";
import { FlashCard } from "./cards.jsx";
import { api } from "../api.js";

function useCountdown(targetMs) {
  const [left, setLeft] = useState(targetMs);
  useEffect(() => {
    const t = setInterval(() => setLeft((v) => (v <= 1000 ? targetMs : v - 1000)), 1000);
    return () => clearInterval(t);
  }, [targetMs]);
  const h = Math.floor((left % 86400000) / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);
  const z = (n) => String(n).padStart(2, "0");
  return [z(h), z(m), z(s)];
}

export function FlashSale({ favs, onFav, onAdd }) {
  const [h, m, s] = useCountdown(1 * 3600000 + 21 * 60000 + 56000);
  const [tab, setTab] = useState(0);
  const [flash, setFlash] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const tabs = ["12 - 15h 05/06", "20 - 06/06"];

  useEffect(() => {
    setLoading(true);
    setError(false);
    api.getFlashSales()
      .then(data => {
        // API có thể trả về array trực tiếp hoặc { data: [...] }
        if (Array.isArray(data)) setFlash(data);
        else if (data?.data && Array.isArray(data.data)) setFlash(data.data);
      })
      .catch(err => {
        console.error("FlashSale fetch error:", err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <section className="section flash-sec" id="flash">
      <div className="wrap">
        <div className="flash-shell">
          <div className="skel-block" style={{ height: 340, borderRadius: 12 }} />
        </div>
      </div>
    </section>
  );

  if (error) return (
    <section className="section flash-sec" id="flash">
      <div className="wrap">
        <div className="flash-shell" style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>
          <p>Không thể tải dữ liệu Flash Sale. Vui lòng thử lại sau.</p>
        </div>
      </div>
    </section>
  );

  if (!flash.length) return (
    <section className="section flash-sec" id="flash">
      <div className="wrap">
        <div className="flash-shell" style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>
          <p>Hiện không có chương trình Flash Sale nào đang diễn ra.</p>
        </div>
      </div>
    </section>
  );

  return (
    <section className="section flash-sec" id="flash">
      <div className="wrap">
        <div className="flash-shell">
          <div className="flash-head">
            <h3><span className="bolt">⚡</span> FLASH SALE NỘI THẤT</h3>
            <div className="flash-timer">
              <span>Kết thúc sau</span>
              <div className="cells">
                <span className="cell">{h}</span><span className="colon">:</span>
                <span className="cell">{m}</span><span className="colon">:</span>
                <span className="cell">{s}</span>
              </div>
            </div>
          </div>
          <div className="flash-tabs">
            {tabs.map((t, i) => (
              <button key={t} className={"flash-tab" + (tab === i ? " active" : "")} onClick={() => setTab(i)}>{t}</button>
            ))}
          </div>
          <div className="flash-grid">
            {flash.map((p) => (
              <FlashCard
                key={p.id}
                p={p}
                fav={favs.has(p.product_id || p.productId || p.id)}
                onFav={onFav}
                onAdd={onAdd}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
