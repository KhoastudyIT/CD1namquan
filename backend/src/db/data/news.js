// Danh mục tin tức và bài viết.


export const newsCategories = [
  {
    id: 1,
    name: 'Xu hướng thiết kế',
    slug: 'xu-huong-thiet-ke',
    description: 'Phong cách, vật liệu và màu sắc đang dẫn dắt thị trường nội thất.',
    sort_order: 1,
  },
  { id: 2, name: 'Mẹo bài trí', slug: 'meo-bai-tri', description: 'Hướng dẫn sắp đặt không gian sống đẹp và tiện dụng hơn.', sort_order: 2 },
  { id: 3, name: 'Cẩm nang chọn mua', slug: 'cam-nang-chon-mua', description: 'Kinh nghiệm chọn sản phẩm đúng nhu cầu, đúng ngân sách.', sort_order: 3 },
  { id: 4, name: 'Bảo quản & vệ sinh', slug: 'bao-quan-ve-sinh', description: 'Giữ đồ nội thất bền đẹp theo thời gian.', sort_order: 4 },
  { id: 5, name: 'Tin NAM QUAN', slug: 'tin-cong-ty', description: 'Hoạt động, showroom và chương trình của NAM QUAN.', sort_order: 5 },
];

export const news = [
  {
    id: 1,
    title: 'Xu Hướng Nội Thất 2026 – Tinh Tế & Bền Vững',
    slug: 'xu-huong-noi-that-2026-tinh-te-ben-vung',
    publish_date: '2026-03-11',
    img: '/images/news1.jpg',
    excerpt: 'Vật liệu tái tạo, đường nét tối giản và bảng màu lấy cảm hứng từ thiên nhiên là ba trụ cột định hình nội thất năm 2026.',
    content: `Năm 2026 đánh dấu giai đoạn người dùng Việt chọn nội thất bằng lý trí nhiều hơn cảm tính. Thay vì chạy theo bộ sưu tập mới mỗi mùa, xu hướng chung là đầu tư vào những món đồ dùng được mười năm, dễ phối và dễ sửa chữa.

## Vật liệu tái tạo lên ngôi

Gỗ có chứng chỉ khai thác bền vững, tre ép khối, vải tái chế từ sợi PET và da thuần chay đang thay thế dần các vật liệu tổng hợp giá rẻ. Điểm chung của nhóm vật liệu này là tuổi thọ cao và ít phát thải trong quá trình sản xuất.

- **Gỗ sồi, tần bì phủ dầu tự nhiên**: giữ được vân gỗ thật, khi xước có thể chà nhám và phủ lại tại nhà.
- **Vải bọc gốc thực vật**: thoáng khí, phù hợp khí hậu nóng ẩm, hạn chế bám mùi.
- **Kim loại sơn tĩnh điện**: khung ghế, chân bàn mảnh nhưng chịu lực tốt, chống gỉ trong môi trường ven biển.

## Đường nét tối giản nhưng ấm

Tối giản của năm 2026 không còn lạnh và trống. Các thiết kế giữ hình khối đơn giản nhưng bổ sung bo góc mềm, chất liệu dệt thô và ánh sáng vàng ấm để không gian bớt khô cứng.

## Bảng màu lấy từ thiên nhiên

Xanh rêu, be cát, nâu đất và trắng ngà là bốn tông màu chủ đạo. Công thức phối an toàn là lấy 60% màu nền trung tính, 30% màu gỗ tự nhiên và 10% màu nhấn đậm ở gối tựa hoặc đồ trang trí.

## Không gian đa công năng

Căn hộ đô thị ngày càng nhỏ nên mỗi món đồ cần làm nhiều hơn một việc: ghế sofa giường cho khách ở lại, bàn ăn mở rộng khi có tiệc, tủ ngăn phòng thay vì xây tường. Đây là nhóm sản phẩm tăng trưởng mạnh nhất tại NAM QUAN trong hai quý gần đây.

Nếu bạn đang lên kế hoạch làm mới nhà trong năm nay, hãy bắt đầu từ những món dùng hằng ngày — sofa, bàn ăn, giường — rồi mới đến đồ trang trí. Đầu tư đúng thứ tự sẽ tiết kiệm đáng kể chi phí về sau.`,
    author: 'NAM QUAN',
    category_id: 1,
    tags: ['xu hướng', 'bền vững', '2026', 'tối giản'],
    views: 412,
    featured: true,
    reading_time: 5,
    status: 'published',
    seo_title: 'Xu hướng nội thất 2026: tinh tế và bền vững',
    seo_description: 'Ba trụ cột định hình nội thất 2026: vật liệu tái tạo, thiết kế tối giản ấm áp và bảng màu lấy cảm hứng thiên nhiên.',
    seo_keywords: 'xu hướng nội thất 2026, nội thất bền vững, thiết kế tối giản',
    og_image: '/images/news1.jpg',
  },
  {
    id: 2,
    title: 'Bàn Trà – Điểm Nhấn Hoàn Hảo Cho Phòng Khách',
    slug: 'ban-tra-diem-nhan-hoan-hao-cho-phong-khach',
    publish_date: '2026-02-21',
    img: '/images/news2.jpg',
    excerpt: 'Chọn đúng kích thước, chiều cao và chất liệu bàn trà sẽ quyết định phòng khách của bạn trông rộng rãi hay chật chội.',
    content: `Bàn trà là món đồ bị chọn vội nhiều nhất trong phòng khách. Người mua thường quyết định theo kiểu dáng mà quên mất ba yếu tố kỹ thuật quyết định trải nghiệm sử dụng: kích thước, chiều cao và khoảng cách tới sofa.

## Kích thước: lấy sofa làm chuẩn

Chiều dài bàn trà nên bằng khoảng hai phần ba chiều dài sofa. Sofa 2,2m thì bàn dài 1,3 – 1,5m là hợp lý. Bàn quá nhỏ khiến bố cục lỏng lẻo, bàn quá lớn làm lối đi bị nghẽn.

## Chiều cao: ngang hoặc thấp hơn mặt ngồi

Mặt bàn nên ngang hoặc thấp hơn mặt ngồi sofa từ 2 đến 5cm. Ở khoảng này, bạn với tay lấy ly nước mà không phải nhoài người.

## Khoảng cách tới sofa: 40 – 45cm

Đây là khoảng đủ để duỗi chân thoải mái nhưng vẫn với tới mặt bàn. Hẹp hơn 35cm sẽ vướng chân khi đứng lên.

## Chọn chất liệu theo nếp sinh hoạt

- **Mặt đá**: sang, chịu nhiệt và chống thấm tốt, phù hợp gia đình hay tiếp khách. Nhược điểm là nặng và dễ mẻ cạnh.
- **Gỗ tự nhiên**: ấm, dễ phối với mọi phong cách. Cần lót ly để tránh vòng nước.
- **Kính cường lực**: tạo cảm giác thoáng cho phòng nhỏ, nhưng lộ vân tay và cần lau thường xuyên.
- **Kim loại kết hợp gỗ**: nhẹ, dễ di chuyển, hợp căn hộ cho thuê.

## Bố trí bàn trà theo nhóm

Xu hướng gần đây là dùng hai bàn tròn cao thấp lệch nhau thay cho một bàn chữ nhật lớn. Cách này linh hoạt hơn khi cần dọn chỗ cho trẻ chơi, đồng thời tạo nhịp thị giác thú vị cho phòng khách.

Trước khi chốt đơn, hãy dán băng keo giấy lên sàn theo đúng kích thước bàn và sống với nó vài ngày. Đây là mẹo đơn giản nhưng giúp tránh gần như mọi sai lầm về tỉ lệ.`,
    author: 'NAM QUAN',
    category_id: 2,
    tags: ['bàn trà', 'phòng khách', 'bài trí'],
    views: 268,
    featured: false,
    reading_time: 4,
    status: 'published',
    seo_title: 'Cách chọn bàn trà chuẩn cho phòng khách',
    seo_description: 'Hướng dẫn chọn kích thước, chiều cao, khoảng cách và chất liệu bàn trà để phòng khách cân đối và tiện dùng.',
    seo_keywords: 'bàn trà, chọn bàn trà, nội thất phòng khách',
    og_image: '/images/news2.jpg',
  },
  {
    id: 3,
    title: 'Giải Pháp Nội Thất Văn Phòng Hiện Đại',
    slug: 'giai-phap-noi-that-van-phong-hien-dai',
    publish_date: '2026-02-23',
    img: '/images/news3.jpg',
    excerpt: 'Từ ghế công thái học đến khu vực làm việc linh hoạt: cách bố trí văn phòng vừa tối ưu diện tích vừa giữ sức khỏe nhân sự.',
    content: `Một văn phòng tốt không phải là văn phòng đắt tiền, mà là nơi con người ngồi được tám tiếng mỗi ngày mà không đau lưng, mỏi cổ hay mất tập trung.

## Bắt đầu từ ghế, không phải bàn

Ghế là khoản đầu tư đáng tiền nhất. Ba tiêu chí bắt buộc: tựa lưng đỡ được vùng thắt lưng, chiều cao điều chỉnh để chân đặt phẳng trên sàn, và tay vịn ngang tầm khuỷu tay khi gõ phím.

## Bàn nâng hạ không còn là thứ xa xỉ

Chi phí bàn nâng hạ đã giảm mạnh trong ba năm qua. Người dùng chỉ cần đứng làm việc 15 phút mỗi giờ cũng đã cải thiện rõ tuần hoàn máu và độ tỉnh táo buổi chiều.

## Chia khu vực theo tính chất công việc

- **Khu tập trung**: bàn cá nhân, vách ngăn tiêu âm, ánh sáng trực tiếp.
- **Khu cộng tác**: bàn lớn, ghế dễ di chuyển, bảng viết gần kề.
- **Khu thư giãn**: sofa thấp, cây xanh, ánh sáng gián tiếp.

Tỉ lệ tham khảo cho công ty 20 – 50 người là 60% diện tích cho khu tập trung, 25% cộng tác và 15% thư giãn.

## Ánh sáng và âm thanh

Đèn nên đạt 400 – 500 lux tại mặt bàn, tránh đặt màn hình đối diện cửa sổ để không bị chói. Với âm thanh, thảm sàn và trần tiêu âm là hai giải pháp rẻ nhất giúp giảm tiếng ồn văn phòng mở.

## Chừa chỗ cho thay đổi

Đội ngũ luôn thay đổi quy mô. Ưu tiên bàn module ghép được, tủ có bánh xe và hệ dây điện đi âm sàn để việc sắp xếp lại không trở thành một dự án cải tạo.`,
    author: 'NAM QUAN',
    category_id: 1,
    tags: ['văn phòng', 'ergonomics', 'bàn nâng hạ'],
    views: 197,
    featured: false,
    reading_time: 4,
    status: 'published',
    seo_title: 'Giải pháp nội thất văn phòng hiện đại',
    seo_description: 'Cách chọn ghế, bàn nâng hạ, chia khu vực và xử lý ánh sáng để văn phòng tối ưu diện tích và tốt cho sức khỏe.',
    seo_keywords: 'nội thất văn phòng, bàn nâng hạ, ghế công thái học',
    og_image: '/images/news3.jpg',
  },
  {
    id: 4,
    title: 'Chọn Sofa Đúng Chuẩn: 7 Điều Cần Biết Trước Khi Xuống Tiền',
    slug: 'chon-sofa-dung-chuan-7-dieu-can-biet',
    publish_date: '2026-01-18',
    img: '/images/catSofa.jpg',
    excerpt: 'Khung gỗ, mật độ mút, chất liệu bọc và độ sâu lòng ghế — bảy yếu tố quyết định chiếc sofa dùng được ba năm hay mười lăm năm.',
    content: `Sofa là món nội thất đắt thứ hai trong nhà, chỉ sau hệ tủ bếp. Nhưng phần lớn quyết định mua lại dựa vào cảm giác ngồi thử năm phút tại cửa hàng. Dưới đây là bảy điều nên kiểm tra trước khi chốt.

## 1. Khung ghế

Khung gỗ tự nhiên đã sấy đạt độ ẩm dưới 12% là chuẩn tốt nhất. Gỗ chưa sấy kỹ sẽ cong vênh sau một mùa mưa. Hãy nhấc thử một góc sofa: khung chắc sẽ nâng cả cụm lên gần như nguyên khối.

## 2. Mật độ mút

Mút mật độ 25 – 35 kg/m³ cho tuổi thọ tốt ở điều kiện dùng hằng ngày. Mút dưới 20 kg/m³ rẻ hơn nhưng sẽ xẹp sau 12 – 18 tháng.

## 3. Hệ lò xo hoặc dây đai

Lò xo túi độc lập cho cảm giác êm và phân bổ lực đều. Dây đai đàn hồi rẻ hơn, phù hợp sofa nhỏ ít người ngồi.

## 4. Độ sâu lòng ghế

- **50 – 55cm**: hợp người cao dưới 1m65, ngồi thẳng lưng.
- **56 – 62cm**: đa số người dùng, tư thế thoải mái.
- **Trên 65cm**: kiểu ngồi ngả, cần thêm gối tựa lưng.

## 5. Chất liệu bọc

Vải mang lại cảm giác ấm và thoáng, phù hợp khí hậu Việt Nam nhưng cần vệ sinh định kỳ. Da thật bền và dễ lau nhưng dính khi trời nóng. Da công nghiệp cao cấp là phương án cân bằng nếu nhà có trẻ nhỏ.

## 6. Khả năng tháo giặt

Áo bọc rời tháo giặt được sẽ kéo dài tuổi thọ sofa thêm nhiều năm. Đây là chi tiết hay bị bỏ qua khi so giá.

## 7. Đường may và chi tiết hoàn thiện

Kiểm tra mật độ mũi chỉ, độ thẳng của đường may và cách xử lý mép góc. Chi tiết hoàn thiện phản ánh khá chính xác tiêu chuẩn của xưởng sản xuất.

Cuối cùng, hãy ngồi thử ít nhất mười phút ở đúng tư thế bạn hay ngồi ở nhà — nằm dài xem phim, hay ngồi thẳng tiếp khách. Cảm giác sau mười phút mới là cảm giác thật.`,
    author: 'NAM QUAN',
    category_id: 3,
    tags: ['sofa', 'cẩm nang', 'kinh nghiệm mua'],
    views: 534,
    featured: true,
    reading_time: 6,
    status: 'published',
    seo_title: 'Cách chọn sofa bền đẹp: 7 tiêu chí quan trọng',
    seo_description: 'Khung gỗ, mật độ mút, lò xo, độ sâu lòng ghế và chất liệu bọc — checklist đầy đủ trước khi mua sofa.',
    seo_keywords: 'chọn sofa, mua sofa, kinh nghiệm chọn sofa',
    og_image: '/images/catSofa.jpg',
  },
  {
    id: 5,
    title: 'Bảo Quản Đồ Gỗ Tự Nhiên Trong Khí Hậu Nhiệt Đới',
    slug: 'bao-quan-do-go-tu-nhien-khi-hau-nhiet-doi',
    publish_date: '2025-12-05',
    img: '/images/bigRoom.jpg',
    excerpt: 'Độ ẩm trên 80% và nắng gắt là hai kẻ thù lớn nhất của đồ gỗ. Đây là lịch chăm sóc đơn giản giúp giữ đồ bền đẹp.',
    content: `Đồ gỗ tự nhiên phản ứng với môi trường suốt vòng đời của nó: hút ẩm khi trời nồm, nhả ẩm khi hanh khô. Hiểu điều này giúp bạn tránh gần như mọi hư hỏng thường gặp.

## Kiểm soát độ ẩm

Khoảng lý tưởng là 45 – 60%. Vào mùa nồm ở miền Bắc hoặc mùa mưa ở miền Nam, độ ẩm có thể vượt 85%. Máy hút ẩm hoặc điều hòa chế độ khô chạy vài giờ mỗi ngày là đủ để giữ đồ gỗ ổn định.

## Tránh nắng trực tiếp

Tia UV làm bạc màu bề mặt và khiến lớp phủ giòn đi. Nếu không đổi được vị trí, hãy dùng rèm lọc sáng hoặc phim cách nhiệt dán kính.

## Lịch vệ sinh gợi ý

- **Hằng tuần**: lau bụi bằng khăn microfiber khô hoặc ẩm nhẹ, lau xuôi theo vân gỗ.
- **Hằng tháng**: kiểm tra và siết lại ốc vít ở ghế, bàn, giường.
- **Sáu tháng một lần**: phủ lại dầu lau gỗ hoặc sáp bảo dưỡng cho bề mặt phủ dầu.

## Những việc nên tránh

Không dùng cồn, nước lau kính hay chất tẩy đa năng lên bề mặt gỗ — chúng phá lớp phủ bảo vệ. Không đặt đồ nóng trực tiếp lên mặt bàn. Không kê sát tường ẩm, hãy chừa khe hở 2 – 3cm cho không khí lưu thông.

## Xử lý vết xước nhẹ

Với gỗ phủ dầu, chà nhẹ bằng giấy nhám mịn P400 theo vân gỗ rồi thoa lại dầu là vết xước gần như biến mất. Với gỗ phủ PU, nên để thợ xử lý vì lớp phủ cần đánh lại toàn bộ mặt.

Chăm đúng cách, một bộ bàn ăn gỗ tự nhiên hoàn toàn có thể theo gia đình bạn qua vài lần chuyển nhà.`,
    author: 'NAM QUAN',
    category_id: 4,
    tags: ['bảo quản', 'gỗ tự nhiên', 'vệ sinh'],
    views: 321,
    featured: false,
    reading_time: 4,
    status: 'published',
    seo_title: 'Bảo quản đồ gỗ tự nhiên trong khí hậu nhiệt đới',
    seo_description: 'Kiểm soát độ ẩm, tránh nắng, lịch vệ sinh định kỳ và cách xử lý vết xước cho đồ gỗ tự nhiên.',
    seo_keywords: 'bảo quản đồ gỗ, vệ sinh nội thất gỗ, chống ẩm mốc',
    og_image: '/images/bigRoom.jpg',
  },
  {
    id: 6,
    title: '5 Cách Bố Trí Ánh Sáng Giúp Phòng Khách Sang Hơn',
    slug: '5-cach-bo-tri-anh-sang-phong-khach',
    publish_date: '2025-11-10',
    img: '/images/living2.jpg',
    excerpt: 'Cùng một bộ nội thất, ánh sáng đúng có thể nâng tầm cả căn phòng — mà chi phí thấp hơn nhiều so với thay đồ mới.',
    content: `Nhiều phòng khách được đầu tư nội thất tốt nhưng vẫn trông phẳng vì chỉ có duy nhất một đèn trần. Ánh sáng nhiều lớp là cách rẻ nhất để thay đổi cảm nhận về không gian.

## 1. Chia ánh sáng thành ba lớp

Lớp nền chiếu sáng tổng thể, lớp chức năng phục vụ đọc sách hay làm việc, lớp nhấn làm nổi tranh, kệ và cây xanh. Có đủ ba lớp, căn phòng lập tức có chiều sâu.

## 2. Giữ nhiệt độ màu thống nhất

Chọn 2700K – 3000K cho phòng khách. Trộn lẫn ánh sáng trắng lạnh và vàng ấm trong cùng một phòng là lỗi phổ biến khiến không gian trông rối.

## 3. Dùng đèn sàn thay vì thêm đèn trần

Một đèn sàn đặt cạnh sofa tạo góc đọc sách ấm cúng và làm mềm bóng đổ trên tường — hiệu quả hơn nhiều so với tăng công suất đèn trần.

## 4. Hắt sáng gián tiếp

Đèn LED giấu sau kệ tivi, sau đầu giường hoặc trong hốc trần tạo hiệu ứng tường phát sáng, giúp phòng trông cao và rộng hơn thực tế.

## 5. Lắp dimmer

Chi phí nhỏ nhưng thay đổi lớn: cùng một hệ đèn có thể sáng rõ khi tiếp khách và dịu lại khi xem phim buổi tối.

Nếu chỉ chọn được một thay đổi, hãy bắt đầu với đèn sàn cạnh sofa. Đây là món tạo khác biệt rõ rệt nhất trên mỗi đồng chi ra.`,
    author: 'NAM QUAN',
    category_id: 2,
    tags: ['ánh sáng', 'phòng khách', 'mẹo'],
    views: 88,
    featured: false,
    reading_time: 3,
    status: 'hidden',
    seo_title: '5 cách bố trí ánh sáng cho phòng khách',
    seo_description: 'Ánh sáng ba lớp, nhiệt độ màu thống nhất, đèn sàn, hắt sáng gián tiếp và dimmer cho phòng khách đẹp hơn.',
    seo_keywords: 'ánh sáng phòng khách, đèn trang trí, bố trí ánh sáng',
    og_image: '/images/living2.jpg',
  },
  {
    id: 7,
    title: 'NAM QUAN Khai Trương Showroom Thủ Đức',
    slug: 'nam-quan-khai-truong-showroom-thu-duc',
    publish_date: '2026-03-20',
    img: '/images/showroom.jpg',
    excerpt: 'Không gian trưng bày 800m² với đầy đủ các dòng sofa, phòng ngủ và nội thất văn phòng, dự kiến mở cửa cuối tháng 3.',
    content: `NAM QUAN chuẩn bị đưa vào hoạt động showroom thứ hai tại TP. Thủ Đức, mở rộng khả năng phục vụ khách hàng khu vực phía Đông thành phố.

## Quy mô và bố cục

Showroom rộng 800m², chia thành sáu khu trải nghiệm theo không gian thật: phòng khách, phòng ăn, phòng ngủ, phòng làm việc, ban công và khu đồ trang trí. Khách hàng có thể ngồi thử, mở thử và cảm nhận vật liệu trước khi đặt hàng.

## Dịch vụ tại chỗ

- Tư vấn phối cảnh 3D miễn phí cho đơn hàng trọn gói.
- Đo đạc tận nơi trong bán kính 15km.
- Giao lắp và bảo hành theo tiêu chuẩn chung của NAM QUAN.

## Thông tin dự kiến

Địa chỉ và lịch khai trương chi tiết sẽ được cập nhật trên website và fanpage trước ngày mở cửa. Trong tuần đầu tiên, khách tham quan sẽ nhận được ưu đãi riêng dành cho đơn hàng đặt tại showroom.

Bài viết đang ở trạng thái nháp và sẽ được cập nhật khi có lịch chính thức.`,
    author: 'NAM QUAN',
    category_id: 5,
    tags: ['showroom', 'Thủ Đức', 'khai trương'],
    views: 0,
    featured: false,
    reading_time: 2,
    status: 'draft',
    seo_title: 'NAM QUAN khai trương showroom Thủ Đức',
    seo_description: 'Showroom thứ hai của NAM QUAN tại TP. Thủ Đức với 800m² trưng bày và dịch vụ tư vấn phối cảnh 3D.',
    seo_keywords: 'showroom nội thất Thủ Đức, NAM QUAN showroom',
    og_image: '/images/showroom.jpg',
  },
];
