// Showroom và ảnh showroom.


export const showrooms = [
  {
    id: 1,
    name: 'Showroom NAM QUAN Quận 1',
    phone: '0900 000 000',
    email: 'showroom@namquan.vn',
    address: 'Quận 1, TP. Hồ Chí Minh',
    map_url: '',
    open_time: '08:30 - 20:30, Thứ 2 - Chủ nhật',
    active: true,
  },
  {
    id: 2,
    name: 'Showroom NAM QUAN Thủ Đức',
    phone: '0900 000 001',
    email: 'thuduc@namquan.vn',
    address: 'TP. Thủ Đức, TP. Hồ Chí Minh',
    map_url: '',
    open_time: '08:30 - 20:30, Thứ 2 - Chủ nhật',
    active: true,
  },
];

export const showroomImages = [
  { showroom_id: 1, img: '/images/showroom-q1-1.jpg', alt_text: 'Không gian showroom Quận 1', sort_order: 1 },
  { showroom_id: 1, img: '/images/showroom-q1-2.jpg', alt_text: 'Khu vực sofa showroom Quận 1', sort_order: 2 },
  { showroom_id: 2, img: '/images/showroom-td-1.jpg', alt_text: 'Không gian showroom Thủ Đức', sort_order: 1 },
];
