import { useState } from "react";
import { Icon, toast } from "../components/ui.jsx";
import { AccountHeader } from "../components/AccountLayout.jsx";
import { useAppContext } from "../context.js";
import { api } from "../api.js";

export function AccountSettings() {
  const { user, setUser, logout } = useAppContext();

  const [profile, setProfile] = useState({ name: user.name || "", phone: user.phone || "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileErr, setProfileErr] = useState("");

  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdErr, setPwdErr] = useState("");

  const saveProfile = async (e) => {
    e.preventDefault();
    if (savingProfile) return;
    setProfileErr("");
    if (profile.name.trim().length < 2) {
      setProfileErr("Tên phải có ít nhất 2 ký tự.");
      return;
    }
    setSavingProfile(true);
    try {
      const updated = await api.updateProfile({ name: profile.name.trim(), phone: profile.phone.trim() });
      setUser(updated);
      toast("Đã cập nhật thông tin");
    } catch (err) {
      setProfileErr(err.message || "Cập nhật thất bại");
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (savingPwd) return;
    setPwdErr("");
    if (pwd.newPassword.length < 6) {
      setPwdErr("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (pwd.newPassword !== pwd.confirm) {
      setPwdErr("Xác nhận mật khẩu không khớp.");
      return;
    }
    setSavingPwd(true);
    try {
      await api.changePassword({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword });
      setPwd({ currentPassword: "", newPassword: "", confirm: "" });
      toast("Đổi mật khẩu thành công, vui lòng đăng nhập lại");
      // Token cũ vẫn còn hiệu lực nhưng bắt đăng nhập lại cho đúng thói quen
      // bảo mật — người dùng vừa đổi mật khẩu thường mong phiên cũ bị chấm dứt.
      setTimeout(logout, 1200);
    } catch (err) {
      setPwdErr(err.message || "Đổi mật khẩu thất bại");
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <>
      <AccountHeader title="Cài đặt" desc="Quản lý thông tin đăng nhập và bảo mật tài khoản" />

      <div className="acc-card">
        <div className="acc-card-head"><h2>Thông tin cá nhân</h2></div>
        <form className="acc-form" onSubmit={saveProfile}>
          <label>
            <span>Họ và tên</span>
            <input
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="Nguyễn Văn A"
            />
          </label>
          <label>
            <span>Số điện thoại</span>
            <input
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="0901234567"
            />
          </label>
          <label>
            <span>Email</span>
            <input value={user.email} disabled title="Email không thể thay đổi" />
          </label>

          {profileErr && <p className="acc-form-err">{profileErr}</p>}
          <button type="submit" className="btn-pill" disabled={savingProfile}>
            {savingProfile ? "Đang lưu…" : "Lưu thay đổi"}
          </button>
        </form>
      </div>

      <div className="acc-card">
        <div className="acc-card-head"><h2>Đổi mật khẩu</h2></div>
        <form className="acc-form" onSubmit={savePassword}>
          <label>
            <span>Mật khẩu hiện tại</span>
            <input
              type="password"
              value={pwd.currentPassword}
              onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })}
              autoComplete="current-password"
            />
          </label>
          <label>
            <span>Mật khẩu mới</span>
            <input
              type="password"
              value={pwd.newPassword}
              onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })}
              autoComplete="new-password"
            />
          </label>
          <label>
            <span>Xác nhận mật khẩu mới</span>
            <input
              type="password"
              value={pwd.confirm}
              onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
              autoComplete="new-password"
            />
          </label>

          {pwdErr && <p className="acc-form-err">{pwdErr}</p>}
          <button
            type="submit"
            className="btn-pill"
            disabled={savingPwd || !pwd.currentPassword || !pwd.newPassword}
          >
            {savingPwd ? "Đang đổi…" : "Đổi mật khẩu"}
          </button>
        </form>
      </div>

      <div className="acc-card acc-note">
        <Icon name="info" size={18} />
        <p>
          Tùy chọn nhận thông báo chưa khả dụng — bảng <code>users</code> hiện chưa có cột lưu
          thiết lập này, cần thêm migration trước khi bật.
        </p>
      </div>
    </>
  );
}
