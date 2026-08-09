import db from '../../db/index.js';
import { dbCache } from '../../db/store.js';
import { normalizeMapEmbed } from './settings.schema.js';

const ROW_ID = 1;

const CACHE_KEY = 'settings:company';

const FALLBACK_NAME = 'NAM QUAN';

const COLS = `
  id,
  company_name AS "companyName",
  slogan,
  about,
  mission,
  vision,
  phone,
  email,
  address,
  map_url      AS "mapUrl",
  facebook,
  instagram,
  youtube,
  tiktok,
  logo,
  updated_at   AS "updatedAt"
`;

const COLUMN_OF = {
  companyName: 'company_name',
  slogan: 'slogan',
  about: 'about',
  mission: 'mission',
  vision: 'vision',
  phone: 'phone',
  email: 'email',
  address: 'address',
  mapUrl: 'map_url',
  facebook: 'facebook',
  instagram: 'instagram',
  youtube: 'youtube',
  tiktok: 'tiktok',
  logo: 'logo',
};

export async function getCompanyInfo() {
  const cached = dbCache.get(CACHE_KEY);
  if (cached) return cached;

  const res = await db.query(`SELECT ${COLS} FROM company_info WHERE id = $1`, [ROW_ID]);
  let row = res.rows[0];

  if (!row) {
    const created = await db.query(
      `INSERT INTO company_info (id, company_name) VALUES ($1, $2)
       ON CONFLICT (id) DO NOTHING
       RETURNING ${COLS}`,
      [ROW_ID, FALLBACK_NAME],
    );

    row = created.rows[0]
      ?? (await db.query(`SELECT ${COLS} FROM company_info WHERE id = $1`, [ROW_ID])).rows[0];
  }

  dbCache.set(CACHE_KEY, row, 600000);
  return row;
}

export async function updateCompanyInfo(input) {
  const data = input.mapUrl === undefined
    ? input
    : { ...input, mapUrl: normalizeMapEmbed(input.mapUrl) };

  const sets = [];
  const params = [];

  for (const [key, column] of Object.entries(COLUMN_OF)) {
    if (data[key] === undefined) continue;
    params.push(data[key]);
    sets.push(`${column} = $${params.length}`);
  }

  if (!sets.length) return getCompanyInfo();

  await getCompanyInfo();
  params.push(ROW_ID);

  const res = await db.query(
    `UPDATE company_info SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING ${COLS}`,
    params,
  );

  dbCache.delete(CACHE_KEY);
  return res.rows[0];
}
