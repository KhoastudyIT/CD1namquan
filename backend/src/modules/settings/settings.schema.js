import { z } from 'zod';

const optionalUrl = (max) => z.union([z.literal(''), z.string().trim().url('Phải là URL đầy đủ, có https://').max(max)]);
const MAP_EMBED_PREFIX = 'https://www.google.com/maps/embed';

export function normalizeMapEmbed(value) {
  if (typeof value !== 'string') return value;
  const iframe = value.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
  return (iframe ? iframe[1] : value).trim();
}

const mapEmbedUrl = z.preprocess(
  normalizeMapEmbed,
  z.union([
    z.literal(''),
    z.string()
      .max(4096)
      .startsWith(MAP_EMBED_PREFIX, `Phải là mã nhúng Google Maps (bắt đầu bằng ${MAP_EMBED_PREFIX})`),
  ]),
);

export const updateCompanyInfoSchema = z.object({
  companyName: z.string().trim().min(1, 'Tên công ty là bắt buộc').max(255).optional(),
  slogan: z.string().trim().max(500).optional(),
  about: z.string().trim().max(5000).optional(),
  mission: z.string().trim().max(5000).optional(),
  vision: z.string().trim().max(5000).optional(),
  phone: z.string().trim().max(50).optional(),
  email: z.union([z.literal(''), z.string().trim().email('Email không hợp lệ').max(255)]).optional(),
  address: z.string().trim().max(1000).optional(),
  mapUrl: mapEmbedUrl.optional(),
  facebook: optionalUrl(500).optional(),
  instagram: optionalUrl(500).optional(),
  youtube: optionalUrl(500).optional(),
  tiktok: optionalUrl(500).optional(),
  logo: z.string().trim().max(500).optional(),
});
