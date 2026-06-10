import { useState } from "react";
import { Img, toast } from "./ui.jsx";
import { IMG } from "../data.js";

export function CTA() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errs, setErrs] = useState({});

  const submit = (e) => {
    e.preventDefault();
    const er = {};
    if (!name.trim()) er.name = 1;
    if (!/^[0-9\s+().-]{8,}$/.test(phone.trim())) er.phone = 1;
    setErrs(er);
    if (Object.keys(er).length === 0) {
      toast("✓ Cảm ơn bạn! Nam Quan sẽ liên hệ tư vấn sớm nhất.");
      setName(""); setPhone("");
    }
  };

  return (
    <section className="section" id="cta">
      <div className="wrap">
        <div className="cta reveal">
          <div className="cta-img">
            <div className="blob"></div>
            <div className="ci"><Img src={IMG.ctaChair} alt="Ghế thư giãn" label="ảnh sản phẩm" /></div>
          </div>
          <div className="cta-body">
            <h2>Kiến tạo không gian sống theo phong cách của bạn</h2>
            <p>Để lại thông tin, đội ngũ Nam Quan sẽ tư vấn miễn phí và giúp bạn lựa chọn giải pháp nội thất phù hợp nhất.</p>
            <form className="cta-form" onSubmit={submit} noValidate>
              <input className={errs.name ? "err" : ""} placeholder="Họ và tên" value={name} onChange={(e) => setName(e.target.value)} />
              <input className={errs.phone ? "err" : ""} placeholder="Số điện thoại" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <button className="btn-pill" type="submit">Gửi yêu cầu</button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
