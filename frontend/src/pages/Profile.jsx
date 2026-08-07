import { Link } from "react-router-dom";
import { useAppContext } from "../context.js";
import { AccountHeader } from "../components/AccountLayout.jsx";

/**
 * Chỉ hiển thị thông tin. Việc sửa tên/số điện thoại và đổi mật khẩu nằm ở
 * trang Cài đặt để tránh có hai chỗ cùng sửa một dữ liệu.
 */
export function Profile() {
  const { user } = useAppContext();

  if (!user) return null;

  const fields = [
    { label: "Họ và tên", value: user.name },
    { label: "Email", value: user.email },
    { label: "Số điện thoại", value: user.phone || "Chưa cập nhật" },
    {
      label: "Ngày tham gia",
      value: user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "—",
    },
  ];

  return (
    <>
      <AccountHeader
        title="Hồ sơ của tôi"
        desc="Thông tin tài khoản của bạn tại NAM QUAN"
        action={<Link to="/account/settings" className="btn-pill ghost">Chỉnh sửa</Link>}
      />

      <div className="acc-card">
        <div className="acc-profile-top">
          <div className="acc-profile-avatar">{user.name.charAt(0).toUpperCase()}</div>
          <div>
            <b>{user.name}</b>
            <span>Thành viên NAM QUAN</span>
          </div>
        </div>

        <dl className="acc-fields">
          {fields.map((f) => (
            <div key={f.label}>
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}
