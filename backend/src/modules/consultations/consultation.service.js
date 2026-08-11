import db from '../../db/index.js';
import { AppError } from '../../middleware/errorHandler.js';

function mapRow(row) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    serviceType: row.service_type,
    propertyType: row.property_type,
    area: row.area,
    budget: row.budget,
    address: row.address,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SORT_SQL = {
  newest: 'created_at DESC, id DESC',
  oldest: 'created_at ASC, id ASC',
};


const RESUBMIT_COOLDOWN = '60 seconds';

// ── Public ───────────────────────────────────────────────────────────────────

export async function createConsultation(data) {
  const recent = await db.query(
    `SELECT 1 FROM consultation_requests
     WHERE phone = $1 AND created_at > NOW() - INTERVAL '${RESUBMIT_COOLDOWN}'
     LIMIT 1`,
    [data.phone],
  );
  if (recent.rows.length > 0) {
    throw new AppError('Yêu cầu của bạn đã được ghi nhận, vui lòng chờ chúng tôi liên hệ.', 429);
  }

  const res = await db.query(
    `INSERT INTO consultation_requests (
       name, phone, email, service_type, property_type, area, budget, address, message
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      data.name,
      data.phone,
      data.email,
      data.serviceType,
      data.propertyType,
      data.area,
      data.budget,
      data.address,
      data.message,
    ],
  );

  return mapRow(res.rows[0]);
}

// ── Admin ────────────────────────────────────────────────────────────────────

export async function listConsultations({ page, limit, status, search, sort }) {
  const params = [];
  const where = [];

  if (status) {
    params.push(status);
    where.push(`status = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    where.push(`(
      unaccent(lower(name)) LIKE unaccent(lower($${params.length}))
      OR phone LIKE $${params.length}
      OR lower(email) LIKE lower($${params.length})
    )`);
  }

  const whereSql = where.length ? ` WHERE ${where.join(' AND ')}` : '';

  const countRes = await db.query(
    `SELECT COUNT(*) FROM consultation_requests${whereSql}`,
    params,
  );
  const total = parseInt(countRes.rows[0].count, 10);

  const listParams = [...params, limit, (page - 1) * limit];
  const res = await db.query(
    `SELECT * FROM consultation_requests${whereSql}
     ORDER BY ${SORT_SQL[sort] || SORT_SQL.newest}
     LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
    listParams,
  );

  return {
    data: res.rows.map(mapRow),
    meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function countConsultationsByStatus() {
  const res = await db.query(
    'SELECT status, COUNT(*)::int AS count FROM consultation_requests GROUP BY status',
  );
  const counts = { total: 0 };
  for (const row of res.rows) {
    counts[row.status] = row.count;
    counts.total += row.count;
  }
  return counts;
}

export async function getConsultationById(id) {
  const res = await db.query('SELECT * FROM consultation_requests WHERE id = $1', [id]);
  if (res.rows.length === 0) throw new AppError('Không tìm thấy yêu cầu tư vấn', 404);
  return mapRow(res.rows[0]);
}

export async function updateConsultationStatus(id, status) {
  const res = await db.query(
    'UPDATE consultation_requests SET status = $1 WHERE id = $2 RETURNING *',
    [status, id],
  );
  if (res.rows.length === 0) throw new AppError('Không tìm thấy yêu cầu tư vấn', 404);
  return mapRow(res.rows[0]);
}

export async function deleteConsultation(id) {
  const res = await db.query(
    'DELETE FROM consultation_requests WHERE id = $1 RETURNING id',
    [id],
  );
  if (res.rows.length === 0) throw new AppError('Không tìm thấy yêu cầu tư vấn', 404);
}
