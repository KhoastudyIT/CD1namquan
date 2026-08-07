import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Icon } from "../components/ui.jsx";
import { AccountHeader } from "../components/AccountLayout.jsx";

const POLICIES = [
  {
    id: "warranty",
    icon: "shield",
    title: "Chính Sách Bảo Hành",
    subtitle: "Bảo hành 24 - 36 tháng & Bảo trì trọn đời sản phẩm",
    content: (
      <div>
        <h3>1. Thời Gian Bảo Hành</h3>
        <ul>
          <li><b>36 Tháng:</b> Áp dụng cho các sản phẩm gỗ tự nhiên, khung ghế sofa, bàn ghế ăn, giường ngủ.</li>
          <li><b>24 Tháng:</b> Áp dụng cho chất liệu đệm mút, nỉ bọc, da công nghiệp và phụ kiện inox.</li>
          <li><b>12 Tháng:</b> Áp dụng cho các thiết bị vệ sinh, đèn trang trí và phụ kiện decor.</li>
          <li><b>Bảo Trì Trọn Đời:</b> Hỗ trợ bảo dưỡng, đánh bóng, bọc lại da/nỉ với chi phí ưu đãi sau hết hạn bảo hành.</li>
        </ul>

        <h3>2. Điều Kiện Được Bảo Hành</h3>
        <ul>
          <li>Sản phẩm còn trong thời hạn bảo hành tính từ ngày bàn giao.</li>
          <li>Lỗi do nhà sản xuất (cong vênh, nứt vỡ tự nhiên, bung chỉ may, lỗi kết cấu khung).</li>
          <li>Có hóa đơn mua hàng hoặc số điện thoại đăng ký mua hàng tại Nam Quan.</li>
        </ul>

        <h3>3. Các Trường Hợp Không Được Bảo Hành</h3>
        <ul>
          <li>Sản phẩm bị hư hỏng do sử dụng sai mục đích, quá tải trọng quy định.</li>
          <li>Tự ý tháo dỡ, sửa chữa bởi bên thứ ba không thuộc Nam Quan.</li>
          <li>Hư hỏng do thiên tai, hỏa hoạn, ngập nước hoặc tiếp xúc với hóa chất tẩy rửa mạnh.</li>
        </ul>
      </div>
    )
  },
  {
    id: "shipping",
    icon: "truck",
    title: "Vận Chuyển & Lắp Đặt",
    subtitle: "Giao hàng tận nơi & Lắp đặt hoàn thiện chuyên nghiệp",
    content: (
      <div>
        <h3>1. Phạm Vi & Chi Phí Vận Chuyển</h3>
        <ul>
          <li><b>Miễn Phí 100%:</b> Cho đơn hàng từ 5.000.000đ tại nội thành TP.HCM và TP. Nha Trang (bán kính 20km).</li>
          <li><b>Hỗ trợ 50% phí ship:</b> Cho các đơn hàng giao đi ngoại thành và các tỉnh lân cận trên toàn quốc.</li>
        </ul>

        <h3>2. Thời Gian Giao Hàng</h3>
        <ul>
          <li><b>Nội thành:</b> Giao hàng và lắp đặt trong vòng 24h - 48h kể từ khi xác nhận đơn.</li>
          <li><b>Các tỉnh khác:</b> Từ 3 - 5 ngày làm việc thông qua đối tác vận chuyển uy tín.</li>
          <li>Hỗ trợ đặt lịch hẹn giờ giao hàng linh hoạt theo yêu cầu khách hàng.</li>
        </ul>

        <h3>3. Quy Trình Bàn Giao & Lắp Đặt</h3>
        <ul>
          <li>Đội ngũ kỹ thuật viên Nam Quan vận chuyển, vác lầu (nếu có) và lắp đặt hoàn thiện tại vị trí chỉ định.</li>
          <li>Khách hàng nghiệm thu, kiểm tra sản phẩm cùng nhân viên trước khi ký biên bản bàn giao.</li>
        </ul>
      </div>
    )
  },
  {
    id: "returns",
    icon: "refresh",
    title: "Đổi Trả & Hoàn Tiền",
    subtitle: "1 Đổi 1 trong vòng 7 ngày nếu có lỗi từ nhà sản xuất",
    content: (
      <div>
        <h3>1. Điều Kiện Đổi Trả (1 Đổi 1 Trong 7 Ngày)</h3>
        <ul>
          <li>Sản phẩm bị lỗi kỹ thuật, sai kích thước, trầy xước nứt vỡ trong quá trình vận chuyển.</li>
          <li>Giao không đúng mẫu mã, màu sắc hoặc chất liệu khách hàng đã đặt mua.</li>
          <li>Sản phẩm còn nguyên tem mác, chưa qua sử dụng và có biên bản giao hàng.</li>
        </ul>

        <h3>2. Chính Sách Hỗ Trợ Đổi Mẫu</h3>
        <ul>
          <li>Khách hàng được hỗ trợ đổi sang sản phẩm khác cùng giá trị hoặc cao hơn trong vòng 3 ngày kể từ ngày nhận.</li>
          <li>Khách hàng chịu chi phí vận chuyển phát sinh khi đổi hàng do nhu cầu cá nhân.</li>
        </ul>

        <h3>3. Chính Sách Hoàn Tiền</h3>
        <ul>
          <li>Hoàn tiền 100% qua tài khoản ngân hàng trong vòng 24h nếu Nam Quan không có sản phẩm thay thế phù hợp.</li>
        </ul>
      </div>
    )
  },
  {
    id: "payment",
    icon: "filter",
    title: "Thanh Toán & Trả Góp",
    subtitle: "Đa dạng hình thức thanh toán & Hỗ trợ Trả góp 0% lãi suất",
    content: (
      <div>
        <h3>1. Các Hình Thức Thanh Toán</h3>
        <ul>
          <li><b>Thanh toán khi nhận hàng (COD):</b> Áp dụng cho các đơn hàng giao tại TP.HCM và Nha Trang.</li>
          <li><b>Chuyển khoản ngân hàng:</b> Thanh toán qua số tài khoản chính thức của Công ty Nam Quan.</li>
          <li><b>Thanh toán thẻ / VNPAY:</b> Hỗ trợ quẹt thẻ ATM, Visa, MasterCard, VNPAY-QR tại showroom hoặc tận nhà.</li>
        </ul>

        <h3>2. Chính Sách Trả Góp 0% Lãi Suất</h3>
        <ul>
          <li>Áp dụng cho thẻ tín dụng (Credit Card) của hơn 25 ngân hàng liên kết (Vietcombank, Techcombank, MB, VPBank...).</li>
          <li>Kỳ hạn trả góp linh hoạt: 3, 6, 9, 12 tháng đối với đơn hàng từ 5.000.000đ.</li>
          <li>Thao tác làm thủ tục online nhanh chóng chỉ trong 3 phút.</li>
        </ul>
      </div>
    )
  },
  {
    id: "privacy",
    icon: "shield",
    title: "Bảo Mật Thông Tin",
    subtitle: "Cam kết bảo mật tuyệt đối dữ liệu cá nhân của khách hàng",
    content: (
      <div>
        <h3>1. Mục Đích Thu Thập Thông Tin</h3>
        <ul>
          <li>Xử lý đơn hàng, vận chuyển và hoàn thiện thủ tục bàn giao sản phẩm.</li>
          <li>Gửi thông báo tiến độ giao hàng, mã bảo hành điện tử và chăm sóc khách hàng định kỳ.</li>
        </ul>

        <h3>2. Cam Kết Bảo Mật</h3>
        <ul>
          <li>Tuyệt đối không bán, chia sẻ hay trao đổi thông tin khách hàng cho bất kỳ bên thứ ba nào.</li>
          <li>Thông tin thanh toán qua thẻ được mã hóa theo tiêu chuẩn an toàn SSL / PCI-DSS.</li>
        </ul>
      </div>
    )
  }
];

