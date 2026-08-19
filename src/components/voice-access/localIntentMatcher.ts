import { LoviraVoiceIntent } from './voice.types';

function normalizeVietnamese(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchLocalIntent(
  command: string,
  availableScreenActions?: Array<{
    id: string;
    label: string;
    aliases?: string[];
    isSatisfied?: boolean;
    missingReason?: string;
    promptForMissing?: string;
  }>
): LoviraVoiceIntent | null {
  if (!command || !command.trim()) return null;
  const clean = command.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, '').replace(/\s+/g, ' ');
  const norm = normalizeVietnamese(clean);

  // 1. Session control
  if (norm === 'tam biet lovira' || norm === 'ket thuc phien' || norm === 'dung lovira' || norm === 'tat mic') {
    return {
      action: 'END_VOICE_SESSION',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Tạm biệt bạn!',
    };
  }

  // 2. Immediate matches against current screen's registered interactive actions (Case 2 & Case 3 fast-path)
  if (availableScreenActions && availableScreenActions.length > 0) {
    for (const act of availableScreenActions) {
      const labelNorm = normalizeVietnamese(act.label);
      if (norm === labelNorm) {
        if (act.isSatisfied === false) {
          return {
            action: 'PREREQUISITE_MISSING',
            confidence: 0.98,
            feedback: act.promptForMissing || act.missingReason || 'Chưa đủ điều kiện để thực hiện hành động này.',
            suggestedAction: act.id,
          };
        }
        return {
          action: act.id,
          confidence: 1.0,
          confirmationRequired: false,
          feedback: `Đã chọn ${act.label}.`,
        };
      }

      if (act.aliases && act.aliases.length > 0) {
        for (const alias of act.aliases) {
          const aliasNorm = normalizeVietnamese(alias);
          if (norm === aliasNorm || norm.startsWith(`${aliasNorm} `) || norm.endsWith(` ${aliasNorm}`)) {
            if (act.isSatisfied === false) {
              return {
                action: 'PREREQUISITE_MISSING',
                confidence: 0.95,
                feedback: act.promptForMissing || act.missingReason || 'Chưa đủ điều kiện để thực hiện hành động này.',
                suggestedAction: act.id,
              };
            }
            return {
              action: act.id,
              confidence: 0.98,
              confirmationRequired: false,
              feedback: `Đã chọn ${act.label}.`,
            };
          }
        }
      }
    }
  }

  // 3. Global Navigation
  if (norm === 've trang chu' || norm === 'trang chu' || norm === 've home' || norm === 'man hinh chinh') {
    return {
      action: 'GO_HOME',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Đang chuyển về trang chủ.',
    };
  }

  if (norm === 'quay lai' || norm === 'tro ve' || norm === 'trang truoc' || norm === 'lui lai') {
    return {
      action: 'GO_BACK',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Đang quay lại trang trước.',
    };
  }

  if (
    norm === 'mo nhin giup toi' ||
    norm === 'nhin giup toi' ||
    norm === 'vao nhin giup toi' ||
    norm === 'chon nhin giup toi' ||
    norm === 'chuc nang nhin' ||
    norm === 'mo camera' ||
    norm === 'bat camera' ||
    norm === 'toi muon dung chuc nang nhin'
  ) {
    return {
      action: 'OPEN_VISION',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Đã mở Nhìn giúp tôi.',
    };
  }

  if (
    norm === 'mo nghe va ghi lai' ||
    norm === 'nghe va ghi lai' ||
    norm === 'mo phan nghe' ||
    norm === 'vao nghe thoai' ||
    norm === 'mo ghi am' ||
    norm === 'ghi am' ||
    norm === 'tro ly dam thoai'
  ) {
    return {
      action: 'OPEN_CONVERSATION',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Đã mở Nghe & Ghi lại.',
    };
  }

  if (
    norm === 'mo lam noi dung de hieu' ||
    norm === 'lam noi dung de hieu' ||
    norm === 'mo easy read' ||
    norm === 'easy read' ||
    norm === 'mo lam de hieu' ||
    norm === 'lam de hieu'
  ) {
    return {
      action: 'OPEN_EASY_READ',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Đã mở Làm nội dung dễ hiểu.',
    };
  }

  if (
    norm === 'mo hieu tai lieu' ||
    norm === 'hieu tai lieu' ||
    norm === 'mo tai lieu' ||
    norm === 'tai lieu' ||
    norm === 'doc pdf'
  ) {
    return {
      action: 'OPEN_DOCUMENTS',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Đã mở Hiểu tài liệu.',
    };
  }

  if (norm === 'mo lich su' || norm === 'lich su' || norm === 'xem lich su') {
    return {
      action: 'OPEN_HISTORY',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Đã mở Lịch sử.',
    };
  }

  if (norm === 'mo cai dat' || norm === 'cai dat' || norm === 'thiet lap' || norm === 'mo tro nang' || norm === 'tro nang') {
    return {
      action: 'OPEN_SETTINGS',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Đã mở Cài đặt.',
    };
  }

  // 4. Accessibility controls
  if (
    norm === 'tang chu' ||
    norm === 'phong to chu' ||
    norm === 'chu to hon' ||
    norm === 'cho chu to len' ||
    norm === 'chu be qua'
  ) {
    return {
      action: 'INCREASE_FONT',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Đã phóng to chữ.',
    };
  }

  if (
    norm === 'giam chu' ||
    norm === 'thu nho chu' ||
    norm === 'chu nho hon' ||
    norm === 'chu nho lai'
  ) {
    return {
      action: 'DECREASE_FONT',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Đã thu nhỏ chữ.',
    };
  }

  if (
    norm === 'bat tuong phan cao' ||
    norm === 'tuong phan cao' ||
    norm === 'mau sac dam hon' ||
    norm === 'dam vien'
  ) {
    return {
      action: 'ENABLE_HIGH_CONTRAST',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Đã bật tương phản cao.',
    };
  }

  if (norm === 'tat tuong phan cao' || norm === 'giao dien binh thuong') {
    return {
      action: 'DISABLE_HIGH_CONTRAST',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Đã tắt tương phản cao.',
    };
  }

  if (norm === 'bat nut lon' || norm === 'nut lon' || norm === 'nut to hon') {
    return {
      action: 'ENABLE_LARGE_CONTROLS',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Đã bật nút lớn.',
    };
  }

  if (norm === 'tat nut lon' || norm === 'nut binh thuong') {
    return {
      action: 'DISABLE_LARGE_CONTROLS',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Đã tắt nút lớn.',
    };
  }

  // 5. Reading & Speech controls
  if (
    norm === 'dung doc' ||
    norm === 'dung noi' ||
    norm === 'tat tieng' ||
    norm === 'im lang' ||
    norm === 'ngung doc' ||
    norm === 'dung'
  ) {
    return {
      action: 'STOP_READING',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Đã dừng đọc.',
    };
  }

  if (norm === 'doc trang nay' || norm === 'doc man hinh' || norm === 'doc toan bo trang') {
    return {
      action: 'READ_PAGE',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Đang đọc nội dung trang hiện tại.',
    };
  }

  if (norm === 'noi cham lai' || norm === 'doc cham lai' || norm === 'cham hon chut') {
    return {
      action: 'SPEAK_SLOWER',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Đã giảm tốc độ đọc.',
    };
  }

  if (norm === 'noi nhanh hon' || norm === 'doc nhanh hon' || norm === 'nhanh hon chut') {
    return {
      action: 'SPEAK_FASTER',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Đã tăng tốc độ đọc.',
    };
  }

  if (norm === 'toi dang o dau' || norm === 'trang nay la gi' || norm === 'mo ta trang') {
    return {
      action: 'DESCRIBE_CURRENT_PAGE',
      confidence: 1.0,
      confirmationRequired: false,
    };
  }

  return null;
}

