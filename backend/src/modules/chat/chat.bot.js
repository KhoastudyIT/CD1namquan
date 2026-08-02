/**
 * Bot tư vấn theo luật (không gọi API AI bên ngoài). Mọi câu trả lời lấy từ dữ
 * liệu thật trong DB: thà nói "chưa có thông tin" rồi mời gặp nhân viên, còn
 * hơn trả lời sai về giá hay tồn kho.
 */
import db from '../../db/index.js';

/** Bỏ dấu để khách gõ không dấu vẫn khớp từ khoá. */
export function normalize(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const vnd = (n) => Number(n || 0).toLocaleString('vi-VN');

/**
 * Bảng ý định. Xếp từ CỤ THỂ đến CHUNG CHUNG: quét theo thứ tự và lấy cái
 * khớp đầu tiên, nên "gặp nhân viên" phải đứng trên "tư vấn" chung chung.
 */
const INTENTS = [
  { key: 'handoff', keywords: ['gap nhan vien', 'gap nguoi', 'nguoi that', 'tu van vien', 'nhan vien tu van', 'gap tu van', 'noi chuyen voi nguoi', 'chat voi nhan vien', 'can nguoi ho tro'] },
  { key: 'greeting', keywords: ['xin chao', 'chao shop', 'chao ban', 'hello', 'alo', 'hi shop'] },
  { key: 'thanks', keywords: ['cam on', 'thanks', 'thank you', 'tks'] },
  { key: 'price', keywords: ['gia bao nhieu', 'bao nhieu tien', 'gia the nao', 'gia sao', 'gia', 'bao nhieu', 'mac khong', 're khong'] },
  { key: 'stock', keywords: ['con hang', 'con khong', 'con hay het', 'het hang', 'ton kho', 'san co', 'con bao nhieu cai', 'co san'] },
  { key: 'material', keywords: ['chat lieu', 'lam bang gi', 'lam tu gi', 'go gi', 'vai gi', 'da that', 'da cong nghiep', 'nguyen lieu'] },
  { key: 'size', keywords: ['kich thuoc', 'kich co', 'size', 'dai rong cao', 'bao lon', 'to khong', 'do dai', 'rong bao nhieu', 'dai bao nhieu'] },
  { key: 'color', keywords: ['mau sac', 'mau gi', 'co mau', 'mau nao', 'mau'] },
  { key: 'warranty', keywords: ['bao hanh', 'bao hanh bao lau', 'che do bao hanh'] },
  { key: 'origin', keywords: ['xuat xu', 'nhap khau', 'san xuat o dau', 'hang cua nuoc nao', 'made in'] },
  { key: 'shipping', keywords: ['giao hang', 'van chuyen', 'ship', 'phi ship', 'freeship', 'mien phi van chuyen', 'giao bao lau', 'lap dat'] },
  { key: 'payment', keywords: ['thanh toan', 'tra gop', 'chuyen khoan', 'cod', 'tra sau', 'quet the'] },
  { key: 'returns', keywords: ['doi tra', 'hoan tien', 'tra lai hang', 'doi hang', 'chinh sach doi'] },
  { key: 'promo', keywords: ['khuyen mai', 'giam gia', 'uu dai', 'sale', 'ma giam', 'voucher', 'coupon', 'flash sale'] },
  { key: 'showroom', keywords: ['showroom', 'cua hang', 'dia chi', 'o dau', 'den xem', 'xem truc tiep'] },
  { key: 'contact', keywords: ['hotline', 'so dien thoai', 'lien he', 'sdt', 'email'] },
  { key: 'suggest', keywords: ['tu van', 'goi y', 'nen mua', 'phu hop', 'recommend', 'mau nao dep', 'co gi'] },
];

/**
 * Trả về key ý định đầu tiên khớp, hoặc '' nếu không nhận ra.
 *
 * So khớp theo TỪ chứ không theo chuỗi con, và bỏ dấu câu trước khi so. Nếu
 * so chuỗi con thì "chính sách giao hàng" sẽ dính từ khoá 'gia' nằm trong
 * "giao" và bị hiểu nhầm thành câu hỏi giá.
 */
export function detectIntent(normalizedText) {
  const haystack = ` ${normalizedText.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()} `;
  for (const { key, keywords } of INTENTS) {
    if (keywords.some(kw => haystack.includes(` ${kw} `))) return key;
  }
  return '';
}

/** Ý định chỉ trả lời được khi biết đang hỏi sản phẩm nào. */
const PRODUCT_INTENTS = new Set(['price', 'stock', 'material', 'size', 'color', 'warranty', 'origin']);

/**
 * Từ dừng: loại khỏi câu hỏi trước khi đem đi tìm sản phẩm, nếu không thì
 * "cái bàn này giá bao nhiêu" sẽ đi tìm sản phẩm tên "cái" hoặc "này".
 */
const STOP_WORDS = new Set([
  'cho', 'toi', 'minh', 'ban', 'shop', 'em', 'anh', 'chi', 'a', 'the', 'la', 'co', 'khong',
  'gia', 'bao', 'nhieu', 'tien', 'nay', 'kia', 'do', 'nhu', 'nao', 'gi', 'va', 'voi', 'cai',
  'chiec', 'bo', 'muon', 'can', 'hoi', 'xin', 'duoc', 'o', 'tai', 've', 'con', 'hang', 'san',
  'pham', 'mua', 'xem', 'tu', 'van', 'giup', 'a', 'ap', 'thi', 'ma', 'de', 'khi', 'sao',
]);

function keywordTokens(normalizedText) {
  return normalizedText
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(' ')
    .filter(t => t.length >= 2 && !STOP_WORDS.has(t));
}

const PRODUCT_COLS = [
  'id', 'name', 'slug', 'type', 'price', 'sale_price', 'img', 'stock', 'rating', 'sold',
  'short_desc', 'category_name', 'brand_name',
  'material', 'color', 'dimensions', 'warranty', 'origin', 'style', 'room',
];
const fields = (alias) => PRODUCT_COLS.map(c => `${alias}.${c}`).join(', ');

function toCard(p) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: Number(p.price),
    salePrice: p.sale_price == null ? null : Number(p.sale_price),
    img: p.img,
  };
}

