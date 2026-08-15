import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useSettings, useAppContext } from "../context.js";
import { Icon, telHref, isMapEmbed, mapSearchHref, toast } from "../components/ui.jsx";

export function Contact() {
  const settings = useSettings();
  const { openChat } = useAppContext();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    serviceType: "Tư vấn thiết kế nội thất",
    propertyType: "Chung cư",
    area: "50 - 100m²",
    budget: "50 - 150 triệu",
    address: "",
    message: ""
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast("Vui lòng nhập họ tên của bạn");
      return;
    }
    if (!formData.phone.trim()) {
      toast("Vui lòng nhập số điện thoại liên hệ");
      return;
    }

    setSubmitting(true);
    try {
      await api.createConsultation({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        serviceType: formData.serviceType,
        propertyType: formData.propertyType,
        area: formData.area,
        budget: formData.budget,
        address: formData.address.trim(),
        message: formData.message.trim()
      });
      toast("✨ Cảm ơn bạn! Yêu cầu tư vấn đã được gửi thành công. Nam Quan sẽ liên hệ với bạn trong thời gian sớm nhất.");
      setFormData({
        name: "",
        phone: "",
        email: "",
        serviceType: "Tư vấn thiết kế nội thất",
        propertyType: "Chung cư",
        area: "50 - 100m²",
        budget: "50 - 150 triệu",
        address: "",
        message: ""
      });
    } catch (err) {
      toast(err.message || "Gửi yêu cầu thất bại, vui lòng thử lại sau.");
    } finally {
      setSubmitting(false);
    }
  };

  const hasMap = isMapEmbed(settings.mapUrl);

  return (
    <div style={{ background: "var(--paper-2)", minHeight: "85vh", padding: "32px 0 80px" }}>
      <div className="wrap">

        {/* ─── Breadcrumb ─── */}
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
          <Link to="/" style={{ color: "var(--ink-2)", textDecoration: "none" }}>Trang chủ</Link>
          <span>/</span>
          <span style={{ color: "var(--green-ink)", fontWeight: 600 }}>Liên hệ & Tư vấn</span>
        </div>

        {/* ─── Banner Header ─── */}
        <div className="shop-banner" style={{ background: "linear-gradient(135deg, #15803d 0%, #064e3b 100%)", color: "#fff", marginBottom: 40 }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--mint)", display: "block", marginBottom: 8 }}>
              KẾT NỐI VỚI CHÚNG TÔI
            </span>
            <h1 style={{ color: "#fff", margin: "0 0 10px", fontSize: 32, fontWeight: 800 }}>
              Liên Hệ & Đăng Ký Tư Vấn
            </h1>
            <p style={{ color: "rgba(255,255,255,.9)", margin: 0, maxWidth: 620, lineHeight: 1.6, fontSize: 15 }}>
              Kiến tạo không gian sống hiện đại và sang trọng. Đội ngũ kiến trúc sư và chuyên viên nội thất của {settings.companyName || "Nam Quan"} luôn sẵn sàng lắng nghe và tư vấn tận tâm cho ngôi nhà của bạn.
            </p>
          </div>
          <div className="shop-banner-right" style={{ fontSize: 48 }}>🛋️</div>
        </div>

        {/* ─── 4 Thông tin liên hệ nhanh ─── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginBottom: 48 }}>
          
          {/* Địa chỉ Showroom */}
          <div style={{ background: "#fff", padding: 24, borderRadius: 16, border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)", display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--mint)", color: "var(--green-ink)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Icon name="pin" size={22} />
            </div>
            <div>
              <h4 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "var(--green-ink)" }}>Showroom Chính</h4>
              <p style={{ margin: 0, fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5 }}>
                {settings.address || "123 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh"}
              </p>
              {settings.address && (
                <a href={mapSearchHref(settings.address)} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 13, fontWeight: 600, color: "var(--green)", textDecoration: "none" }}>
                  Chỉ đường Google Maps <Icon name="arrowR" size={13} />
                </a>
              )}
            </div>
          </div>

          {/* Hotline */}
          <div style={{ background: "#fff", padding: 24, borderRadius: 16, border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)", display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--mint)", color: "var(--green-ink)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Icon name="phone" size={22} />
            </div>
            <div>
              <h4 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "var(--green-ink)" }}>Hotline Tư Vấn</h4>
              {settings.phone ? (
                <a href={telHref(settings.phone)} style={{ fontSize: 18, fontWeight: 800, color: "var(--green-ink)", textDecoration: "none", display: "block" }}>
                  {settings.phone}
                </a>
              ) : (
                <span style={{ fontSize: 16, fontWeight: 700, color: "var(--green-ink)" }}>1900 6868</span>
              )}
              <span style={{ fontSize: 12, color: "var(--muted)", display: "block", marginTop: 4 }}>Hỗ trợ 24/7 (Miễn phí cuộc gọi)</span>
            </div>
          </div>

          {/* Email */}
          <div style={{ background: "#fff", padding: 24, borderRadius: 16, border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)", display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--mint)", color: "var(--green-ink)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Icon name="mail" size={22} />
            </div>
            <div>
              <h4 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "var(--green-ink)" }}>Email Hỗ Trợ</h4>
              {settings.email ? (
                <a href={`mailto:${settings.email}`} style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-2)", textDecoration: "none", wordBreak: "break-all" }}>
                  {settings.email}
                </a>
              ) : (
                <span style={{ fontSize: 14, color: "var(--ink-2)" }}>cskh@namquan.vn</span>
              )}
              <span style={{ fontSize: 12, color: "var(--muted)", display: "block", marginTop: 4 }}>Phản hồi trong vòng 2 giờ</span>
            </div>
          </div>

          {/* Giờ mở cửa */}
          <div style={{ background: "#fff", padding: 24, borderRadius: 16, border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)", display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--mint)", color: "var(--green-ink)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Icon name="clock" size={22} />
            </div>
            <div>
              <h4 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "var(--green-ink)" }}>Giờ Hoạt Động</h4>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--ink-2)" }}>08:00 – 21:00</p>
              <span style={{ fontSize: 12, color: "var(--muted)", display: "block", marginTop: 4 }}>Tất cả các ngày trong tuần (Kể cả lễ)</span>
            </div>
          </div>

        </div>

        {/* ─── Bố cục Form & Chat/Map ─── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 32, alignItems: "start" }}>

          {/* Bên trái: Form gửi yêu cầu tư vấn */}
          <div style={{ background: "#fff", padding: "32px 28px", borderRadius: 20, border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)" }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: "var(--green-ink)" }}>
              Đăng Ký Tư Vấn Trực Tuyến
            </h3>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: "var(--muted)", lineHeight: 1.5 }}>
              Vui lòng điền thông tin bên dưới. Chuyên viên thiết kế của {settings.companyName || "Nam Quan"} sẽ liên hệ báo giá và tư vấn giải pháp tối ưu nhất cho bạn.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--ink-2)", marginBottom: 6 }}>
                    Họ và tên <span style={{ color: "#e6457a" }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Nhập họ và tên của bạn"
                    required
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid var(--line-2)", fontSize: 14, outline: "none", transition: ".2s" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--ink-2)", marginBottom: 6 }}>
                    Số điện thoại <span style={{ color: "#e6457a" }}>*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Nhập số điện thoại liên hệ"
                    required
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid var(--line-2)", fontSize: 14, outline: "none", transition: ".2s" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--ink-2)", marginBottom: 6 }}>
                  Email nhận báo giá (không bắt buộc)
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Nhập địa chỉ email nhận thông tin báo giá"
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid var(--line-2)", fontSize: 14, outline: "none", transition: ".2s" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--ink-2)", marginBottom: 6 }}>
                    Dịch vụ quan tâm
                  </label>
                  <select
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={handleChange}
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid var(--line-2)", fontSize: 14, background: "#fff", outline: "none" }}
                  >
                    <option value="Tư vấn thiết kế nội thất">🎨 Tư vấn thiết kế nội thất</option>
                    <option value="Thi công trọn gói">🔨 Thi công trọn gói</option>
                    <option value="Mua sắm sản phẩm lẻ">🛋️ Mua sắm sản phẩm lẻ</option>
                    <option value="Báo giá dự án công trình">🏢 Báo giá dự án công trình</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--ink-2)", marginBottom: 6 }}>
                    Loại công trình
                  </label>
                  <select
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={handleChange}
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid var(--line-2)", fontSize: 14, background: "#fff", outline: "none" }}
                  >
                    <option value="Chung cư">🏢 Căn hộ Chung cư</option>
                    <option value="Nhà phố / Biệt thự">🏡 Nhà phố / Biệt thự</option>
                    <option value="Văn phòng / Showroom">💼 Văn phòng / Showroom</option>
                    <option value="Khác">✨ Công trình khác</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--ink-2)", marginBottom: 6 }}>
                    Diện tích ước tính
                  </label>
                  <select
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid var(--line-2)", fontSize: 14, background: "#fff", outline: "none" }}
                  >
                    <option value="Dưới 50m²">Dưới 50m²</option>
                    <option value="50 - 100m²">50 - 100m²</option>
                    <option value="100 - 200m²">100 - 200m²</option>
                    <option value="Trên 200m²">Trên 200m²</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--ink-2)", marginBottom: 6 }}>
                    Ngân sách dự kiến
                  </label>
                  <select
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid var(--line-2)", fontSize: 14, background: "#fff", outline: "none" }}
                  >
                    <option value="Dưới 50 triệu">Dưới 50 triệu</option>
                    <option value="50 - 150 triệu">50 - 150 triệu</option>
                    <option value="150 - 300 triệu">150 - 300 triệu</option>
                    <option value="Trên 300 triệu">Trên 300 triệu</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--ink-2)", marginBottom: 6 }}>
                  Nội dung chi tiết / Yêu cầu thêm
                </label>
                <textarea
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Nhập ghi chú thêm về phong cách yêu thích, thời gian cần hoàn thành..."
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid var(--line-2)", fontSize: 14, outline: "none", resize: "vertical" }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-pill"
                style={{ width: "100%", justifyContent: "center", height: 48, fontSize: 16, marginTop: 6 }}
              >
                {submitting ? "Đang gửi yêu cầu..." : "✨ Gửi Yêu Cầu Tư Vấn"}
              </button>
            </form>
          </div>

          {/* Bên phải: Chat trực tiếp & Bản đồ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            
            {/* Box Chat trực tiếp */}
            <div style={{ background: "linear-gradient(135deg, #1f9d4d 0%, #15803d 100%)", color: "#fff", padding: 28, borderRadius: 20, boxShadow: "var(--shadow-sm)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(255,255,255,.2)", display: "grid", placeItems: "center" }}>
                  <Icon name="chat" size={22} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#fff" }}>Cần hỗ trợ ngay?</h4>
                  <span style={{ fontSize: 13, color: "var(--mint)" }}>Tư vấn viên trực tuyến 24/7</span>
                </div>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,.9)", marginBottom: 20 }}>
                Bạn có câu hỏi cần giải đáp gấp về sản phẩm, tiến độ đơn hàng hoặc chính sách bảo hành? Trò chuyện trực tiếp với nhân viên CSKH của Nam Quan ngay bây giờ.
              </p>
              <button
                onClick={() => openChat()}
                style={{
                  width: "100%", height: 44, borderRadius: 12, border: "none",
                  background: "#fff", color: "var(--green-ink)", fontWeight: 700, fontSize: 14,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,.1)", transition: ".2s"
                }}
              >
                <Icon name="chat" size={17} /> Trò chuyện trực tiếp
              </button>
            </div>

            {/* Bản đồ Google Map */}
            {hasMap ? (
              <div style={{ background: "#fff", borderRadius: 20, padding: 12, border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
                <h4 style={{ margin: "8px 12px 14px", fontSize: 16, fontWeight: 700, color: "var(--green-ink)" }}>
                  📍 Vị trí Showroom
                </h4>
                <div style={{ width: "100%", height: 260, borderRadius: 12, overflow: "hidden" }}>
                  <iframe
                    src={settings.mapUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    title="Bản đồ Showroom"
                  />
                </div>
              </div>
            ) : (
              <div style={{ background: "#fff", borderRadius: 20, padding: 24, border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)" }}>
                <h4 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "var(--green-ink)" }}>
                  🛋️ Cam Kết Chất Lượng Nam Quan
                </h4>
                <ul style={{ paddingLeft: 20, margin: 0, fontSize: 14, color: "var(--ink-2)", lineHeight: 1.8 }}>
                  <li>Miễn phí tư vấn thiết kế 3D không gian nội thất.</li>
                  <li>Bảo hành chính hãng 24 – 36 tháng cho mọi sản phẩm.</li>
                  <li>Miễn phí vận chuyển & lắp đặt tận nơi tại nội thành.</li>
                  <li>Đổi trả linh hoạt trong vòng 7 ngày nếu không hài lòng.</li>
                </ul>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
