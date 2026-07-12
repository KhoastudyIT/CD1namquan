import { partners } from "../data.js";

export function Partners() {
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <h2 className="sec-title" style={{ fontSize: 22 }}>Đối tác của chúng tôi</h2>
        <div className="partners-wrapper reveal">
          <div className="partners-track">
            {partners.map((p, index) => (
              <div key={index} className="partner-logo">
                <img src={p.img} alt={p.name} title={p.name} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