async function findProductById(id) {
  const res = await db.query(
    `SELECT ${fields('v')} FROM vw_product_detail v WHERE v.id = $1`, [id],
  );
  return res.rows[0] || null;
}

/**
 * Tìm sản phẩm theo tên trong câu hỏi. Cho điểm theo số token khớp để
 * "sofa da milano" ưu tiên đúng mẫu Milano thay vì mọi sofa da trong shop.
 */
async function searchProducts(normalizedText, limit = 4) {
  const tokens = keywordTokens(normalizedText);
  if (tokens.length === 0) return [];

  // unaccent() cho phép khách gõ "ghe an go soi" vẫn khớp "Ghế Ăn Gỗ Sồi".
  const searchable = `unaccent(lower(v.name || ' ' || v.type || ' ' || COALESCE(v.category_name, '')))`;
  const productName = `unaccent(lower(v.name))`;

  const tokenScore = tokens
    .map((_, i) => `(CASE WHEN ${searchable} LIKE '%' || unaccent($${i + 1}) || '%' THEN 1 ELSE 0 END)`)
    .join(' + ');

  // Khách gõ trọn tên một mẫu thì mẫu đó thắng tuyệt đối. Không có vế này,
  // "Vòi Rửa Tay Rinto" hoà điểm với "Vòi Rửa Tay Rinto Vuông" và mọi biến
  // thể khác (đều chứa đủ 4 từ), khiến bot phải hỏi lại một cách vô lý.
  const exactScore =
    `(CASE WHEN unaccent($${tokens.length + 1}) LIKE '%' || ${productName} || '%' THEN 100 ELSE 0 END)`;

  const res = await db.query(
    `SELECT * FROM (
       SELECT ${fields('v')}, ${tokenScore} + ${exactScore} AS score
       FROM vw_product_detail v
       WHERE v.status = 'active'
     ) matched
     WHERE matched.score > 0
     ORDER BY matched.score DESC,
       -- Cùng điểm thì tên NGẮN hơn là khớp sát hơn.
       length(matched.name) ASC,
       matched.sold DESC
     LIMIT $${tokens.length + 2}`,
    [...tokens, normalizedText, limit],
  );
  return res.rows;
}

