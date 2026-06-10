import { Img } from "./ui.jsx";
import { IMG } from "../data.js";

export function Showcase() {
  return (
    <section className="section showcase">
      <div className="wrap">
        <div className="showcase-grid">
          <div className="showcase-imgs reveal">
            <div className="si si1"><Img src={IMG.living1} alt="Không gian sang trọng" label="ảnh nội thất" /></div>
            <div className="si si2"><Img src={IMG.living2} alt="Chi tiết nội thất" label="ảnh nội thất" /></div>
          </div>
          <div className="showcase-txt reveal" style={{ animationDelay: ".12s" }}>
            <span className="eyebrow">Về Nam Quan</span>
            <h2>Kiến tạo không gian sống đẳng cấp</h2>
            <p>
              Nam Quan là đơn vị cung cấp giải pháp nội thất toàn diện, mang đến những sản phẩm chất lượng cao
              cùng trải nghiệm không gian sống đẳng cấp. Với sự chỉn chu trong từng chi tiết, chúng tôi đồng hành
              cùng khách hàng kiến tạo những giá trị bền vững cho tổ ấm và công trình.
            </p>
            <div className="showcase-stats">
              <div className="st"><b>12+</b><span>Năm kinh nghiệm</span></div>
              <div className="st"><b>5.000+</b><span>Khách hàng tin chọn</span></div>
              <div className="st"><b>03</b><span>Showroom toàn quốc</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
