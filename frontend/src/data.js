/* ============ NAM QUAN — data ============ */

const I = (name) => `/images/${name}.jpg`;

export const IMG = {
  heroLiving:  I("heroLiving"),
  living1:     I("living1"),
  living2:     I("living2"),
  modern:      I("modern"),
  luxury:      I("luxury"),
  minimal:     I("minimal"),
  bigRoom:     I("bigRoom"),
  showroom:    I("showroom"),
  ctaChair:    I("ctaChair"),
  footerChair: I("footerChair"),
  catSofa:     I("catSofa"),
  catChair:    I("catChair"),
  catTable:    I("catTable"),
  catBed:      I("catBed"),
  catOutdoor:  I("catOutdoor"),
  catOffice:   I("catOffice"),
  catDecor:    I("catDecor"),
  news1:       I("news1"),
  news2:       I("news2"),
  news3:       I("news3"),
};

const P = {
  sofaBeige:  I("sofaBeige"),
  vaseGreen:  I("vaseGreen"),
  armBlue:    I("armBlue"),
  rattan:     I("rattan"),
  bedClassic: I("bedClassic"),
  tableBlack: I("tableBlack"),
  sofaWhite:  I("sofaWhite"),
  drawer:     I("drawer"),
  deskWood:   I("deskWood"),
  armBeige:   I("armBeige"),
  sofaSlate:  I("sofaSlate"),
  armPink:    I("armPink"),
  bonCauLaskaDen: I("bon_cau_laska_hoa_tiet_den"),
  bonCauLaskaTrang: I("bon_cau_laska_trang"),
  boSofaGocBanTron: I("bo_sofa_goc_va_ban_tron_doi_cao_thap"),
  boSofaBanMatDa: I("bo_sofa_va_ban_mat_da"),
  decorDenTrang: I("do_decor_phong_khach_typography_dentrang"),
  decorNauDen: I("do_decor_phong_khach_typography_nauden"),
  voiSenDen: I("voi_hoa_sen_toan_than_denbong"),
  voiSenVang: I("voi_hoa_sen_toan_than_vangkim"),
  voiCaoRinto: I("voi_rua_tay_cao_rinto"),
  voiCoMemRinto: I("voi_rua_tay_co_mem_rinto"),
  voiRinto: I("voi_rua_tay_rinto"),
  voiRintoVuong: I("voi_rua_tay_rinto_vuong"),
};

export const cats = ["Phòng khách", "Phòng ngủ", "Bếp", "Văn phòng", "Decor", "Phòng tắm"];

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
  p(36, "Bồn Cầu Laska Họa Tiết Đen", "Thiết Bị Vệ Sinh", 4500000, "Phòng tắm", P.bonCauLaskaDen, 5.0, 0),
  p(37, "Bồn Cầu Laska Trắng", "Thiết Bị Vệ Sinh", 4200000, "Phòng tắm", P.bonCauLaskaTrang, 4.9, 0),
  p(38, "Bộ Sofa Góc Và Bàn Tròn Đôi Cao Thấp", "Bộ Sofa", 25900000, "Phòng khách", P.boSofaGocBanTron, 5.0, 0),
  p(39, "Bộ Sofa Và Bàn Mặt Đá", "Bộ Sofa", 28500000, "Phòng khách", P.boSofaBanMatDa, 4.8, 0),
  p(40, "Đồ Decor Typography Đen Trắng", "Decor", 850000, "Decor", P.decorDenTrang, 4.7, 0),
  p(41, "Đồ Decor Typography Nâu Đen", "Decor", 850000, "Decor", P.decorNauDen, 4.8, 0),
  p(42, "Vòi Sen Toàn Thân Đen Bóng", "Thiết Bị Vệ Sinh", 3500000, "Phòng tắm", P.voiSenDen, 4.9, 0),
  p(43, "Vòi Sen Toàn Thân Vàng Kim", "Thiết Bị Vệ Sinh", 3800000, "Phòng tắm", P.voiSenVang, 5.0, 0),
  p(44, "Vòi Rửa Tay Cao Rinto", "Thiết Bị Vệ Sinh", 1200000, "Phòng tắm", P.voiCaoRinto, 4.7, 0),
  p(45, "Vòi Rửa Tay Cổ Mềm Rinto", "Thiết Bị Vệ Sinh", 1450000, "Phòng tắm", P.voiCoMemRinto, 4.8, 0),
  p(46, "Vòi Rửa Tay Rinto", "Thiết Bị Vệ Sinh", 950000, "Phòng tắm", P.voiRinto, 4.6, 0),
  p(47, "Vòi Rửa Tay Rinto Vuông", "Thiết Bị Vệ Sinh", 1100000, "Phòng tắm", P.voiRintoVuong, 4.8, 0),
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

export const partners = [
  { name: "Logo 1", img: "/images/partner1.png" },
  { name: "Logo 2", img: "/images/partner2.png" },
  { name: "Logo 3", img: "/images/partner3.png" },
  { name: "Logo 4", img: "/images/partner4.png" },
  { name: "Logo 5", img: "/images/partner5.png" },
  { name: "HAPPYFOOD", img: "/images/partner6.png" },
  { name: "ECOBOO", img: "/images/partner7.png" },
  { name: "COMOON", img: "/images/partner8.png" },
  { name: "BÌNH MINH SÀI GÒN", img: "/images/partner9.png" },
  { name: "VẠN TƯỜNG", img: "/images/partner10.png" },
  { name: "ÂU LẠC HUẾ", img: "/images/partner11.png" },
];