async function topProducts(limit = 4) {
  const res = await db.query(
    `SELECT ${fields('v')} FROM vw_product_detail v
     WHERE v.status = 'active' ORDER BY v.sold DESC, v.rating DESC LIMIT $1`, [limit],
  );
  return res.rows;
}

async function activeFlashSales(limit = 4) {
  const res = await db.query(
    `SELECT product_id AS id, name, slug, price AS sale_price, original_price AS price, img
     FROM vw_active_flash_sales ORDER BY sold DESC LIMIT $1`, [limit],
  );
  return res.rows;
}

function priceLine(p) {
  const hasSale = p.sale_price != null && Number(p.sale_price) < Number(p.price);
  if (!hasSale) return `Giá niêm yết: **${vnd(p.price)} đ**.`;
  const off = Math.round((1 - Number(p.sale_price) / Number(p.price)) * 100);
  return `Giá gốc ${vnd(p.price)} đ, đang ưu đãi còn **${vnd(p.sale_price)} đ** (giảm ${off}%).`;
}

function stockLine(p) {
  const stock = Number(p.stock);
  if (stock <= 0) return 'Hiện **đang hết hàng**. Anh/chị để lại số điện thoại, NAM QUAN sẽ báo ngay khi có hàng về.';
  if (stock <= 5) return `Còn **${stock} sản phẩm** cuối cùng — số lượng có hạn ạ.`;
  return `**Còn hàng**, kho hiện có ${stock} sản phẩm, đặt là giao được ngay.`;
}

/**
 * Trả lời một trường thông số. Trả về null khi DB chưa có dữ liệu — người gọi
 * sẽ chuyển sang câu "chưa có thông tin, để nhân viên hỗ trợ".
 */
function specLine(p, intent) {
  const specs = {
    material: { value: p.material, label: 'Chất liệu' },
    size: { value: p.dimensions, label: 'Kích thước' },
    color: { value: p.color, label: 'Màu sắc' },
    warranty: { value: p.warranty, label: 'Bảo hành' },
    origin: { value: p.origin, label: 'Xuất xứ' },
  };
  const spec = specs[intent];
  if (!spec || !spec.value || !String(spec.value).trim()) return null;
  return `${spec.label}: **${spec.value}**.`;
}

function productSummary(p) {
  const lines = [`**${p.name}**`, priceLine(p), stockLine(p)];
  const specs = [
    p.material && `chất liệu ${p.material}`,
    p.dimensions && `kích thước ${p.dimensions}`,
    p.color && `màu ${p.color}`,
    p.warranty && `bảo hành ${p.warranty}`,
  ].filter(Boolean);
  if (specs.length) lines.push(`Thông số: ${specs.join(', ')}.`);
  return lines.join('\n');
}

