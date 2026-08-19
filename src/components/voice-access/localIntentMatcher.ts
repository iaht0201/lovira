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

  // 1. Session control & Stop commands
  if (
    norm === 'tam biet lovira' ||
    norm === 'ket thuc phien' ||
    norm === 'dung lovira' ||
    norm === 'tat mic' ||
    norm === 'tat voice access' ||
    norm === 'dong phien'
  ) {
    return {
      action: 'END_VOICE_SESSION',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Tạm biệt bạn! Lovira sẽ ở đây khi bạn cần.',
    };
  }

  if (
    norm === 'dung' ||
    norm === 'dung lai' ||
    norm === 'ngung' ||
    norm === 'ngung lai' ||
    norm === 'tat' ||
    norm === 'thoi' ||
    norm === 'huy' ||
    norm === 'huy viec nay' ||
    norm === 'dung doc' ||
    norm === 'dung doc nua' ||
    norm === 'ngung doc'
  ) {
    return {
      action: 'speech.stop',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Đã dừng thao tác.',
    };
  }

  // 2. Immediate matches against current screen's registered interactive actions
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

  // 3. Global Navigation & Router Switching
  if (
    norm === 've trang chu' ||
    norm === 'trang chu' ||
    norm === 've home' ||
    norm === 'man hinh chinh' ||
    norm === 'tro ve trang chu' ||
    norm === 'chuyen sang trang chu' ||
    norm === 'chuyen qua trang chu' ||
    norm === 'vao trang chu'
  ) {
    return {
      action: 'navigation.home',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Được rồi, Lovira đã đưa bạn về Trang chủ. Nhiệm vụ đang làm vẫn được giữ.',
    };
  }

  if (
    norm === 'quay lai' ||
    norm === 'tro ve' ||
    norm === 'trang truoc' ||
    norm === 'lui lai' ||
    norm === 'quay ve truoc' ||
    norm === 'lui ve'
  ) {
    return {
      action: 'navigation.back',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Lovira đang quay lại màn hình trước. Nội dung bạn đã nhập vẫn được giữ.',
    };
  }

  // Vision - Direct inspection with camera chain
  if (
    norm.includes('kiem tra hinh anh') ||
    norm.includes('kiem tra anh') ||
    norm.includes('xem hinh anh') ||
    norm.includes('xem anh nay') ||
    norm.includes('chup anh giup toi') ||
    norm.includes('chup hinh giup toi') ||
    norm.includes('nhin khong ro') ||
    norm.includes('khong nhin ro')
  ) {
    return {
      action: 'navigation.openVision',
      chainAction: { action: 'vision.openCamera' },
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Lovira đã mở Nhìn giúp tôi và bật máy ảnh để hỗ trợ bạn. Bạn hãy đưa camera về phía vật thể hoặc bấm chụp nhé.',
    };
  }

  // Retry / Repeat previous action from memory
  if (
    norm === 'thuc hien lai' ||
    norm === 'lam lai' ||
    norm === 'thu lai' ||
    norm === 'lap lai' ||
    norm === 'lam lai thao tac' ||
    norm === 'chay lai'
  ) {
    return {
      action: 'RETRY_LAST_ACTION',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Lovira đang thực hiện lại thao tác trước đó cho bạn.',
    };
  }

  // Vision Navigation
  if (
    norm === 'mo nhin giup toi' ||
    norm === 'nhin giup toi' ||
    norm === 'vao nhin giup toi' ||
    norm === 'chon nhin giup toi' ||
    norm === 'chuc nang nhin' ||
    norm === 'mo camera' ||
    norm === 'bat camera' ||
    norm === 'xem giup toi' ||
    norm === 'toi muon dung chuc nang nhin' ||
    norm === 'xem giup toi cai nay' ||
    norm === 'coi cai nay la gi' ||
    norm === 'chuyen sang nhin' ||
    norm === 'chuyen qua nhin' ||
    norm === 'chuyen sang vision' ||
    norm === 'chuyen qua vision' ||
    norm === 'vao vision' ||
    norm === 'mo vision'
  ) {
    return {
      action: 'navigation.openVision',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Lovira đã mở Nhìn giúp tôi. Bạn có thể chụp ảnh hoặc chọn ảnh có sẵn trong máy.',
    };
  }

  // Conversation Navigation
  if (
    norm === 'mo nghe va ghi lai' ||
    norm === 'nghe va ghi lai' ||
    norm === 'mo phan nghe' ||
    norm === 'vao nghe thoai' ||
    norm === 'mo ghi am' ||
    norm === 'ghi am' ||
    norm === 'tro ly dam thoai' ||
    norm === 'toi khong nghe kip' ||
    norm === 'chuyen sang nghe' ||
    norm === 'chuyen qua nghe' ||
    norm === 'vao phan nghe' ||
    norm === 'mo conversation' ||
    norm === 'chuyen sang conversation'
  ) {
    return {
      action: 'navigation.openConversation',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Lovira đã mở Nghe & ghi lại. Khi sẵn sàng, bạn có thể bấm hoặc nói "Bắt đầu nghe".',
    };
  }

  // Easy Read Navigation
  if (
    norm === 'mo lam noi dung de hieu' ||
    norm === 'lam noi dung de hieu' ||
    norm === 'mo easy read' ||
    norm === 'easy read' ||
    norm === 'mo lam de hieu' ||
    norm === 'lam de hieu' ||
    norm === 'toi muon lam doan nay de hieu' ||
    norm === 'van ban nay kho qua' ||
    norm === 'lam doan nay bot kho' ||
    norm === 'chuyen sang lam de hieu' ||
    norm === 'chuyen qua de hieu' ||
    norm === 'vao de hieu' ||
    norm === 'chuyen sang easy read'
  ) {
    return {
      action: 'navigation.openEasyRead',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Lovira đã mở Làm nội dung dễ hiểu. Bạn có thể dán văn bản hoặc chọn tài liệu đang có.',
    };
  }

  // Documents Navigation
  if (
    norm === 'mo hieu tai lieu' ||
    norm === 'hieu tai lieu' ||
    norm === 'mo tai lieu' ||
    norm === 'tai lieu' ||
    norm === 'doc pdf' ||
    norm === 'toi co mot file pdf' ||
    norm === 'chon tai lieu' ||
    norm === 'chuyen sang tai lieu' ||
    norm === 'chuyen qua tai lieu' ||
    norm === 'vao tai lieu' ||
    norm === 'mo documents' ||
    norm === 'chuyen sang documents'
  ) {
    return {
      action: 'navigation.openDocuments',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Lovira đã mở Hiểu tài liệu. Bạn có thể chọn PDF, DOCX hoặc TXT để bắt đầu.',
    };
  }

  // History Navigation
  if (
    norm === 'mo lich su' ||
    norm === 'lich su' ||
    norm === 'xem lich su' ||
    norm === 'nhat ky' ||
    norm === 'xem lai cai truoc' ||
    norm === 'toi muon xem lai viec hom qua' ||
    norm === 'chuyen sang lich su' ||
    norm === 'chuyen qua lich su' ||
    norm === 'vao lich su'
  ) {
    return {
      action: 'navigation.openHistory',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Lovira đã mở Lịch sử. Bạn có thể tìm theo tên, loại hoạt động hoặc thời gian.',
    };
  }

  // Settings Navigation
  if (
    norm === 'mo cai dat' ||
    norm === 'cai dat' ||
    norm === 'tro nang' ||
    norm === 'tuy chinh' ||
    norm === 'mo tro nang' ||
    norm === 'vao cai dat' ||
    norm === 'chuyen sang cai dat' ||
    norm === 'chuyen qua cai dat' ||
    norm === 'mo settings'
  ) {
    return {
      action: 'navigation.openSettings',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Lovira đã mở Cài đặt & Trợ năng.',
    };
  }

  // Lovira Life / Session Navigation
  if (
    norm === 'mo lovira life' ||
    norm === 'lovira life' ||
    norm === 'lovira live' ||
    norm === 'bat lovira life' ||
    norm === 'chuc nang lovira life' ||
    norm === 'che do doi song' ||
    norm === 'phien lam viec' ||
    norm === 'mo phien lam viec' ||
    norm === 'chuyen sang session' ||
    norm === 'chuyen sang lovira life'
  ) {
    return {
      action: 'navigation.openSession',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Lovira đã mở màn hình Lovira Life.',
    };
  }

  // Life Session triggers
  if (
    norm === 'toi dang di kham' ||
    norm === 'di kham' ||
    norm === 'di kham benh' ||
    norm === 'kham benh'
  ) {
    return {
      action: 'session.create',
      parameters: { type: 'healthcare' },
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Lovira đã tạo phiên Đi khám để cùng bạn ghi nhớ thông tin quan trọng. Bạn có thể chụp phiếu khám hoặc ghi lại lời dặn bác sĩ.',
    };
  }

  if (
    norm === 'toi dang lam thu tuc' ||
    norm === 'lam thu tuc' ||
    norm === 'lam giay to' ||
    norm === 'thu tuc hanh chinh'
  ) {
    return {
      action: 'session.create',
      parameters: { type: 'administrative' },
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Lovira đã tạo phiên Làm thủ tục. Bạn có thể gửi giấy tờ; Lovira sẽ giúp tìm hồ sơ cần chuẩn bị và thời hạn quan trọng.',
    };
  }

  if (
    norm === 'toi di mua do' ||
    norm === 'di mua do' ||
    norm === 'mua sam' ||
    norm === 'di sieu thi'
  ) {
    return {
      action: 'session.create',
      parameters: { type: 'shopping' },
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Lovira đã tạo phiên Đi mua đồ. Bạn có thể chụp nhãn sản phẩm để đọc tên, giá và hạn dùng.',
    };
  }

  if (
    norm === 'gio toi lam gi' ||
    norm === 'gio toi phai lam gi' ||
    norm === 'buoc tiep theo' ||
    norm === 'tiep theo' ||
    norm === 'con gi khong'
  ) {
    return {
      action: 'session.getNextStep',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Lovira đang kiểm tra bước tiếp theo trong phiên của bạn.',
    };
  }

  // 4. Accessibility & UI Adjustments
  if (
    norm === 'tang chu' ||
    norm === 'tang co chu' ||
    norm === 'phong to chu' ||
    norm === 'chu lon hon' ||
    norm === 'chu to hon' ||
    norm === 'cho chu lon hon mot chut'
  ) {
    return {
      action: 'accessibility.increaseFont',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Lovira đã tăng cỡ chữ lên một mức.',
    };
  }

  if (
    norm === 'giam chu' ||
    norm === 'giam co chu' ||
    norm === 'thu nho chu' ||
    norm === 'chu nho hon'
  ) {
    return {
      action: 'accessibility.decreaseFont',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Lovira đã giảm cỡ chữ xuống một mức.',
    };
  }

  if (
    norm === 'bat tuong phan cao' ||
    norm === 'tuong phan cao' ||
    norm === 'bat tuong phan' ||
    norm === 'nen toi chu vang' ||
    norm === 'doi sang nen de nhin hon'
  ) {
    return {
      action: 'accessibility.enableHighContrast',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Lovira đã bật tương phản cao để chữ và điều khiển nổi bật hơn.',
    };
  }

  if (norm === 'tat tuong phan cao' || norm === 'tat tuong phan' || norm === 'tuong phan binh thuong') {
    return {
      action: 'accessibility.disableHighContrast',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Lovira đã trở về độ tương phản thông thường.',
    };
  }

  if (norm === 'bat nut lon' || norm === 'nut lon' || norm === 'nut to') {
    return {
      action: 'accessibility.enableLargeControls',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Lovira đã tăng kích thước vùng bấm cho các nút điều khiển.',
    };
  }

  if (norm === 'tat nut lon' || norm === 'nut binh thuong') {
    return {
      action: 'accessibility.disableLargeControls',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Lovira đã trở về kích thước nút bấm tiêu chuẩn.',
    };
  }

  if (norm === 'giam chuyen dong' || norm === 'tat chuyen dong' || norm === 'tat hieu ung') {
    return {
      action: 'accessibility.enableReducedMotion',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Lovira đã giảm các hiệu ứng chuyển động không cần thiết.',
    };
  }

  // 5. Speech Reading Controls
  if (
    norm === 'doc cham hon' ||
    norm === 'doc cham lai' ||
    norm === 'noi cham hon' ||
    norm === 'noi cham lai' ||
    norm === 'noi lai cham thoi'
  ) {
    return {
      action: 'speech.slower',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Lovira đã giảm tốc độ đọc.',
    };
  }

  if (norm === 'doc nhanh hon' || norm === 'doc nhanh len' || norm === 'noi nhanh hon') {
    return {
      action: 'speech.faster',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Lovira đã tăng tốc độ đọc.',
    };
  }

  if (norm === 'doc to' || norm === 'doc trang nay' || norm === 'doc man hinh' || norm === 'doc toan bo') {
    return {
      action: 'speech.readCurrent',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Lovira sẽ đọc nội dung hiển thị trên màn hình.',
    };
  }

  if (norm === 'doc lai' || norm === 'noi lai' || norm === 'doc lai ket qua') {
    return {
      action: 'speech.readResult',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Lovira sẽ đọc lại kết quả gần nhất.',
    };
  }

  if (norm === 'toi dang o dau' || norm === 'trang nay la gi' || norm === 'mo ta trang') {
    return {
      action: 'DESCRIBE_CURRENT_PAGE',
      confidence: 1.0,
      confirmationRequired: false,
      feedback: 'Lovira sẽ mô tả vị trí và các thành phần trên trang này.',
    };
  }

  return null;
}