/**
 * Phần ruột dùng chung cho cả trang công khai /policies lẫn mục Chính sách
 * trong khu vực tài khoản — hai nơi chỉ khác lớp bọc bên ngoài.
 */
function PoliciesBody() {
  const location = useLocation();
  const [activeId, setActiveId] = useState("warranty");

  useEffect(() => {
    window.scrollTo(0, 0);
    const hash = location.hash.replace("#", "");
    if (hash && POLICIES.some(p => p.id === hash)) {
      setActiveId(hash);
    }
  }, [location]);

  const activePolicy = POLICIES.find(p => p.id === activeId) || POLICIES[0];

  return (
        <div className="profile-layout">

          {/* Sidebar policy tabs */}
          <div className="profile-sidebar" style={{ width: 280 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", margin: "0 0 16px", color: "var(--ink)" }}>
              Danh Mục Chính Sách
            </h4>
            <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {POLICIES.map(p => (
                <button
                  key={p.id}
                  onClick={() => setActiveId(p.id)}
                  className={"cat-item" + (activeId === p.id ? " active" : "")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "none",
                    background: activeId === p.id ? "var(--mint)" : "transparent",
                    color: activeId === p.id ? "var(--green-ink)" : "var(--ink-2)",
                    fontWeight: activeId === p.id ? 700 : 500,
                    textAlign: "left",
                    cursor: "pointer",
                    transition: ".18s"
                  }}
                >
                  <Icon name={p.icon} size={18} />
                  <span style={{ fontSize: 14 }}>{p.title}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Policy Detail Content */}
          <div className="profile-content">
            <div style={{ display: "flex", alignItems: "center", gap: 16, borderBottom: "1px solid var(--line)", paddingBottom: 20, marginBottom: 24 }}>
              <div style={{ width: 50, height: 50, borderRadius: "50%", background: "var(--mint)", color: "var(--green-ink)", display: "grid", placeItems: "center" }}>
                <Icon name={activePolicy.icon} size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--green-ink)", margin: "0 0 4px" }}>
                  {activePolicy.title}
                </h2>
                <p style={{ margin: 0, fontSize: 14, color: "var(--muted)" }}>
                  {activePolicy.subtitle}
                </p>
              </div>
            </div>

            <div className="policy-body" style={{ lineHeight: 1.8, fontSize: 15, color: "var(--ink-2)" }}>
              {activePolicy.content}
            </div>

            {/* Contact banner */}
            <div style={{ marginTop: 40, padding: "20px 24px", background: "linear-gradient(105deg, var(--green-3) 0%, var(--green) 100%)", borderRadius: 14, color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div>
                <h4 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700 }}>Bạn cần giải đáp thêm thắc mắc?</h4>
                <p style={{ margin: 0, fontSize: 13.5, opacity: 0.9 }}>Đội ngũ tư vấn Nam Quan sẵn sàng hỗ trợ 24/7 qua Hotline 1900 6789.</p>
              </div>
              <a href="tel:19006789" className="btn-pill ghost" style={{ background: "#fff", color: "var(--green-ink)", border: "none" }}>
                <Icon name="phone" size={16} /> Gọi 1900 6789
              </a>
            </div>

          </div>

        </div>
  );
}

/** Trang công khai, có breadcrumb và nền riêng. */
export function Policies() {
  return (
    <section className="section" style={{ background: "var(--paper-2)", minHeight: "80vh", padding: "40px 0 80px" }}>
      <div className="wrap">
        <div className="page-header" style={{ borderRadius: "var(--radius-lg)", marginBottom: 30 }}>
          <div className="page-header-in">
            <h1>Chính Sách Bán Hàng & Quy Định</h1>
            <div className="breadcrumb">
              <Link to="/">Trang chủ</Link>
              <span>/</span>
              <span className="current">Chính sách bán hàng</span>
            </div>
          </div>
        </div>

        <PoliciesBody />
      </div>
    </section>
  );
}

/** Bản nằm trong khu vực tài khoản — tiêu đề do shell cung cấp. */
export function AccountPolicies() {
  return (
    <>
      <AccountHeader title="Chính sách bán hàng" desc="Quy định về bảo hành, vận chuyển, đổi trả và thanh toán" />
      <PoliciesBody />
    </>
  );
}