const POLICY_ANSWERS = {
  shipping: 'NAM QUAN **miễn phí giao hàng và lắp đặt** trong nội thành TP.HCM và Hà Nội với đơn từ 5.000.000 đ.\n• Nội thành: 1–3 ngày làm việc\n• Tỉnh thành khác: 3–7 ngày, phí tính theo khối lượng và khoảng cách\nNhân viên sẽ gọi hẹn giờ trước khi giao ạ.',
  payment: 'Shop hỗ trợ các hình thức:\n• Thanh toán khi nhận hàng (COD)\n• Chuyển khoản ngân hàng\n• Quẹt thẻ tại showroom\n• **Trả góp 0%** qua thẻ tín dụng cho đơn từ 10.000.000 đ\nAnh/chị muốn dùng hình thức nào để em hướng dẫn chi tiết ạ?',
  returns: 'Chính sách đổi trả của NAM QUAN:\n• **Đổi trả trong 7 ngày** nếu sản phẩm còn nguyên tem, chưa qua sử dụng\n• **Lỗi do nhà sản xuất: đổi mới trong 30 ngày**, shop chịu toàn bộ phí vận chuyển\n• Bảo hành theo từng sản phẩm, tính từ ngày nhận hàng\nAnh/chị cần đổi trả đơn nào để em kiểm tra giúp ạ?',
  showroom: 'Anh/chị có thể ghé showroom NAM QUAN để xem và trải nghiệm trực tiếp. Thông tin địa chỉ và giờ mở cửa của từng showroom nằm ở cuối trang web ạ. Nếu muốn được đón tiếp riêng, anh/chị để lại thời gian dự kiến, em sẽ nhờ nhân viên sắp lịch.',
  contact: 'Anh/chị để lại số điện thoại và khung giờ tiện nghe máy, nhân viên NAM QUAN sẽ liên hệ tư vấn trực tiếp ạ. Hoặc anh/chị gõ **"gặp nhân viên"** để em chuyển hội thoại này cho bộ phận chăm sóc khách hàng ngay.',
};

const QUICK_HELP = 'Em có thể giúp anh/chị tra cứu **giá, tồn kho, chất liệu, kích thước, màu sắc, bảo hành, xuất xứ** của từng sản phẩm, cùng các chính sách **giao hàng, thanh toán, đổi trả, khuyến mãi**.\nAnh/chị cứ nhắn tên sản phẩm kèm điều muốn biết, ví dụ *"sofa Milano còn hàng không"*. Cần nhân viên tư vấn hỗ trợ thì gõ **"gặp nhân viên"** ạ.';

/**
 * Sinh câu trả lời của bot.
 *
 * @param {object} params
 * @param {string} params.text          Nội dung khách vừa gửi
 * @param {number|null} params.productId Sản phẩm khách gửi kèm (từ trang chi tiết)
 * @param {number|null} params.lastProductId Sản phẩm nhắc gần nhất trong hội thoại
 * @returns {Promise<{message: string, intent: string, productId: number|null,
 *                    suggestions: object[], handoff: boolean}>}
 */
