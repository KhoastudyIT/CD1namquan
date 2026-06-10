/* ============ NAM QUAN — data ============ */

// Interior / furniture imagery (Unsplash CDN — loads in-browser, <Img> handles fallback)
const U = (id, w = 700) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const IMG = {
  heroLiving:   U("1618219740975-d40978bb7378", 1600),
  living1:      U("1586023492125-27b2c045efd7", 1200),
  living2:      U("1567538096630-e0c55bd6374c", 1000),
  modern:       U("1618220179428-22790b461013", 1000),
  luxury:       U("1616137466211-f939a420be84", 1000),
  minimal:      U("1567016432779-094069958ea5", 1000),
  bigRoom:      U("1600210492486-724fe5c67fb0", 1600),
  showroom:     U("1615875605825-5eb9bb5d52ac", 900),
  ctaChair:     U("1586023492125-27b2c045efd7", 900),
  footerChair:  U("1567538096630-e0c55bd6374c", 700),
  catSofa:      U("1555041469-a586c61ea9bc", 500),
  catChair:     U("1567538096630-e0c55bd6374c", 500),
  catTable:     U("1577140917170-285929fb55b7", 500),
  catBed:       U("1505693416388-ac5ce068fe85", 500),
  catOutdoor:   U("1600121848594-d8644e57abab", 500),
  catOffice:    U("1497366754035-f200968a6e72", 500),
  catDecor:     U("1602874801007-bd458bb1b8b6", 500),
  news1:        U("1567016376408-0226e4d0c1ea", 700),
  news2:        U("1556228453-efd6c1ff04f6", 700),
  news3:        U("1497366811353-6870744d04b2", 700),
};

const P = {
  sofaBeige:  U("1555041469-a586c61ea9bc", 600),
  vaseGreen:  U("1602874801007-bd458bb1b8b6", 600),
  armBlue:    U("1567538096630-e0c55bd6374c", 600),
  rattan:     U("1503602642458-232111445657", 600),
  bedClassic: U("1505693416388-ac5ce068fe85", 600),
  tableBlack: U("1577140917170-285929fb55b7", 600),
  sofaWhite:  U("1493663284031-b7e3aefcae8e", 600),
  drawer:     U("1595428774223-ef52624120d2", 600),
  deskWood:   U("1518455027359-f3f8164ba6bd", 600),
  armBeige:   U("1586023492125-27b2c045efd7", 600),
  sofaSlate:  U("1550254478-ead40cc54513", 600),
  armPink:    U("1519947486511-46149fa0a254", 600),
};

export const cats = ["Phòng khách", "Phòng ngủ", "Bếp", "Văn phòng", "Decor"];

function p(id, name, type, price, cat, img, rating, sold) {
  return { id, name, type, price, cat, img, rating, sold };
}

export const products = [
  p(1,  "Sofa Băng Vải Linen Mây",   "Ghế Sofa",   18900000, "Phòng khách", P.sofaBeige, 4.8, 124),
  p(2,  "Bình Gốm Trang Trí Emerald","Decor",       1290000,  "Decor",       P.vaseGreen, 4.9, 56),
  p(3,  "Ghế Bành Bọc Nỉ Azure",     "Ghế Armchair",6500000,  "Phòng khách", P.armBlue,   4.7, 88),
  p(4,  "Ghế Mây Đan Thủ Công",      "Ghế Thư Giãn",3900000,  "Ngoại trời",  P.rattan,    4.6, 41),
  p(5,  "Giường Ngủ Tân Cổ Điển",    "Giường",      24500000, "Phòng ngủ",   P.bedClassic,4.9, 73),
  p(6,  "Bàn Trà Tròn Mặt Đá",       "Bàn Trà",     5200000,  "Phòng khách", P.tableBlack,4.8, 102),
  p(7,  "Sofa Module Vải Bố",        "Ghế Sofa",    22900000, "Phòng khách", P.sofaWhite, 4.8, 67),
  p(8,  "Tủ Đầu Giường Gỗ Sồi",      "Tủ",          4100000,  "Phòng ngủ",   P.drawer,    4.7, 95),
  p(9,  "Bàn Làm Việc Gỗ Tự Nhiên",  "Bàn",         7800000,  "Văn phòng",   P.deskWood,  4.9, 58),
  p(10, "Ghế Armchair Bọc Vải Kem",  "Ghế Armchair",5400000,  "Phòng khách", P.armBeige,  4.6, 130),
  p(11, "Sofa Băng Da Cao Cấp",      "Ghế Sofa",    29900000, "Phòng khách", P.sofaSlate, 4.9, 49),
  p(12, "Ghế Bành Tân Cổ Điển Rose", "Ghế Armchair",6900000,  "Phòng ngủ",   P.armPink,   4.7, 38),
];

