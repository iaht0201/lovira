import { AccessibilitySettings } from '../types';

export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  fontScale: '100',
  highContrast: false,
  reducedMotion: false,
  largeControls: false,
  autoReadResponses: false,
  captionsEnabled: true,
  easyReadDefault: false,
  preferredLanguage: 'vi',
  theme: 'system',
  speechRate: 1.0,
  voiceVariant: 'female1',
  voiceURI: '',
};

export const APP_NAME = 'Lovira';
export const APP_TAGLINE = 'AI lan tỏa sự thấu hiểu — Giúp mọi người tiếp cận thông tin theo cách phù hợp nhất.';

export const SAMPLE_EASY_READ_TEXTS = [
  {
    title: 'Thông báo quy trình cấp đổi thẻ Căn cước công dân',
    text: `Căn cứ Nghị định số 70/2021/NĐ-CP, Công an quận thông báo về việc thực hiện thủ tục cấp, đổi, cấp lại thẻ Căn cước công dân (CCCD) gắn chíp cho công dân thường trú và tạm trú trên địa bàn. Công dân khi đến làm thủ tục vui lòng mang theo Sổ hộ khẩu bản chính, Giấy khai sinh (trong trường hợp thông tin ngày tháng sinh chưa đồng bộ trong Cơ sở dữ liệu quốc gia) và Giấy chứng minh nhân dân 9 số/12 số cũ. Thời gian tiếp nhận hồ sơ từ 07:30 đến 11:30 sáng và từ 13:30 đến 17:00 chiều các ngày từ thứ Hai đến thứ Sáu hàng tuần. Lệ phí cấp đổi là 30.000 VNĐ đối với trường hợp đổi do thẻ bị hư hỏng, 50.000 VNĐ đối với trường hợp cấp lại khi bị mất.`,
  },
  {
    title: 'Hướng dẫn chuẩn bị hồ sơ khám chữa bệnh Bảo hiểm Y tế',
    text: `Người tham gia bảo hiểm y tế khi đến khám bệnh, chữa bệnh phải xuất trình thẻ bảo hiểm y tế còn giá trị sử dụng và giấy tờ chứng minh về nhân thân có ảnh hợp lệ. Đối với trẻ em dưới 6 tuổi chỉ xuất trình thẻ bảo hiểm y tế. Trường hợp cấp cứu, người tham gia BHYT được đến khám bệnh, chữa bệnh tại bất kỳ cơ sở khám bệnh, chữa bệnh nào và phải xuất trình các giấy tờ nêu trên trước khi ra viện để được hưởng quyền lợi bảo hiểm y tế theo quy định.`,
  },
];

export const DEMO_DOCUMENTS = [
  {
    name: 'Thong_bao_thu_tuc_hanh_chinh.txt',
    content: `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc

THÔNG BÁO VỀ VIỆC CẤP PHÉP XÂY DỰNG NHÀ Ở RIÊNG LẺ
1. Yêu cầu hồ sơ:
- Đơn xin cấp phép xây dựng (theo mẫu)
- Bản sao một trong những giấy tờ chứng minh quyền sử dụng đất theo quy định của pháp luật về đất đai
- 02 bộ bản vẽ thiết kế kỹ thuật hoặc thiết kế bản vẽ thi công
2. Thời hạn giải quyết: Không quá 15 ngày làm việc kể từ ngày nhận đủ hồ sơ hợp lệ.
3. Lệ phí: 50.000 VNĐ / hồ sơ.
4. Địa điểm nộp: Bộ phận một cửa UBND Quận/Huyện. Hotline hỗ trợ: 1900-1234.`,
  },
];
