import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { vnd, Img, Icon, toast, confirm, discountPct, flashStatus, FLASH_STATUS_STYLE, orderTotals, normalizeMapEmbed, isMapEmbed, telHref } from "../components/ui.jsx";
import { ImageField } from "../components/ImageField.jsx";
import { ContentEditor } from "../components/ContentEditor.jsx";
import { AdminChat } from "../components/AdminChat.jsx";
import { useAppContext } from "../context.js";
import { isAdmin as isAdminRole, ROLE_LABEL, STAFF_HIDDEN_TABS } from "../utils/roles.js";

// ── Trang Tổng quan ────────────────────────────────────────────────────
/** Mốc thời gian bấm nhanh, số ngày phải khớp period.days của server. */
const QUICK_RANGES = [
  { label: "7 ngày", days: 7 },
  { label: "30 ngày", days: 30 },
  { label: "90 ngày", days: 90 },
];

/**
 * Bề ngang tối đa của thẻ chứa biểu đồ doanh thu — để nó không kéo hết màn hình
 * trên máy màn rộng. Biểu đồ bên trong tự co theo thẻ, nên chỉ cần đổi số này.
 */
const CHART_CARD_MAX_W = 780;

/** Màu cho các cột danh mục, lặp lại khi hết. */
const CATEGORY_COLORS = ["#15803d", "#2563eb", "#7c3aed", "#ca8a04", "#0891b2", "#dc2626"];

const dmy = (s) => {
  const [y, m, d] = String(s).split("-");
  return `${d}/${m}/${y}`;
};

const ovLabel = { display: "block", fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 4 };
const ovEmpty = { color: "var(--muted)", fontSize: 13, textAlign: "center", padding: "18px 0", margin: 0 };
const ovRank = (i) => ({
  width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
  display: "grid", placeItems: "center", fontSize: 11.5, fontWeight: 700,
  background: i === 0 ? "#fef3c7" : i === 1 ? "#e5e7eb" : i === 2 ? "#fde8d7" : "var(--mint)",
  color: i === 0 ? "#92400e" : i === 1 ? "#4b5563" : i === 2 ? "#9a3412" : "var(--green-ink)",
});

// Màu nhãn vai trò trong bảng Người dùng.
const ROLE_BADGE = {
  admin:    { bg: "#fef3c7", fg: "#92400e", text: "👑 Quản trị viên" },
  staff:    { bg: "#e0f2fe", fg: "#0369a1", text: "👔 Nhân viên" },
  customer: { bg: "var(--mint)", fg: "var(--green-ink)", text: "👤 Khách hàng" },
};