export async function generateReply({ text, productId = null, lastProductId = null }) {
  const normalized = normalize(text);
  const intent = detectIntent(normalized);

  const reply = (message, extra = {}) => ({
    message,
    intent: intent || 'unknown',
    productId: extra.productId ?? null,
    suggestions: extra.suggestions ?? [],
    handoff: extra.handoff ?? false,
  });

  // ── Chuyển cho nhân viên: xử lý trước mọi ý định khác ─────────────────────
  if (intent === 'handoff') {
    return reply(
      'Em đã chuyển hội thoại này cho nhân viên tư vấn của NAM QUAN. Anh/chị vui lòng đợi trong giây lát, sẽ có người phản hồi ngay tại đây ạ.\nTrong lúc chờ, anh/chị có thể để lại nội dung cần hỗ trợ để nhân viên nắm trước.',
      { handoff: true, productId: productId ?? lastProductId ?? null },
    );
  }

  if (intent === 'greeting') {
    return reply(`Chào anh/chị, NAM QUAN rất vui được hỗ trợ ạ.\n${QUICK_HELP}`);
  }

  if (intent === 'thanks') {
    return reply('Dạ, rất vui được hỗ trợ anh/chị. Nếu cần thêm thông tin gì về sản phẩm hay đơn hàng, anh/chị cứ nhắn em bất cứ lúc nào ạ.');
  }

  if (POLICY_ANSWERS[intent]) {
    return reply(POLICY_ANSWERS[intent]);
  }

  if (intent === 'promo') {
    const sales = await activeFlashSales();
    if (sales.length === 0) {
      return reply('Hiện chưa có chương trình flash sale nào đang chạy ạ. Anh/chị theo dõi mục **Flash Sale** ở trang chủ hoặc để lại email, shop sẽ báo ngay khi có đợt ưu đãi mới.');
    }
    return reply(
      `Đang có **${sales.length} sản phẩm** trong chương trình flash sale ạ. Anh/chị xem thử các mẫu bên dưới nhé:`,
      { suggestions: sales.map(toCard) },
    );
  }

  // ── Xác định sản phẩm đang được hỏi ───────────────────────────────────────
  let product = null;
  let matches = [];

  if (productId) {
    product = await findProductById(productId);
  }
  if (!product) {
    matches = await searchProducts(normalized);
    // Chỉ tự tin chốt một sản phẩm khi kết quả đầu vượt trội hơn kết quả nhì.
    // Ngang điểm nghĩa là câu hỏi mơ hồ ("sofa da") — nên hỏi lại, đừng đoán.
    if (matches.length === 1 || (matches.length > 1 && matches[0].score > matches[1].score)) {
      product = matches[0];
    }
  }
  // Chỉ nhớ lại sản phẩm cũ khi câu hỏi KHÔNG nhắc tên sản phẩm nào ("giá bao
  // nhiêu?"). Nếu khách vừa gõ tên một mẫu khác, dùng last_product_id là trả
  // lời sai hẳn sản phẩm — đúng lỗi "hỏi mẫu khác mà bot vẫn nói mẫu cũ".
  if (!product && matches.length === 0 && lastProductId && PRODUCT_INTENTS.has(intent)) {
    product = await findProductById(lastProductId);
  }

  if (!product && matches.length > 1) {
    return reply(
      'Em tìm được vài mẫu phù hợp với mô tả của anh/chị. Anh/chị đang quan tâm mẫu nào ạ?',
      { suggestions: matches.map(toCard) },
    );
  }

  // ── Trả lời theo ý định, dựa trên dữ liệu sản phẩm thật ───────────────────
  if (product) {
    const card = [toCard(product)];

    if (intent === 'price') {
      return reply(`**${product.name}**\n${priceLine(product)}\n${stockLine(product)}`,
        { productId: product.id, suggestions: card });
    }
    if (intent === 'stock') {
      return reply(`**${product.name}**\n${stockLine(product)}`,
        { productId: product.id, suggestions: card });
    }
    if (PRODUCT_INTENTS.has(intent)) {
      const line = specLine(product, intent);
      if (line) {
        return reply(`**${product.name}**\n${line}`, { productId: product.id, suggestions: card });
      }
      // DB chưa nhập thông số này — nói thật thay vì bịa.
      return reply(
        `Thông tin này của **${product.name}** chưa được cập nhật đầy đủ trên hệ thống ạ. Anh/chị gõ **"gặp nhân viên"** để em nhờ bộ phận tư vấn kiểm tra và phản hồi chính xác nhất nhé.`,
        { productId: product.id, suggestions: card },
      );
    }
    return reply(productSummary(product), { productId: product.id, suggestions: card });
  }

  // ── Không xác định được sản phẩm ──────────────────────────────────────────
  if (PRODUCT_INTENTS.has(intent)) {
    const popular = await topProducts();
    return reply(
      'Anh/chị cho em xin **tên sản phẩm** cần hỏi với ạ, để em tra đúng thông tin. Hoặc anh/chị chọn nhanh một trong các mẫu đang được quan tâm nhất:',
      { suggestions: popular.map(toCard) },
    );
  }

  if (intent === 'suggest') {
    const popular = await topProducts();
    return reply(
      'Để tư vấn sát nhất, anh/chị cho em biết **không gian cần bố trí** (phòng khách, phòng ngủ, văn phòng…) và **ngân sách dự kiến** nhé. Trong lúc đó, đây là các mẫu bán chạy nhất của NAM QUAN:',
      { suggestions: popular.map(toCard) },
    );
  }

  return reply(`Em chưa hiểu rõ ý anh/chị ạ.\n${QUICK_HELP}`);
}
