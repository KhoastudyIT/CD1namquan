/* ============ NAM QUAN — UI primitives ============ */
import { useState, useEffect } from "react";

export const vnd = (n) => (n != null ? Number(n).toLocaleString("vi-VN") : "0");

/**
 * Tách tổng tiền một đơn hàng thành: tiền theo giá gốc, số đã giảm, số phải trả.
 *
 * Dựa trên `listPrice` mà order_items chụp lại lúc đặt — KHÔNG đọc giá sản phẩm
 * hiện tại, vì giá đổi về sau sẽ làm sai lệch đơn cũ. Đơn đặt trước khi có cột
 * này không có listPrice; khi đó coi như không giảm để khỏi bịa số liệu.
 *
 * Nhận được cả hai dạng dữ liệu: dòng đơn hàng ({ price, listPrice }) và dòng
 * giỏ hàng ({ product: { price, listPrice } }), để giỏ hàng, trang thanh toán
 * và chi tiết đơn dùng chung một cách tính.
 */
export function orderTotals(items = []) {
  let subtotal = 0;   // theo giá gốc
  let payable = 0;    // theo giá thực trả

  for (const it of items) {
    const src = it.product ?? it;
    const qty = Number(it.quantity ?? 0);
    const paid = Number(src.price ?? 0);
    const list = Number(src.listPrice ?? src.list_price ?? 0);
    payable += paid * qty;
    subtotal += (list > paid ? list : paid) * qty;
  }

  const discount = subtotal - payable;
  return { subtotal, discount, payable, hasDiscount: discount > 0 };
}

/**
 * Trạng thái thật của một chương trình flash sale.
 *
 * Phải khớp thứ tự điều kiện với activeFlashWhere() ở backend
 * (backend/src/utils/price.js): active -> mốc thời gian -> còn suất. Chỉ đọc mỗi
 * cột `active` là chưa đủ — chương trình hết hạn hoặc hết suất vẫn có active=true
 * trong DB, nên dashboard sẽ báo "đang chạy" trong khi public đã ngừng áp giá.
 *
 * Trả về { label, tone, running }; `running` đúng bằng điều kiện backend dùng
 * để quyết định có áp giá flash hay không.
 */
export function flashStatus(fs = {}, now = Date.now()) {
  const starts = fs.starts_at ? new Date(fs.starts_at).getTime() : null;
  const ends = fs.ends_at ? new Date(fs.ends_at).getTime() : null;
  const remaining = Math.max(0, Number(fs.stock ?? 0) - Number(fs.sold ?? 0));

  if (!fs.active) return { label: "Tạm ngưng", tone: "off", running: false };
  if (starts && starts > now) return { label: "Chưa bắt đầu", tone: "pending", running: false };
  if (ends && ends < now) return { label: "Đã kết thúc", tone: "expired", running: false };
  if (remaining === 0) return { label: "Hết suất", tone: "soldout", running: false };
  return { label: "Đang chạy", tone: "live", running: true };
}

/** Màu badge theo tone của flashStatus. */
export const FLASH_STATUS_STYLE = {
  live: { background: "#dcfce7", color: "#166534" },
  pending: { background: "#dbeafe", color: "#1e40af" },
  expired: { background: "#e5e7eb", color: "#4b5563" },
  soldout: { background: "#ffedd5", color: "#c2410c" },
  off: { background: "#fee2e2", color: "#b91c1c" },
};

/**
 * Phần trăm giảm giá — luôn tính trên giá niêm yết HIỆN TẠI của sản phẩm.
 *
 * Không tính theo flash_sales.original_price: cột đó là ảnh chụp lúc tạo chương
 * trình, admin sửa giá sản phẩm sau đó là lệch ngay, dẫn tới dashboard và trang
 * public hiện hai con số khác nhau. Đối xứng với discountPercent() ở backend.
 */
export function discountPct(listPrice, salePrice) {
  const list = Number(listPrice ?? 0);
  const sale = Number(salePrice ?? 0);
  if (!(list > 0) || !(sale > 0) || sale >= list) return 0;
  return Math.round((1 - sale / list) * 100);
}

/**
 * Giá thực trả và giá niêm yết của một sản phẩm.
 *
 * Backend đã tính sẵn `effective_price` (flash sale đang chạy > sale_price > price)
 * ở utils/price.js — đây chỉ là lớp đọc, có fallback cho dữ liệu mẫu offline và
 * cho các endpoint chưa kèm trường này.
 *
 * Trả về { price, listPrice, hasDiscount, discountPct }; listPrice chỉ khác price
 * khi đang thực sự giảm giá, để component biết lúc nào cần gạch ngang giá cũ.
 */
