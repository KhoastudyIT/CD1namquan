import { Link } from "react-router-dom";
import { telHref, isMapEmbed, mapSearchHref } from "./ui.jsx";
import { Logo } from "./Logo.jsx";
import { useSettings } from "../context.js";

const SOCIALS = [
  { key: "facebook", label: "f", title: "Facebook", color: "#1877f2" },
  { key: "instagram", label: "IG", title: "Instagram", color: "#e1306c" },
  { key: "youtube", label: "YT", title: "YouTube", color: "#ff0000" },
  { key: "tiktok", label: "TT", title: "TikTok", color: "#111" },
];

export function Footer() {
  const settings = useSettings();
  const policies = [
    { title: "Chính sách bảo hành", id: "warranty" },
    { title: "Vận chuyển & lắp đặt", id: "shipping" },
    { title: "Chính sách đổi trả", id: "returns" },
    { title: "Thanh toán & trả góp", id: "payment" },
    { title: "Bảo mật thông tin", id: "privacy" },
  ];
  const socials = SOCIALS.filter(s => settings[s.key]);
  const hasMap = isMapEmbed(settings.mapUrl);

  return (
    <footer className="foot">
      <div className="wrap">
        <div className={"foot-grid" + (hasMap ? " with-map" : "")}>
          <div>
            <Logo />
            <p className="foot-desc">
              {settings.about || "Thương hiệu nội thất phong cách hiện đại tối giản. Đồng hành kiến tạo không gian tinh tế và sự phong thái thảnh thơi sang trọng bậc nhất cho ngôi nhà Việt."}
            </p>
          </div>
          <div>
            <h5>Chính Sách & Quy Định</h5>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {policies.map(p => (
                <li key={p.id}>
                  <Link
                    to={`/policies#${p.id}`}
                    style={{ fontSize: 13.5, color: "var(--ink-2)", transition: ".18s", textDecoration: "none" }}
                    className="foot-link"
                  >
                    › {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h5>Thông Tin Liên Hệ</h5>
            {settings.address && (
              <div className="foot-addr">
                <b>Địa chỉ:</b> {settings.address}{" "}
                <a href={mapSearchHref(settings.address)} target="_blank" rel="noreferrer" className="foot-link" style={{ whiteSpace: "nowrap" }}>
                  (Chỉ đường)
                </a>
              </div>
            )}
            {settings.phone && (
              <div className="foot-addr">
                <b>Hotline:</b>{" "}
                <a href={telHref(settings.phone)} className="foot-link">{settings.phone}</a>
              </div>
            )}
            {settings.email && (
              <div className="foot-addr">
                <b>Email:</b>{" "}
                <a href={`mailto:${settings.email}`} className="foot-link">{settings.email}</a>
              </div>
            )}
          </div>

          {hasMap && (
            <div>
              <h5>Bản Đồ</h5>
              <div className="foot-map">
                <iframe
                  src={settings.mapUrl}
                  title={`Bản đồ ${settings.companyName}`}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          )}
        </div>
        <div className="foot-bottom">
          <div className="foot-tag">Mỗi không gian<b>Một câu chuyện</b></div>
          {socials.length > 0 && (
            <div className="socials">
              {socials.map(s => (
                <a
                  key={s.key}
                  className="soc"
                  href={settings[s.key]}
                  target="_blank"
                  rel="noreferrer"
                  title={s.title}
                  aria-label={s.title}
                  style={{ background: s.color }}
                >
                  {s.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
