/**
 * Nội dung 3 trang chính sách (footer): Chính sách bảo mật, Điều khoản sử dụng, Chính sách đổi trả.
 * Muốn sửa chữ, chỉ cần sửa file này — giao diện ở src/pages/PolicyPage.tsx tự hiển thị lại.
 * LƯU Ý: đây là nội dung mẫu cho cửa hàng; chủ cửa hàng nên đọc lại và chỉnh theo chính sách thật trước khi mở bán.
 */

/** Thông tin cửa hàng dùng chung cho cả 3 trang (khớp với footer) */
export const STORE = {
  name: 'Shoppc',
  address: '911 Đường Trần Duy Hưng, Quận 1, TP.HCM',
  phone: '0354 334 944',
  phoneHref: 'tel:0354334944',
  email: 'muihoangdong007lklk@gmail.com',
  hours: '8:00 - 20:00 (Thứ 2 - Chủ nhật)',
};

export interface PolicySection {
  id: string;
  heading: string;
  /** Đoạn văn đặt TRƯỚC danh sách */
  paragraphs?: string[];
  bullets?: string[];
  /** Ghi chú đặt SAU danh sách */
  note?: string;
}

export interface Policy {
  slug: 'privacy' | 'terms' | 'return';
  path: string;
  title: string;
  /** Tên ngắn trên thanh chọn */
  short: string;
  updated: string;
  intro: string;
  sections: PolicySection[];
}

