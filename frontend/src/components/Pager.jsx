import { Fragment } from "react";

/**
 * Thanh phân trang dùng chung cho các bảng quản trị.
 *
 * Chỉ hiện nút số quanh trang hiện tại kèm trang đầu / trang cuối. Cách cũ là
 * liệt kê đủ mọi trang, cửa hàng chạy được vài tháng thì bảng đơn hàng lên
 * hàng trăm trang và dãy nút tràn ngang hết màn hình.
 *
 * @param {number} page      Trang đang xem (bắt đầu từ 1)
 * @param {object} meta      { total, totalPages } trả về từ API
 * @param {string} unit      Danh từ đếm hiển thị ở cuối, ví dụ "đơn hàng"
 * @param {(p:number)=>void} onChange
 */
export function Pager({ page, meta, unit = "mục", onChange }) {
  const totalPages = meta?.totalPages ?? 1;
  if (totalPages <= 1) return null;

  const pages = [];
  const push = (p) => { if (p >= 1 && p <= totalPages && !pages.includes(p)) pages.push(p); };
  push(1);
  for (let p = page - 2; p <= page + 2; p++) push(p);
  push(totalPages);
  pages.sort((a, b) => a - b);

  return (
    <div className="admin-pager">
      <button className="page-btn" disabled={page <= 1} onClick={() => onChange(page - 1)}>‹</button>

      {pages.map((p, i) => (
        <Fragment key={p}>
          {i > 0 && p - pages[i - 1] > 1 && <span className="admin-pager-gap">…</span>}
          <button
            className={`page-btn ${p === page ? "active" : ""}`}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        </Fragment>
      ))}

      <button className="page-btn" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>›</button>

      <span className="admin-pager-info">
        Trang {page} / {totalPages} ({meta.total} {unit})
      </span>
    </div>
  );
}