export function priceOf(p = {}) {
  const list = Number(p.price ?? 0);
  const raw = p.effective_price ?? p.effectivePrice ?? p.sale_price ?? p.salePrice;
  const eff = raw != null && Number(raw) > 0 ? Number(raw) : list;
  const price = eff > 0 && eff < list ? eff : list;
  const hasDiscount = price < list;

  return {
    price,
    listPrice: list,
    hasDiscount,
    discountPct: discountPct(list, price),
  };
}

export const telHref = (phone) => `tel:${String(phone || "").replace(/[\s.]/g, "")}`;

const MAP_EMBED_PREFIX = "https://www.google.com/maps/embed";

export const normalizeMapEmbed = (value) => {
  const v = String(value || "").trim();
  const iframe = v.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
  return iframe ? iframe[1].trim() : v;
};

export const isMapEmbed = (url) => String(url || "").startsWith(MAP_EMBED_PREFIX);

export const mapSearchHref = (address) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || "")}`;

/* image with graceful fallback to striped placeholder */
export function Img({ src, alt = "", label = "ảnh", style, className = "", ...rest }) {
  const [err, setErr] = useState(false);
  if (err || !src) {
    return (
      <div className={"ph-fallback " + className} style={style} {...rest}>
        {label}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setErr(true)}
      className={className}
      style={{ objectFit: "cover", width: "100%", height: "100%", ...style }}
      {...rest}
    />
  );
}


const SOCIAL_PATHS = {
  facebook: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  instagram: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z",
  youtube: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  tiktok: "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.17a8.16 8.16 0 0 0 4.78 1.52V7.25a4.85 4.85 0 0 1-1.01-.56z",
};

export function SocialIcon({ name, size = 17, style }) {
  const d = SOCIAL_PATHS[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export function Icon({ name, size = 18, stroke = 1.6, style, fill = "none" }) {
  const c = "currentColor";
  const common = {
    width: size, height: size, viewBox: "0 0 24 24", fill,
    stroke: c, strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round", style,
  };
  const P = {
    cart: <><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2.5 3h2l2.2 12.2a1.6 1.6 0 0 0 1.6 1.3h8.3a1.6 1.6 0 0 0 1.6-1.3L21 7H6" /></>,
    heart: <path d="M12 20.5 4.3 13a4.6 4.6 0 0 1 6.5-6.5l1.2 1.2 1.2-1.2A4.6 4.6 0 1 1 19.7 13z" />,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    arrowR: <path d="m9 6 6 6-6 6" />,
    arrowL: <path d="m15 6-6 6 6 6" />,
    check: <path d="M20 6 9 17l-5-5" />,
    shield: <><path d="M12 2 4 5v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V5z" /><path d="m9 12 2 2 4-4" /></>,
    truck: <><path d="M3 6h11v9H3z" /><path d="M14 9h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.6" /><circle cx="17.5" cy="18" r="1.6" /></>,
    refresh: <><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></>,
    filter: <path d="M3 5h18l-7 8v6l-4-2v-4z" />,
    chevD: <path d="m6 9 6 6 6-6" />,
    grid: <><path d="M3 3h7v7H3z" /><path d="M14 3h7v7h-7z" /><path d="M14 14h7v7h-7z" /><path d="M3 14h7v7H3z" /></>,
    gear: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
    star: <path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9z" />,
    menu: <><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></>,
    close: <><path d="M6 6l12 12" /><path d="M18 6 6 18" /></>,
    phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />,
    pin: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="2.6" /></>,
    mail: <><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></>,
    clock: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
    leaf: <><path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 16-9 0 8-4 13-9 13" /><path d="M4 20c2-4 5-7 9-9" /></>,
    fire: <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />,
    chat: <><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.9-.9L3 21l1.9-4.6A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4z" /><path d="M8.5 11.5h.01" /><path d="M12 11.5h.01" /><path d="M15.5 11.5h.01" /></>,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    eye: <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>,
    eyeOff: <><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" /></>,
  };
  return <svg {...common} aria-hidden="true">{P[name] || null}</svg>;
}

export function Stars({ value = 5, size = 12 }) {
  return (
    <span style={{ display: "inline-flex", gap: 1, color: "var(--orange)" }}>
      {[0, 1, 2, 3, 4].map(i => (
        <Icon key={i} name="star" size={size} fill={i < Math.round(value) ? "var(--orange)" : "none"} stroke={1.4} style={{ color: i < Math.round(value) ? "var(--orange)" : "#d7ddd8" }} />
      ))}
    </span>
  );
}

export function ColorDots({ colors = ["#c9bfa6", "#2f6b46", "#1d2722"] }) {
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
      {colors.map((c, i) => (
        <span key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: c, boxShadow: i === 0 ? "0 0 0 1.5px #fff, 0 0 0 2.6px var(--green)" : "0 0 0 1px rgba(0,0,0,.12)" }} />
      ))}
    </span>
  );
}

/* scroll reveal hook — call once in App */
export function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });

    // Observe any .reveal already in the DOM
    const observe = (root = document) => {
      root.querySelectorAll(".reveal:not(.in)").forEach((el) => io.observe(el));
    };
    observe();

    // Also observe .reveal elements added later (after async API calls)
    const mo = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.classList?.contains("reveal") && !node.classList.contains("in")) io.observe(node);
          node.querySelectorAll?.(".reveal:not(.in)").forEach((el) => io.observe(el));
        });
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => { io.disconnect(); mo.disconnect(); };
  }, []); // run only once on mount
}

/* toast — stackable notification system with auto-dismiss and close buttons */
export function toast(msg, type = "success") {
  if (msg && typeof msg === "object") {
    msg = msg.message || JSON.stringify(msg);
    type = "error";
  }

  const lowerMsg = String(msg).toLowerCase();
  if (type === "success") {
    if (
      lowerMsg.includes("lỗi") ||
      lowerMsg.includes("thất bại") ||
      lowerMsg.includes("không tìm thấy") ||
      lowerMsg.includes("từ chối") ||
      lowerMsg.includes("chưa") ||
      lowerMsg.includes("quá ngắn") ||
      lowerMsg.includes("error")
    ) {
      type = "error";
    } else if (lowerMsg.includes("cảnh báo") || lowerMsg.includes("vui lòng")) {
      type = "warning";
    } else if (lowerMsg.includes("thông tin") || lowerMsg.includes("lưu ý")) {
      type = "info";
    }
  }

  let container = document.getElementById("nq-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "nq-toast-container";
    document.body.appendChild(container);
  }

  const item = document.createElement("div");
  item.className = `toast-item ${type}`;

  const icons = {
    success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
    error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e04a4a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
    warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--orange)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
    info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
  };

  item.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.success}</div>
    <div class="toast-content">${msg}</div>
    <div class="toast-close">&times;</div>
  `;

  if (container.firstChild) {
    container.insertBefore(item, container.firstChild);
  } else {
    container.appendChild(item);
  }

  setTimeout(() => item.classList.add("show"), 10);

  const dismissToast = () => {
    item.classList.add("fade-out");
    setTimeout(() => {
      if (item.parentNode) item.parentNode.removeChild(item);
    }, 350);
  };

  let dismissTimer = setTimeout(dismissToast, 4000);

  item.querySelector(".toast-close").addEventListener("click", () => {
    clearTimeout(dismissTimer);
    dismissToast();
  });
}

toast.success = (msg) => toast(msg, "success");
toast.error = (msg) => toast(msg, "error");
toast.warning = (msg) => toast(msg, "warning");
toast.info = (msg) => toast(msg, "info");

/* confirm — Promise-based premium modal dialog overlay */
export function confirm(msg, title = "Xác nhận xóa") {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "confirm-overlay";

    overlay.innerHTML = `
      <div class="confirm-box">
        <div class="confirm-hdr">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e04a4a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          <span class="confirm-title">${title}</span>
        </div>
        <div class="confirm-body">${msg}</div>
        <div class="confirm-ftr">
          <button class="confirm-btn cancel">Hủy</button>
          <button class="confirm-btn confirm-action">Xác nhận</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    setTimeout(() => overlay.classList.add("show"), 10);

    const close = (result) => {
      overlay.classList.remove("show");
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
        resolve(result);
      }, 250);
    };

    overlay.querySelector(".cancel").addEventListener("click", () => close(false));
    overlay.querySelector(".confirm-action").addEventListener("click", () => close(true));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close(false);
    });
  });
}
