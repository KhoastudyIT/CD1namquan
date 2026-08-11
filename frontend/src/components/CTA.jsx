import { useState } from "react";
import { Img, Icon, toast, telHref } from "./ui.jsx";
import { useSettings } from "../context.js";
import { api } from "../api.js";
import { IMG } from "../data.js";

const SERVICE_TYPES = [
  "Thiết kế nội thất",
  "Thi công trọn gói",
  "Cải tạo không gian",
  "Mua sản phẩm lẻ",
  "Khác",
];

const PROPERTY_TYPES = [
  "Căn hộ",
  "Nhà phố",
  "Biệt thự",
  "Văn phòng",
  "Cửa hàng / F&B",
  "Khác",
];

const BUDGETS = [
  "Dưới 100 triệu",
  "100 - 200 triệu",
  "200 - 500 triệu",
  "500 triệu - 1 tỷ",
  "Trên 1 tỷ",
];

const PERKS = [
  "Khảo sát và tư vấn tận nơi",
  "Phối cảnh 3D trước khi thi công",
  "Báo giá chi tiết trong 24 giờ",
];

const EMPTY = {
  name: "", phone: "", email: "",
  serviceType: "", propertyType: "", area: "", budget: "", address: "",
  message: "",
};

function validate(form) {
  const errs = {};
  if (form.name.trim().length < 2) errs.name = "Vui lòng nhập họ tên";

  const digits = form.phone.replace(/[\s.\-()+]/g, "");
  if (!form.phone.trim()) errs.phone = "Vui lòng nhập số điện thoại";
  else if (!/^\d{9,15}$/.test(digits)) errs.phone = "Số điện thoại không hợp lệ";

  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errs.email = "Email không hợp lệ";
  }
  return errs;
}

export function CTA() {
  const settings = useSettings();
  const [form, setForm] = useState(EMPTY);
  const [errs, setErrs] = useState({});
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState(null); // số điện thoại đã gửi -> hiện màn cảm ơn

  // Xoá lỗi ngay khi khách bắt đầu sửa lại ô đó, không đợi bấm gửi lần nữa.
  const set = (key) => (e) => {
    const { value } = e.target;
    setForm((f) => ({ ...f, [key]: value }));
    setErrs((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (sending) return;

    const found = validate(form);
    setErrs(found);
    if (Object.keys(found).length > 0) return;

    setSending(true);
    try {
      await api.createConsultation(form);
      setSentTo(form.phone.trim());
      setForm(EMPTY);
    } catch (err) {
      toast(err.message || "Gửi yêu cầu thất bại, vui lòng thử lại.", "error");
    } finally {
      setSending(false);
    }
  };

  const field = (key, label, { type = "text", placeholder = "", required = false, options } = {}) => (
    <label className={"cta-field" + (errs[key] ? " err" : "")}>
      <span className="cta-label">
        {label}{required && <i>*</i>}
      </span>
      {options ? (
        <select className={form[key] ? "" : "empty"} value={form[key]} onChange={set(key)}>
          <option value="">{placeholder}</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={form[key]} onChange={set(key)} placeholder={placeholder} />
      )}
      {errs[key] && <em className="cta-err">{errs[key]}</em>}
    </label>
  );

  return (
    <section className="section" id="cta">
      <div className="wrap">
        <div className="cta reveal">
          <aside className="cta-aside">
            <Img src={IMG.ctaChair} alt="Không gian nội thất Nam Quan" label="ảnh sản phẩm" />
            <div className="cta-aside-in">
              <span className="cta-eyebrow">TƯ VẤN MIỄN PHÍ</span>
              <h2>Kiến tạo không gian sống theo phong cách của bạn</h2>
              <p>
                Để lại thông tin, đội ngũ Nam Quan sẽ tư vấn miễn phí và giúp bạn
                lựa chọn giải pháp nội thất phù hợp nhất.
              </p>
              <ul className="cta-perks">
                {PERKS.map((p) => (
                  <li key={p}><Icon name="check" size={14} stroke={2.4} />{p}</li>
                ))}
              </ul>
              {settings.phone && (
                <a className="cta-hotline" href={telHref(settings.phone)}>
                  <Icon name="phone" size={15} />
                  <span>Hoặc gọi ngay <b>{settings.phone}</b></span>
                </a>
              )}
            </div>
          </aside>

          <div className="cta-panel">
            {sentTo ? (
              <div className="cta-done">
                <span className="cta-done-ic"><Icon name="check" size={30} stroke={2.6} /></span>
                <h3>Đã nhận yêu cầu của bạn</h3>
                <p>
                  Nam Quan sẽ liên hệ qua số <b>{sentTo}</b> trong vòng 24 giờ làm việc
                  để tư vấn miễn phí.
                </p>
                <button type="button" className="cta-again" onClick={() => setSentTo(null)}>
                  Gửi yêu cầu khác
                </button>
              </div>
            ) : (
              <form className="cta-form" onSubmit={submit} noValidate>
                <h3>Đăng ký tư vấn</h3>
                <p className="cta-form-note">Chỉ mất 30 giây, không phát sinh chi phí.</p>

                <div className="cta-grid">
                  {field("name", "Họ và tên", { placeholder: "Nguyễn Văn A", required: true })}
                  {field("phone", "Số điện thoại", { type: "tel", placeholder: "0901 234 567", required: true })}
                  {field("email", "Email", { type: "email", placeholder: "email@cua-ban.com" })}
                  {field("serviceType", "Nhu cầu tư vấn", { placeholder: "Chọn nhu cầu", options: SERVICE_TYPES })}
                  {field("propertyType", "Loại công trình", { placeholder: "Chọn loại", options: PROPERTY_TYPES })}
                  {field("area", "Diện tích", { placeholder: "VD: 85m2" })}
                  {field("budget", "Ngân sách dự kiến", { placeholder: "Chọn mức", options: BUDGETS })}
                  {field("address", "Khu vực", { placeholder: "VD: Quận 2, TP.HCM" })}

                  <label className="cta-field full">
                    <span className="cta-label">Ghi chú</span>
                    <textarea
                      rows={3}
                      value={form.message}
                      onChange={set("message")}
                      placeholder="Mô tả ngắn về không gian, phong cách bạn thích hoặc thời gian mong muốn hoàn thiện…"
                    />
                  </label>
                </div>

                <button className="cta-submit" type="submit" disabled={sending}>
                  {sending ? "Đang gửi…" : "Gửi yêu cầu tư vấn"}
                  {!sending && <Icon name="arrow" size={17} />}
                </button>
                <p className="cta-privacy">
                  <Icon name="shield" size={13} />
                  Thông tin của bạn được bảo mật và chỉ dùng để liên hệ tư vấn.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
