import { Img, Icon } from "./ui.jsx";
import { IMG } from "../data.js";

export function Hero() {
  return (
    <section className="hero">
      <div className="hero-bg"><Img src={IMG.heroLiving} alt="Không gian phòng khách" label="ảnh không gian sống" /></div>
      <div className="hero-in">
        <h1 className="reveal">Mỗi không gian<br/><em>một câu chuyện</em> riêng</h1>
        <p className="reveal" style={{ animationDelay: ".1s" }}>
          Kiến tạo không gian sống tinh tế với những giải pháp nội thất hiện đại, hài hòa giữa thẩm mỹ,
          công năng và cảm hứng sống.
        </p>
        <div className="reveal" style={{ animationDelay: ".2s", display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a className="btn-pill" href="#showroom">Khám phá ngay <Icon name="arrow" size={17} /></a>
          <a className="btn-pill ghost" href="#flash" style={{ background: "rgba(255,255,255,.15)", color: "#fff", boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,.5)" }}>Xem Flash Sale</a>
        </div>
      </div>
    </section>
  );
}
