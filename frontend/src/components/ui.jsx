/* ============ NAM QUAN — UI primitives ============ */
import { useState, useEffect } from "react";

export const vnd = (n) => n.toLocaleString("vi-VN");

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

/* tiny inline icon set (stroke) */
export function Icon({ name, size = 18, stroke = 1.6, style, fill = "none" }) {
  const c = "currentColor";
  const common = {
    width: size, height: size, viewBox: "0 0 24 24", fill,
    stroke: c, strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round", style,
  };
  const P = {
    cart: <><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2.5 3h2l2.2 12.2a1.6 1.6 0 0 0 1.6 1.3h8.3a1.6 1.6 0 0 0 1.6-1.3L21 7H6"/></>,
    heart: <path d="M12 20.5 4.3 13a4.6 4.6 0 0 1 6.5-6.5l1.2 1.2 1.2-1.2A4.6 4.6 0 1 1 19.7 13z"/>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></>,
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    arrowR: <path d="m9 6 6 6-6 6"/>,
    arrowL: <path d="m15 6-6 6 6 6"/>,
    check: <path d="M20 6 9 17l-5-5"/>,
    shield: <><path d="M12 2 4 5v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V5z"/><path d="m9 12 2 2 4-4"/></>,
    truck: <><path d="M3 6h11v9H3z"/><path d="M14 9h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17.5" cy="18" r="1.6"/></>,
    refresh: <><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></>,
    filter: <path d="M3 5h18l-7 8v6l-4-2v-4z"/>,
    chevD: <path d="m6 9 6 6 6-6"/>,
    star: <path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9z"/>,
    menu: <><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/></>,
    close: <><path d="M6 6l12 12"/><path d="M18 6 6 18"/></>,
    phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>,
    pin: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="2.6"/></>,
    leaf: <><path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 16-9 0 8-4 13-9 13"/><path d="M4 20c2-4 5-7 9-9"/></>,
  };
  return <svg {...common} aria-hidden="true">{P[name] || null}</svg>;
}

export function Stars({ value = 5, size = 12 }) {
  return (
    <span style={{ display: "inline-flex", gap: 1, color: "var(--orange)" }}>
      {[0,1,2,3,4].map(i => (
        <Icon key={i} name="star" size={size} fill={i < Math.round(value) ? "var(--orange)" : "none"} stroke={1.4} style={{ color: i < Math.round(value) ? "var(--orange)" : "#d7ddd8" }} />
      ))}
    </span>
  );
}

export function ColorDots({ colors = ["#c9bfa6","#2f6b46","#1d2722"] }) {
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
      {colors.map((c, i) => (
        <span key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: c, boxShadow: i===0 ? "0 0 0 1.5px #fff, 0 0 0 2.6px var(--green)" : "0 0 0 1px rgba(0,0,0,.12)" }} />
      ))}
    </span>
  );
}

/* scroll reveal hook — call once in App */
export function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  });
}

/* toast — lazily creates its own DOM node */
let toastTimer;
export function toast(msg) {
  let el = document.getElementById("nq-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "nq-toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}
