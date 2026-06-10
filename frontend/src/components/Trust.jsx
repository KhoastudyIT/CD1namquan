import { Icon } from "./ui.jsx";

export function Trust() {
  const items = [
    { ic: "shield",  t: "Cam kết chính hãng", s: "100% sản phẩm chính hãng, rõ nguồn gốc" },
    { ic: "truck",   t: "Giao hàng miễn phí",  s: "Miễn phí vận chuyển nội thành" },
    { ic: "refresh", t: "Đổi trả 7 ngày",      s: "Đổi trả linh hoạt trong vòng 7 ngày" },
  ];
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="trust">
          {items.map((it, i) => (
            <div key={it.t} className="trust-card reveal" style={{ animationDelay: (i * 0.08) + "s" }}>
              <span className="trust-ic"><Icon name={it.ic} size={22} /></span>
              <div><b>{it.t}</b><br/><span>{it.s}</span></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