export const flash = [
  { id: 101, name: "Giường Ngủ Tân Cổ Điển", type: "Giường",       price: 11000000, old: 16500000, img: P.bedClassic, rating: 4.8, sold: 64, stock: 80 },
  { id: 102, name: "Ghế Armchair Bọc Vải",   type: "Ghế Armchair", price: 7500000,  old: 10900000, img: P.armBeige,   rating: 4.7, sold: 41, stock: 60 },
  { id: 103, name: "Bàn Trà Tròn Mặt Đá",    type: "Bàn Trà",      price: 7500000,  old: 9800000,  img: P.tableBlack, rating: 4.9, sold: 88, stock: 95 },
  { id: 104, name: "Ghế Bành Bọc Nỉ Azure",  type: "Ghế Armchair", price: 7500000,  old: 9200000,  img: P.armBlue,    rating: 4.6, sold: 22, stock: 30 },
  { id: 105, name: "Bàn Làm Việc Gỗ",        type: "Bàn",          price: 11000000, old: 14200000, img: P.deskWood,   rating: 4.8, sold: 73, stock: 88 },
  { id: 106, name: "Bình Gốm Mạ Vàng",       type: "Decor",        price: 7500000,  old: 9900000,  img: P.vaseGreen,  rating: 4.9, sold: 30, stock: 45 },
  { id: 107, name: "Tủ Đầu Giường Gỗ Sồi",   type: "Tủ",           price: 7500000,  old: 10100000, img: P.drawer,     rating: 4.7, sold: 55, stock: 70 },
  { id: 108, name: "Sofa Góc Chữ L Da",       type: "Ghế Sofa",     price: 7500000,  old: 12500000, img: P.sofaSlate,  rating: 4.9, sold: 91, stock: 99 },
];

export const categories = [
  { name: "Sofa",      img: IMG.catSofa },
  { name: "Ghế",       img: IMG.catChair },
  { name: "Bàn & Tủ",  img: IMG.catTable },
  { name: "Giường",    img: IMG.catBed },
  { name: "Ngoại trời",img: IMG.catOutdoor },
  { name: "Văn phòng", img: IMG.catOffice },
  { name: "Trang trí", img: IMG.catDecor },
];

export const collections = [
  { name: "BST MODERN LIVING", img: IMG.modern },
  { name: "BST LUXURY",        img: IMG.luxury },
  { name: "BST MINIMALIST",    img: IMG.minimal },
];

export const news = [
  { title: "Xu Hướng Nội Thất 2026 – Tinh Tế & Bền Vững", date: "11/03/2026", img: IMG.news1,
    excerpt: "Khám phá những phong cách thiết kế nổi bật với vật liệu thân thiện môi trường, tối giản mà ấm cúng." },
  { title: "Bàn Trà – Điểm Nhấn Hoàn Hảo Cho Phòng Khách", date: "21/02/2026", img: IMG.news2,
    excerpt: "Thiết kế đa dạng, đường nét tinh tế và chất liệu cao cấp giúp hoàn thiện không gian sống của bạn." },
  { title: "Giải Pháp Nội Thất Văn Phòng Hiện Đại", date: "23/02/2026", img: IMG.news3,
    excerpt: "Tối ưu công năng sử dụng với hệ thống bàn ghế linh hoạt, tạo cảm hứng cho không gian làm việc." },
];

export const partners = ["MOHO", "HOMIE", "NHÀ XINH", "HAVEN", "HALO", "HAPPYFOOD", "ECOBOO"];