export const POLICIES: Policy[] = [
  {
    slug: 'privacy',
    path: '/privacy',
    title: 'Chính sách bảo mật',
    short: 'Bảo mật',
    updated: '06/10/2026',
    intro:
      'Shoppc tôn trọng quyền riêng tư của khách hàng. Chính sách này giải thích chúng tôi thu thập thông tin gì, dùng vào việc gì, lưu ở đâu và bạn có những quyền gì đối với thông tin của mình.',
    sections: [
      {
        id: 'thu-thap',
        heading: '1. Thông tin chúng tôi thu thập',
        bullets: [
          'Khi tạo tài khoản: tên đăng nhập, họ tên, email và mật khẩu.',
          'Khi đặt hàng: họ tên người nhận, số điện thoại, email, địa chỉ giao hàng, ghi chú đơn hàng, sản phẩm đã mua và phương thức thanh toán bạn chọn.',
          'Khi chat với bộ phận hỗ trợ: nội dung tin nhắn và (nếu bạn cung cấp) họ tên, số điện thoại.',
          'Chúng tôi KHÔNG thu thập và KHÔNG lưu số thẻ ngân hàng hay mật khẩu ví điện tử của bạn.',
        ],
      },
      {
        id: 'muc-dich',
        heading: '2. Mục đích sử dụng',
        bullets: [
          'Xử lý, giao hàng và liên hệ xác nhận đơn hàng.',
          'Hỗ trợ khách hàng, bảo hành, đổi trả và giải quyết khiếu nại.',
          'Gửi email cần thiết cho tài khoản (ví dụ: liên kết đặt lại mật khẩu).',
          'Cải thiện chất lượng dịch vụ và phát hiện, ngăn chặn gian lận.',
        ],
        note: 'Chúng tôi không bán, cho thuê hay trao đổi thông tin cá nhân của bạn cho bên thứ ba vì mục đích quảng cáo.',
      },
      {
        id: 'chia-se',
        heading: '3. Chia sẻ thông tin',
        paragraphs: ['Thông tin chỉ được chia sẻ trong phạm vi cần thiết với:'],
        bullets: [
          'Đơn vị vận chuyển: họ tên, số điện thoại và địa chỉ người nhận để giao hàng.',
          'Trợ lý AI trong khung chat hỗ trợ: tin nhắn bạn gửi được xử lý bởi dịch vụ AI (Google Gemini) để trả lời tự động. Vui lòng không gửi mật khẩu, mã OTP hay thông tin thẻ qua khung chat. Bạn có thể bấm "Gặp nhân viên" để chat trực tiếp với người thật.',
          'Cơ quan nhà nước có thẩm quyền khi có yêu cầu theo quy định của pháp luật.',
        ],
      },
      {
        id: 'bao-mat',
        heading: '4. Bảo mật thông tin',
        bullets: [
          'Mật khẩu được mã hóa một chiều (bcrypt) trước khi lưu; nhân viên cửa hàng cũng không xem được mật khẩu của bạn.',
          'Dữ liệu được truyền qua kết nối mã hóa HTTPS.',
          'Chỉ nhân viên được phân quyền mới truy cập được thông tin đơn hàng để xử lý.',
          'Chúng tôi không bao giờ hỏi mật khẩu của bạn qua điện thoại, email hay khung chat.',
        ],
      },
      {
        id: 'luu-tru-trinh-duyet',
        heading: '5. Dữ liệu lưu trên trình duyệt',
        paragraphs: ['Website lưu một số dữ liệu nhỏ trong trình duyệt của bạn (localStorage) để hoạt động:'],
        bullets: [
          'Mã phiên giỏ hàng — để giữ giỏ hàng khi bạn tải lại trang.',
          'Mã đăng nhập — để bạn không phải đăng nhập lại mỗi lần mở trang.',
          'Mã hội thoại hỗ trợ — để giữ lịch sử chat với cửa hàng.',
          'Lựa chọn giao diện sáng/tối.',
        ],
      },
      {
        id: 'quyen',
        heading: '6. Quyền của bạn',
        bullets: [
          'Xem và cập nhật thông tin tài khoản tại trang "Tài khoản của tôi".',
          'Yêu cầu chỉnh sửa hoặc xóa thông tin cá nhân, trừ những thông tin chúng tôi buộc phải lưu theo quy định về hóa đơn, kế toán.',
          'Xóa dữ liệu lưu trên trình duyệt bất cứ lúc nào bằng cách đăng xuất hoặc xóa dữ liệu trang web.',
        ],
        note: `Để thực hiện các quyền trên, vui lòng liên hệ email ${STORE.email} hoặc hotline ${STORE.phone}.`,
      },
      {
        id: 'thay-doi',
        heading: '7. Thay đổi chính sách',
        paragraphs: [
          'Chính sách có thể được cập nhật khi dịch vụ thay đổi. Ngày cập nhật gần nhất được ghi ở đầu trang. Việc bạn tiếp tục sử dụng website sau khi chính sách thay đổi đồng nghĩa với việc bạn chấp nhận nội dung mới.',
        ],
      },
    ],
  },
  {
    slug: 'terms',
    path: '/terms',
    title: 'Điều khoản sử dụng',
    short: 'Điều khoản',
    updated: '06/10/2026',
    intro:
      'Khi truy cập và mua hàng tại website Shoppc, bạn đồng ý với các điều khoản dưới đây. Vui lòng đọc kỹ trước khi đặt hàng.',
    sections: [
      {
        id: 'tai-khoan',
        heading: '1. Tài khoản',
        bullets: [
          'Bạn chịu trách nhiệm về tính chính xác của thông tin đăng ký và giữ bí mật mật khẩu của mình.',
          'Mọi hoạt động thực hiện bằng tài khoản của bạn được xem là do bạn thực hiện. Hãy báo ngay cho chúng tôi nếu nghi ngờ tài khoản bị sử dụng trái phép.',
          'Shoppc có quyền tạm khóa tài khoản có dấu hiệu gian lận, đặt hàng ảo hoặc vi phạm điều khoản.',
        ],
      },
      {
        id: 'san-pham-gia',
        heading: '2. Sản phẩm và giá bán',
        bullets: [
          'Giá niêm yết trên website tính bằng Việt Nam đồng (VND).',
          'Hình ảnh sản phẩm mang tính minh họa; thông số kỹ thuật được ghi trong trang chi tiết sản phẩm.',
          'Trường hợp có sai sót về giá hoặc thông tin sản phẩm, chúng tôi sẽ liên hệ để bạn xác nhận lại hoặc hủy đơn mà không mất phí.',
          'Số lượng hàng có hạn; đơn hàng chỉ được giữ hàng sau khi đặt thành công.',
        ],
      },
      {
        id: 'dat-hang',
        heading: '3. Đặt hàng và xác nhận',
        bullets: [
          'Sau khi đặt hàng, bạn nhận được mã đơn hàng (dạng ORD-...). Hãy giữ mã này cùng số điện thoại đặt hàng để tra cứu đơn.',
          'Nhân viên có thể gọi điện xác nhận trước khi giao, đặc biệt với đơn giá trị lớn.',
          'Shoppc có quyền từ chối hoặc hủy đơn nếu thông tin liên hệ không chính xác, không liên lạc được hoặc có dấu hiệu gian lận.',
        ],
      },
      {
        id: 'thanh-toan',
        heading: '4. Thanh toán',
        bullets: [
          'Thanh toán khi nhận hàng (COD): trả tiền trực tiếp cho nhân viên giao hàng.',
          'Chuyển khoản ngân hàng: sau khi đặt hàng, quét mã VietQR (đã điền sẵn số tiền và nội dung là mã đơn) bằng app ngân hàng bất kỳ. Đơn được xử lý sau khi cửa hàng nhận đủ tiền.',
          'Vui lòng chỉ chuyển khoản tới tài khoản do cửa hàng cung cấp chính thức; Shoppc không chịu trách nhiệm với khoản tiền chuyển tới tài khoản khác.',
        ],
      },
      {
        id: 'giao-hang',
        heading: '5. Giao hàng',
        bullets: [
          'Miễn phí giao hàng cho đơn từ 5.000.000₫; đơn dưới mức này phí giao hàng là 30.000₫.',
          'Giao hàng toàn quốc. Thời gian giao phụ thuộc khu vực và sẽ được nhân viên thông báo khi xác nhận đơn.',
          'Vui lòng kiểm tra tình trạng bên ngoài kiện hàng khi nhận; nếu móp méo, rách niêm phong, hãy từ chối nhận và báo ngay cho cửa hàng.',
        ],
      },
      {
        id: 'huy-don',
        heading: '6. Hủy đơn hàng',
        bullets: [
          'Bạn có thể hủy đơn miễn phí khi đơn còn ở trạng thái "Chờ xử lý" bằng cách liên hệ hotline hoặc chat hỗ trợ.',
          'Đơn đã chuyển cho đơn vị vận chuyển được xử lý theo Chính sách đổi trả.',
        ],
      },
      {
        id: 'hanh-vi',
        heading: '7. Hành vi bị cấm',
        bullets: [
          'Sử dụng website cho mục đích gian lận, đặt hàng ảo, phá hoại hệ thống hoặc thu thập dữ liệu trái phép.',
          'Gửi nội dung xúc phạm, quấy rối hoặc vi phạm pháp luật qua khung chat hỗ trợ.',
          'Sao chép nội dung, hình ảnh của website cho mục đích thương mại khi chưa được đồng ý.',
        ],
      },
      {
        id: 'tro-ly-ai',
        heading: '8. Trợ lý AI',
        paragraphs: [
          'Khung chat có trợ lý AI trả lời tự động để hỗ trợ nhanh. Câu trả lời của AI chỉ mang tính tham khảo; giá, tồn kho, tình trạng đơn hàng và chính sách cuối cùng do nhân viên Shoppc xác nhận.',
        ],
      },
      {
        id: 'luat',
        heading: '9. Luật áp dụng',
        paragraphs: [
          'Các điều khoản này được điều chỉnh theo pháp luật Việt Nam. Mọi tranh chấp được ưu tiên giải quyết bằng thương lượng; nếu không thành, sẽ được giải quyết tại cơ quan có thẩm quyền.',
        ],
      },
    ],
  },
  {
    slug: 'return',
    path: '/return',
    title: 'Chính sách đổi trả',
    short: 'Đổi trả',
    updated: '06/10/2026',
    intro:
      'Shoppc muốn bạn hoàn toàn yên tâm khi mua hàng. Dưới đây là các trường hợp được đổi trả, điều kiện và cách thực hiện.',
    sections: [
      {
        id: 'thoi-han',
        heading: '1. Thời hạn đổi trả',
        bullets: [
          'Trong 7 ngày kể từ khi nhận hàng: đổi sản phẩm mới cùng loại nếu sản phẩm có lỗi từ nhà sản xuất.',
          'Trong 15 ngày kể từ khi nhận hàng: đổi sang sản phẩm khác hoặc trả hàng hoàn tiền nếu sản phẩm lỗi mà không có hàng để đổi.',
          'Sau thời hạn trên, sản phẩm lỗi được xử lý theo chính sách bảo hành (thời gian bảo hành ghi trong mô tả từng sản phẩm).',
        ],
      },
      {
        id: 'truong-hop',
        heading: '2. Trường hợp được đổi trả',
        bullets: [
          'Sản phẩm lỗi kỹ thuật do nhà sản xuất (không lên nguồn, lỗi phần cứng, điểm chết màn hình vượt mức cho phép của hãng...).',
          'Giao sai sản phẩm, sai cấu hình, sai màu so với đơn đặt hàng.',
          'Sản phẩm bị hư hỏng, móp méo trong quá trình vận chuyển (cần báo trong vòng 24 giờ kể từ khi nhận hàng).',
          'Thiếu phụ kiện, quà tặng so với mô tả.',
        ],
      },
      {
        id: 'khong-ap-dung',
        heading: '3. Trường hợp không áp dụng đổi trả',
        bullets: [
          'Sản phẩm bị rơi vỡ, vào nước, cháy nổ, biến dạng do người dùng.',
          'Sản phẩm đã bị tự ý tháo, sửa chữa hoặc can thiệp phần cứng/phần mềm ngoài hướng dẫn của hãng.',
          'Tem bảo hành, số serial bị rách, tẩy xóa hoặc không khớp với hóa đơn.',
          'Đổi ý không thích sản phẩm khi sản phẩm không có lỗi (trừ khi cửa hàng có thông báo hỗ trợ riêng).',
          'Phần mềm, mã kích hoạt bản quyền (key) đã được mở hoặc kích hoạt.',
        ],
      },
      {
        id: 'dieu-kien',
        heading: '4. Điều kiện sản phẩm khi đổi trả',
        bullets: [
          'Còn đầy đủ hộp, phụ kiện, sách hướng dẫn, quà tặng kèm (nếu có).',
          'Còn hóa đơn mua hàng hoặc mã đơn hàng.',
          'Tem bảo hành và số serial còn nguyên vẹn.',
        ],
      },
      {
        id: 'quy-trinh',
        heading: '5. Quy trình đổi trả',
        bullets: [
          `Bước 1: Liên hệ hotline ${STORE.phone}, email ${STORE.email} hoặc khung chat hỗ trợ, cung cấp mã đơn hàng và mô tả lỗi (kèm hình ảnh/video nếu có).`,
          'Bước 2: Nhân viên kiểm tra thông tin và hướng dẫn gửi sản phẩm về cửa hàng hoặc mang trực tiếp tới cửa hàng.',
          'Bước 3: Cửa hàng kiểm tra sản phẩm (thường trong 1–3 ngày làm việc) và thông báo kết quả.',
          'Bước 4: Đổi sản phẩm mới hoặc hoàn tiền theo kết quả kiểm tra.',
        ],
      },
      {
        id: 'chi-phi',
        heading: '6. Chi phí vận chuyển khi đổi trả',
        bullets: [
          'Lỗi do nhà sản xuất hoặc do Shoppc giao sai: Shoppc chịu toàn bộ phí vận chuyển hai chiều.',
          'Các trường hợp khác được cửa hàng chấp nhận hỗ trợ: khách hàng chịu phí vận chuyển.',
        ],
      },
      {
        id: 'hoan-tien',
        heading: '7. Hoàn tiền',
        bullets: [
          'Đơn đã thanh toán bằng chuyển khoản: hoàn tiền vào tài khoản ngân hàng của bạn trong 3–7 ngày làm việc sau khi cửa hàng xác nhận đổi trả.',
          'Đơn thanh toán khi nhận hàng (COD): hoàn tiền bằng chuyển khoản tới tài khoản do bạn cung cấp.',
          'Số tiền hoàn bằng giá trị sản phẩm trả lại (không gồm phí giao hàng ban đầu nếu lỗi không thuộc về cửa hàng).',
        ],
      },
    ],
  },
];

export const findPolicy = (slug: string) => POLICIES.find((p) => p.slug === slug);