// ── Mini bar chart (pure CSS) ──────────────────────────────────────────
/** Rút gọn tiền cho nhãn trục: 12.500.000 → "12,5tr" */
function shortVnd(n) {
  const v = Number(n) || 0;
  if (v >= 1e9) return `${(v / 1e9).toFixed(v >= 1e10 ? 0 : 1).replace(".", ",")} tỷ`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(v >= 1e7 ? 0 : 1).replace(".", ",")}tr`;
  if (v >= 1e3) return `${Math.round(v / 1e3)}k`;
  return String(v);
}

/**
 * Biểu đồ đường doanh thu theo ngày.
 *
 * Vẽ bằng SVG thuần thay vì kéo thêm thư viện biểu đồ: chỉ cần một đường gấp
 * khúc, vùng tô dưới đường và vài nhãn trục nên không đáng để thêm phụ thuộc.
 * viewBox cố định còn width="100%" nên hình tự co giãn theo khung chứa.
 */
function LineChart({ data, labelKey = "date", valueKey = "revenue", color = "#15803d" }) {
  // Hệ toạ độ viewBox. Tỉ lệ W:H quyết định biểu đồ dẹt hay cao; bề ngang hiển
  // thị do thẻ chứa quyết định.
  const W = 760;
  const H = 260;
  // right phải đủ rộng cho nửa bề ngang nhãn ngày cuối (canh giữa), nếu không
  // chữ tràn khỏi viewBox và bị xén mất chữ số tháng.
  const PAD = { top: 16, right: 26, bottom: 30, left: 54 };
  const iw = W - PAD.left - PAD.right;
  const ih = H - PAD.top - PAD.bottom;

  const svgRef = useRef(null);
  const [hover, setHover] = useState(null);

  const vals = data.map(d => Number(d[valueKey]) || 0);
  const rawMax = Math.max(...vals, 1);
  // Làm tròn trần lên số đẹp để các đường lưới không ra số lẻ.
  const step = Math.pow(10, Math.floor(Math.log10(rawMax)));
  const max = Math.ceil(rawMax / step) * step;

  const x = (i) => PAD.left + (data.length <= 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const y = (v) => PAD.top + ih - (v / max) * ih;

  const pts = data.map((d, i) => [x(i), y(Number(d[valueKey]) || 0)]);

  /**
   * Nối các điểm bằng đường cong trơn.
   *
   * Dùng Catmull-Rom quy đổi sang đường Bézier bậc ba: điểm điều khiển của mỗi
   * đoạn lấy theo độ dốc giữa điểm trước và điểm sau, nhờ đó đường đi mượt qua
   * đúng mọi điểm dữ liệu. Toạ độ y của điểm điều khiển bị kẹp trong vùng vẽ để
   * chỗ dốc mạnh đường không vọt ra ngoài trục.
   */
  const clampY = (v) => Math.max(PAD.top, Math.min(PAD.top + ih, v));
  const TENSION = 0.75;
  const curve = (() => {
    if (pts.length === 0) return "";
    if (pts.length === 1) return `M${pts[0][0]},${pts[0][1]}`;
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] ?? pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] ?? p2;
      const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * TENSION;
      const c1y = clampY(p1[1] + ((p2[1] - p0[1]) / 6) * TENSION);
      const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * TENSION;
      const c2y = clampY(p2[1] - ((p3[1] - p1[1]) / 6) * TENSION);
      d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d;
  })();

  const baseY = PAD.top + ih;
  const areaPath = curve
    ? `${curve} L${pts[pts.length - 1][0].toFixed(1)},${baseY} L${pts[0][0].toFixed(1)},${baseY} Z`
    : "";

  // Nhãn trục ngang: tối đa 8 mốc. Đếm NGƯỢC từ ngày cuối để mốc cuối luôn được
  // ghi mà vẫn cách đều mốc trước — đi xuôi rồi ép thêm ngày cuối sẽ đè chữ.
  const tickEvery = Math.max(1, Math.ceil(data.length / 8));
  const ticks = [];
  for (let i = data.length - 1; i >= 0; i -= tickEvery) ticks.unshift(i);
  const gridLines = 4;

  const dm = (s) => {
    const p = String(s).split("-");
    return p.length === 3 ? `${p[2]}/${p[1]}` : s;
  };

  /** Đổi toạ độ chuột sang hệ viewBox rồi tìm điểm dữ liệu gần nhất. */
  const handleMove = (e) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || data.length === 0) return;
    const vx = ((e.clientX - rect.left) / rect.width) * W;
    const ratio = (vx - PAD.left) / (iw || 1);
    const i = Math.round(ratio * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  };

  const hp = hover != null ? pts[hover] : null;

  // Hộp thông tin: lật sang trái khi điểm nằm gần mép phải để không bị cắt.
  const TIP_W = 132;
  const TIP_H = 40;
  const tipLeft = hp ? hp[0] + TIP_W + 14 > W : false;
  const tipX = hp ? (tipLeft ? hp[0] - TIP_W - 12 : hp[0] + 12) : 0;
  const tipY = hp ? Math.max(PAD.top, Math.min(hp[1] - TIP_H / 2, PAD.top + ih - TIP_H)) : 0;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: "block", width: "100%", height: "auto" }}
      onMouseMove={handleMove}
      onMouseLeave={() => setHover(null)}
    >
      <defs>
        <linearGradient id="lcFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Lưới ngang và nhãn trục dọc */}
      {Array.from({ length: gridLines + 1 }, (_, i) => {
        const v = (max / gridLines) * i;
        const gy = y(v);
        return (
          <g key={i}>
            <line x1={PAD.left} y1={gy} x2={PAD.left + iw} y2={gy}
              stroke="var(--line)" strokeWidth="1" strokeDasharray={i === 0 ? "0" : "3 4"} />
            <text x={PAD.left - 9} y={gy + 3.8} textAnchor="end" fontSize="11.5" fill="var(--muted)">
              {shortVnd(v)}
            </text>
          </g>
        );
      })}

      {/* Vùng tô dưới đường + đường doanh thu dạng cong */}
      <path d={areaPath} fill="url(#lcFill)" />
      <path d={curve} fill="none" stroke={color} strokeWidth="2.4"
        strokeLinejoin="round" strokeLinecap="round" />

      {/* Chấm và thông tin chỉ hiện khi rê chuột */}
      {hp && (
        <g pointerEvents="none">
          <line x1={hp[0]} y1={PAD.top} x2={hp[0]} y2={PAD.top + ih}
            stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
          <circle cx={hp[0]} cy={hp[1]} r="5.5" fill="#fff" stroke={color} strokeWidth="2.6" />

          <rect x={tipX} y={tipY} width={TIP_W} height={TIP_H} rx="7"
            fill="#1d2722" opacity="0.94" />
          <text x={tipX + 10} y={tipY + 16} fontSize="11.5" fill="#c8d6cd">
            {dm(data[hover][labelKey])} · {data[hover].orders ?? 0} đơn
          </text>
          <text x={tipX + 10} y={tipY + 31} fontSize="13" fontWeight="700" fill="#fff">
            {(Number(data[hover][valueKey]) || 0).toLocaleString("vi-VN")}đ
          </text>
        </g>
      )}

      {/* Nhãn trục ngang */}
      {ticks.map(i => (
        <text key={i} x={x(i)} y={H - 10} textAnchor="middle" fontSize="11.5"
          fill={hover === i ? "var(--ink)" : "var(--muted)"}
          fontWeight={hover === i ? 700 : 400}>
          {dm(data[i][labelKey])}
        </text>
      ))}
    </svg>
  );
}

/**
 * Biểu đồ tròn khuyết (donut) cho doanh thu theo danh mục.
 *
 * Mỗi phần được vẽ bằng một vòng tròn dùng stroke-dasharray: đoạn nét bằng
 * chiều dài cung cần tô, phần còn lại để trống, rồi dịch điểm bắt đầu bằng
 * stroke-dashoffset. Cách này gọn hơn nhiều so với tự tính toạ độ cung tròn
 * bằng path arc, và các phần luôn khít nhau không hở.
 */
function DonutChart({ data, valueKey = "revenue", labelKey = "category", colors, size = 190 }) {
  const R = 66;                    // bán kính đường tâm của vành
  const SW = 30;                   // bề dày vành
  const C = 2 * Math.PI * R;       // chu vi
  const cx = size / 2;
  const cy = size / 2;

  const total = data.reduce((s, d) => s + (Number(d[valueKey]) || 0), 0);
  let acc = 0;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ display: "block", flexShrink: 0 }}>
      {/* Vành nền cho trường hợp chưa có dữ liệu */}
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--line)" strokeWidth={SW} />

      {total > 0 && data.map((d, i) => {
        const v = Number(d[valueKey]) || 0;
        const len = (v / total) * C;
        const el = (
          <circle
            key={i}
            cx={cx} cy={cy} r={R}
            fill="none"
            stroke={colors[i % colors.length]}
            strokeWidth={SW}
            strokeDasharray={`${len} ${C - len}`}
            strokeDashoffset={-acc}
            transform={`rotate(-90 ${cx} ${cy})`}
          >
            <title>{`${d[labelKey]}: ${v.toLocaleString("vi-VN")}đ`}</title>
          </circle>
        );
        acc += len;
        return el;
      })}

      {/* Lỗ giữa: tổng doanh thu của kỳ */}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="13" fill="var(--muted)">Tổng</text>
      <text x={cx} y={cy + 16} textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--ink)">
        {shortVnd(total)}
      </text>
    </svg>
  );
}

function BarChart({ data, labelKey, valueKey, color = "var(--green)" }) {
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 90, padding: "0 4px" }}>
      {data.map((d, i) => {
        const pct = Math.round((d[valueKey] / max) * 100);
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div
              title={`${d[labelKey]}: ${d[valueKey]?.toLocaleString()}`}
              style={{
                width: "100%", borderRadius: "4px 4px 0 0",
                background: color,
                height: `${Math.max(pct, 3)}%`,
                transition: "height .5s cubic-bezier(.2,.7,.2,1)",
                opacity: 0.85,
              }}
            />
            <span style={{ fontSize: 10, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%", textAlign: "center" }}>
              {d[labelKey]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Status color map ───────────────────────────────────────────────────
const STATUS_COLORS = {
  pending: "#f59a1c",
  confirmed: "#3b82f6",
  shipped: "#8b5cf6",
  delivered: "var(--green)",
  cancelled: "#ef4444",
};

// ── Flash sale ─────────────────────────────────────────────────────────
// `tone` khớp với flashStatus() trong ui.jsx; "all" là mục xem tất cả.
// Thứ tự ở đây cũng là thứ tự ưu tiên sắp xếp trong bảng.
const FLASH_FILTERS = [
  { tone: "live", label: "Đang chạy" },
  { tone: "pending", label: "Chưa bắt đầu" },
  { tone: "soldout", label: "Hết suất" },
  { tone: "off", label: "Tạm ngưng" },
  { tone: "expired", label: "Đã kết thúc" },
  { tone: "all", label: "Tất cả" },
];
const FLASH_TONE_ORDER = FLASH_FILTERS.map(f => f.tone);

// ── Yêu cầu tư vấn ─────────────────────────────────────────────────────
// Vòng đời một lead: khách gửi form ở trang chủ (new) → nhân viên gọi
// (contacted) → gửi báo giá (quoted) → chốt hoặc khách từ chối (closed/cancelled).
const CONSULT_STATUS_META = {
  new: { label: "Chưa xử lý", bg: "#fef3c7", color: "#92400e" },
  contacted: { label: "Đã liên hệ", bg: "#dbeafe", color: "#1e40af" },
  quoted: { label: "Đã báo giá", bg: "#ede9fe", color: "#5b21b6" },
  closed: { label: "Đã chốt", bg: "#dcfce7", color: "var(--green-ink)" },
  cancelled: { label: "Đã hủy", bg: "#fee2e2", color: "#b91c1c" },
};

const CONSULT_STATUSES = Object.keys(CONSULT_STATUS_META);

// Quy trình chỉ đi tới, không lùi (khớp consultation.schema.js phía server):
//   new → contacted → quoted → closed, và huỷ được từ mọi bước chưa kết thúc.
// Cho phép nhảy cóc về trước (khách gọi hỏi giá luôn → new sang thẳng quoted).
// ── Trả / đổi hàng ─────────────────────────────────────────────────────
// Vòng đời: pending → approved → completed, từ chối được ở hai bước đầu.
// Cũng chỉ đi tới, không lùi — bước completed đụng tới kho và tiền nên cho lùi
// rồi tiến lại sẽ hoàn kho hai lần.
const RETURN_STATUS_META = {
  pending:   { label: "Chờ duyệt", bg: "#fef3c7", color: "#92400e" },
  approved:  { label: "Đã duyệt",  bg: "#dbeafe", color: "#1e40af" },
  rejected:  { label: "Từ chối",   bg: "#fee2e2", color: "#b91c1c" },
  completed: { label: "Hoàn tất",  bg: "#dcfce7", color: "var(--green-ink)" },
};
const RETURN_TYPE_LABEL = { return: "Trả hàng", exchange: "Đổi hàng" };
const RETURN_NEXT = {
  pending:   ["approved", "rejected"],
  approved:  ["completed", "rejected"],
  rejected:  [],
  completed: [],
};

const CONSULT_FLOW = ["new", "contacted", "quoted", "closed"];
const CONSULT_TERMINAL = ["closed", "cancelled"];

const consultRank = (s) => CONSULT_FLOW.indexOf(s);
const isConsultDone = (s) => CONSULT_TERMINAL.includes(s);
/** Bước này đã đi qua hoặc đang đứng ở đây → hiển thị nhưng khoá lại. */
const canGoToConsult = (from, to) =>
  !isConsultDone(from) && (to === "cancelled" || consultRank(to) > consultRank(from));

// ── Tin tức ────────────────────────────────────────────────────────────
const NEWS_STATUS_META = {
  published: { label: "Đã đăng", bg: "#dcfce7", color: "var(--green-ink)" },
  draft: { label: "Bản nháp", bg: "#fef3c7", color: "#92400e" },
  hidden: { label: "Đã ẩn", bg: "#e5e7eb", color: "#4b5563" },
};

const EMPTY_NEWS_FORM = {
  title: "", slug: "", img: "/images/news1.jpg", excerpt: "", content: "",
  categoryId: "", tags: "", status: "draft", featured: false, date: "",
  seoTitle: "", seoDescription: "", seoKeywords: "", ogImage: "",
};

// Xem trước slug sẽ được backend sinh ra khi admin để trống ô slug.
const slugify = (value) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/\u0111/g, "d").replace(/\u0110/g, "D")
  .toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "") || "bai-viet";

export function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, settings, refreshSettings } = useAppContext();

  // ── Phân quyền ────────────────────────────────────────────────────
  // canManage = admin (toàn quyền). Nhân viên chỉ được xem ở các tab nội dung,
  // nhưng vẫn thao tác đầy đủ với đơn hàng, tư vấn và chat.
  // Đây chỉ là lớp che giao diện — server vẫn chặn lại bằng authorize/readOnly.
  const canManage = isAdminRole(user?.role);

  // Đọc tab từ URL hash (#overview, #products, v.v.), fallback về 'overview'
  const ALL_TABS = ["overview", "products", "orders", "returns", "users", "staff", "categories", "collections", "news", "flash_sales", "consultations", "chat", "settings"];
  const VALID_TABS = canManage ? ALL_TABS : ALL_TABS.filter(t => !STAFF_HIDDEN_TABS.includes(t));
  const hashTab = location.hash.replace("#", "");
  // Nhân viên gõ thẳng #settings vào URL cũng bị đưa về Tổng quan.
  const activeTab = VALID_TABS.includes(hashTab) ? hashTab : "overview";

  // Thay đổi tab → cập nhật URL hash (reload sẽ giữ đúng tab)
  const setActiveTab = useCallback((tab) => {
    navigate(`/admin#${tab}`, { replace: true });
  }, [navigate]);

  // ── Chung ─────────────────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  // Số tin khách chưa được trả lời — hiện ngay trên nhãn tab Chat ở sidebar.
  const [chatUnread, setChatUnread] = useState(0);

  // ── Users tab ─────────────────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [usersMeta, setUsersMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userStatus, setUserStatus] = useState("");
  const [userPage, setUserPage] = useState(1);
  // ── Tab Trả hàng ──────────────────────────────────────────────────
  const [returns, setReturns] = useState([]);
  const [returnsMeta, setReturnsMeta] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [returnsLoading, setReturnsLoading] = useState(false);
  const [returnFilter, setReturnFilter] = useState("pending"); // mặc định mở ở nhóm cần xử lý
  const [returnPage, setReturnPage] = useState(1);
  const [returnCounts, setReturnCounts] = useState({ pending: 0, approved: 0, rejected: 0, completed: 0, total: 0 });
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [returnNote, setReturnNote] = useState("");
  const [returnSaving, setReturnSaving] = useState(false);

  // ── Tab Nhân viên (chỉ admin) ─────────────────────────────────────
  // Tách khỏi tab Người dùng: ở đây chỉ có nhân sự nội bộ (staff + admin),
  // còn tab Người dùng dành cho toàn bộ tài khoản kể cả khách hàng.
  const [staffList, setStaffList] = useState([]);
  const [staffMeta, setStaffMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffSearch, setStaffSearch] = useState("");
  const [staffPage, setStaffPage] = useState(1);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffSaving, setStaffSaving] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: "", email: "", phone: "", password: "", role: "staff" });

  // ── Categories tab ────────────────────────────────────────────────
  const [allCategories, setAllCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [showEditCatModal, setShowEditCatModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [catFormData, setCatFormData] = useState({ name: "", img: "" });

  // ── Collections tab ───────────────────────────────────────────────
  const [allCollections, setAllCollections] = useState([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [showAddCollModal, setShowAddCollModal] = useState(false);
  const [showEditCollModal, setShowEditCollModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [collFormData, setCollFormData] = useState({ name: "", img: "" });

  // ── News tab ──────────────────────────────────────────────────────
  const [allNews, setAllNews] = useState([]);
  const [newsMeta, setNewsMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [newsCategories, setNewsCategories] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsSearch, setNewsSearch] = useState("");
  const [newsStatus, setNewsStatus] = useState("");     // "" = tất cả
  const [newsCategory, setNewsCategory] = useState(""); // slug danh mục
  const [newsPage, setNewsPage] = useState(1);
  // Một modal dùng chung cho cả tạo mới và sửa — mode: "create" | "edit"
  const [newsModal, setNewsModal] = useState(null);
  const [newsSaving, setNewsSaving] = useState(false);
  const [newsSeoOpen, setNewsSeoOpen] = useState(false);
  const [newsFormData, setNewsFormData] = useState(EMPTY_NEWS_FORM);

  // Dùng chung cho mọi modal có ảnh — mỗi lúc chỉ mở được một modal.
  const [imageUploading, setImageUploading] = useState(false);

  // ── Consultations tab (yêu cầu tư vấn từ form trang chủ) ───────────
  const [consults, setConsults] = useState([]);
  const [consultsMeta, setConsultsMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [consultCounts, setConsultCounts] = useState({});
  const [consultsLoading, setConsultsLoading] = useState(false);
  const [consultSearch, setConsultSearch] = useState("");
  const [consultStatus, setConsultStatus] = useState(""); // "" = tất cả
  const [consultPage, setConsultPage] = useState(1);
  const [selectedConsult, setSelectedConsult] = useState(null);

  // ── Flash Sales tab ────────────────────────────────────────────────
  const [flashSales, setFlashSales] = useState([]);
  const [flashSalesLoading, setFlashSalesLoading] = useState(false);
  // Chương trình đã kết thúc được giữ lại vĩnh viễn để đơn hàng cũ còn tra được
  // (order_items.flash_sale_id), nên bảng sẽ dài dần — lọc theo trạng thái thay
  // vì xoá dữ liệu. Mặc định xem "Đang chạy" cho gọn.
  const [flashFilter, setFlashFilter] = useState("live");
  const [showAddFlashModal, setShowAddFlashModal] = useState(false);
  const [showEditFlashModal, setShowEditFlashModal] = useState(false);
  const [selectedFlash, setSelectedFlash] = useState(null);
  const [flashFormData, setFlashFormData] = useState({
    productId: "", price: "", originalPrice: "", discountPct: "", stock: "", sold: "", startsAt: "", endsAt: "", active: true
  });

  // ── Thông tin công ty (logo, hotline, địa chỉ, mạng xã hội) ───────
  const [infoForm, setInfoForm] = useState(null);
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoSaving, setInfoSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  // ── Products filter ───────────────────────────────────────────────
  const [productSearch, setProductSearch] = useState("");
  const [productCategory, setProductCategory] = useState("all");
  const [productStock, setProductStock] = useState("all");     // all | in | low | out
  const [productSort, setProductSort] = useState("default");   // default | price-asc | price-desc | stock-asc | sold-desc

  // ── Mobile nav (menu hamburger) ───────────────────────────────────
  const [mobileNav, setMobileNav] = useState(false);

  // ── Modals ────────────────────────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [printingInvoice, setPrintingInvoice] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusOrder, setStatusOrder] = useState(null);
  const [newStatusValue, setNewStatusValue] = useState("");

  const handleOpenStatusEdit = (order) => {
    setStatusOrder(order);
    setNewStatusValue(order.status);
    setShowStatusModal(true);
  };

  const handleSaveStatusModal = async () => {
    if (!statusOrder || !newStatusValue) return;
    await handleUpdateOrderStatus(statusOrder.id, newStatusValue);
    setShowStatusModal(false);
    setStatusOrder(null);
  };

  // ── Xuất báo cáo Excel ────────────────────────────────────────────────────
  // Mặc định 30 ngày gần nhất, trùng với mặc định phía server.
  const todayStr = new Date().toISOString().slice(0, 10);
  const [reportFrom, setReportFrom] = useState(
    new Date(Date.now() - 29 * 86_400_000).toISOString().slice(0, 10),
  );
  const [reportTo, setReportTo] = useState(todayStr);
  const [exporting, setExporting] = useState(false);

  const handlePrintInvoice = async (orderId) => {
    setPrintingInvoice(true);
    try {
      await api.openInvoice(orderId);
    } catch (err) {
      toast(err.message);
    } finally {
      setPrintingInvoice(false);
    }
  };

  /** Nạp lại số liệu trang Tổng quan theo khoảng ngày đang chọn. */
  const fetchOverview = async (range = {}) => {
    const from = range.from ?? reportFrom;
    const to = range.to ?? reportTo;
    if (from > to) { toast("Ngày bắt đầu phải trước ngày kết thúc"); return; }
    setLoading(true);
    try {
      setStats(await api.getStatsOverview({ from, to }));
    } catch (err) {
      toast("Lỗi tải thống kê: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  /** Bấm nhanh 7 / 30 / 90 ngày — đặt lại ô ngày rồi nạp luôn. */
  const applyQuickRange = (days) => {
    const to = todayStr;
    const from = new Date(Date.now() - (days - 1) * 86_400_000).toISOString().slice(0, 10);
    setReportFrom(from);
    setReportTo(to);
    fetchOverview({ from, to });
  };

  const handleExportExcel = async () => {
    if (reportFrom > reportTo) {
      toast("Ngày bắt đầu phải trước ngày kết thúc");
      return;
    }
    setExporting(true);
    try {
      await api.downloadStatsExcel({ from: reportFrom, to: reportTo });
      toast("Đã tải báo cáo thống kê");
    } catch (err) {
      toast("Lỗi xuất báo cáo: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  // ── Product form ──────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    name: "", type: "", price: "", categoryId: "", img: "", stock: "", description: ""
  });

  // ─────────────── FETCH ───────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    try {
      const productsData = await api.getProducts({ limit: 100 });
      setProducts(productsData.data || productsData || []);

      const ordersData = await api.getAllOrders();
      setOrders(ordersData || []);

      // Lần nạp đầu dùng đúng khoảng ngày mặc định của trang Tổng quan.
      const statsData = await api.getStatsOverview({ from: reportFrom, to: reportTo });
      setStats(statsData);

      const catsData = await api.getCategories();
      setAllCategories(catsData || []);

      const flashData = await api.getFlashSalesAdmin();
      setFlashSales(flashData || []);
    } catch (err) {
      console.error(err);
      toast("Lỗi tải dữ liệu: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFlashSales = async () => {
    setFlashSalesLoading(true);
    try {
      const data = await api.getFlashSalesAdmin();
      setFlashSales(data || []);
    } catch (err) {
      toast("Lỗi tải danh sách Flash Sale: " + err.message);
    } finally {
      setFlashSalesLoading(false);
    }
  };

  const fetchUsers = async (overrides = {}) => {
    setUsersLoading(true);
    try {
      const params = {
        // Tab này chỉ quản lý KHÁCH HÀNG; nhân viên và quản trị viên nằm ở
        // tab Nhân viên để không lẫn tài khoản nội bộ với tài khoản mua hàng.
        role: "customer",
        search: userSearch,
        status: userStatus,
        page: userPage,
        limit: 10,
        ...overrides,
      };
      Object.keys(params).forEach(k => params[k] === "" && delete params[k]);
      const res = await api.getUsers(params);
      setUsers(res.data || []);
      setUsersMeta(res.meta || { total: 0, page: 1, limit: 10, totalPages: 1 });
    } catch (err) {
      toast("Lỗi tải danh sách người dùng: " + err.message);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchReturns = async (overrides = {}) => {
    setReturnsLoading(true);
    try {
      const params = { status: returnFilter, page: returnPage, limit: 15, ...overrides };
      Object.keys(params).forEach(k => params[k] === "" && delete params[k]);
      const res = await api.getReturnsAdmin(params);
      setReturns(res.data || []);
      setReturnsMeta(res.meta || { total: 0, page: 1, limit: 15, totalPages: 1 });
    } catch (err) {
      toast("Lỗi tải yêu cầu trả hàng: " + err.message);
    } finally {
      setReturnsLoading(false);
    }
  };

  const fetchReturnCounts = async () => {
    try { setReturnCounts(await api.getReturnStats()); } catch { /* chip đếm hỏng không chặn tab */ }
  };

  /**
   * Duyệt / từ chối / hoàn tất. Hoàn tất một yêu cầu TRẢ hàng sẽ hoàn tồn kho và
   * đánh dấu đơn đã hoàn tiền, nên hỏi lại cho chắc trước khi gọi API.
   */
  const handleReturnStatus = async (r, status) => {
    // Từ chối phải kèm lý do — server cũng chặn, đây chỉ là báo sớm cho đỡ mất công.
    if (status === "rejected" && !returnNote.trim() && !r.adminNote) {
      toast("Vui lòng nhập lý do từ chối để khách hàng nắm được");
      return;
    }
    if (status === "completed" && r.type === "return") {
      const okToRun = await confirm(
        `Hoàn tất trả hàng cho đơn #${String(r.orderId).split("-")[0].toUpperCase()}?\n\n`
        + "Hệ thống sẽ cộng lại tồn kho, trừ số đã bán và đánh dấu đơn là đã trả / đã hoàn tiền.",
        "Xác nhận hoàn tất trả hàng",
      );
      if (!okToRun) return;
    }
    setReturnSaving(true);
    try {
      const body = { status };
      if (returnNote.trim()) body.adminNote = returnNote.trim();
      const updated = await api.updateReturnStatus(r.id, body);
      toast(`Đã chuyển yêu cầu sang: ${RETURN_STATUS_META[status].label}`);
      setSelectedReturn(updated);
      setReturnNote("");
      fetchReturns();
      fetchReturnCounts();
      // Tồn kho vừa đổi thì bảng sản phẩm và thống kê ở tab khác cũng cũ theo.
      if (status === "completed" && r.type === "return") fetchData();
    } catch (err) {
      toast("Lỗi: " + err.message);
    } finally {
      setReturnSaving(false);
    }
  };

  /** Danh sách nhân sự nội bộ — backend nhận nhiều vai trò phân tách bằng dấu phẩy. */
  const fetchStaff = async (overrides = {}) => {
    setStaffLoading(true);
    try {
      const params = { role: "staff,admin", search: staffSearch, page: staffPage, limit: 10, ...overrides };
      Object.keys(params).forEach(k => params[k] === "" && delete params[k]);
      const res = await api.getUsers(params);
      setStaffList(res.data || []);
      setStaffMeta(res.meta || { total: 0, page: 1, limit: 10, totalPages: 1 });
    } catch (err) {
      toast("Lỗi tải danh sách nhân viên: " + err.message);
    } finally {
      setStaffLoading(false);
    }
  };

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const catsData = await api.getCategories();
      setAllCategories(catsData || []);
    } catch (err) {
      toast("Lỗi tải danh sách danh mục: " + err.message);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchCollections = async () => {
    setCollectionsLoading(true);
    try {
      const collsData = await api.getCollections();
      setAllCollections(collsData || []);
    } catch (err) {
      toast("Lỗi tải danh sách bộ sưu tập: " + err.message);
    } finally {
      setCollectionsLoading(false);
    }
  };

  // overrides: cho phép gọi ngay với giá trị mới mà không chờ state cập nhật
  const fetchNewsList = async (overrides = {}) => {
    setNewsLoading(true);
    try {
      const params = {
        page: overrides.page ?? newsPage,
        limit: newsMeta.limit,
        search: overrides.search ?? newsSearch,
        status: overrides.status ?? newsStatus,
        category: overrides.category ?? newsCategory,
      };
      Object.keys(params).forEach(k => { if (params[k] === "" || params[k] == null) delete params[k]; });

      const res = await api.getNewsAdmin(params);
      setAllNews(res.data || []);
      if (res.meta) setNewsMeta(res.meta);
    } catch (err) {
      toast("Lỗi tải danh sách tin tức: " + err.message);
    } finally {
      setNewsLoading(false);
    }
  };

  const fetchNewsCategories = async () => {
    try {
      setNewsCategories(await api.getNewsCategories() || []);
    } catch { /* bộ lọc danh mục không có thì tab vẫn dùng được */ }
  };

  const fetchConsults = async (overrides = {}) => {
    setConsultsLoading(true);
    try {
      const params = {
        page: overrides.page ?? consultPage,
        limit: consultsMeta.limit,
        search: overrides.search ?? consultSearch,
        status: overrides.status ?? consultStatus,
      };
      Object.keys(params).forEach(k => { if (params[k] === "" || params[k] == null) delete params[k]; });

      const res = await api.getConsultations(params);
      setConsults(res.data || []);
      if (res.meta) setConsultsMeta(res.meta);
    } catch (err) {
      toast("Lỗi tải yêu cầu tư vấn: " + err.message);
    } finally {
      setConsultsLoading(false);
    }
  };

  // Số lượng theo trạng thái — dùng cho badge sidebar và số trên các chip lọc.
  const fetchConsultCounts = async () => {
    try {
      setConsultCounts(await api.getConsultationStats() || {});
    } catch { /* thiếu số đếm thì tab vẫn dùng được */ }
  };

  const fetchCompanyInfo = async () => {
    try {
      setInfoLoading(true);
      setInfoForm(await api.getSettings());
    } catch (err) {
      toast("Lỗi tải thông tin công ty: " + err.message);
    } finally {
      setInfoLoading(false);
    }
  };

  const setInfoField = (key, value) => setInfoForm(prev => ({ ...prev, [key]: value }));

  const handleSaveCompanyInfo = async (e) => {
    e.preventDefault();
    try {
      setInfoSaving(true);
      const { id, updatedAt, ...payload } = infoForm;
      setInfoForm(await api.updateSettings(payload));
      await refreshSettings();
      toast("Đã lưu thông tin công ty!");
    } catch (err) {
      toast("Lỗi lưu thông tin: " + err.message);
    } finally {
      setInfoSaving(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (activeTab === "users") fetchUsers(); }, [activeTab]);
  useEffect(() => { if (activeTab === "returns") fetchReturns(); }, [activeTab]);
  useEffect(() => { fetchReturnCounts(); }, []);
  useEffect(() => { if (activeTab === "staff") fetchStaff(); }, [activeTab]);
  // Nạp một lần lúc vào dashboard để sidebar hiện ngay số nhân sự.
  useEffect(() => { if (canManage && activeTab !== "staff") fetchStaff(); }, []);
  useEffect(() => { if (activeTab === "categories") fetchCategories(); }, [activeTab]);
  useEffect(() => { if (activeTab === "collections") fetchCollections(); }, [activeTab]);
  useEffect(() => { if (activeTab === "news") { fetchNewsList(); fetchNewsCategories(); } }, [activeTab]);
  useEffect(() => { if (activeTab === "flash_sales") fetchFlashSales(); }, [activeTab]);
  useEffect(() => { if (activeTab === "consultations") fetchConsults(); }, [activeTab]);
  useEffect(() => { if (activeTab === "settings") fetchCompanyInfo(); }, [activeTab]);

  // Badge "yêu cầu chưa xử lý" nạp một lần khi mở dashboard để thấy ngay từ tab
  // Tổng quan; sau đó tự cập nhật lại sau mỗi lần đổi trạng thái hoặc xoá.
  useEffect(() => { fetchConsultCounts(); }, []);

  // Badge chat chạy nền ở mọi tab để admin thấy khách nhắn dù đang ở trang khác.
  useEffect(() => {
    const poll = () => api.getChatUnreadCount()
      .then(data => setChatUnread(data?.total ?? 0))
      .catch(() => { });
    poll();
    const id = setInterval(poll, 15000);
    return () => clearInterval(id);
  }, []);

  // ─────────────── PRODUCT HANDLERS ────────────────────────────────
  const handleOpenAdd = () => {
    if (allCategories.length === 0) {
      toast("Vui lòng tạo danh mục trước khi thêm sản phẩm");
      return;
    }
    setFormData({
      name: "", type: "Ghế Sofa", price: 1000000, categoryId: String(allCategories[0].id),
      img: "/images/placeholder.jpg", stock: 10, description: "Mô tả sản phẩm chất lượng cao."
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (p) => {
    setSelectedProduct(p);
    setFormData({
      name: p.name, type: p.type, price: p.price, categoryId: p.category_id ? String(p.category_id) : "",
      img: p.img, stock: p.stock, description: p.description || ""
    });
    setShowEditModal(true);
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.type || !formData.price || !formData.stock || !formData.categoryId) { toast("Vui lòng điền đầy đủ thông tin bắt buộc"); return; }
    try {
      await api.createProduct({ ...formData, categoryId: Number(formData.categoryId), price: Number(formData.price), stock: Number(formData.stock) });
      toast("Thêm sản phẩm thành công!");
      setShowAddModal(false);
      fetchData();
    } catch (err) { toast("Lỗi: " + err.message); }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.type || !formData.price || !formData.stock || !formData.categoryId) { toast("Vui lòng điền đầy đủ thông tin bắt buộc"); return; }
    try {
      await api.updateProduct(selectedProduct.id, { ...formData, categoryId: Number(formData.categoryId), price: Number(formData.price), stock: Number(formData.stock) });
      toast("Cập nhật sản phẩm thành công!");
      setShowEditModal(false);
      fetchData();
    } catch (err) { toast("Lỗi: " + err.message); }
  };

  const handleDeleteProduct = async (id, name) => {
    if (await confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}"?`)) {
      try {
        await api.deleteProduct(id);
        toast("Xóa sản phẩm thành công!");
        fetchData();
      } catch (err) { toast("Lỗi xóa sản phẩm: " + err.message); }
    }
  };

  const handleUpdateOrderStatus = async (id, status) => {
    try {
      await api.updateOrderStatus(id, status);
      toast("Đã cập nhật trạng thái đơn hàng!");
      fetchData();
    } catch (err) { toast("Lỗi cập nhật đơn hàng: " + err.message); }
  };

  // ─────────────── USER HANDLERS ───────────────────────────────────
  const handleUpdateUserRole = async (u, newRole) => {
    if (!newRole || newRole === u.role) return;
    try {
      await api.updateUserRole(u.id, newRole);
      toast(`Đã đổi quyền của ${u.name} thành ${ROLE_LABEL[newRole]}`);
      fetchUsers({ page: userPage });
    } catch (err) { toast("Lỗi: " + err.message); }
  };

  const handleUpdateUserStatus = async (u) => {
    // Giá trị phải khớp CHECK của cột users.status ('active','inactive','blocked').
    const newStatus = (u.status || "active") === "active" ? "blocked" : "active";
    try {
      await api.updateUserStatus(u.id, newStatus);
      toast(newStatus === "blocked" ? "Đã khóa tài khoản!" : "Đã mở khóa tài khoản!");
      fetchUsers({ page: userPage });
    } catch (err) { toast("Lỗi: " + err.message); }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (staffForm.password.length < 6) {
      toast("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    setStaffSaving(true);
    try {
      const createdUser = await api.createUser(staffForm);
      toast(`Đã tạo tài khoản ${ROLE_LABEL[createdUser.role]} cho ${createdUser.name}`);
      setShowStaffModal(false);
      setStaffForm({ name: "", email: "", phone: "", password: "", role: "staff" });
      // Về trang 1 để thấy ngay người vừa tạo (danh sách xếp theo ngày tạo giảm dần).
      setStaffSearch("");
      setStaffPage(1);
      fetchStaff({ page: 1, search: "" });
    } catch (err) {
      toast("Lỗi tạo tài khoản: " + err.message);
    } finally {
      setStaffSaving(false);
    }
  };

  // ─────────────── CATEGORY HANDLERS ───────────────────────────────
  const handleOpenAddCat = () => {
    setCatFormData({ name: "", img: "/images/placeholder.jpg" });
    setShowAddCatModal(true);
  };

  const handleOpenEditCat = (c) => {
    setSelectedCategory(c);
    setCatFormData({ name: c.name, img: c.img });
    setShowEditCatModal(true);
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!catFormData.name) { toast("Vui lòng điền tên danh mục"); return; }
    try {
      await api.createCategory(catFormData);
      toast("Thêm danh mục thành công!");
      setShowAddCatModal(false);
      fetchCategories();
    } catch (err) { toast("Lỗi: " + err.message); }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!catFormData.name) { toast("Vui lòng điền tên danh mục"); return; }
    try {
      await api.updateCategory(selectedCategory.id, catFormData);
      toast("Cập nhật danh mục thành công!");
      setShowEditCatModal(false);
      fetchCategories();
    } catch (err) { toast("Lỗi: " + err.message); }
  };

  const handleDeleteCategory = async (id, name) => {
    if (await confirm(`Bạn có chắc chắn muốn xóa danh mục "${name}"?`)) {
      try {
        await api.deleteCategory(id);
        toast("Xóa danh mục thành công!");
        fetchCategories();
      } catch (err) { toast("Lỗi xóa danh mục: " + err.message); }
    }
  };

  // ─────────────── COLLECTION HANDLERS ─────────────────────────────
  const handleOpenAddColl = () => {
    setCollFormData({ name: "", img: "/images/placeholder.jpg" });
    setShowAddCollModal(true);
  };

  const handleOpenEditColl = (c) => {
    setSelectedCollection(c);
    setCollFormData({ name: c.name, img: c.img });
    setShowEditCollModal(true);
  };

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!collFormData.name) { toast("Vui lòng điền tên bộ sưu tập"); return; }
    try {
      await api.createCollection(collFormData);
      toast("Thêm bộ sưu tập thành công!");
      setShowAddCollModal(false);
      fetchCollections();
    } catch (err) { toast("Lỗi: " + err.message); }
  };

  const handleUpdateCollection = async (e) => {
    e.preventDefault();
    if (!collFormData.name) { toast("Vui lòng điền tên bộ sưu tập"); return; }
    try {
      await api.updateCollection(selectedCollection.id, collFormData);
      toast("Cập nhật bộ sưu tập thành công!");
      setShowEditCollModal(false);
      fetchCollections();
    } catch (err) { toast("Lỗi: " + err.message); }
  };

  const handleDeleteCollection = async (id, name) => {
    if (await confirm(`Bạn có chắc chắn muốn xóa bộ sưu tập "${name}"?`)) {
      try {
        await api.deleteCollection(id);
        toast("Xóa bộ sưu tập thành công!");
        fetchCollections();
      } catch (err) { toast("Lỗi xóa bộ sưu tập: " + err.message); }
    }
  };

  // ─────────────── NEWS HANDLERS ───────────────────────────────────
  const handleOpenAddNews = () => {
    setNewsFormData(EMPTY_NEWS_FORM);
    setNewsSeoOpen(false);
    setNewsModal({ mode: "create", id: null });
  };

  // Danh sách không kèm `content` (cho nhẹ) → phải tải chi tiết trước khi sửa.
  const handleOpenEditNews = async (n) => {
    setNewsSeoOpen(false);
    setNewsModal({ mode: "edit", id: n.id, loading: true });
    try {
      const a = await api.getNewsAdminById(n.id);
      setNewsFormData({
        title: a.title, slug: a.slug, img: a.img, excerpt: a.excerpt, content: a.content,
        categoryId: a.category?.id ? String(a.category.id) : "",
        tags: (a.tags || []).join(", "),
        status: a.status,
        featured: a.featured,
        date: a.publishedAt || "",
        seoTitle: a.seo?.title || "",
        seoDescription: a.seo?.description || "",
        seoKeywords: a.seo?.keywords || "",
        ogImage: a.seo?.ogImage || "",
      });
      setNewsModal({ mode: "edit", id: n.id, loading: false });
    } catch (err) {
      toast("Lỗi tải bài viết: " + err.message);
      setNewsModal(null);
    }
  };

  // Chỉ gửi các trường backend hiểu; chuỗi rỗng để backend tự xử lý (→ null).
  const buildNewsPayload = () => ({
    title: newsFormData.title.trim(),
    img: newsFormData.img.trim(),
    excerpt: newsFormData.excerpt.trim(),
    content: newsFormData.content.trim(),
    categoryId: newsFormData.categoryId ? Number(newsFormData.categoryId) : null,
    tags: newsFormData.tags.split(",").map(t => t.trim()).filter(Boolean),
    status: newsFormData.status,
    featured: newsFormData.featured,
    date: newsFormData.date || undefined,
    seoTitle: newsFormData.seoTitle,
    seoDescription: newsFormData.seoDescription,
    seoKeywords: newsFormData.seoKeywords,
    ogImage: newsFormData.ogImage,
    // Slug để trống khi tạo mới = backend tự sinh từ tiêu đề.
    ...(newsFormData.slug.trim() ? { slug: newsFormData.slug.trim() } : {}),
  });

  const handleSubmitNews = async (e) => {
    e.preventDefault();
    if (!newsFormData.title.trim() || !newsFormData.img.trim()
      || !newsFormData.excerpt.trim() || !newsFormData.content.trim()) {
      toast("Vui lòng điền đầy đủ các thông tin bắt buộc");
      return;
    }
    setNewsSaving(true);
    try {
      const payload = buildNewsPayload();
      if (newsModal.mode === "create") {
        await api.createNews(payload);
        toast(payload.status === "published" ? "Đã đăng bài viết!" : "Đã lưu bản nháp!");
      } else {
        await api.updateNews(newsModal.id, payload);
        toast("Cập nhật bài viết thành công!");
      }
      setNewsModal(null);
      fetchNewsList();
      fetchNewsCategories(); // số bài theo danh mục đổi theo
    } catch (err) {
      toast("Lỗi: " + err.message);
    } finally {
      setNewsSaving(false);
    }
  };

  // Đăng / gỡ nhanh ngay trên bảng, không cần mở form
  const handleToggleNewsStatus = async (n) => {
    const next = n.status === "published" ? "hidden" : "published";
    try {
      const res = await api.updateNewsStatus(n.id, next);
      setAllNews(list => list.map(item => (item.id === n.id ? { ...item, status: res.status } : item)));
      toast(next === "published" ? "Đã đăng bài viết!" : "Đã gỡ bài viết khỏi trang tin tức!");
      fetchNewsCategories();
    } catch (err) { toast("Lỗi đổi trạng thái: " + err.message); }
  };

  const handleDeleteNews = async (id, title) => {
    if (await confirm(`Bạn có chắc chắn muốn xóa bài viết "${title}"?`)) {
      try {
        await api.deleteNews(id);
        toast("Xóa bài viết thành công!");
        // Xoá bài cuối của trang cuối → lùi về trang trước cho khỏi trống
        const page = allNews.length === 1 && newsPage > 1 ? newsPage - 1 : newsPage;
        setNewsPage(page);
        fetchNewsList({ page });
        fetchNewsCategories();
      } catch (err) { toast("Lỗi xóa bài viết: " + err.message); }
    }
  };

  // ─────────────── CONSULTATION HANDLERS ────────────────────────────
  // Đổi trạng thái ngay trên bảng: cập nhật tại chỗ để khỏi nạp lại cả danh
  // sách, nhưng vẫn xin lại số đếm vì các chip lọc hiển thị theo trạng thái.
  const handleConsultStatus = async (c, status) => {
    if (c.status === status) return;
    try {
      const res = await api.updateConsultationStatus(c.id, status);
      setConsults(list => list.map(item => (item.id === c.id ? res : item)));
      setSelectedConsult(prev => (prev?.id === c.id ? res : prev));
      toast(`Đã chuyển "${c.name}" sang: ${CONSULT_STATUS_META[status].label}`);
      fetchConsultCounts();
      // Đang lọc theo một trạng thái khác thì bản ghi không còn thuộc bộ lọc nữa.
      if (consultStatus && consultStatus !== status) fetchConsults();
    } catch (err) { toast("Lỗi đổi trạng thái: " + err.message); }
  };

  const handleDeleteConsult = async (c) => {
    if (await confirm(`Xóa yêu cầu tư vấn của "${c.name}" (${c.phone})?`)) {
      try {
        await api.deleteConsultation(c.id);
        toast("Đã xóa yêu cầu tư vấn!");
        setSelectedConsult(prev => (prev?.id === c.id ? null : prev));
        const page = consults.length === 1 && consultPage > 1 ? consultPage - 1 : consultPage;
        setConsultPage(page);
        fetchConsults({ page });
        fetchConsultCounts();
      } catch (err) { toast("Lỗi xóa yêu cầu: " + err.message); }
    }
  };

  // ─────────────── FLASH SALE HANDLERS ──────────────────────────────
  const handleOpenAddFlash = () => {
    if (products.length === 0) {
      toast("Vui lòng thêm sản phẩm trước khi tạo Flash Sale");
      return;
    }
    const defaultProduct = products[0];
    setFlashFormData({
      productId: String(defaultProduct.id),
      price: String(Math.round(defaultProduct.price * 0.8)),
      originalPrice: String(defaultProduct.price),
      discountPct: "20",
      stock: "50",
      sold: "0",
      startsAt: new Date().toISOString().slice(0, 16),
      endsAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16),
      active: true
    });
    setShowAddFlashModal(true);
  };

  const handleOpenEditFlash = (fs) => {
    setSelectedFlash(fs);
    // Neo vào giá niêm yết hiện tại: nếu admin đã sửa giá sản phẩm sau khi tạo
    // chương trình thì form phải hiện mức giảm thật, không phải mức giảm cũ.
    const listPrice = fs.product_price ?? fs.original_price;
    const discount = discountPct(listPrice, fs.price);
    setFlashFormData({
      productId: String(fs.product_id),
      price: String(fs.price),
      originalPrice: String(listPrice),
      discountPct: String(discount),
      stock: String(fs.stock),
      sold: String(fs.sold),
      startsAt: fs.starts_at ? new Date(fs.starts_at).toISOString().slice(0, 16) : "",
      endsAt: fs.ends_at ? new Date(fs.ends_at).toISOString().slice(0, 16) : "",
      active: fs.active
    });
    setShowEditFlashModal(true);
  };

  const handleFlashProductChange = (prodId) => {
    const prod = products.find(p => String(p.id) === String(prodId));
    if (!prod) return;
    const orig = Number(prod.price || 0);
    const pct = Number(flashFormData.discountPct || 20);
    const sale = Math.round(orig * (1 - pct / 100));
    setFlashFormData(prev => ({
      ...prev,
      productId: String(prodId),
      originalPrice: String(orig),
      price: String(sale)
    }));
  };

  const handleFlashPriceChange = (val) => {
    const sale = Number(val || 0);
    const orig = Number(flashFormData.originalPrice || 0);
    let pct = 0;
    if (orig > 0) {
      pct = Math.round((1 - sale / orig) * 100);
    }
    setFlashFormData(prev => ({
      ...prev,
      price: String(val),
      discountPct: String(pct)
    }));
  };

  const handleFlashDiscountChange = (val) => {
    const pct = Number(val || 0);
    const orig = Number(flashFormData.originalPrice || 0);
    const sale = Math.round(orig * (1 - pct / 100));
    setFlashFormData(prev => ({
      ...prev,
      discountPct: String(val),
      price: String(sale)
    }));
  };

  const handleCreateFlash = async (e) => {
    e.preventDefault();
    try {
      await api.createFlashSale({
        productId: Number(flashFormData.productId),
        price: Number(flashFormData.price),
        originalPrice: Number(flashFormData.originalPrice),
        stock: Number(flashFormData.stock || 0),
        sold: Number(flashFormData.sold || 0),
        startsAt: flashFormData.startsAt ? new Date(flashFormData.startsAt).toISOString() : new Date().toISOString(),
        endsAt: flashFormData.endsAt ? new Date(flashFormData.endsAt).toISOString() : null,
        active: flashFormData.active
      });
      toast("Đã thêm chương trình Flash Sale");
      setShowAddFlashModal(false);
      // Bộ lọc mặc định chỉ hiện "Đang chạy"; chương trình hẹn giờ cho tương lai
      // sẽ nằm ngoài đó, nên chuyển về "Tất cả" để admin thấy cái vừa tạo.
      setFlashFilter("all");
      fetchFlashSales();
    } catch (err) {
      toast("Lỗi tạo Flash Sale: " + err.message);
    }
  };

  const handleUpdateFlash = async (e) => {
    e.preventDefault();
    if (!selectedFlash) return;
    try {
      await api.updateFlashSale(selectedFlash.id, {
        productId: Number(flashFormData.productId),
        price: Number(flashFormData.price),
        originalPrice: Number(flashFormData.originalPrice),
        stock: Number(flashFormData.stock || 0),
        sold: Number(flashFormData.sold || 0),
        startsAt: flashFormData.startsAt ? new Date(flashFormData.startsAt).toISOString() : new Date().toISOString(),
        endsAt: flashFormData.endsAt ? new Date(flashFormData.endsAt).toISOString() : null,
        active: flashFormData.active
      });
      toast("Đã cập nhật chương trình Flash Sale");
      setShowEditFlashModal(false);
      fetchFlashSales();
    } catch (err) {
      toast("Lỗi cập nhật Flash Sale: " + err.message);
    }
  };

  // Đóng chương trình bằng cách chốt ends_at = bây giờ, KHÔNG xoá dòng:
  // order_items.flash_sale_id của các đơn cũ vẫn phải trỏ được về chương trình này.
  const handleStopFlash = async (fs) => {
    if (!(await confirm(`Dừng chương trình Flash Sale #${fs.id} cho "${fs.product_name}" ngay bây giờ?`))) return;
    try {
      await api.updateFlashSale(fs.id, { endsAt: new Date().toISOString() });
      toast(`Đã dừng chương trình #${fs.id}`);
      fetchFlashSales();
    } catch (err) {
      toast("Lỗi dừng Flash Sale: " + err.message);
    }
  };

  // ─────────────── HELPERS ─────────────────────────────────────────
  const getStatusLabel = (s) => ({ pending: "Chờ xử lý", confirmed: "Đã xác nhận", shipped: "Đang giao", delivered: "Đã giao hàng", cancelled: "Đã hủy" }[s] || s);

  const STATUS_RANKS = { pending: 1, confirmed: 2, shipped: 3, delivered: 4, cancelled: 99 };
  const ALL_STATUS_OPTIONS = [
    { value: "pending", label: "Chờ xử lý", rank: 1 },
    { value: "confirmed", label: "Xác nhận đơn", rank: 2 },
    { value: "shipped", label: "Đang giao hàng", rank: 3 },
    { value: "delivered", label: "Đã giao (Hoàn thành)", rank: 4 },
    { value: "cancelled", label: "Hủy đơn hàng", rank: 99 }
  ];

  // Lọc theo trạng thái, rồi xếp chương trình đang chạy lên đầu và đã kết thúc
  // xuống cuối; trong cùng nhóm thì mới nhất trước.
  const visibleFlashSales = flashSales
    .filter(fs => flashFilter === "all" || flashStatus(fs).tone === flashFilter)
    .sort((a, b) => {
      const d = FLASH_TONE_ORDER.indexOf(flashStatus(a).tone) - FLASH_TONE_ORDER.indexOf(flashStatus(b).tone);
      return d !== 0 ? d : b.id - a.id;
    });

  // Đã có đơn mua theo chương trình -> khoá các trường định giá.
  const pricingLocked = Number(selectedFlash?.order_item_count ?? 0) > 0;

  const getAvailableNextStatuses = (currentStatus) => {
    const currentRank = STATUS_RANKS[currentStatus] || 1;
    if (currentStatus === "delivered" || currentStatus === "cancelled") {
      return ALL_STATUS_OPTIONS.filter(opt => opt.value === currentStatus);
    }
    return ALL_STATUS_OPTIONS.filter(opt =>
      opt.value === currentStatus ||
      opt.value === "cancelled" ||
      (opt.rank > currentRank && opt.rank !== 99)
    );
  };

  // Derived stats (fallback khi chưa load)
  // ── Dữ liệu trang Tổng quan ─────────────────────────────────────────────
  // Server trả về cả cấu trúc mới (kpi/totals/todo/...) lẫn các trường phẳng cũ,
  // nên phần dưới đọc cấu trúc mới còn các tab khác vẫn dùng trường cũ bình thường.
  const ov = stats ?? {};
  const kpi = ov.kpi ?? {};
  const totals = ov.totals ?? {};
  const revenueByCategory = ov.revenueByCategory ?? [];
  const topCustomers = ov.topCustomers ?? [];
  const recentOrders = ov.recentOrders ?? [];
  const lowStockList = ov.lowStock ?? [];

  // Kỳ dài thì biểu đồ cột sẽ chi chít — chỉ vẽ 30 ngày cuối, số liệu đủ nằm ở Excel.
  const chartDays = (ov.revenueByDay ?? []).slice(-30);

  const todoItems = [
    { tab: "orders", label: "Đơn chờ xử lý", icon: "🧾", color: "#2563eb", count: ov.todo?.pendingOrders ?? 0 },
    { tab: "returns", label: "Trả hàng chờ duyệt", icon: "🔄", color: "#b45309", count: ov.todo?.pendingReturns ?? 0 },
    { tab: "consultations", label: "Tư vấn mới", icon: "📞", color: "#7c3aed", count: ov.todo?.newConsultations ?? 0 },
    { tab: "chat", label: "Tin chưa đọc", icon: "💬", color: "#0891b2", count: ov.todo?.unreadChats ?? 0 },
    { tab: "products", label: "Sắp hết hàng", icon: "⚠️", color: "#dc2626", count: ov.todo?.lowStock ?? 0 },
  ].filter(t => t.count > 0);

  const totalRevenue = stats?.totalRevenue ?? orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  const totalOrders = stats?.totalOrders ?? orders.length;
  const totalProducts = stats?.totalProducts ?? products.length;
  const lowStockCount = stats?.lowStockCount ?? products.filter(p => p.stock < 10).length;
  const totalUsers = stats?.totalUsers ?? 0;
  const avgOrderValue = stats?.avgOrderValue ?? 0;
  const ordersByStatus = Array.isArray(stats?.ordersByStatus) ? stats.ordersByStatus : [];
  const revenueByDay = Array.isArray(stats?.revenueByDay) ? stats.revenueByDay : [];
  const topProducts = stats?.topProducts ?? [];

  const displayCategories = allCategories;

  // Helpers to normalize product <-> category relations
  const getProductCategoryId = (p) => {
    if (p == null) return null;
    if (p.category_id != null) return Number(p.category_id);
    if (p.categoryId != null) return Number(p.categoryId);
    // fallback: if product has category as name, try to find matching category id
    if (typeof p.category === 'string') {
      const found = allCategories.find(c => c.name === p.category);
      return found ? Number(found.id) : null;
    }
    return null;
  };

  const getCategoryNameForProduct = (p) => {
    if (p == null) return "";
    if (p.category && typeof p.category === 'string') return p.category;
    const id = getProductCategoryId(p);
    if (id == null) return "";
    const c = allCategories.find(x => Number(x.id) === Number(id));
    return c ? c.name : "";
  };

  const lowStockProducts = products.filter(p => Number(p.stock) < 10);
  const filteredProducts = products
    .filter(p => {
      const q = productSearch.toLowerCase();
      const matchesSearch = (p.name || "").toLowerCase().includes(q) || (p.type || "").toLowerCase().includes(q);
      const matchesCategory = productCategory === "all" || getProductCategoryId(p) === Number(productCategory);
      const matchesStock =
        productStock === "all" ||
        (productStock === "in" && Number(p.stock) >= 10) ||
        (productStock === "low" && Number(p.stock) > 0 && Number(p.stock) < 10) ||
        (productStock === "out" && Number(p.stock) === 0);
      return matchesSearch && matchesCategory && matchesStock;
    })
    .sort((a, b) => {
      switch (productSort) {
        case "price-asc": return a.price - b.price;
        case "price-desc": return b.price - a.price;
        case "stock-asc": return Number(a.stock) - Number(b.stock);
        case "sold-desc": return (Number(b.sold) || 0) - (Number(a.sold) || 0);
        default: return 0;
      }
    });

  const productFilterActive = productSearch || productCategory !== "all" || productStock !== "all" || productSort !== "default";
  const resetProductFilters = () => { setProductSearch(""); setProductCategory("all"); setProductStock("all"); setProductSort("default"); };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 12 }}>
        <div className="imgph" style={{ width: 40, height: 40, borderRadius: '50%' }}></div>
        <p style={{ color: 'var(--muted)', fontWeight: 500 }}>Đang tải dữ liệu quản trị...</p>
      </div>
    );
  }

  const NAV_ITEMS = [
    { key: "overview", icon: "leaf", label: "Tổng quan" },
    { key: "products", icon: "cart", label: `Sản phẩm (${totalProducts})` },
    { key: "categories", icon: "menu", label: "Danh mục" },
    { key: "collections", icon: "pin", label: "Bộ sưu tập" },
    { key: "news", icon: "bell", label: "Tin tức" },
    { key: "flash_sales", icon: "fire", label: `Flash Sale (${flashSales.length})` },
    { key: "orders", icon: "truck", label: `Đơn hàng (${totalOrders})` },
    { key: "returns", icon: "refresh", label: returnCounts.pending > 0 ? `Trả hàng (${returnCounts.pending})` : "Trả hàng" },
    { key: "users", icon: "user", label: "Người dùng" },
    { key: "staff", icon: "shield", label: staffMeta.total > 0 ? `Nhân viên (${staffMeta.total})` : "Nhân viên" },
    { key: "consultations", icon: "phone", label: consultCounts.new > 0 ? `Tư vấn (${consultCounts.new})` : "Tư vấn" },
    { key: "chat", icon: "chat", label: chatUnread > 0 ? `Chat (${chatUnread})` : "Chat" },
    { key: "settings", icon: "gear", label: "Thông tin công ty" },
  ].filter(item => VALID_TABS.includes(item.key));
  const currentNavLabel = NAV_ITEMS.find(t => t.key === activeTab)?.label || "Quản trị";

  return (
    <div className="admin-layout">
      {/* ── Thanh bar mobile: hamburger + tên tab hiện tại ────────── */}
      <div className="admin-mobile-bar">
        <button className="admin-burger" onClick={() => setMobileNav(v => !v)} aria-label="Menu quản trị" aria-expanded={mobileNav}>
          <Icon name={mobileNav ? "close" : "menu"} size={20} />
        </button>
        <span className="admin-mobile-title">{currentNavLabel}</span>
      </div>

      {/* ── Sidebar (mobile: sổ xuống dưới thanh bar từ hamburger) ── */}
      <aside className={`admin-sidebar ${mobileNav ? "open" : ""}`}>
        <div style={{ padding: "0 16px 16px", borderBottom: "1px solid var(--line)", marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--green-ink)" }}>HỆ THỐNG QUẢN TRỊ</h3>
          <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>{settings.companyName}</span>
        </div>

        {NAV_ITEMS.map(({ key, icon, label }) => (
          <button
            key={key}
            className={`admin-sidebar-btn ${activeTab === key ? "active" : ""}`}
            onClick={() => { setActiveTab(key); setMobileNav(false); }}
          >
            <Icon name={icon} size={16} fill={activeTab === key ? "#fff" : "none"} />
            <span>{label}</span>
          </button>
        ))}

        {/* Nút Thoát trên header bị ẩn ở mobile (.hdr .btn-pill{display:none}),
            và admin không có Drawer như khách — nên cần lối đăng xuất ở đây. */}
        <div className="admin-sidebar-foot">
          <span className="admin-sidebar-user">
            <Icon name="user" size={14} />
            {user?.name || "Quản trị viên"}
          </span>
          <button className="admin-logout-btn" onClick={logout}>
            <Icon name="arrow" size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────── */}
      <main className="admin-content">

        {/* ===== TAB 1: OVERVIEW ===== */}
        {activeTab === "overview" && (
          <div>
            <div className="admin-sec-header">
              <h2>Trang tổng quan cửa hàng</h2>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>
                Kỳ báo cáo: {ov.period ? `${dmy(ov.period.from)} – ${dmy(ov.period.to)} (${ov.period.days} ngày)` : "—"}
              </span>
            </div>

            {/* ── Chọn kỳ báo cáo · áp cho cả trang lẫn tệp Excel ───────── */}
            <div className="admin-card" style={{ padding: 16, marginBottom: 18 }}>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div>
                  <label style={ovLabel}>Từ ngày</label>
                  <input type="date" className="admin-input" style={{ width: 160 }}
                    value={reportFrom} max={reportTo}
                    onChange={e => setReportFrom(e.target.value)} />
                </div>
                <div>
                  <label style={ovLabel}>Đến ngày</label>
                  <input type="date" className="admin-input" style={{ width: 160 }}
                    value={reportTo} min={reportFrom} max={todayStr}
                    onChange={e => setReportTo(e.target.value)} />
                </div>
                <button className="btn-pill" style={{ padding: "9px 18px", fontSize: 13 }}
                  onClick={() => fetchOverview()} disabled={loading}>
                  {loading ? "Đang tải..." : "Áp dụng"}
                </button>
                <button className="btn-pill ghost" style={{ padding: "9px 18px", fontSize: 13 }}
                  disabled={exporting} onClick={handleExportExcel}>
                  {exporting ? "Đang tạo tệp..." : "📊 Xuất báo cáo Excel"}
                </button>

                {/* Mốc thời gian đặt sẵn — bấm một cái là xong, khỏi chọn ngày */}
                <div style={{ display: "flex", gap: 6, marginLeft: "auto", flexWrap: "wrap" }}>
                  {QUICK_RANGES.map(r => (
                    <button key={r.label} onClick={() => applyQuickRange(r.days)}
                      style={{
                        padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                        cursor: "pointer", background: "#fff",
                        border: `1.5px solid ${ov.period?.days === r.days ? "var(--green)" : "var(--line)"}`,
                        color: ov.period?.days === r.days ? "var(--green-ink)" : "var(--muted)",
                      }}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Việc cần xử lý — bấm vào là sang đúng tab ─────────────── */}
            {todoItems.length > 0 && (
              <div className="admin-card" style={{ padding: 14, marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>⚡ Cần xử lý</span>
                  {todoItems.map(t => (
                    <button key={t.tab} onClick={() => setActiveTab(t.tab)}
                      title={`Sang tab ${t.label}`}
                      style={{
                        display: "flex", alignItems: "center", gap: 7, cursor: "pointer",
                        padding: "6px 13px", borderRadius: 999, fontSize: 12.5, fontWeight: 600,
                        border: `1.5px solid ${t.color}33`, background: `${t.color}14`, color: t.color,
                      }}>
                      {t.icon} {t.label}
                      <span style={{
                        minWidth: 20, padding: "1px 6px", borderRadius: 999,
                        background: t.color, color: "#fff", fontSize: 11, fontWeight: 700, textAlign: "center",
                      }}>{t.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Chỉ số chính, kèm mức tăng so với kỳ trước ────────────── */}
            <div className="admin-ov-stats">
              {[
                { icon: "💰", label: "Doanh thu trong kỳ", val: `${vnd(kpi.revenue)}đ`, accent: "#16a34a", g: kpi.growth?.revenue },
                { icon: "🧾", label: "Số đơn trong kỳ", val: kpi.orders ?? 0, accent: "#2563eb", g: kpi.growth?.orders },
                { icon: "📈", label: "Giá trị đơn TB", val: `${vnd(kpi.avgOrderValue)}đ`, accent: "#7c3aed", g: kpi.growth?.avgOrderValue },
                { icon: "🧑", label: "Khách hàng mới", val: kpi.newCustomers ?? 0, accent: "#0891b2", g: kpi.growth?.newCustomers },
                { icon: "📦", label: "Sản phẩm đã bán", val: kpi.itemsSold ?? 0, accent: "#ca8a04" },
                { icon: "⚠️", label: "Sắp hết hàng", val: totals.lowStockCount ?? 0, accent: "#dc2626",
                  valColor: (totals.lowStockCount ?? 0) > 0 ? "#dc2626" : undefined },
              ].map(({ icon, label, val, accent, valColor, g }) => (
                <div key={label} className="admin-stat-card" style={{ "--accent": accent }}>
                  <div className="admin-stat-icon">{icon}</div>
                  <div className="admin-stat-info">
                    <span className="admin-stat-label">{label}</span>
                    <span className="admin-stat-val" style={{ color: valColor }}>{val}</span>
                    {g !== undefined && (
                      <span style={{
                        fontSize: 11.5, fontWeight: 700,
                        color: g > 0 ? "#16a34a" : g < 0 ? "#dc2626" : "var(--muted)",
                      }}>
                        {g > 0 ? "▲" : g < 0 ? "▼" : "—"} {Math.abs(g)}% so với kỳ trước
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Biểu đồ doanh thu ──────────────────────────────────────── */}
            {/* Bỏ alignItems:start để hai thẻ kéo bằng chiều cao nhau (mặc định
                của grid là stretch) — hàng nhìn cân, không thẻ nào hụt xuống. */}
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.55fr) minmax(0,1fr)",
                          gap: 16, marginTop: 16 }} className="admin-ov-charts">
            <div className="admin-card" style={{ padding: 16, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
                <h4 className="admin-card-title" style={{ margin: 0 }}>📊 Doanh thu theo ngày</h4>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>
                  Tổng {vnd(kpi.revenue)}đ · {kpi.orders ?? 0} đơn
                </span>
              </div>
              <div style={{ marginTop: 8, flex: 1, display: "flex", alignItems: "center" }}>
                {revenueByDay.length > 0
                  ? <LineChart data={chartDays} labelKey="date" valueKey="revenue" color="#15803d" />
                  : <p style={{ color: "var(--muted)", textAlign: "center", padding: 30 }}>Chưa có dữ liệu trong kỳ</p>}
              </div>
              {revenueByDay.length > chartDays.length && (
                <p style={{ margin: "10px 0 0", fontSize: 11.5, color: "var(--muted)", textAlign: "center" }}>
                  Kỳ dài {revenueByDay.length} ngày — biểu đồ hiển thị {chartDays.length} ngày gần nhất cho dễ đọc.
                  Số liệu đầy đủ có trong tệp Excel.
                </p>
              )}
            </div>

            {/* ── Doanh thu theo danh mục — biểu đồ tròn ─────────────────── */}
            <div className="admin-card" style={{ padding: 16, display: "flex", flexDirection: "column" }}>
              <h4 className="admin-card-title" style={{ margin: 0 }}>🗂️ Doanh thu theo danh mục</h4>
              {revenueByCategory.length === 0 ? (
                <p style={{ ...ovEmpty, flex: 1, display: "grid", placeItems: "center" }}>Chưa có dữ liệu trong kỳ</p>
              ) : (
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: 10, flex: 1 }}>
                    <DonutChart data={revenueByCategory} colors={CATEGORY_COLORS} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 16 }}>
                    {revenueByCategory.map((c, i) => (
                      <div key={c.category} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
                        <span style={{
                          width: 13, height: 13, borderRadius: 4, flexShrink: 0,
                          background: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                        }} />
                        <span style={{ flex: 1, minWidth: 0, color: "var(--ink-2)", fontWeight: 600,
                                       overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {c.category}
                        </span>
                        <span style={{ color: "var(--muted)", fontSize: 13, minWidth: 44, textAlign: "right" }}>{c.share}%</span>
                        <b style={{ color: "var(--green-ink)", minWidth: 88, textAlign: "right", fontSize: 14 }}>{vnd(c.revenue)}đ</b>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            </div>

            {/* ── Trạng thái đơn hàng ────────────────────────────────────── */}
            <div className="admin-ov-row2" style={{ marginTop: 20 }}>
              {/* Chỉ còn một thẻ trong hàng nên cho nó trải hết bề ngang */}
              <div className="admin-card" style={{ padding: 18, gridColumn: "1 / -1" }}>
                <h4 className="admin-card-title">🎯 Trạng thái đơn hàng</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 12 }}>
                  {ordersByStatus.length === 0 && <p style={ovEmpty}>Chưa có đơn nào trong kỳ</p>}
                  {ordersByStatus.map(item => {
                    const totalCnt = ordersByStatus.reduce((s, x) => s + x.count, 0) || 1;
                    const pct = Math.round((item.count / totalCnt) * 100);
                    return (
                      <div key={item.status}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, color: "var(--ink-2)" }}>{getStatusLabel(item.status)}</span>
                          <span style={{ fontWeight: 700, color: STATUS_COLORS[item.status] }}>{item.count} · {pct}%</span>
                        </div>
                        <div style={{ height: 7, borderRadius: 999, background: "var(--line)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, borderRadius: 999, background: STATUS_COLORS[item.status], transition: "width .6s ease" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* ── Top sản phẩm · Top khách hàng ──────────────────────────── */}
            <div className="admin-ov-row2" style={{ marginTop: 20 }}>
              <div className="admin-card" style={{ padding: 18 }}>
                <h4 className="admin-card-title">🏆 Sản phẩm bán chạy trong kỳ</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
                  {topProducts.length === 0 && <p style={ovEmpty}>Chưa có sản phẩm nào được bán</p>}
                  {topProducts.map((p, i) => (
                    <div key={p.id ?? i} style={{ display: "flex", alignItems: "center", gap: 11 }}>
                      <span style={ovRank(i)}>{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                        <div style={{ fontSize: 11.5, color: "var(--muted)" }}>Đã bán {p.sold}</div>
                      </div>
                      <b style={{ fontSize: 13, color: "var(--green-ink)" }}>{vnd(p.revenue)}đ</b>
                    </div>
                  ))}
                </div>
              </div>

              <div className="admin-card" style={{ padding: 18 }}>
                <h4 className="admin-card-title">👑 Khách hàng chi tiêu nhiều nhất</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
                  {topCustomers.length === 0 && <p style={ovEmpty}>Chưa có khách hàng nào trong kỳ</p>}
                  {topCustomers.map((c, i) => (
                    <div key={`${c.name}-${i}`} style={{ display: "flex", alignItems: "center", gap: 11 }}>
                      <span style={ovRank(i)}>{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{c.name}</div>
                        <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{c.phone || "—"} · {c.orders} đơn</div>
                      </div>
                      <b style={{ fontSize: 13, color: "var(--green-ink)" }}>{vnd(c.spent)}đ</b>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Đơn mới nhất · Hàng sắp hết ────────────────────────────── */}
            <div className="admin-ov-row3" style={{ marginTop: 20 }}>
              <div className="admin-card" style={{ padding: 18 }}>
                <h4 className="admin-card-title">Đơn hàng mới nhất</h4>
                <div className="admin-table-wrap" style={{ marginTop: 10 }}>
                  <table className="admin-table">
                    <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Trạng thái</th><th style={{ textAlign: "right" }}>Tổng tiền</th></tr></thead>
                    <tbody>
                      {recentOrders.map(o => (
                        <tr key={o.id}>
                          <td style={{ fontWeight: 700 }}>#{String(o.id).split("-")[0].toUpperCase()}</td>
                          <td style={{ fontSize: 13 }}>{o.customerName}</td>
                          <td>
                            <span style={{
                              display: "inline-block", padding: "2px 9px", borderRadius: 999, fontSize: 11.5,
                              fontWeight: 700, background: `${STATUS_COLORS[o.status] ?? "#888"}1a`,
                              color: STATUS_COLORS[o.status] ?? "#888",
                            }}>{getStatusLabel(o.status)}</span>
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 700, color: "var(--green-ink)" }}>{vnd(o.total)}đ</td>
                        </tr>
                      ))}
                      {recentOrders.length === 0 && (
                        <tr><td colSpan="4" style={{ textAlign: "center", padding: 26, color: "var(--muted)" }}>Chưa có đơn hàng</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="admin-card" style={{ padding: 18 }}>
                <h4 className="admin-card-title">⚠️ Sản phẩm sắp hết hàng</h4>
                <div className="admin-table-wrap" style={{ marginTop: 10 }}>
                  <table className="admin-table">
                    <thead><tr><th>Sản phẩm</th><th style={{ textAlign: "center" }}>Còn</th><th style={{ textAlign: "center" }}>Đã bán</th></tr></thead>
                    <tbody>
                      {lowStockList.map(p => (
                        <tr key={p.id}>
                          <td style={{ fontSize: 13 }}>{p.name}</td>
                          <td style={{ textAlign: "center", fontWeight: 700, color: "#dc2626" }}>{p.stock}</td>
                          <td style={{ textAlign: "center", color: "var(--muted)" }}>{p.sold}</td>
                        </tr>
                      ))}
                      {lowStockList.length === 0 && (
                        <tr><td colSpan="3" style={{ textAlign: "center", padding: 26, color: "var(--muted)" }}>Tồn kho đang ổn</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB 2: PRODUCTS ===== */}
        {activeTab === "products" && (
          <div>
            <div className="admin-sec-header">
              <h2>Quản lý sản phẩm</h2>
              {canManage && <button className="btn-pill" onClick={handleOpenAdd}><span style={{ fontSize: 16 }}>+</span> Thêm sản phẩm</button>}
            </div>

            <div className="admin-card" style={{ padding: 16, marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <input type="text" placeholder="Tìm kiếm sản phẩm theo tên hoặc loại..." className="admin-input" style={{ flex: 1, minWidth: 200 }} value={productSearch} onChange={e => setProductSearch(e.target.value)} />
                <select className="admin-select" style={{ width: 180 }} value={productCategory} onChange={e => setProductCategory(e.target.value)}>
                  <option value="all">Tất cả danh mục</option>
                  {displayCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select className="admin-select" style={{ width: 160 }} value={productStock} onChange={e => setProductStock(e.target.value)}>
                  <option value="all">Tất cả tồn kho</option>
                  <option value="in">Còn hàng (≥ 10)</option>
                  <option value="low">Sắp hết (1 – 9)</option>
                  <option value="out">Hết hàng (0)</option>
                </select>
                <select className="admin-select" style={{ width: 170 }} value={productSort} onChange={e => setProductSort(e.target.value)}>
                  <option value="default">Sắp xếp mặc định</option>
                  <option value="price-asc">Giá tăng dần</option>
                  <option value="price-desc">Giá giảm dần</option>
                  <option value="stock-asc">Tồn kho ít nhất</option>
                  <option value="sold-desc">Bán chạy nhất</option>
                </select>
                {productFilterActive && (
                  <button className="btn-pill ghost" style={{ padding: "9px 16px", fontSize: 13 }} onClick={resetProductFilters}>✕ Xóa lọc</button>
                )}
              </div>
              <div style={{ marginTop: 10, fontSize: 13, color: "var(--muted)" }}>
                Hiển thị <b style={{ color: "var(--green-ink)" }}>{filteredProducts.length}</b> / {products.length} sản phẩm
              </div>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th style={{ width: 60 }}>Ảnh</th><th>Tên sản phẩm</th><th>Loại</th><th>Danh mục</th><th>Đơn giá</th><th>Tồn kho</th><th>Đã bán</th><th style={{ width: 180 }}>Hành động</th></tr>
                </thead>
                <tbody>
                  {filteredProducts.map(p => (
                    <tr key={p.id}>
                      <td><Img src={p.img} alt={p.name} className="admin-img-thumb" /></td>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td>{p.type}</td>
                      <td style={{ color: "var(--muted)" }}>{getCategoryNameForProduct(p)}</td>
                      <td style={{ fontWeight: 700, color: "var(--green-ink)" }}>{vnd(p.price)} đ</td>
                      <td style={{ fontWeight: 600, color: p.stock < 10 ? "var(--orange-2)" : "inherit" }}>{p.stock}</td>
                      <td>{p.sold}</td>
                      <td>
                        {canManage ? (
                          <div className="admin-actions">
                            <button className="admin-btn-sm edit" onClick={() => handleOpenEdit(p)}>Sửa</button>
                            <button className="admin-btn-sm delete" onClick={() => handleDeleteProduct(p.id, p.name)}>Xóa</button>
                          </div>
                        ) : <span style={{ color: "var(--muted)", fontSize: 12 }}>Chỉ xem</span>}
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && <tr><td colSpan="8" style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>Không tìm thấy sản phẩm nào phù hợp bộ lọc</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== TAB 3: CATEGORIES ===== */}
        {activeTab === "categories" && (
          <div>
            <div className="admin-sec-header">
              <h2>Quản lý danh mục</h2>
              {canManage && (
                <button className="btn-pill" onClick={handleOpenAddCat}>
                  <span style={{ fontSize: 16 }}>+</span> Thêm danh mục
                </button>
              )}
            </div>

            {categoriesLoading ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>Đang tải...</div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: 80 }}>ID</th>
                      <th style={{ width: 100 }}>Ảnh đại diện</th>
                      <th>Tên danh mục</th>
                      <th style={{ width: 200 }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCategories.map(c => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 600 }}>#{c.id}</td>
                        <td>
                          <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", border: "1px solid var(--line)" }}>
                            <Img src={c.img} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{c.name}</td>
                        <td>
                          {canManage ? (
                            <div className="admin-actions">
                              <button className="admin-btn-sm edit" onClick={() => handleOpenEditCat(c)}>Sửa</button>
                              <button className="admin-btn-sm delete" onClick={() => handleDeleteCategory(c.id, c.name)}>Xóa</button>
                            </div>
                          ) : <span style={{ color: "var(--muted)", fontSize: 12 }}>Chỉ xem</span>}
                        </td>
                      </tr>
                    ))}
                    {allCategories.length === 0 && (
                      <tr><td colSpan="4" style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>Không tìm thấy danh mục nào</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===== TAB 4: COLLECTIONS ===== */}
        {activeTab === "collections" && (
          <div>
            <div className="admin-sec-header">
              <h2>Quản lý bộ sưu tập</h2>
              {canManage && (
                <button className="btn-pill" onClick={handleOpenAddColl}>
                  <span style={{ fontSize: 16 }}>+</span> Thêm bộ sưu tập
                </button>
              )}
            </div>

            {collectionsLoading ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>Đang tải...</div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: 80 }}>ID</th>
                      <th style={{ width: 100 }}>Ảnh đại diện</th>
                      <th>Tên bộ sưu tập</th>
                      <th style={{ width: 200 }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCollections.map(c => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 600 }}>#{c.id}</td>
                        <td>
                          <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", border: "1px solid var(--line)" }}>
                            <Img src={c.img} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{c.name}</td>
                        <td>
                          {canManage ? (
                            <div className="admin-actions">
                              <button className="admin-btn-sm edit" onClick={() => handleOpenEditColl(c)}>Sửa</button>
                              <button className="admin-btn-sm delete" onClick={() => handleDeleteCollection(c.id, c.name)}>Xóa</button>
                            </div>
                          ) : <span style={{ color: "var(--muted)", fontSize: 12 }}>Chỉ xem</span>}
                        </td>
                      </tr>
                    ))}
                    {allCollections.length === 0 && (
                      <tr><td colSpan="4" style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>Không tìm thấy bộ sưu tập nào</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===== TAB 5: NEWS ===== */}
        {activeTab === "news" && (
          <div>
            <div className="admin-sec-header">
              <h2>Tin tức & bài viết</h2>
              <div className="admin-sec-actions">
                {/* Lượt xem tăng khi khách đọc bài, nhưng bảng chỉ nạp lại lúc
                    mở tab. Nút này để xem số mới mà không phải F5 cả trang. */}
                <button
                  className="btn-pill ghost"
                  onClick={() => fetchNewsList()}
                  disabled={newsLoading}
                  title="Tải lại lượt xem và trạng thái mới nhất"
                >
                  <Icon name="refresh" size={15} />
                  {newsLoading ? "Đang tải…" : "Làm mới"}
                </button>
                {canManage && (
                  <button className="btn-pill" onClick={handleOpenAddNews}>
                    <span style={{ fontSize: 16 }}>+</span> Viết bài mới
                  </button>
                )}
              </div>
            </div>

            {/* Lọc nhanh theo trạng thái */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              {[
                { value: "", label: "Tất cả" },
                { value: "published", label: "Đã đăng" },
                { value: "draft", label: "Bản nháp" },
                { value: "hidden", label: "Đã ẩn" },
              ].map(t => (
                <button
                  key={t.value || "all"}
                  onClick={() => { setNewsStatus(t.value); setNewsPage(1); fetchNewsList({ status: t.value, page: 1 }); }}
                  style={{
                    padding: "7px 16px", borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: "pointer",
                    border: `1.5px solid ${newsStatus === t.value ? "var(--green)" : "var(--line)"}`,
                    background: newsStatus === t.value ? "var(--green)" : "#fff",
                    color: newsStatus === t.value ? "#fff" : "var(--ink-2)",
                    transition: ".18s",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tìm kiếm + lọc danh mục */}
            <div className="admin-card" style={{ padding: 16, marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Tìm theo tiêu đề hoặc mô tả ngắn (không cần gõ dấu)..."
                  className="admin-input"
                  style={{ flex: 1, minWidth: 220 }}
                  value={newsSearch}
                  onChange={e => setNewsSearch(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") { setNewsPage(1); fetchNewsList({ page: 1, search: e.target.value }); }
                  }}
                />
                <select
                  className="admin-select"
                  style={{ width: 200 }}
                  value={newsCategory}
                  onChange={e => {
                    const v = e.target.value;
                    setNewsCategory(v); setNewsPage(1);
                    fetchNewsList({ page: 1, category: v });
                  }}
                >
                  <option value="">Tất cả danh mục</option>
                  {newsCategories.map(c => (
                    <option key={c.id} value={c.slug}>{c.name} ({c.articleCount})</option>
                  ))}
                </select>
                <button
                  className="btn-pill"
                  style={{ padding: "9px 18px", fontSize: 13 }}
                  onClick={() => { setNewsPage(1); fetchNewsList({ page: 1 }); }}
                >
                  🔍 Tìm kiếm
                </button>
              </div>
            </div>

            {newsLoading ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>Đang tải...</div>
            ) : (
              <>
                <div className="admin-table-wrap">
                  <table className="admin-table admin-news-table">
                    <thead>
                      <tr>
                        <th style={{ width: 90 }}>Ảnh bìa</th>
                        <th>Bài viết</th>
                        <th style={{ width: 150 }}>Danh mục</th>
                        <th style={{ width: 110 }}>Trạng thái</th>
                        <th style={{ width: 90 }}>Lượt xem</th>
                        <th style={{ width: 110 }}>Ngày đăng</th>
                        <th style={{ width: 210 }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allNews.map(n => {
                        const meta = NEWS_STATUS_META[n.status] || NEWS_STATUS_META.draft;
                        return (
                          <tr key={n.id}>
                            <td>
                              <div style={{ width: 62, height: 44, borderRadius: 6, overflow: "hidden", border: "1px solid var(--line)" }}>
                                <Img src={n.img} alt={n.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              </div>
                            </td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: 13.5, lineHeight: 1.4 }}>
                                {n.featured && <span title="Bài nổi bật">⭐</span>}
                                {n.title}
                              </div>
                              <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>
                                /{n.slug} · {n.readingTime} phút đọc
                              </div>
                              {/* Mobile ẩn 3 cột danh mục/lượt xem/ngày để cột
                                  tiêu đề rộng ra — gộp lại đây cho khỏi mất. */}
                              <div className="admin-news-meta">
                                {n.category?.name || "Chưa phân loại"} · {n.date} · {n.views?.toLocaleString("vi-VN")} lượt xem
                              </div>
                            </td>
                            <td>
                              {n.category ? (
                                <span style={{
                                  display: "inline-block", padding: "3px 10px", borderRadius: 999,
                                  fontSize: 11.5, fontWeight: 700,
                                  background: "var(--mint)", color: "var(--green-ink)",
                                }}>
                                  {n.category.name}
                                </span>
                              ) : (
                                <span style={{ fontSize: 12, color: "var(--muted)" }}>—</span>
                              )}
                            </td>
                            <td>
                              <span style={{
                                display: "inline-block", padding: "3px 10px", borderRadius: 999,
                                fontSize: 12, fontWeight: 700, background: meta.bg, color: meta.color,
                              }}>
                                {meta.label}
                              </span>
                            </td>
                            <td style={{ fontSize: 13, color: "var(--muted)" }}>{n.views?.toLocaleString("vi-VN")}</td>
                            <td style={{ color: "var(--muted)", fontSize: 12.5 }}>{n.date}</td>
                            <td>
                              {canManage ? (
                                <div className="admin-actions">
                                  <button className="admin-btn-sm edit" onClick={() => handleOpenEditNews(n)}>Sửa</button>
                                  <button
                                    className="admin-btn-sm"
                                    style={{
                                      fontSize: 11,
                                      background: n.status === "published" ? "#e5e7eb" : "#dcfce7",
                                      color: n.status === "published" ? "#4b5563" : "var(--green-ink)",
                                      border: "none", borderRadius: 7, padding: "5px 10px", fontWeight: 600, cursor: "pointer",
                                    }}
                                    title={n.status === "published" ? "Gỡ khỏi trang tin tức" : "Đăng lên trang tin tức"}
                                    onClick={() => handleToggleNewsStatus(n)}
                                  >
                                    {n.status === "published" ? "Gỡ bài" : "Đăng bài"}
                                  </button>
                                  <button className="admin-btn-sm delete" onClick={() => handleDeleteNews(n.id, n.title)}>Xóa</button>
                                </div>
                              ) : <span style={{ color: "var(--muted)", fontSize: 12 }}>Chỉ xem</span>}
                            </td>
                          </tr>
                        );
                      })}
                      {allNews.length === 0 && (
                        <tr><td colSpan="7" style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>Không tìm thấy bài viết nào</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Phân trang */}
                {newsMeta.totalPages > 1 && (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 20 }}>
                    <button className="page-btn" disabled={newsPage <= 1}
                      onClick={() => { const p = newsPage - 1; setNewsPage(p); fetchNewsList({ page: p }); }}>‹</button>
                    {Array.from({ length: newsMeta.totalPages }, (_, i) => i + 1).map(p => (
                      <button key={p} className={`page-btn ${p === newsPage ? "active" : ""}`}
                        onClick={() => { setNewsPage(p); fetchNewsList({ page: p }); }}>{p}</button>
                    ))}
                    <button className="page-btn" disabled={newsPage >= newsMeta.totalPages}
                      onClick={() => { const p = newsPage + 1; setNewsPage(p); fetchNewsList({ page: p }); }}>›</button>
                    <span style={{ fontSize: 13, color: "var(--muted)", marginLeft: 8 }}>
                      Trang {newsPage} / {newsMeta.totalPages} ({newsMeta.total} bài viết)
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ===== TAB 6: ORDERS ===== */}
        {activeTab === "orders" && (
          <div>
            <div className="admin-sec-header"><h2>Quản lý đơn hàng</h2></div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Mã đơn hàng</th><th>Ngày mua</th><th>Địa chỉ giao hàng</th><th>Tổng thanh toán</th><th>Trạng thái</th><th style={{ width: 220, textAlign: "center" }}>Thao tác</th></tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 600, color: "var(--green-ink)", fontSize: 13 }}>#{o.id.split('-')[0].toUpperCase()}</td>
                      <td style={{ color: "var(--muted)" }}>{new Date(o.createdAt).toLocaleDateString("vi-VN", { hour: '2-digit', minute: '2-digit' })}</td>
                      <td style={{ fontSize: 13, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.shippingAddress}</td>
                      <td style={{ fontWeight: 700 }}>{vnd(o.total)} đ</td>
                      <td><span className={`admin-badge ${o.status}`}>{getStatusLabel(o.status)}</span></td>
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                          <button
                            className="admin-btn-sm edit"
                            style={{ background: "var(--green)", color: "#fff", padding: "5px 12px", fontSize: 12.5 }}
                            onClick={() => handleOpenStatusEdit(o)}
                          >
                            ✏️ Xử lý ĐH
                          </button>
                          <button
                            className="admin-btn-sm edit"
                            style={{ background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink-2)", padding: "5px 12px", fontSize: 12.5 }}
                            onClick={() => { setSelectedOrder(o); setShowOrderModal(true); }}
                          >
                            👁️ Chi tiết
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan="6" style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>Chưa có đơn hàng nào</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== TAB: TRẢ / ĐỔI HÀNG ===== */}
        {activeTab === "returns" && (
          <div>
            <div className="admin-sec-header">
              <h2>Yêu cầu trả / đổi hàng</h2>
              <span style={{ fontSize: 13, color: "var(--muted)", background: "var(--mint)", padding: "4px 12px", borderRadius: 999, fontWeight: 600 }}>
                {returnCounts.total} yêu cầu
              </span>
            </div>

            {/* Chip lọc theo trạng thái, kèm số đếm để biết ngay còn gì phải xử lý. */}
            <div className="admin-card" style={{ padding: 16, marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[{ value: "", label: "Tất cả", count: returnCounts.total },
                  ...Object.keys(RETURN_STATUS_META).map(s => ({ value: s, label: RETURN_STATUS_META[s].label, count: returnCounts[s] }))
                ].map(f => (
                  <button
                    key={f.value || "all"}
                    onClick={() => { setReturnFilter(f.value); setReturnPage(1); fetchReturns({ page: 1, status: f.value }); }}
                    style={{
                      padding: "7px 15px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, cursor: "pointer",
                      border: `1.5px solid ${returnFilter === f.value ? "var(--green)" : "var(--line)"}`,
                      background: returnFilter === f.value ? "var(--green)" : "#fff",
                      color: returnFilter === f.value ? "#fff" : "var(--ink-2)",
                    }}
                  >
                    {f.label}{f.count > 0 ? ` (${f.count})` : ""}
                  </button>
                ))}
              </div>
            </div>

            {returnsLoading ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>Đang tải...</div>
            ) : (
              <>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Khách hàng</th>
                        <th style={{ width: 110 }}>Loại</th>
                        <th>Lý do</th>
                        <th style={{ width: 130 }}>Ngày gửi</th>
                        <th style={{ width: 120 }}>Trạng thái</th>
                        <th style={{ width: 100 }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {returns.map(r => {
                        const meta = RETURN_STATUS_META[r.status] ?? RETURN_STATUS_META.pending;
                        return (
                          <tr key={r.id}>
                            <td>
                              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{r.customerName || "Khách mua lẻ"}</div>
                              <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>
                                Đơn #{String(r.orderId).split("-")[0].toUpperCase()} · {vnd(r.orderTotal)}đ
                              </div>
                            </td>
                            <td>
                              <span style={{
                                display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700,
                                background: r.type === "return" ? "#fee2e2" : "#ede9fe",
                                color: r.type === "return" ? "#b91c1c" : "#5b21b6",
                              }}>
                                {RETURN_TYPE_LABEL[r.type]}
                              </span>
                            </td>
                            <td style={{ fontSize: 13, color: "var(--ink-2)", maxWidth: 320 }}>
                              <div style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {r.reason}
                              </div>
                              {r.imageUrls?.length > 0 && (
                                <span style={{ fontSize: 11.5, color: "var(--muted)" }}>📎 {r.imageUrls.length} ảnh</span>
                              )}
                            </td>
                            <td style={{ color: "var(--muted)", fontSize: 12.5 }}>
                              {new Date(r.createdAt).toLocaleDateString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                            </td>
                            <td>
                              <span style={{
                                display: "inline-block", padding: "3px 10px", borderRadius: 999,
                                fontSize: 12, fontWeight: 700, background: meta.bg, color: meta.color,
                              }}>
                                {meta.label}
                              </span>
                            </td>
                            <td>
                              <button
                                className="admin-btn-sm edit"
                                onClick={() => { setSelectedReturn(r); setReturnNote(""); }}
                              >
                                Xem
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {returns.length === 0 && (
                        <tr><td colSpan="6" style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
                          Không có yêu cầu nào trong nhóm này
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {returnsMeta.totalPages > 1 && (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 20 }}>
                    <button className="page-btn" disabled={returnPage <= 1}
                      onClick={() => { const p = returnPage - 1; setReturnPage(p); fetchReturns({ page: p }); }}>‹</button>
                    {Array.from({ length: returnsMeta.totalPages }, (_, i) => i + 1).map(p => (
                      <button key={p} className={`page-btn ${p === returnPage ? "active" : ""}`}
                        onClick={() => { setReturnPage(p); fetchReturns({ page: p }); }}>{p}</button>
                    ))}
                    <button className="page-btn" disabled={returnPage >= returnsMeta.totalPages}
                      onClick={() => { const p = returnPage + 1; setReturnPage(p); fetchReturns({ page: p }); }}>›</button>
                    <span style={{ fontSize: 13, color: "var(--muted)", marginLeft: 8 }}>
                      Trang {returnPage} / {returnsMeta.totalPages} ({returnsMeta.total} yêu cầu)
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ===== TAB 7: USERS ===== */}
        {activeTab === "users" && (
          <div>
            <div className="admin-sec-header">
              <h2>Quản lý người dùng</h2>
              <span style={{ fontSize: 13, color: "var(--muted)", background: "var(--mint)", padding: "4px 12px", borderRadius: 999, fontWeight: 600 }}>
                {usersMeta.total} khách hàng
              </span>
            </div>

            {/* Filter bar */}
            <div className="admin-card" style={{ padding: 16, marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên hoặc email..."
                  className="admin-input"
                  style={{ flex: 1, minWidth: 200 }}
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      setUserPage(1);
                      fetchUsers({ page: 1, search: e.target.value });
                    }
                  }}
                />
                <select
                  className="admin-select"
                  style={{ width: 160 }}
                  value={userStatus}
                  onChange={e => {
                    const v = e.target.value;
                    setUserStatus(v);
                    setUserPage(1);
                    fetchUsers({ page: 1, status: v });
                  }}
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="blocked">Đã khóa</option>
                </select>
                <button
                  className="btn-pill"
                  style={{ padding: "9px 18px", fontSize: 13 }}
                  onClick={() => { setUserPage(1); fetchUsers({ page: 1 }); }}
                >
                  🔍 Tìm kiếm
                </button>
              </div>
            </div>

            {usersLoading ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>Đang tải...</div>
            ) : (
              <>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Tên</th>
                        <th>Email</th>
                        <th style={{ textAlign: "center" }}>Số đơn</th>
                        <th>Trạng thái</th>
                        <th>Ngày đăng ký</th>
                        <th style={{ width: 140 }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id}>
                          <td style={{ fontWeight: 600 }}>{u.name}</td>
                          <td style={{ color: "var(--muted)", fontSize: 13 }}>{u.email}</td>
                          <td style={{ textAlign: "center", fontWeight: 600 }}>{u.orderCount ?? 0}</td>
                          <td>
                            <span style={{
                              display: "inline-block", padding: "3px 10px", borderRadius: 999,
                              fontSize: 12, fontWeight: 700,
                              background: (u.status || "active") === "active" ? "#dcfce7" : "#fee2e2",
                              color: (u.status || "active") === "active" ? "var(--green-ink)" : "#ef4444",
                            }}>
                              {(u.status || "active") === "active" ? "✅ Hoạt động" : "🔒 Đã khóa"}
                            </span>
                          </td>
                          <td style={{ color: "var(--muted)", fontSize: 12 }}>
                            {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                          </td>
                          <td>
                            {/* Không có đổi vai trò ở đây: nâng khách hàng lên nhân
                                viên là việc của tab Nhân viên. Nhân viên xem tab này
                                cũng không khóa được ai — server chặn bằng readOnly('staff'). */}
                            {!canManage ? (
                              <span style={{ color: "var(--muted)", fontSize: 12 }}>Chỉ xem</span>
                            ) : (
                              <button
                                className="admin-btn-sm"
                                style={{
                                  fontSize: 11,
                                  background: (u.status || "active") === "active" ? "#fee2e2" : "#dcfce7",
                                  color: (u.status || "active") === "active" ? "#ef4444" : "var(--green-ink)",
                                  border: "none", borderRadius: 7, padding: "5px 10px", fontWeight: 600, cursor: "pointer",
                                }}
                                title={(u.status || "active") === "active" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                                onClick={() => handleUpdateUserStatus(u)}
                              >
                                {(u.status || "active") === "active" ? "🔒 Khóa" : "🔓 Mở"}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr><td colSpan="6" style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>Không tìm thấy khách hàng nào</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Phân trang */}
                {usersMeta.totalPages > 1 && (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 20 }}>
                    <button className="page-btn" disabled={userPage <= 1}
                      onClick={() => { const p = userPage - 1; setUserPage(p); fetchUsers({ page: p }); }}>‹</button>
                    {Array.from({ length: usersMeta.totalPages }, (_, i) => i + 1).map(p => (
                      <button key={p} className={`page-btn ${p === userPage ? "active" : ""}`}
                        onClick={() => { setUserPage(p); fetchUsers({ page: p }); }}>{p}</button>
                    ))}
                    <button className="page-btn" disabled={userPage >= usersMeta.totalPages}
                      onClick={() => { const p = userPage + 1; setUserPage(p); fetchUsers({ page: p }); }}>›</button>
                    <span style={{ fontSize: 13, color: "var(--muted)", marginLeft: 8 }}>
                      Trang {userPage} / {usersMeta.totalPages} ({usersMeta.total} khách hàng)
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ===== TAB: QUẢN LÝ NHÂN VIÊN (chỉ admin) ===== */}
        {activeTab === "staff" && canManage && (
          <div>
            <div className="admin-sec-header">
              <h2>Quản lý nhân viên</h2>
              <button className="btn-pill" onClick={() => setShowStaffModal(true)}>
                <span style={{ fontSize: 16 }}>+</span> Thêm nhân viên
              </button>
            </div>

            <div className="admin-card" style={{ padding: 16, marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <input
                  type="text"
                  className="admin-input"
                  style={{ flex: 1, minWidth: 220 }}
                  placeholder="Tìm theo tên hoặc email nhân viên..."
                  value={staffSearch}
                  onChange={e => setStaffSearch(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { setStaffPage(1); fetchStaff({ page: 1 }); } }}
                />
                <button
                  className="btn-pill"
                  style={{ padding: "9px 18px", fontSize: 13 }}
                  onClick={() => { setStaffPage(1); fetchStaff({ page: 1 }); }}
                >
                  🔍 Tìm kiếm
                </button>
              </div>
            </div>

            {staffLoading ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>Đang tải...</div>
            ) : (
              <>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Họ và tên</th>
                        <th>Email đăng nhập</th>
                        <th>Vai trò</th>
                        <th>Trạng thái</th>
                        <th>Ngày tạo</th>
                        <th style={{ width: 230 }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffList.map(s => (
                        <tr key={s.id}>
                          <td style={{ fontWeight: 600 }}>{s.name}</td>
                          <td style={{ color: "var(--muted)", fontSize: 13 }}>{s.email}</td>
                          <td>
                            <span style={{
                              display: "inline-block", padding: "3px 10px", borderRadius: 999,
                              fontSize: 12, fontWeight: 700,
                              background: ROLE_BADGE[s.role]?.bg, color: ROLE_BADGE[s.role]?.fg,
                            }}>
                              {ROLE_BADGE[s.role]?.text ?? ROLE_LABEL[s.role]}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              display: "inline-block", padding: "3px 10px", borderRadius: 999,
                              fontSize: 12, fontWeight: 700,
                              background: (s.status || "active") === "active" ? "#dcfce7" : "#fee2e2",
                              color: (s.status || "active") === "active" ? "var(--green-ink)" : "#ef4444",
                            }}>
                              {(s.status || "active") === "active" ? "✅ Hoạt động" : "🔒 Đã khóa"}
                            </span>
                          </td>
                          <td style={{ color: "var(--muted)", fontSize: 12 }}>
                            {new Date(s.createdAt).toLocaleDateString("vi-VN")}
                          </td>
                          <td>
                            {/* Không cho tự hạ quyền hay tự khóa mình — server cũng
                                trả 400 cho hai thao tác này. */}
                            {s.id === user?.id ? (
                              <span style={{ color: "var(--muted)", fontSize: 12 }}>Tài khoản của bạn</span>
                            ) : (
                              <div className="admin-actions">
                                <select
                                  className="admin-select"
                                  style={{ width: 130, fontSize: 12, padding: "5px 8px" }}
                                  value={s.role}
                                  title="Đổi vai trò trong nội bộ. Nhân viên nghỉ việc thì Khóa tài khoản, không hạ xuống khách hàng."
                                  onChange={async e => { await handleUpdateUserRole(s, e.target.value); fetchStaff(); }}
                                >
                                  <option value="staff">Nhân viên</option>
                                  <option value="admin">Quản trị viên</option>
                                </select>
                                <button
                                  className="admin-btn-sm"
                                  style={{
                                    fontSize: 11,
                                    background: (s.status || "active") === "active" ? "#fee2e2" : "#dcfce7",
                                    color: (s.status || "active") === "active" ? "#ef4444" : "var(--green-ink)",
                                    border: "none", borderRadius: 7, padding: "5px 10px", fontWeight: 600, cursor: "pointer",
                                  }}
                                  title={(s.status || "active") === "active" ? "Khóa tài khoản — nhân viên nghỉ việc dùng nút này; chặn đăng nhập ngay lập tức" : "Mở khóa tài khoản"}
                                  onClick={async () => { await handleUpdateUserStatus(s); fetchStaff(); }}
                                >
                                  {(s.status || "active") === "active" ? "🔒 Khóa" : "🔓 Mở"}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {staffList.length === 0 && (
                        <tr><td colSpan="6" style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
                          Chưa có tài khoản nhân viên nào. Bấm “Thêm nhân viên” để tạo.
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {staffMeta.totalPages > 1 && (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 20 }}>
                    <button className="page-btn" disabled={staffPage <= 1}
                      onClick={() => { const p = staffPage - 1; setStaffPage(p); fetchStaff({ page: p }); }}>‹</button>
                    {Array.from({ length: staffMeta.totalPages }, (_, i) => i + 1).map(p => (
                      <button key={p} className={`page-btn ${p === staffPage ? "active" : ""}`}
                        onClick={() => { setStaffPage(p); fetchStaff({ page: p }); }}>{p}</button>
                    ))}
                    <button className="page-btn" disabled={staffPage >= staffMeta.totalPages}
                      onClick={() => { const p = staffPage + 1; setStaffPage(p); fetchStaff({ page: p }); }}>›</button>
                    <span style={{ fontSize: 13, color: "var(--muted)", marginLeft: 8 }}>
                      Trang {staffPage} / {staffMeta.totalPages} ({staffMeta.total} nhân sự)
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ===== TAB 8: FLASH SALES ===== */}
        {activeTab === "flash_sales" && (
          <div>
            <div className="admin-sec-header">
              <h2>Quản lý Flash Sale</h2>
              {canManage && <button className="btn-pill" onClick={handleOpenAddFlash}>🔥 Thêm Flash Sale</button>}
            </div>

            <div className="admin-card" style={{ padding: 16, marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                {FLASH_FILTERS.map(f => {
                  const count = f.tone === "all"
                    ? flashSales.length
                    : flashSales.filter(fs => flashStatus(fs).tone === f.tone).length;
                  const on = flashFilter === f.tone;
                  return (
                    <button
                      key={f.tone}
                      className="admin-btn-sm"
                      onClick={() => setFlashFilter(f.tone)}
                      style={{
                        fontWeight: 700,
                        border: on ? "1px solid var(--green)" : "1px solid var(--line)",
                        background: on ? "var(--mint)" : "#fff",
                        color: on ? "var(--green-ink)" : "var(--muted)",
                      }}
                    >
                      {f.label} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {flashSalesLoading ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>Đang tải...</div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table compact">
                  <thead>
                    <tr>
                      <th>Mã</th>
                      <th>Ảnh</th>
                      <th className="col-grow">Sản phẩm</th>
                      <th>Giá gốc</th>
                      <th>Giá sale</th>
                      <th>Giảm</th>
                      <th>Kho</th>
                      <th>Đã bán</th>
                      <th>Thời gian</th>
                      <th>Trạng thái</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleFlashSales.map(fs => {
                      // Tính trên giá niêm yết hiện tại, cùng cơ sở với trang public.
                      const listPrice = fs.product_price ?? fs.original_price;
                      const discount = discountPct(listPrice, fs.price);
                      const remaining = Math.max(0, Number(fs.stock) - Number(fs.sold));
                      const status = flashStatus(fs);
                      // Dạng ngắn "10/08/26 22:05" thay cho "22:05 10/8/2026" —
                      // cột thời gian là cột rộng nhất bảng nếu để mặc định.
                      const fmt = (v) => new Date(v).toLocaleString("vi-VN", {
                        day: "2-digit", month: "2-digit", year: "2-digit",
                        hour: "2-digit", minute: "2-digit",
                      }).replace(",", "");
                      const startStr = fs.starts_at ? fmt(fs.starts_at) : "—";
                      const endStr = fs.ends_at ? fmt(fs.ends_at) : "Không giới hạn";
                      return (
                        <tr key={fs.id}>
                          <td style={{ fontWeight: 700, fontSize: 12, color: "var(--green-ink)" }}>#{fs.id}</td>
                          <td>
                            <img src={fs.product_img || "/images/placeholder.jpg"} alt={fs.product_name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--line)' }} />
                          </td>
                          <td className="col-grow" style={{ fontWeight: 600 }}>{fs.product_name}</td>
                          <td style={{ color: "var(--muted)", textDecoration: "line-through" }}>{vnd(listPrice)} đ</td>
                          <td style={{ color: "var(--red)", fontWeight: 700 }}>{vnd(fs.price)} đ</td>
                          <td>
                            <span style={{ background: "#fee2e2", color: "#ef4444", padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                              -{discount}%
                            </span>
                          </td>
                          <td>{fs.stock}</td>
                          <td>
                            {fs.sold}
                            <span style={{ color: remaining === 0 ? "#c2410c" : "var(--muted)", fontSize: 11, fontWeight: 600, marginLeft: 6 }}>
                              (còn {remaining})
                            </span>
                          </td>
                          <td>
                            <div className="flash-period">
                              {/* "Bắt đầu" ngắn hơn "Kết thúc" 1 ký tự — chèn
                                  1 khoảng trắng cứng trước dấu ":" để hai dấu
                                  ":" thẳng hàng mà lề trái vẫn phẳng. */}
                              <div><span className="flash-period-label">Bắt đầu&nbsp;:</span> {startStr}</div>
                              <div><span className="flash-period-label">Kết thúc:</span> {endStr}</div>
                            </div>
                          </td>
                          <td>
                            <span style={{
                              display: "inline-block", padding: "3px 10px", borderRadius: 999,
                              fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
                              ...FLASH_STATUS_STYLE[status.tone],
                            }}>
                              {status.label}
                            </span>
                          </td>
                          <td>
                            {/* Không có nút xoá: xoá chương trình sẽ set NULL
                                order_items.flash_sale_id, làm các đơn đã mua theo
                                chương trình này mất dấu vết. Dừng, không xoá.

                                Chương trình đã kết thúc thì cũng không cho sửa:
                                sửa giá của nó làm sai lệch các đơn đã bán theo
                                chương trình, còn dời ends_at là hồi sinh nó. Muốn
                                chạy lại thì tạo chương trình mới. */}
                            {status.tone !== "expired" && canManage && (
                              <div className="admin-actions">
                                <button className="admin-btn-sm edit" onClick={() => handleOpenEditFlash(fs)}>Sửa</button>
                                {status.running && (
                                  <button className="admin-btn-sm" style={{ background: "#ffedd5", color: "#c2410c" }} onClick={() => handleStopFlash(fs)}>
                                    Dừng ngay
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {visibleFlashSales.length === 0 && (
                      <tr><td colSpan="11" style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
                        {flashSales.length === 0
                          ? "Chưa cấu hình chương trình Flash Sale nào"
                          : "Không có chương trình nào ở trạng thái này"}
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===== TAB 9: YÊU CẦU TƯ VẤN ===== */}
        {activeTab === "consultations" && (
          <div>
            <div className="admin-sec-header">
              <h2>Yêu cầu tư vấn</h2>
              <div className="admin-sec-actions">
                <button
                  className="btn-pill ghost"
                  onClick={() => { fetchConsults(); fetchConsultCounts(); }}
                  disabled={consultsLoading}
                  title="Kiểm tra yêu cầu khách vừa gửi"
                >
                  <Icon name="refresh" size={15} />
                  {consultsLoading ? "Đang tải…" : "Làm mới"}
                </button>
              </div>
            </div>

            <p style={{ margin: "-6px 0 16px", fontSize: 13.5, color: "var(--muted)" }}>
              Khách để lại thông tin ở form “Đăng ký tư vấn” cuối trang chủ. Gọi cho khách,
              rồi cập nhật trạng thái để cả nhóm biết yêu cầu nào đã được xử lý.
            </p>

            {/* Lọc nhanh theo trạng thái, kèm số lượng */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              {[{ value: "", label: "Tất cả", count: consultCounts.total },
              ...CONSULT_STATUSES.map(s => ({ value: s, label: CONSULT_STATUS_META[s].label, count: consultCounts[s] }))
              ].map(t => (
                <button
                  key={t.value || "all"}
                  onClick={() => { setConsultStatus(t.value); setConsultPage(1); fetchConsults({ status: t.value, page: 1 }); }}
                  style={{
                    padding: "7px 16px", borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: "pointer",
                    border: `1.5px solid ${consultStatus === t.value ? "var(--green)" : "var(--line)"}`,
                    background: consultStatus === t.value ? "var(--green)" : "#fff",
                    color: consultStatus === t.value ? "#fff" : "var(--ink-2)",
                    transition: ".18s",
                  }}
                >
                  {t.label}{t.count ? ` (${t.count})` : ""}
                </button>
              ))}
            </div>

            {/* Tìm kiếm */}
            <div className="admin-card" style={{ padding: 16, marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Tìm theo tên (không cần gõ dấu), số điện thoại hoặc email..."
                  className="admin-input"
                  style={{ flex: 1, minWidth: 220 }}
                  value={consultSearch}
                  onChange={e => setConsultSearch(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") { setConsultPage(1); fetchConsults({ page: 1, search: e.target.value }); }
                  }}
                />
                <button
                  className="btn-pill"
                  style={{ padding: "9px 18px", fontSize: 13 }}
                  onClick={() => { setConsultPage(1); fetchConsults({ page: 1 }); }}
                >
                  🔍 Tìm kiếm
                </button>
              </div>
            </div>

            {consultsLoading ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>Đang tải...</div>
            ) : (
              <>
                <div className="admin-table-wrap">
                  <table className="admin-table admin-consult-table">
                    <thead>
                      <tr>
                        <th>Khách hàng</th>
                        <th style={{ width: 230 }}>Nhu cầu</th>
                        <th style={{ width: 150 }}>Thời gian gửi</th>
                        <th style={{ width: 130 }}>Trạng thái</th>
                        <th style={{ width: 110 }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {consults.map(c => {
                        const meta = CONSULT_STATUS_META[c.status] || CONSULT_STATUS_META.new;
                        return (
                          <tr key={c.id}>
                            <td>
                              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{c.name}</div>
                              {/* Gọi được ngay từ bảng — thao tác chính của nhân viên tư vấn. */}
                              <a href={telHref(c.phone)} className="admin-consult-phone">
                                <Icon name="phone" size={12} />{c.phone}
                              </a>
                              {c.email && (
                                <a href={`mailto:${c.email}`} className="admin-consult-mail">{c.email}</a>
                              )}
                              <div className="admin-consult-mobile-meta">
                                {[c.serviceType, c.propertyType, c.budget].filter(Boolean).join(" · ") || "Chưa nêu nhu cầu"}
                                {" · "}
                                {new Date(c.createdAt).toLocaleDateString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                              </div>
                            </td>
                            <td>
                              <div style={{ fontSize: 13, fontWeight: 600 }}>{c.serviceType || "—"}</div>
                              <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>
                                {[c.propertyType, c.area, c.budget].filter(Boolean).join(" · ") || "Chưa nêu chi tiết"}
                              </div>
                            </td>
                            <td style={{ color: "var(--muted)", fontSize: 12.5 }}>
                              {new Date(c.createdAt).toLocaleDateString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                            </td>
                            <td>
                              {/* Chỉ hiển thị — đổi trạng thái và xoá đều nằm trong modal
                                  chi tiết, tránh bấm nhầm ngay trên bảng. */}
                              <span style={{
                                display: "inline-block", padding: "3px 10px", borderRadius: 999,
                                fontSize: 12, fontWeight: 700, background: meta.bg, color: meta.color,
                              }}>
                                {meta.label}
                              </span>
                            </td>
                            <td>
                              <div className="admin-actions">
                                <button className="admin-btn-sm edit" onClick={() => setSelectedConsult(c)}>Chi tiết</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {consults.length === 0 && (
                        <tr><td colSpan="5" style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
                          {consultSearch || consultStatus
                            ? "Không tìm thấy yêu cầu nào khớp bộ lọc"
                            : "Chưa có khách nào để lại thông tin"}
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Phân trang */}
                {consultsMeta.totalPages > 1 && (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 20 }}>
                    <button className="page-btn" disabled={consultPage <= 1}
                      onClick={() => { const p = consultPage - 1; setConsultPage(p); fetchConsults({ page: p }); }}>‹</button>
                    {Array.from({ length: consultsMeta.totalPages }, (_, i) => i + 1).map(p => (
                      <button key={p} className={`page-btn ${p === consultPage ? "active" : ""}`}
                        onClick={() => { setConsultPage(p); fetchConsults({ page: p }); }}>{p}</button>
                    ))}
                    <button className="page-btn" disabled={consultPage >= consultsMeta.totalPages}
                      onClick={() => { const p = consultPage + 1; setConsultPage(p); fetchConsults({ page: p }); }}>›</button>
                    <span style={{ fontSize: 13, color: "var(--muted)", marginLeft: 8 }}>
                      Trang {consultPage} / {consultsMeta.totalPages} ({consultsMeta.total} yêu cầu)
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ===== TAB 10: CHAT ===== */}
        {activeTab === "chat" && <AdminChat />}

        {/* ===== TAB 11: THÔNG TIN CÔNG TY ===== */}
        {activeTab === "settings" && (
          <div>
            <div className="admin-sec-header">
              <h2>Thông tin công ty</h2>
            </div>

            {infoLoading || !infoForm ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>Đang tải...</div>
            ) : (
              <form className="admin-settings-form" onSubmit={handleSaveCompanyInfo}>
                {/* ── Nhận diện thương hiệu ── */}
                <div className="admin-card">
                  <h3 className="admin-card-title">Nhận diện thương hiệu</h3>

                  <ImageField
                    value={infoForm.logo}
                    onChange={url => setInfoField("logo", url)}
                    type="settings"
                    label="Logo"
                    onUploadingChange={setLogoUploading}
                    hint="Ảnh vuông, nền trong suốt (PNG/WEBP) · tối đa 5MB"
                  />

                  <div className="admin-form-group">
                    <label>Tên công ty *</label>
                    <input
                      className="admin-input"
                      required
                      maxLength={255}
                      value={infoForm.companyName}
                      onChange={e => setInfoField("companyName", e.target.value)}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Slogan</label>
                    <input
                      className="admin-input"
                      maxLength={500}
                      placeholder="NỘI THẤT CAO CẤP"
                      value={infoForm.slogan}
                      onChange={e => setInfoField("slogan", e.target.value)}
                    />
                  </div>
                </div>

                {/* ── Liên hệ ── */}
                <div className="admin-card">
                  <h3 className="admin-card-title">Thông tin liên hệ</h3>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div className="admin-form-group">
                      <label>Hotline</label>
                      <input
                        className="admin-input"
                        maxLength={50}
                        placeholder="1900 6789"
                        value={infoForm.phone}
                        onChange={e => setInfoField("phone", e.target.value)}
                      />
                    </div>

                    <div className="admin-form-group">
                      <label>Email</label>
                      <input
                        className="admin-input"
                        type="email"
                        maxLength={255}
                        placeholder="contact@namquan.vn"
                        value={infoForm.email}
                        onChange={e => setInfoField("email", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <label>Địa chỉ</label>
                    <textarea
                      className="admin-textarea"
                      rows={2}
                      maxLength={1000}
                      placeholder="Số 90 Hương Lộ 2, Xã Tân Phú Trung, Huyện Củ Chi, TP. HCM"
                      value={infoForm.address}
                      onChange={e => setInfoField("address", e.target.value)}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Bản đồ Google (mã nhúng)</label>
                    <textarea
                      className="admin-textarea"
                      rows={3}
                      placeholder="https://www.google.com/maps/embed?pb=..."
                      value={infoForm.mapUrl}
                      onChange={e => setInfoField("mapUrl", normalizeMapEmbed(e.target.value))}
                    />
                    <small style={{ fontSize: 11.5, color: "var(--muted)" }}>
                      Google Maps → <b>Chia sẻ</b> → <b>Nhúng bản đồ</b> → <b>SAO CHÉP HTML</b>
                    </small>
                    {infoForm.mapUrl && (
                      isMapEmbed(infoForm.mapUrl) ? (
                        <div style={{ marginTop: 8, borderRadius: 10, overflow: "hidden", border: "1px solid var(--line)", height: 360, maxWidth: 520 }}>
                          <iframe
                            src={infoForm.mapUrl}
                            title="Xem trước bản đồ"
                            loading="lazy"
                            style={{ display: "block", width: "100%", height: "100%", border: 0 }}
                          />
                        </div>
                      ) : (
                        <div style={{ marginTop: 8, padding: "10px 14px", borderRadius: 8, background: "#fff1f0", border: "1px solid #ffccc7", color: "#cf1322", fontSize: 12.5 }}>
                          Chưa đúng mã nhúng — phải bắt đầu bằng <b>https://www.google.com/maps/embed</b>. Lưu sẽ bị từ chối.
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* ── Giới thiệu ── */}
                <div className="admin-card">
                  <h3 className="admin-card-title">Giới thiệu</h3>

                  <div className="admin-form-group">
                    <label>Về chúng tôi</label>
                    <textarea
                      className="admin-textarea"
                      rows={3}
                      maxLength={5000}
                      value={infoForm.about}
                      onChange={e => setInfoField("about", e.target.value)}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div className="admin-form-group">
                      <label>Sứ mệnh</label>
                      <textarea
                        className="admin-textarea"
                        rows={3}
                        maxLength={5000}
                        value={infoForm.mission}
                        onChange={e => setInfoField("mission", e.target.value)}
                      />
                    </div>

                    <div className="admin-form-group">
                      <label>Tầm nhìn</label>
                      <textarea
                        className="admin-textarea"
                        rows={3}
                        maxLength={5000}
                        value={infoForm.vision}
                        onChange={e => setInfoField("vision", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Mạng xã hội ── */}
                <div className="admin-card">
                  <h3 className="admin-card-title">Mạng xã hội</h3>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {[
                      { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/namquan" },
                      { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/namquan" },
                      { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@namquan" },
                      { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@namquan" },
                    ].map(({ key, label, placeholder }) => (
                      <div className="admin-form-group" key={key}>
                        <label>{label}</label>
                        <input
                          className="admin-input"
                          type="url"
                          maxLength={500}
                          placeholder={placeholder}
                          value={infoForm[key]}
                          onChange={e => setInfoField(key, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginBottom: 24 }}>
                  <button type="button" className="admin-btn-sm edit" onClick={fetchCompanyInfo} disabled={infoSaving}>
                    Hoàn tác
                  </button>
                  <button type="submit" className="btn-pill" disabled={infoSaving || logoUploading}>
                    {logoUploading ? "Đang tải ảnh..." : infoSaving ? "Đang lưu..." : "Lưu thông tin"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </main>

      {/* ===== MODAL: ADD PRODUCT ===== */}
      {showAddModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="admin-modal-panel" onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setShowAddModal(false)}><Icon name="close" size={14} /></button>
            <h3 className="admin-modal-title">Thêm sản phẩm mới</h3>
            <form onSubmit={handleCreateProduct}>
              <div className="admin-form-group">
                <label>Tên sản phẩm *</label>
                <input type="text" className="admin-input" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="admin-form-group">
                  <label>Loại sản phẩm *</label>
                  <input type="text" className="admin-input" required placeholder="Ghế Sofa, Bàn, Đèn..." value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label>Danh mục *</label>
                  <select className="admin-select" value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })}>
                    <option value="" disabled>Select category</option>
                    {displayCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="admin-form-group">
                  <label>Đơn giá (đ) *</label>
                  <input type="number" className="admin-input" required min="1" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label>Số lượng kho *</label>
                  <input type="number" className="admin-input" required min="0" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} />
                </div>
              </div>
              <ImageField
                label="Ảnh sản phẩm"
                type="products"
                value={formData.img}
                onChange={img => setFormData(f => ({ ...f, img }))}
                onUploadingChange={setImageUploading}
              />
              <div className="admin-form-group">
                <label>Mô tả chi tiết</label>
                <textarea className="admin-textarea" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="admin-form-actions">
                <button type="button" className="btn-pill ghost" onClick={() => setShowAddModal(false)}>Hủy bỏ</button>
                <button type="submit" className="btn-pill" disabled={imageUploading}>Lưu sản phẩm</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: EDIT PRODUCT ===== */}
      {showEditModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="admin-modal-panel" onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setShowEditModal(false)}><Icon name="close" size={14} /></button>
            <h3 className="admin-modal-title">Chỉnh sửa sản phẩm</h3>
            <form onSubmit={handleUpdateProduct}>
              <div className="admin-form-group">
                <label>Tên sản phẩm *</label>
                <input type="text" className="admin-input" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="admin-form-group">
                  <label>Loại sản phẩm *</label>
                  <input type="text" className="admin-input" required value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label>Danh mục *</label>
                  <select className="admin-select" value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })}>
                    <option value="" disabled>Select category</option>
                    {displayCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="admin-form-group">
                  <label>Đơn giá (đ) *</label>
                  <input type="number" className="admin-input" required min="1" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label>Số lượng kho *</label>
                  <input type="number" className="admin-input" required min="0" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} />
                </div>
              </div>
              <ImageField
                label="Ảnh sản phẩm"
                type="products"
                value={formData.img}
                onChange={img => setFormData(f => ({ ...f, img }))}
                onUploadingChange={setImageUploading}
              />
              <div className="admin-form-group">
                <label>Mô tả chi tiết</label>
                <textarea className="admin-textarea" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="admin-form-actions">
                <button type="button" className="btn-pill ghost" onClick={() => setShowEditModal(false)}>Hủy bỏ</button>
                <button type="submit" className="btn-pill" disabled={imageUploading}>Cập nhật</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: XỬ LÝ TRẠNG THÁI ĐƠN HÀNG ===== */}
      {showStatusModal && statusOrder && (
        <div className="admin-modal-backdrop" onClick={() => setShowStatusModal(false)}>
          <div className="admin-modal-panel" style={{ maxWidth: 460, width: "90%", padding: 24 }} onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setShowStatusModal(false)}><Icon name="close" size={14} /></button>
            <h3 className="admin-modal-title" style={{ margin: "0 0 16px", fontSize: 16 }}>✏️ Xử lý trạng thái đơn #{statusOrder.id.split('-')[0].toUpperCase()}</h3>
            
            <div style={{ marginBottom: 16, fontSize: 13.5, background: "var(--paper-2)", padding: 14, borderRadius: 10 }}>
              <p style={{ margin: "0 0 6px" }}><b>Khách hàng:</b> {statusOrder.customerName || "Khách lẻ"}</p>
              <p style={{ margin: "0 0 6px" }}><b>Trạng thái hiện tại:</b> <span className={`admin-badge ${statusOrder.status}`}>{getStatusLabel(statusOrder.status)}</span></p>
              <p style={{ margin: 0 }}><b>Tổng giá trị:</b> <b style={{ color: "var(--green-ink)" }}>{vnd(statusOrder.total)} đ</b></p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 8, color: "var(--ink-2)" }}>Chọn trạng thái cập nhật:</label>
              <select
                className="admin-select"
                style={{ width: "100%", padding: "10px 14px", fontSize: 14 }}
                value={newStatusValue}
                onChange={e => setNewStatusValue(e.target.value)}
              >
                {getAvailableNextStatuses(statusOrder.status).map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn-pill ghost" style={{ padding: "8px 16px", fontSize: 13 }} onClick={() => setShowStatusModal(false)}>Hủy</button>
              <button className="btn-pill" style={{ padding: "8px 20px", fontSize: 13 }} onClick={handleSaveStatusModal}>Cập nhật trạng thái</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: ORDER DETAILS ===== */}
      {showOrderModal && selectedOrder && (
        <div className="admin-modal-backdrop" onClick={() => setShowOrderModal(false)}>
          <div className="admin-modal-panel" style={{ maxWidth: 920, width: "94%" }} onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setShowOrderModal(false)}><Icon name="close" size={14} /></button>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <h3 className="admin-modal-title" style={{ margin: 0 }}>Chi tiết đơn hàng #{selectedOrder.id.split('-')[0].toUpperCase()}</h3>
              <button
                type="button"
                className="btn-pill ghost"
                /* Nút đóng modal nằm absolute ở right:20px, rộng 32px — chừa
                   46px bên phải để hai nút không dính vào nhau. */
                style={{ padding: "6px 14px", fontSize: 13, marginLeft: "auto", marginRight: 46 }}
                disabled={printingInvoice}
                onClick={() => handlePrintInvoice(selectedOrder.id)}
              >
                {printingInvoice ? "Đang tạo..." : "🧾 In hóa đơn"}
              </button>
            </div>
            <div style={{ height: 14 }} />

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 20, marginBottom: 20, fontSize: 13.5, background: "var(--paper-2)", padding: 14, borderRadius: 10 }}>
              <div>
                <p style={{ margin: "0 0 6px" }}><b>Khách hàng:</b> {selectedOrder.customerName || "Khách mua lẻ"}{selectedOrder.customerEmail ? ` (${selectedOrder.customerEmail})` : ""}</p>
                <p style={{ margin: "0 0 6px" }}><b>Địa chỉ nhận hàng:</b> {selectedOrder.shippingAddress}</p>
                <p style={{ margin: 0 }}><b>Ghi chú đơn:</b> {selectedOrder.note || "Không có"}</p>
              </div>
              <div>
                <p style={{ margin: "0 0 6px" }}><b>Ngày đặt:</b> {new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}</p>
                <p style={{ margin: "0 0 6px" }}><b>Trạng thái:</b> <span className={`admin-badge ${selectedOrder.status}`}>{getStatusLabel(selectedOrder.status)}</span></p>
                <p style={{ margin: 0 }}><b>Tổng thanh toán:</b> <span style={{ color: "var(--green-ink)", fontWeight: 700 }}>{vnd(selectedOrder.total)} đ</span></p>
              </div>
            </div>

            <h4 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>Sản phẩm đã mua</h4>
            <div className="admin-table-wrap">
              <table className="admin-table" style={{ fontSize: 13 }}>
                <thead><tr><th>Ảnh</th><th>Sản phẩm</th><th>Đơn giá</th><th style={{ textAlign: "center" }}>SL</th><th style={{ textAlign: "right" }}>Tổng</th></tr></thead>
                <tbody>
                  {selectedOrder.items.map((item, idx) => (
                    <tr key={idx}>
                      <td><Img src={item.img} alt={item.name} className="admin-img-thumb" style={{ width: 36, height: 36 }} /></td>
                      <td style={{ fontWeight: 600, width: "100%" }}>{item.name}</td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {vnd(item.price)} đ
                        {item.listPrice > item.price && (
                          <s style={{ color: "var(--muted)", marginLeft: 6, fontWeight: 500 }}>{vnd(item.listPrice)} đ</s>
                        )}
                      </td>
                      <td style={{ textAlign: "center", fontWeight: 700 }}>{item.quantity}</td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: "var(--green-ink)", whiteSpace: "nowrap" }}>{vnd(item.price * item.quantity)} đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bảng bóc tách: giá gốc -> số đã giảm -> số phải trả. Dòng giảm
                chỉ hiện khi đơn thực sự có khuyến mãi. */}
            {(() => {
              const t = orderTotals(selectedOrder.items);
              return (
                <div style={{ marginTop: 16, marginLeft: "auto", maxWidth: 320, fontSize: 13.5 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ color: "var(--muted)" }}>Tạm tính{t.hasDiscount ? " (giá gốc)" : ""}</span>
                    <span>{vnd(t.subtotal)} đ</span>
                  </div>
                  {t.hasDiscount && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ color: "var(--muted)" }}>Giảm giá</span>
                      <span style={{ color: "#e6457a", fontWeight: 600 }}>−{vnd(t.discount)} đ</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed var(--line)", paddingTop: 8 }}>
                    <b>Tổng thanh toán</b>
                    <b style={{ color: "var(--green-ink)", fontSize: 15 }}>{vnd(t.payable)} đ</b>
                  </div>
                </div>
              );
            })()}

            <div className="admin-form-actions">
              <button className="btn-pill" onClick={() => setShowOrderModal(false)}>Đóng chi tiết</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: ADD CATEGORY ===== */}
      {/* ===== MODAL: CHI TIẾT YÊU CẦU TRẢ / ĐỔI HÀNG ===== */}
      {selectedReturn && (() => {
        const r = selectedReturn;
        const meta = RETURN_STATUS_META[r.status] ?? RETURN_STATUS_META.pending;
        const nextSteps = RETURN_NEXT[r.status] ?? [];
        return (
          <div className="admin-modal-backdrop" onClick={() => setSelectedReturn(null)}>
            <div className="admin-modal-panel" onClick={e => e.stopPropagation()}>
              <button className="admin-modal-close" onClick={() => setSelectedReturn(null)}><Icon name="close" size={14} /></button>
              <h3 className="admin-modal-title">
                {RETURN_TYPE_LABEL[r.type]} · đơn #{String(r.orderId).split("-")[0].toUpperCase()}
              </h3>

              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
                <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, background: meta.bg, color: meta.color }}>
                  {meta.label}
                </span>
                <span style={{ fontSize: 12.5, color: "var(--muted)" }}>
                  Gửi {new Date(r.createdAt).toLocaleString("vi-VN")}
                </span>
                {r.resolvedAt && (
                  <span style={{ fontSize: 12.5, color: "var(--muted)" }}>
                    · chốt {new Date(r.resolvedAt).toLocaleString("vi-VN")}
                  </span>
                )}
              </div>

              <div style={{ display: "grid", gap: 6, fontSize: 13.5, marginBottom: 16 }}>
                <div><b>Khách hàng:</b> {r.customerName || "—"}</div>
                <div><b>Liên hệ:</b> <a href={telHref(r.customerPhone)}>{r.customerPhone || "—"}</a>{r.customerEmail ? ` · ${r.customerEmail}` : ""}</div>
                <div><b>Giá trị đơn:</b> {vnd(r.orderTotal)}đ · thanh toán: {r.orderPaymentStatus}</div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 5 }}>LÝ DO KHÁCH NÊU</div>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: "var(--ink-2)" }}>{r.reason}</p>
              </div>

              {r.imageUrls?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>
                    ẢNH KHÁCH GỬI ({r.imageUrls.length})
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {r.imageUrls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer"
                        style={{ width: 88, height: 88, borderRadius: 10, overflow: "hidden", border: "1px solid var(--line-2)" }}>
                        <img src={url} alt={`Ảnh ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {r.adminNote && (
                <div style={{ marginBottom: 16, padding: 12, borderRadius: 10, background: "#f9fbf9", border: "1px solid var(--line)" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 4 }}>GHI CHÚ XỬ LÝ</div>
                  <div style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.6 }}>{r.adminNote}</div>
                </div>
              )}

              {nextSteps.length > 0 ? (
                <>
                  <div className="admin-form-group">
                    <label>
                      Phản hồi gửi khách
                      {nextSteps.includes("rejected") && (
                        <span style={{ color: "#b91c1c" }}> * bắt buộc nếu từ chối</span>
                      )}
                    </label>
                    <textarea
                      className="admin-input" rows={3} maxLength={500}
                      placeholder="Nhập phản hồi gửi khách hàng..."
                      value={returnNote}
                      onChange={e => setReturnNote(e.target.value)}
                      style={{ fontFamily: "inherit", resize: "vertical" }}
                    />
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>
                      {returnNote.length}/500 — khách đọc được nội dung này ở trang chi tiết đơn hàng.
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                    {nextSteps.map(s => (
                      <button
                        key={s}
                        disabled={returnSaving}
                        onClick={() => handleReturnStatus(r, s)}
                        style={{
                          padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: "pointer",
                          border: `1.5px solid ${RETURN_STATUS_META[s].color}`,
                          background: RETURN_STATUS_META[s].bg, color: RETURN_STATUS_META[s].color,
                        }}
                      >
                        {s === "approved" ? "✓ Duyệt yêu cầu"
                          : s === "rejected" ? "✕ Từ chối"
                          : r.type === "return" ? "✓ Hoàn tất — hoàn kho & hoàn tiền" : "✓ Hoàn tất đổi hàng"}
                      </button>
                    ))}
                  </div>
                  {r.status === "approved" && r.type === "return" && (
                    <p style={{ margin: "10px 0 0", fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
                      Bấm “Hoàn tất” sau khi đã nhận lại hàng: hệ thống cộng lại tồn kho,
                      trừ số đã bán và đánh dấu đơn là đã trả / đã hoàn tiền.
                    </p>
                  )}
                </>
              ) : (
                <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                  Yêu cầu đã kết thúc — không đổi trạng thái được nữa.
                </p>
              )}

              <div className="admin-form-actions">
                <button type="button" className="btn-pill ghost" onClick={() => setSelectedReturn(null)}>Đóng</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===== MODAL: THÊM NHÂN VIÊN ===== */}
      {showStaffModal && canManage && (
        <div className="admin-modal-backdrop" onClick={() => setShowStaffModal(false)}>
          <div className="admin-modal-panel" onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setShowStaffModal(false)}><Icon name="close" size={14} /></button>
            <h3 className="admin-modal-title">Thêm tài khoản nhân viên</h3>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
              Nhân viên không tự đăng ký được. Quản trị viên tạo tài khoản tại đây
              rồi bàn giao email và mật khẩu cho người đó.
            </p>
            <form onSubmit={handleCreateStaff}>
              <div className="admin-form-group">
                <label>Họ và tên *</label>
                <input type="text" className="admin-input" required minLength={2} maxLength={100}
                  value={staffForm.name}
                  onChange={e => setStaffForm({ ...staffForm, name: e.target.value })} />
              </div>
              <div className="admin-form-group">
                <label>Email đăng nhập *</label>
                <input type="email" className="admin-input" required
                  value={staffForm.email}
                  onChange={e => setStaffForm({ ...staffForm, email: e.target.value })} />
              </div>
              <div className="admin-form-group">
                <label>Số điện thoại</label>
                <input type="tel" className="admin-input" maxLength={20}
                  value={staffForm.phone}
                  onChange={e => setStaffForm({ ...staffForm, phone: e.target.value })} />
              </div>
              <div className="admin-form-group">
                <label>Mật khẩu tạm thời *</label>
                <input type="text" className="admin-input" required minLength={6} maxLength={100}
                  placeholder="Ít nhất 6 ký tự"
                  value={staffForm.password}
                  onChange={e => setStaffForm({ ...staffForm, password: e.target.value })} />
                <span style={{ fontSize: 12, color: "var(--muted)" }}>
                  Hiển thị dạng chữ để bạn sao chép gửi cho nhân viên; nhắc họ đổi lại sau lần đăng nhập đầu.
                </span>
              </div>
              <div className="admin-form-group">
                <label>Vai trò *</label>
                <select className="admin-select" value={staffForm.role}
                  onChange={e => setStaffForm({ ...staffForm, role: e.target.value })}>
                  <option value="staff">Nhân viên — xử lý đơn hàng, tư vấn, chat</option>
                  <option value="admin">Quản trị viên — toàn quyền</option>
                </select>
              </div>
              <div className="admin-form-actions">
                <button type="button" className="btn-pill ghost" onClick={() => setShowStaffModal(false)}>Hủy bỏ</button>
                <button type="submit" className="btn-pill" disabled={staffSaving}>
                  {staffSaving ? "Đang tạo..." : "Tạo tài khoản"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddCatModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowAddCatModal(false)}>
          <div className="admin-modal-panel" onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setShowAddCatModal(false)}><Icon name="close" size={14} /></button>
            <h3 className="admin-modal-title">Thêm danh mục mới</h3>
            <form onSubmit={handleCreateCategory}>
              <div className="admin-form-group">
                <label>Tên danh mục *</label>
                <input type="text" className="admin-input" required value={catFormData.name} onChange={e => setCatFormData({ ...catFormData, name: e.target.value })} />
              </div>
              <ImageField
                label="Ảnh danh mục"
                type="categories"
                value={catFormData.img}
                onChange={img => setCatFormData(f => ({ ...f, img }))}
                onUploadingChange={setImageUploading}
              />
              <div className="admin-form-actions">
                <button type="button" className="btn-pill ghost" onClick={() => setShowAddCatModal(false)}>Hủy bỏ</button>
                <button type="submit" className="btn-pill" disabled={imageUploading}>Lưu danh mục</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: EDIT CATEGORY ===== */}
      {showEditCatModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowEditCatModal(false)}>
          <div className="admin-modal-panel" onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setShowEditCatModal(false)}><Icon name="close" size={14} /></button>
            <h3 className="admin-modal-title">Chỉnh sửa danh mục</h3>
            <form onSubmit={handleUpdateCategory}>
              <div className="admin-form-group">
                <label>Tên danh mục *</label>
                <input type="text" className="admin-input" required value={catFormData.name} onChange={e => setCatFormData({ ...catFormData, name: e.target.value })} />
              </div>
              <ImageField
                label="Ảnh danh mục"
                type="categories"
                value={catFormData.img}
                onChange={img => setCatFormData(f => ({ ...f, img }))}
                onUploadingChange={setImageUploading}
              />
              <div className="admin-form-actions">
                <button type="button" className="btn-pill ghost" onClick={() => setShowEditCatModal(false)}>Hủy bỏ</button>
                <button type="submit" className="btn-pill" disabled={imageUploading}>Cập nhật</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: ADD COLLECTION ===== */}
      {showAddCollModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowAddCollModal(false)}>
          <div className="admin-modal-panel" onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setShowAddCollModal(false)}><Icon name="close" size={14} /></button>
            <h3 className="admin-modal-title">Thêm bộ sưu tập mới</h3>
            <form onSubmit={handleCreateCollection}>
              <div className="admin-form-group">
                <label>Tên bộ sưu tập *</label>
                <input type="text" className="admin-input" required value={collFormData.name} onChange={e => setCollFormData({ ...collFormData, name: e.target.value })} />
              </div>
              <ImageField
                label="Ảnh bộ sưu tập"
                type="collections"
                value={collFormData.img}
                onChange={img => setCollFormData(f => ({ ...f, img }))}
                onUploadingChange={setImageUploading}
              />
              <div className="admin-form-actions">
                <button type="button" className="btn-pill ghost" onClick={() => setShowAddCollModal(false)}>Hủy bỏ</button>
                <button type="submit" className="btn-pill" disabled={imageUploading}>Lưu bộ sưu tập</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: EDIT COLLECTION ===== */}
      {showEditCollModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowEditCollModal(false)}>
          <div className="admin-modal-panel" onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setShowEditCollModal(false)}><Icon name="close" size={14} /></button>
            <h3 className="admin-modal-title">Chỉnh sửa bộ sưu tập</h3>
            <form onSubmit={handleUpdateCollection}>
              <div className="admin-form-group">
                <label>Tên bộ sưu tập *</label>
                <input type="text" className="admin-input" required value={collFormData.name} onChange={e => setCollFormData({ ...collFormData, name: e.target.value })} />
              </div>
              <ImageField
                label="Ảnh bộ sưu tập"
                type="collections"
                value={collFormData.img}
                onChange={img => setCollFormData(f => ({ ...f, img }))}
                onUploadingChange={setImageUploading}
              />
              <div className="admin-form-actions">
                <button type="button" className="btn-pill ghost" onClick={() => setShowEditCollModal(false)}>Hủy bỏ</button>
                <button type="submit" className="btn-pill" disabled={imageUploading}>Cập nhật</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: SOẠN / SỬA BÀI VIẾT ===== */}
      {newsModal && (
        <div className="admin-modal-backdrop" onClick={() => !newsSaving && setNewsModal(null)}>
          {/* Rộng hơn các modal khác: form này có thanh công cụ nhiều nút và
              khung soạn nội dung dài, chật quá thì toolbar bị xuống dòng. */}
          <div className="admin-modal-panel" style={{ maxWidth: 1080, width: "94%" }} onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setNewsModal(null)}><Icon name="close" size={14} /></button>
            <h3 className="admin-modal-title">
              {newsModal.mode === "create" ? "Viết bài mới" : "Chỉnh sửa bài viết"}
            </h3>

            {newsModal.loading ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>Đang tải nội dung bài viết...</div>
            ) : (
              <form onSubmit={handleSubmitNews}>
                {/* ── Nội dung ───────────────────────────────────────── */}
                <div className="admin-form-group">
                  <label>Tiêu đề bài viết *</label>
                  <input
                    type="text" className="admin-input" required maxLength={500}
                    value={newsFormData.title}
                    onChange={e => setNewsFormData({ ...newsFormData, title: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label>Đường dẫn (slug)</label>
                  <input
                    type="text" className="admin-input"
                    placeholder={newsModal.mode === "create" ? "Để trống sẽ tự sinh từ tiêu đề" : ""}
                    value={newsFormData.slug}
                    onChange={e => setNewsFormData({ ...newsFormData, slug: e.target.value })}
                  />
                  <small style={{ fontSize: 11.5, color: "var(--muted)" }}>
                    /news/{newsFormData.slug.trim() || (newsFormData.title ? slugify(newsFormData.title) : "…")}
                    {newsModal.mode === "edit" && " · đổi slug sẽ làm hỏng liên kết cũ đã chia sẻ"}
                  </small>
                </div>

                <ImageField
                  label="Ảnh bìa"
                  required
                  type="news"
                  value={newsFormData.img}
                  onChange={img => setNewsFormData(f => ({ ...f, img }))}
                  onUploadingChange={setImageUploading}
                />

                <div className="admin-form-group">
                  <label>Ngày đăng</label>
                  <input
                    type="date" className="admin-input" style={{ maxWidth: 260 }}
                    value={newsFormData.date}
                    onChange={e => setNewsFormData({ ...newsFormData, date: e.target.value })}
                  />
                  <small style={{ fontSize: 11.5, color: "var(--muted)" }}>Để trống = ngày hôm nay</small>
                </div>

                <div className="admin-form-group">
                  <label>
                    Mô tả ngắn *
                    <span style={{ float: "right", fontSize: 11.5, fontWeight: 500, color: newsFormData.excerpt.length > 500 ? "#ef4444" : "var(--muted)" }}>
                      {newsFormData.excerpt.length}/500
                    </span>
                  </label>
                  <textarea
                    className="admin-textarea" required style={{ height: 66 }} maxLength={500}
                    placeholder="Đoạn giới thiệu hiển thị ở card tin tức và kết quả tìm kiếm"
                    value={newsFormData.excerpt}
                    onChange={e => setNewsFormData({ ...newsFormData, excerpt: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label>Nội dung bài viết *</label>
                  <ContentEditor
                    value={newsFormData.content}
                    onChange={content => setNewsFormData(f => ({ ...f, content }))}
                    imageType="news"
                    height={280}
                  />
                  <small style={{ fontSize: 11.5, color: "var(--muted)" }}>
                    Bôi đen chữ rồi bấm nút trên thanh công cụ. Dòng trống để ngăn đoạn.
                    Thẻ HTML sẽ bị gỡ khi lưu.
                  </small>
                </div>

                {/* ── Phân loại & hiển thị ───────────────────────────── */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div className="admin-form-group">
                    <label>Danh mục</label>
                    <select
                      className="admin-select"
                      value={newsFormData.categoryId}
                      onChange={e => setNewsFormData({ ...newsFormData, categoryId: e.target.value })}
                    >
                      <option value="">— Chưa phân loại —</option>
                      {newsCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label>Trạng thái</label>
                    <select
                      className="admin-select"
                      value={newsFormData.status}
                      onChange={e => setNewsFormData({ ...newsFormData, status: e.target.value })}
                    >
                      <option value="draft">Bản nháp — chưa hiển thị</option>
                      <option value="published">Đã đăng — hiện trên website</option>
                      <option value="hidden">Đã ẩn — gỡ khỏi website</option>
                    </select>
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>Thẻ (tag)</label>
                  <input
                    type="text" className="admin-input"
                    placeholder="Ngăn cách bằng dấu phẩy. VD: sofa, phòng khách, mẹo bài trí"
                    value={newsFormData.tags}
                    onChange={e => setNewsFormData({ ...newsFormData, tags: e.target.value })}
                  />
                  <small style={{ fontSize: 11.5, color: "var(--muted)" }}>Tối đa 10 thẻ</small>
                </div>

                <div className="admin-form-group">
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={newsFormData.featured}
                      onChange={e => setNewsFormData({ ...newsFormData, featured: e.target.checked })}
                    />
                    ⭐ Bài nổi bật — được ưu tiên hiển thị trên trang chủ
                  </label>
                </div>

                {/* ── SEO (thu gọn) ──────────────────────────────────── */}
                <div style={{ border: "1px solid var(--line)", borderRadius: 10, marginBottom: 18, overflow: "hidden" }}>
                  <button
                    type="button"
                    onClick={() => setNewsSeoOpen(o => !o)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "11px 14px", background: "var(--mint)", border: "none", cursor: "pointer",
                      fontSize: 13.5, fontWeight: 700, color: "var(--green-ink)",
                    }}
                  >
                    <span>Tối ưu SEO {newsSeoOpen ? "" : "(tùy chọn)"}</span>
                    <span>{newsSeoOpen ? "▲" : "▼"}</span>
                  </button>

                  {newsSeoOpen && (
                    <div style={{ padding: "16px 14px 2px" }}>
                      <div className="admin-form-group">
                        <label>
                          Tiêu đề SEO
                          <span style={{ float: "right", fontSize: 11.5, fontWeight: 500, color: newsFormData.seoTitle.length > 60 ? "#f59a1c" : "var(--muted)" }}>
                            {newsFormData.seoTitle.length}/60 khuyến nghị
                          </span>
                        </label>
                        <input
                          type="text" className="admin-input" maxLength={255}
                          placeholder="Để trống sẽ dùng tiêu đề bài viết"
                          value={newsFormData.seoTitle}
                          onChange={e => setNewsFormData({ ...newsFormData, seoTitle: e.target.value })}
                        />
                      </div>
                      <div className="admin-form-group">
                        <label>
                          Mô tả SEO
                          <span style={{ float: "right", fontSize: 11.5, fontWeight: 500, color: newsFormData.seoDescription.length > 160 ? "#f59a1c" : "var(--muted)" }}>
                            {newsFormData.seoDescription.length}/160 khuyến nghị
                          </span>
                        </label>
                        <textarea
                          className="admin-textarea" style={{ height: 60 }} maxLength={500}
                          placeholder="Để trống sẽ dùng mô tả ngắn"
                          value={newsFormData.seoDescription}
                          onChange={e => setNewsFormData({ ...newsFormData, seoDescription: e.target.value })}
                        />
                      </div>
                      <div className="admin-form-group">
                        <label>Từ khóa</label>
                        <input
                          type="text" className="admin-input" maxLength={500}
                          placeholder="ngăn cách bằng dấu phẩy"
                          value={newsFormData.seoKeywords}
                          onChange={e => setNewsFormData({ ...newsFormData, seoKeywords: e.target.value })}
                        />
                      </div>

                      <ImageField
                        label="Ảnh chia sẻ (OG image)"
                        type="news"
                        value={newsFormData.ogImage}
                        onChange={ogImage => setNewsFormData(f => ({ ...f, ogImage }))}
                        onUploadingChange={setImageUploading}
                        hint="Ảnh hiện khi chia sẻ lên Facebook, Zalo… Để trống sẽ dùng ảnh bìa. Khuyến nghị 1200×630."
                      />
                    </div>
                  )}
                </div>

                <div className="admin-form-actions">
                  <button type="button" className="btn-pill ghost" disabled={newsSaving} onClick={() => setNewsModal(null)}>
                    Hủy bỏ
                  </button>
                  <button type="submit" className="btn-pill" disabled={newsSaving || imageUploading}>
                    {newsSaving
                      ? "Đang lưu..."
                      : newsModal.mode === "create"
                        ? (newsFormData.status === "published" ? "Đăng bài" : "Lưu bản nháp")
                        : "Cập nhật"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* ===== MODAL: ADD FLASH SALE ===== */}
      {showAddFlashModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowAddFlashModal(false)}>
          <div className="admin-modal-panel" style={{ maxWidth: 720, width: "94%" }} onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setShowAddFlashModal(false)}><Icon name="close" size={14} /></button>
            <h3 className="admin-modal-title">Thêm sản phẩm Flash Sale</h3>
            <form onSubmit={handleCreateFlash}>
              <div className="admin-form-group">
                <label>Sản phẩm áp dụng *</label>
                <select className="admin-select" required value={flashFormData.productId} onChange={e => handleFlashProductChange(e.target.value)}>
                  <option value="" disabled>-- Chọn sản phẩm --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({vnd(p.price)} đ)</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="admin-form-group">
                  <label>Giá gốc sản phẩm</label>
                  <input type="text" className="admin-input" disabled value={vnd(flashFormData.originalPrice) + " đ"} />
                </div>
                <div className="admin-form-group">
                  <label>Giảm giá (%) *</label>
                  <input type="number" min="0" max="100" className="admin-input" required value={flashFormData.discountPct} onChange={e => handleFlashDiscountChange(e.target.value)} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="admin-form-group">
                  <label>Giá bán Flash Sale *</label>
                  <input type="number" min="1" className="admin-input" required value={flashFormData.price} onChange={e => handleFlashPriceChange(e.target.value)} />
                </div>
                <div className="admin-form-group">
                  <label>Số lượng kho sale *</label>
                  <input type="number" min="1" className="admin-input" required value={flashFormData.stock} onChange={e => setFlashFormData({ ...flashFormData, stock: e.target.value })} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="admin-form-group">
                  <label>Thời gian bắt đầu *</label>
                  <input type="datetime-local" className="admin-input" required value={flashFormData.startsAt} onChange={e => setFlashFormData({ ...flashFormData, startsAt: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label>Thời gian kết thúc</label>
                  <input type="datetime-local" className="admin-input" value={flashFormData.endsAt} onChange={e => setFlashFormData({ ...flashFormData, endsAt: e.target.value })} />
                </div>
              </div>
              <div className="admin-form-group" style={{ display: "flex", flexDirection: "row", gap: 8, alignItems: "center", marginTop: 12 }}>
                <input type="checkbox" id="add-flash-active" checked={flashFormData.active} onChange={e => setFlashFormData({ ...flashFormData, active: e.target.checked })} />
                <label htmlFor="add-flash-active" style={{ marginBottom: 0, cursor: "pointer" }}>Kích hoạt</label>
              </div>
              <div className="admin-form-actions" style={{ marginTop: 20 }}>
                <button type="button" className="btn-pill ghost" onClick={() => setShowAddFlashModal(false)}>Hủy bỏ</button>
                <button type="submit" className="btn-pill">Tạo chương trình</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: EDIT FLASH SALE ===== */}
      {/* Chương trình đã phát sinh đơn thì khoá phần giá — backend cũng chặn
          (assertPricingNotLocked), đây chỉ là lớp báo trước cho admin. */}
      {showEditFlashModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowEditFlashModal(false)}>
          <div className="admin-modal-panel" style={{ maxWidth: 720, width: "94%" }} onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setShowEditFlashModal(false)}><Icon name="close" size={14} /></button>
            <h3 className="admin-modal-title">Cấu hình Flash Sale</h3>
            <form onSubmit={handleUpdateFlash}>
              <div className="admin-form-group">
                <label>Sản phẩm áp dụng</label>
                <select className="admin-select" disabled value={flashFormData.productId}>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="admin-form-group">
                  <label>Giá gốc sản phẩm</label>
                  <input type="text" className="admin-input" disabled value={vnd(flashFormData.originalPrice) + " đ"} />
                </div>
                <div className="admin-form-group">
                  <label>Giảm giá (%) *</label>
                  <input type="number" min="0" max="100" className="admin-input" required disabled={pricingLocked} value={flashFormData.discountPct} onChange={e => handleFlashDiscountChange(e.target.value)} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="admin-form-group">
                  <label>Giá bán Flash Sale *</label>
                  <input type="number" min="1" className="admin-input" required disabled={pricingLocked} value={flashFormData.price} onChange={e => handleFlashPriceChange(e.target.value)} />
                </div>
                <div className="admin-form-group">
                  <label>Số lượng kho sale *</label>
                  <input type="number" min="1" className="admin-input" required value={flashFormData.stock} onChange={e => setFlashFormData({ ...flashFormData, stock: e.target.value })} />
                </div>
              </div>
              {pricingLocked && (
                <p style={{
                  margin: "0 0 16px", padding: "10px 12px", borderRadius: 8,
                  background: "#fff7ed", color: "#9a3412", fontSize: 12.5, lineHeight: 1.55,
                }}>
                  Đã có {selectedFlash.order_item_count} dòng đơn hàng mua theo chương trình này nên phần giá bị khoá —
                  sửa giá sẽ khiến các đơn đã bán không còn khớp với chương trình.
                  Vẫn đổi được thời gian, số suất và trạng thái. Muốn áp mức giá khác, hãy dừng chương trình này rồi tạo chương trình mới.
                </p>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="admin-form-group">
                  <label>Thời gian bắt đầu *</label>
                  <input type="datetime-local" className="admin-input" required value={flashFormData.startsAt} onChange={e => setFlashFormData({ ...flashFormData, startsAt: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label>Thời gian kết thúc</label>
                  <input type="datetime-local" className="admin-input" value={flashFormData.endsAt} onChange={e => setFlashFormData({ ...flashFormData, endsAt: e.target.value })} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="admin-form-group">
                  <label>Số lượng đã bán</label>
                  <input type="number" min="0" className="admin-input" required value={flashFormData.sold} onChange={e => setFlashFormData({ ...flashFormData, sold: e.target.value })} />
                </div>
                <div className="admin-form-group" style={{ display: "flex", flexDirection: "row", gap: 8, alignItems: "center", marginTop: 24 }}>
                  <input type="checkbox" id="edit-flash-active" checked={flashFormData.active} onChange={e => setFlashFormData({ ...flashFormData, active: e.target.checked })} />
                  <label htmlFor="edit-flash-active" style={{ marginBottom: 0, cursor: "pointer" }}>Kích hoạt</label>
                </div>
              </div>
              <div className="admin-form-actions" style={{ marginTop: 20 }}>
                <button type="button" className="btn-pill ghost" onClick={() => setShowEditFlashModal(false)}>Hủy bỏ</button>
                <button type="submit" className="btn-pill">Cập nhật</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: CHI TIẾT YÊU CẦU TƯ VẤN ===== */}
      {selectedConsult && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedConsult(null)}>
          <div className="admin-modal-panel" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setSelectedConsult(null)}><Icon name="close" size={14} /></button>
            <h3 className="admin-modal-title">Yêu cầu tư vấn #{selectedConsult.id}</h3>

            {/* Khối liên hệ đặt trên cùng: việc đầu tiên cần làm là gọi cho khách. */}
            <div className="admin-consult-contact">
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "var(--ink)" }}>{selectedConsult.name}</div>
                <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
                  Gửi lúc {new Date(selectedConsult.createdAt).toLocaleString("vi-VN")}
                </div>
              </div>
              <div className="admin-consult-contact-btns">
                <a className="btn-pill" href={telHref(selectedConsult.phone)}>
                  <Icon name="phone" size={15} /> {selectedConsult.phone}
                </a>
                {selectedConsult.email && (
                  <a className="btn-pill ghost" href={`mailto:${selectedConsult.email}`}>Gửi email</a>
                )}
              </div>
            </div>

            <div className="admin-consult-grid">
              {[
                ["Nhu cầu tư vấn", selectedConsult.serviceType],
                ["Loại công trình", selectedConsult.propertyType],
                ["Diện tích", selectedConsult.area],
                ["Ngân sách dự kiến", selectedConsult.budget],
                ["Khu vực", selectedConsult.address],
                ["Email", selectedConsult.email],
              ].map(([label, value]) => (
                <div key={label}>
                  <span className="admin-consult-k">{label}</span>
                  <span className="admin-consult-v">{value || "—"}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16 }}>
              <span className="admin-consult-k">Ghi chú của khách</span>
              <p className="admin-consult-note">{selectedConsult.message || "Khách không để lại ghi chú."}</p>
            </div>

            {/* Đổi trạng thái ngay trong modal — khỏi đóng lại rồi tìm đúng dòng.
                Luồng một chiều: bước đã qua bị khoá, chỉ bấm được bước phía trước. */}
            <div style={{ marginTop: 20 }}>
              <span className="admin-consult-k">Trạng thái xử lý</span>

              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                {CONSULT_FLOW.map((s, i) => {
                  const meta = CONSULT_STATUS_META[s];
                  const cur = selectedConsult.status;
                  const on = cur === s;
                  const passed = !isConsultDone(cur) ? consultRank(s) < consultRank(cur)
                                                     : cur === "closed" ? consultRank(s) <= consultRank(cur) : false;
                  const clickable = canGoToConsult(cur, s);
                  return (
                    <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      {i > 0 && <span style={{ color: "var(--line-2)", fontSize: 13 }}>→</span>}
                      <button
                        onClick={() => clickable && handleConsultStatus(selectedConsult, s)}
                        disabled={!clickable}
                        title={
                          on ? "Trạng thái hiện tại"
                          : clickable ? `Chuyển sang: ${meta.label}`
                          : "Quy trình chỉ đi tới, không lùi được"
                        }
                        style={{
                          padding: "7px 15px", borderRadius: 999, fontSize: 12.5, fontWeight: 700,
                          cursor: clickable ? "pointer" : "default",
                          border: `1.5px solid ${on ? meta.color : "var(--line)"}`,
                          background: on ? meta.bg : "#fff",
                          color: on ? meta.color : passed ? "var(--muted-2)" : "var(--muted)",
                          opacity: !on && !clickable ? 0.55 : 1,
                          transition: ".18s",
                        }}
                      >
                        {passed && !on ? "✓ " : ""}{meta.label}
                      </button>
                    </span>
                  );
                })}
              </div>

              {/* Huỷ tách riêng khỏi dòng quy trình — đây là nhánh thoát, không phải bước kế tiếp. */}
              <div style={{ marginTop: 10 }}>
                {selectedConsult.status === "cancelled" ? (
                  <span style={{
                    display: "inline-block", padding: "6px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 700,
                    background: CONSULT_STATUS_META.cancelled.bg, color: CONSULT_STATUS_META.cancelled.color,
                  }}>
                    {CONSULT_STATUS_META.cancelled.label}
                  </span>
                ) : !isConsultDone(selectedConsult.status) ? (
                  <button
                    onClick={() => handleConsultStatus(selectedConsult, "cancelled")}
                    style={{
                      padding: "6px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, cursor: "pointer",
                      border: "1.5px solid var(--line)", background: "#fff", color: "#b91c1c",
                    }}
                  >
                    ✕ Huỷ yêu cầu
                  </button>
                ) : null}

                {isConsultDone(selectedConsult.status) && (
                  <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--muted)" }}>
                    Yêu cầu đã kết thúc — không đổi trạng thái được nữa.
                  </p>
                )}
              </div>
            </div>

            <div className="admin-form-actions" style={{ alignItems: "center" }}>
              <button
                type="button"
                className="admin-btn-sm delete"
                style={{ marginRight: "auto" }}
                onClick={() => handleDeleteConsult(selectedConsult)}
              >
                Xóa yêu cầu
              </button>
              <button type="button" className="btn-pill ghost" onClick={() => setSelectedConsult(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
