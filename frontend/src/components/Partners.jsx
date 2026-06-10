import { partners } from "../data.js";

export function Partners() {
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <h2 className="sec-title" style={{ fontSize: 22 }}>Đối tác của chúng tôi</h2>
        <div className="partners reveal">
          {partners.map((p) => (
            <div key={p} className="partner"><span className="pmark">{p[0]}</span>{p}</div>
          ))}
        </div>
      </div>
    </section>
  );
}
