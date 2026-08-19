import { LoviraVoiceIntent, LoviraAction } from './voice.types';

export function matchLocalIntent(command: string): LoviraVoiceIntent | null {
  const clean = command.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');

  // 1. Session commands
  if (clean === 'chào lovira' || clean === 'chao lovira') {
    return {
      action: 'START_VOICE_SESSION',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Chào bạn! Mình đang nghe, hãy nói yêu cầu của bạn.',
    };
  }

  if (
    clean === 'tạm biệt lovira' ||
    clean === 'tam biet lovira' ||
    clean === 'kết thúc phiên' ||
    clean === 'ket thuc phien' ||
    clean === 'dừng lovira' ||
    clean === 'dung lovira'
  ) {
    return {
      action: 'END_VOICE_SESSION',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Tạm biệt bạn! Chúc bạn một ngày tốt lành.',
    };
  }

  // 2. Navigation
  if (clean === 'về trang chủ' || clean === 've trang chu' || clean === 'trang chủ' || clean === 'trang chu') {
    return {
      action: 'GO_HOME',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Đang chuyển về trang chủ.',
    };
  }

  if (clean === 'quay lại' || clean === 'quay lai') {
    return {
      action: 'GO_BACK',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Đang quay lại trang trước.',
    };
  }

  if (clean === 'mở nhìn giúp tôi' || clean === 'mo nhin giup toi' || clean === 'mở camera' || clean === 'mo camera') {
    return {
      action: 'OPEN_CAMERA',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Đang mở màn hình nhìn giúp tôi và kích hoạt camera.',
    };
  }

  if (clean === 'mở phần nghe' || clean === 'mo phan nghe' || clean === 'ghi âm' || clean === 'ghi am') {
    return {
      action: 'OPEN_CONVERSATION',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Đang mở màn hình nghe và ghi âm.',
    };
  }

  if (clean === 'mở easy read' || clean === 'mo easy read' || clean === 'mở làm dễ hiểu' || clean === 'mo lam de hieu') {
    return {
      action: 'OPEN_EASY_READ',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Đang mở màn hình làm nội dung dễ hiểu.',
    };
  }

  if (clean === 'mở tài liệu' || clean === 'mo tai lieu' || clean === 'hiểu tài liệu' || clean === 'hieu tai lieu') {
    return {
      action: 'OPEN_DOCUMENTS',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Đang mở màn hình hiểu tài liệu.',
    };
  }

  if (clean === 'mở lịch sử' || clean === 'mo lich su' || clean === 'lịch sử' || clean === 'lich su') {
    return {
      action: 'OPEN_HISTORY',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Đang mở màn hình lịch sử.',
    };
  }

  if (clean === 'mở trợ năng' || clean === 'mo tro nang' || clean === 'trợ năng' || clean === 'tro nang') {
    return {
      action: 'OPEN_ACCESSIBILITY',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Đang mở màn hình cấu hình trợ năng.',
    };
  }

  if (clean === 'mở cài đặt' || clean === 'mo cai dat' || clean === 'cài đặt' || clean === 'cai dat') {
    return {
      action: 'OPEN_SETTINGS',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Đang mở màn hình cài đặt.',
    };
  }

  // 3. Accessibility controls
  if (clean === 'tăng chữ' || clean === 'tang chu' || clean === 'chữ to hơn' || clean === 'chu to hon') {
    return {
      action: 'INCREASE_FONT',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Đã tăng kích thước chữ.',
    };
  }

  if (clean === 'giảm chữ' || clean === 'giam chu' || clean === 'chữ nhỏ hơn' || clean === 'chu nho hon') {
    return {
      action: 'DECREASE_FONT',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Đã giảm kích thước chữ.',
    };
  }

  if (clean === 'bật tương phản cao' || clean === 'bat tuong phan cao' || clean === 'tương phản cao' || clean === 'tuong phan cao') {
    return {
      action: 'ENABLE_HIGH_CONTRAST',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Đã kích hoạt chế độ tương phản cao.',
    };
  }

  if (clean === 'tắt tương phản cao' || clean === 'tat tuong phan cao') {
    return {
      action: 'DISABLE_HIGH_CONTRAST',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Đã tắt chế độ tương phản cao.',
    };
  }

  if (clean === 'bật nút lớn' || clean === 'bat nut lon' || clean === 'nút lớn' || clean === 'nut lon') {
    return {
      action: 'ENABLE_LARGE_CONTROLS',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Đã kích hoạt chế độ nút lớn trợ năng.',
    };
  }

  if (clean === 'tắt nút lớn' || clean === 'tat nut lon') {
    return {
      action: 'DISABLE_LARGE_CONTROLS',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Đã tắt chế độ nút lớn.',
    };
  }

  // 4. Reading controls
  if (
    clean === 'dừng đọc' ||
    clean === 'dung doc' ||
    clean === 'dừng' ||
    clean === 'dung' ||
    clean === 'im lặng' ||
    clean === 'im lang' ||
    clean === 'ngừng đọc' ||
    clean === 'ngung doc'
  ) {
    return {
      action: 'STOP_READING',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Đã dừng đọc.',
    };
  }

  if (clean === 'nói chậm lại' || clean === 'noi cham lai' || clean === 'đọc chậm lại' || clean === 'doc cham lai') {
    return {
      action: 'SPEAK_SLOWER',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Đã giảm tốc độ đọc.',
    };
  }

  if (clean === 'nói nhanh hơn' || clean === 'noi nhanh hon' || clean === 'đọc nhanh hơn' || clean === 'doc nhanh hon') {
    return {
      action: 'SPEAK_FASTER',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Đã tăng tốc độ đọc.',
    };
  }

  // 5. Context / Status
  if (clean === 'tôi đang ở đâu' || clean === 'toi dang o dau' || clean === 'trang này là gì' || clean === 'trang nay la gi') {
    return {
      action: 'DESCRIBE_CURRENT_PAGE',
      confidence: 1.0,
      confirmationRequired: false,
    };
  }

  if (clean === 'chụp' || clean === 'chup' || clean === 'chụp ảnh' || clean === 'chup anh') {
    return {
      action: 'CAPTURE_IMAGE',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Đang tiến hành chụp ảnh.',
    };
  }

  return null;
}
