import { Img } from "./ui.jsx";
import { Logo } from "./Logo.jsx";
import { IMG } from "../data.js";

export function Footer() {
  const socials = [
    { l: "G", c: "#ea4335" }, { l: "f", c: "#1877f2" },
    { l: "z", c: "#0068ff" }, { l: "X", c: "#111" },
  ];
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <Logo />
            <p className="foot-desc">
              Thương hiệu nội thất phong cách hiện đại tối giản. Đồng hành kiến tạo không gian
              tinh tế và sự phong thái thảnh thơi sang trọng bậc nhất cho ngôi nhà Việt.
            </p>
          </div>
          <div>
            <h5>Văn Phòng &amp; Showroom</h5>
            <div className="foot-addr"><b>Showroom 1:</b> Số 90 Hương Lộ 2, Xã Tân Phú Trung, Huyện Củ Chi, TP. HCM</div>
            <div className="foot-addr"><b>Showroom 2:</b> Số 472 Quốc Lộ 22, Xã Tân Phú Trung, Huyện Củ Chi, TP. HCM</div>
            <div className="foot-addr"><b>Showroom 3:</b> Số 712 Đường 23/10, Xã Vĩnh Thạnh, Nha Trang, Khánh Hòa</div>
          </div>
          <div className="foot-img"><Img src={IMG.footerChair} alt="Ghế Nam Quan" label="ảnh sản phẩm" /></div>
        </div>
        <div className="foot-bottom">
          <div className="foot-tag">Mỗi không gian<b>Một câu chuyện</b></div>
          <div className="socials">
            {socials.map((s, i) => <a key={i} className="soc" href="#" style={{ background: s.c }}>{s.l}</a>)}
          </div>
        </div>
      </div>
    </footer>
  );
}
