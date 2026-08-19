import { AgentActionDefinition } from './types';

export const CORE_AGENT_ACTIONS: AgentActionDefinition[] = [
  // ==================== NAVIGATION ====================
  {
    id: 'navigation.home',
    label: 'Về trang chủ',
    description: 'Chuyển về màn hình trang chủ chính của Lovira',
    category: 'navigation',
    aliases: ['về trang chủ', 'quay về trang chủ', 'về màn hình chính', 'trang chủ', 'menu chính'],
  },
  {
    id: 'navigation.back',
    label: 'Quay lại',
    description: 'Quay trở lại màn hình trước đó',
    category: 'navigation',
    aliases: ['quay lại', 'trở lại', 'lùi lại', 'quay về trước'],
  },
  {
    id: 'navigation.openVision',
    label: 'Mở Nhìn giúp tôi',
    description: 'Chuyển sang màn hình phân tích hình ảnh và camera',
    category: 'navigation',
    aliases: [
      'nhìn giúp tôi',
      'xem giúp tôi',
      'mở camera',
      'tôi muốn xem cái này',
      'chụp ảnh',
      'quét ảnh',
      'mở nhìn',
      'tôi không thấy rõ',
    ],
  },
  {
    id: 'navigation.openConversation',
    label: 'Mở Nghe & ghi lại',
    description: 'Chuyển sang màn hình ghi âm và nhận diện giọng nói',
    category: 'navigation',
    aliases: [
      'nghe & ghi lại',
      'nghe giúp tôi',
      'mở nghe thoại',
      'bắt đầu nghe',
      'ghi âm',
      'nghe bác sĩ dặn',
      'tạo phụ đề',
    ],
  },
  {
    id: 'navigation.openEasyRead',
    label: 'Mở Làm nội dung dễ hiểu',
    description: 'Chuyển sang màn hình đơn giản hóa văn bản phức tạp',
    category: 'navigation',
    aliases: [
      'làm nội dung dễ hiểu',
      'làm dễ hiểu',
      'đơn giản hóa',
      'giản lược văn bản',
      'giải thích dễ hiểu',
      'khó hiểu quá',
    ],
  },
  {
    id: 'navigation.openDocument',
    label: 'Mở Hiểu tài liệu',
    description: 'Chuyển sang màn hình đọc và phân tích tài liệu PDF / DOCX',
    category: 'navigation',
    aliases: [
      'hiểu tài liệu',
      'đọc tài liệu',
      'phân tích tệp',
      'đọc file pdf',
      'mở tài liệu',
      'gửi tài liệu',
    ],
  },
  {
    id: 'navigation.openHistory',
    label: 'Mở Lịch sử & Hoạt động',
    description: 'Chuyển sang màn hình xem lịch sử hoạt động',
    category: 'navigation',
    aliases: ['lịch sử', 'xem lịch sử', 'các hoạt động cũ', 'lịch sử đã lưu', 'nhật ký'],
  },
  {
    id: 'navigation.openSettings',
    label: 'Mở Cài đặt & Trợ năng',
    description: 'Chuyển sang màn hình tùy chỉnh kích cỡ chữ, màu sắc và giọng đọc',
    category: 'navigation',
    aliases: ['cài đặt', 'trợ năng', 'tùy chỉnh', 'đổi cỡ chữ', 'đổi giọng đọc'],
  },
  {
    id: 'navigation.openSession',
    label: 'Xem phiên làm việc hiện tại',
    description: 'Mở màn hình chi tiết của phiên đời sống đang thực hiện',
    category: 'navigation',
    aliases: ['xem phiên hiện tại', 'phiên làm việc', 'nhiệm vụ hiện tại', 'mở phiên'],
  },

  // ==================== VISION ====================
  {
    id: 'vision.openCamera',
    label: 'Bật máy ảnh',
    description: 'Mở camera thiết bị để người dùng quét hoặc chụp ảnh',
    category: 'vision',
    aliases: ['bật camera', 'mở máy ảnh', 'bật máy ảnh', 'bật chụp hình'],
  },
  {
    id: 'vision.capture',
    label: 'Chụp ảnh',
    description: 'Chụp lại khung hình hiện tại từ camera',
    category: 'vision',
    aliases: ['chụp ảnh', 'chụp hình', 'bấm chụp', 'chụp cái này'],
  },
  {
    id: 'vision.selectImage',
    label: 'Chọn ảnh từ máy',
    description: 'Mở hộp thoại chọn tệp hình ảnh từ thiết bị',
    category: 'vision',
    aliases: ['chọn ảnh', 'tải ảnh lên', 'chọn tệp ảnh', 'upload ảnh'],
  },
  {
    id: 'vision.describeScene',
    label: 'Mô tả toàn cảnh',
    description: 'Chuyển chế độ sang mô tả toàn bộ cảnh quan và bối cảnh xung quanh',
    category: 'vision',
    requires: ['activeImage'],
    aliases: ['mô tả cảnh', 'mô tả cảnh vật', 'xung quanh có gì', 'nhìn tổng quan'],
  },
  {
    id: 'vision.readText',
    label: 'Đọc chữ trong ảnh',
    description: 'Trích xuất và đọc toàn bộ văn bản, biển báo hoặc nhãn chữ trong ảnh',
    category: 'vision',
    requires: ['activeImage'],
    aliases: [
      'đọc chữ',
      'đọc chữ trong ảnh',
      'trích xuất chữ',
      'đọc biển báo',
      'đọc nhãn',
      'chữ gì đây',
      'giấy này viết gì',
    ],
  },
  {
    id: 'vision.detectSafety',
    label: 'Cảnh báo an toàn',
    description: 'Kiểm tra chướng ngại vật và cảnh báo an toàn trong tầm nhìn',
    category: 'vision',
    requires: ['activeImage'],
    aliases: ['cảnh báo an toàn', 'có nguy hiểm không', 'có chướng ngại vật không', 'an toàn'],
  },
  {
    id: 'vision.analyze',
    label: 'Phân tích hình ảnh',
    description: 'Chạy phân tích đa phương thức trên ảnh hiện tại',
    category: 'vision',
    requires: ['activeImage'],
    aliases: ['phân tích ảnh', 'quét ảnh này', 'xem ảnh này'],
  },

  // ==================== DOCUMENT ====================
  {
    id: 'document.select',
    label: 'Chọn tệp tài liệu',
    description: 'Mở hộp thoại tải tài liệu PDF, DOCX hoặc văn bản',
    category: 'document',
    aliases: ['chọn tệp tài liệu', 'tải tài liệu lên', 'chọn file pdf', 'nạp tài liệu'],
  },
  {
    id: 'document.read',
    label: 'Đọc tài liệu',
    description: 'Đọc to toàn bộ nội dung hoặc phân tích của tài liệu',
    category: 'document',
    requires: ['activeDocument'],
    aliases: ['đọc tài liệu này', 'đọc nội dung văn bản', 'đọc to tài liệu'],
  },
  {
    id: 'document.summarize',
    label: 'Tóm tắt tài liệu',
    description: 'Tóm tắt các ý chính trong tài liệu hiện tại',
    category: 'document',
    requires: ['activeDocument'],
    aliases: ['tóm tắt tài liệu', 'tóm tắt tệp', 'nói ngắn gọn tài liệu'],
  },
  {
    id: 'document.ask',
    label: 'Hỏi về tài liệu',
    description: 'Đặt câu hỏi cụ thể về thông tin trong tài liệu',
    category: 'document',
    requires: ['activeDocument'],
    aliases: ['hỏi tài liệu', 'tra cứu thông tin tài liệu', 'hỏi về giấy này'],
  },
  {
    id: 'document.extractImportantInformation',
    label: 'Trích xuất thông tin quan trọng',
    description: 'Rút trích các ngày tháng, địa điểm, phòng khám, số thứ tự, yêu cầu',
    category: 'document',
    requires: ['activeDocument'],
    aliases: [
      'thông tin quan trọng',
      'trích xuất thông tin',
      'rút ra thông tin cần nhớ',
      'có gì quan trọng',
    ],
  },
  {
    id: 'document.extractDates',
    label: 'Trích xuất ngày tháng hạn chót',
    description: 'Tìm kiếm tất cả ngày hẹn, hạn chót, ngày nộp hồ sơ',
    category: 'document',
    requires: ['activeDocument'],
    aliases: ['hạn chót', 'ngày hẹn', 'ngày nào quan trọng', 'khi nào'],
  },
  {
    id: 'document.extractRequirements',
    label: 'Trích xuất yêu cầu hồ sơ',
    description: 'Liệt kê danh sách các giấy tờ và thủ tục cần chuẩn bị',
    category: 'document',
    requires: ['activeDocument'],
    aliases: ['hồ sơ cần có', 'giấy tờ cần chuẩn bị', 'tôi cần mang gì', 'yêu cầu'],
  },

  // ==================== EASY READ ====================
  {
    id: 'easyRead.simplify',
    label: 'Làm dễ hiểu văn bản',
    description: 'Giản lược đoạn văn bản phức tạp thành ngôn ngữ bình dân, dễ hiểu',
    category: 'easyRead',
    aliases: [
      'làm dễ hiểu',
      'giản lược',
      'đơn giản hóa đoạn này',
      'nói dễ hiểu hơn',
      'dễ hiểu hơn',
      'ngắn gọn lại',
    ],
  },
  {
    id: 'easyRead.simplifySelectedText',
    label: 'Làm dễ hiểu đoạn chọn',
    description: 'Giản lược đoạn văn bản mà người dùng đang bôi đen / chọn',
    category: 'easyRead',
    requires: ['selectedText'],
    aliases: ['làm dễ hiểu đoạn này', 'giải thích đoạn bôi đen', 'đoạn này nghĩa là gì'],
  },
  {
    id: 'easyRead.explainTerm',
    label: 'Giải thích thuật ngữ khó',
    description: 'Tra cứu và giải thích từ ngữ chuyên môn, luật định hoặc y khoa',
    category: 'easyRead',
    aliases: ['giải thích từ này', 'từ này nghĩa là gì', 'thuật ngữ khó'],
  },

  // ==================== CONVERSATION ====================
  {
    id: 'conversation.start',
    label: 'Bắt đầu lắng nghe',
    description: 'Bật micro để ghi âm và nhận diện giọng nói đối thoại',
    category: 'conversation',
    aliases: ['bắt đầu nghe', 'bật nghe thoại', 'nghe giúp tôi', 'bắt đầu ghi âm', 'bật micro', 'thu âm'],
  },
  {
    id: 'conversation.pause',
    label: 'Tạm dừng nghe',
    description: 'Tạm dừng việc ghi âm nhận diện giọng nói',
    category: 'conversation',
    aliases: ['tạm dừng nghe', 'tạm dừng', 'ngừng nghe tạm thời', 'tạm dừng ghi âm'],
  },
  {
    id: 'conversation.resume',
    label: 'Tiếp tục nghe',
    description: 'Tiếp tục ghi âm nhận diện giọng nói sau khi tạm dừng',
    category: 'conversation',
    aliases: ['tiếp tục nghe', 'tiếp tục ghi âm', 'tiếp tục thu âm', 'nghe tiếp'],
  },
  {
    id: 'conversation.stop',
    label: 'Dừng ghi âm',
    description: 'Dừng ghi âm hội thoại và sẵn sàng phân tích',
    category: 'conversation',
    aliases: ['dừng nghe', 'dừng ghi âm', 'kết thúc nghe', 'kết thúc ghi âm', 'xong rồi'],
  },
  {
    id: 'conversation.summarize',
    label: 'Tóm tắt hội thoại',
    description: 'Tóm tắt nội dung cuộc trò chuyện vừa ghi âm',
    category: 'conversation',
    aliases: ['tóm tắt cuộc trò chuyện', 'tóm tắt lời nói', 'họ dặn gì', 'bác sĩ nói gì', 'tóm tắt'],
  },
  {
    id: 'conversation.extractTasks',
    label: 'Trích xuất việc cần làm',
    description: 'Tìm kiếm các lời dặn, việc cần làm, lịch hẹn từ cuộc hội thoại',
    category: 'conversation',
    aliases: ['việc cần làm từ cuộc nói chuyện', 'lời dặn', 'phải làm gì sau đó', 'việc cần làm'],
  },
  {
    id: 'conversation.clear',
    label: 'Xóa nội dung cuộc trò chuyện',
    description: 'Xóa toàn bộ văn bản ghi âm và kết quả tóm tắt cuộc trò chuyện hiện tại',
    category: 'conversation',
    aliases: ['xóa cuộc trò chuyện', 'xóa ghi âm', 'xóa hết', 'làm mới cuộc trò chuyện'],
  },
  {
    id: 'conversation.readSummary',
    label: 'Đọc bản tóm tắt cuộc trò chuyện',
    description: 'Đọc to nội dung tóm tắt và các ý chính của cuộc trò chuyện',
    category: 'conversation',
    aliases: ['đọc bản tóm tắt', 'đọc tóm tắt', 'đọc tóm tắt cuộc trò chuyện', 'đọc lời dặn'],
  },
  {
    id: 'conversation.copyTranscript',
    label: 'Sao chép văn bản cuộc trò chuyện',
    description: 'Sao chép toàn bộ nội dung lời thoại đã ghi âm vào khay nhớ tạm',
    category: 'conversation',
    aliases: ['sao chép cuộc trò chuyện', 'copy lời thoại', 'sao chép văn bản'],
  },

  // ==================== AGENT CONTROL ====================
  {
    id: 'agent.stopListening',
    label: 'Dừng nhận lệnh giọng nói',
    description: 'Dừng lắng nghe lệnh điều khiển từ micro',
    category: 'general',
    aliases: ['dừng nghe lệnh', 'thôi không nói nữa', 'dừng nhận lệnh'],
  },
  {
    id: 'agent.cancel',
    label: 'Hủy kế hoạch thực hiện',
    description: 'Dừng lại toàn bộ chuỗi hành động đang chạy',
    category: 'general',
    aliases: ['hủy thao tác', 'dừng lại', 'thôi', 'hủy kế hoạch', 'bỏ qua'],
  },

  // ==================== SPEECH ====================
  {
    id: 'speech.readCurrent',
    label: 'Đọc nội dung đang chọn',
    description: 'Đọc to văn bản hoặc mục đang được người dùng chú ý',
    category: 'speech',
    aliases: ['đọc cái này', 'đọc đoạn này', 'đọc chỗ này', 'đọc to'],
  },
  {
    id: 'speech.readResult',
    label: 'Đọc kết quả phân tích',
    description: 'Đọc to toàn bộ kết quả vừa xử lý xong',
    category: 'speech',
    aliases: ['đọc kết quả', 'đọc lại kết quả', 'đọc lại', 'nói lại cho tôi'],
  },
  {
    id: 'speech.stop',
    label: 'Dừng đọc',
    description: 'Dừng ngay giọng đọc đang phát',
    category: 'speech',
    aliases: ['dừng đọc', 'im lặng', 'tắt tiếng', 'dừng phát âm', 'thôi đừng đọc'],
  },
  {
    id: 'speech.slower',
    label: 'Đọc chậm lại',
    description: 'Giảm tốc độ phát âm giọng đọc',
    category: 'speech',
    aliases: ['đọc chậm lại', 'nói chậm hơn', 'chậm thôi', 'giảm tốc độ nói'],
  },
  {
    id: 'speech.faster',
    label: 'Đọc nhanh hơn',
    description: 'Tăng tốc độ phát âm giọng đọc',
    category: 'speech',
    aliases: ['đọc nhanh hơn', 'nói nhanh lên', 'tăng tốc độ nói'],
  },

  // ==================== ACCESSIBILITY ====================
  {
    id: 'accessibility.increaseFont',
    label: 'Tăng kích thước chữ',
    description: 'Phóng to cỡ chữ hiển thị trên toàn ứng dụng',
    category: 'accessibility',
    aliases: ['tăng cỡ chữ', 'chữ to hơn', 'phóng to chữ', 'chữ to lên', 'cỡ chữ lớn hơn'],
  },
  {
    id: 'accessibility.decreaseFont',
    label: 'Giảm kích thước chữ',
    description: 'Thu nhỏ cỡ chữ hiển thị trên toàn ứng dụng',
    category: 'accessibility',
    aliases: ['giảm cỡ chữ', 'chữ nhỏ hơn', 'thu nhỏ chữ', 'cỡ chữ bé hơn'],
  },
  {
    id: 'accessibility.enableHighContrast',
    label: 'Bật tương phản cao',
    description: 'Chuyển giao diện sang màu tương phản đen vàng/trắng sắc nét',
    category: 'accessibility',
    aliases: ['bật tương phản cao', 'tương phản cao', 'chế độ tương phản', 'đổi tương phản'],
  },
  {
    id: 'accessibility.disableHighContrast',
    label: 'Tắt tương phản cao',
    description: 'Khôi phục độ tương phản màu chuẩn',
    category: 'accessibility',
    aliases: ['tắt tương phản cao', 'tương phản thường', 'tắt tương phản'],
  },
  {
    id: 'accessibility.enableLargeControls',
    label: 'Bật chế độ nút lớn',
    description: 'Mở rộng kích thước nút bấm và vùng chạm trợ năng',
    category: 'accessibility',
    aliases: ['bật nút lớn', 'nút bấm to', 'chế độ nút lớn'],
  },
  {
    id: 'accessibility.disableLargeControls',
    label: 'Tắt chế độ nút lớn',
    description: 'Khôi phục kích thước nút chuẩn',
    category: 'accessibility',
    aliases: ['tắt nút lớn', 'nút bấm thường'],
  },

  // ==================== LIFE SESSION ====================
  {
    id: 'session.create',
    label: 'Tạo phiên đời sống mới',
    description: 'Khởi tạo một nhiệm vụ đời sống (đi khám, làm thủ tục, mua sắm, đọc hiểu)',
    category: 'session',
    aliases: [
      'tôi đang đi khám',
      'hỗ trợ tôi đi khám',
      'làm thủ tục',
      'tôi đang làm giấy tờ',
      'tôi đang đi mua sắm',
      'tôi đang mua đồ',
      'tạo phiên mới',
    ],
  },
  {
    id: 'session.update',
    label: 'Cập nhật phiên làm việc',
    description: 'Cập nhật trạng thái hoặc mục tiêu của phiên hiện tại',
    category: 'session',
    aliases: ['cập nhật phiên', 'đổi mục tiêu'],
  },
  {
    id: 'session.addFact',
    label: 'Lưu thông tin quan trọng vào phiên',
    description: 'Lưu thêm số phòng, số thứ tự, ngày hẹn hoặc dặn dò vào bộ nhớ phiên',
    category: 'session',
    aliases: ['lưu thông tin này', 'ghi nhớ số này', 'nhớ ngày hẹn này'],
  },
  {
    id: 'session.addTask',
    label: 'Thêm việc cần làm vào phiên',
    description: 'Thêm mục hành động hoặc giấy tờ cần nộp vào danh sách nhiệm vụ',
    category: 'session',
    aliases: ['thêm việc cần làm', 'thêm nhiệm vụ', 'cần làm việc này'],
  },
  {
    id: 'session.completeTask',
    label: 'Đánh dấu đã hoàn thành việc',
    description: 'Đánh dấu hoàn thành một nhiệm vụ hoặc giấy tờ trong phiên',
    category: 'session',
    aliases: ['xong việc này rồi', 'đã có giấy này', 'hoàn thành việc'],
  },
  {
    id: 'session.getNextStep',
    label: 'Việc tiếp theo tôi phải làm gì',
    description: 'Hỏi Lovira bước hành động kế tiếp dựa vào bộ nhớ phiên làm việc',
    category: 'session',
    aliases: [
      'giờ tôi phải làm gì',
      'tiếp theo làm gì',
      'bước tiếp theo',
      'làm gì bây giờ',
      'tiếp theo',
      'tôi còn thiếu gì',
      'bây giờ làm sao',
    ],
  },
  {
    id: 'session.summarize',
    label: 'Tóm tắt toàn bộ phiên',
    description: 'Đọc tổng kết tiến độ, những việc đã làm và việc còn lại của phiên',
    category: 'session',
    aliases: ['tóm tắt phiên', 'tổng kết phiên', 'tôi đã làm được gì rồi'],
  },
  {
    id: 'session.pause',
    label: 'Tạm dừng phiên',
    description: 'Tạm dừng phiên làm việc để tiếp tục sau',
    category: 'session',
    aliases: ['tạm dừng phiên', 'tạm nghỉ', 'để sau làm tiếp'],
  },
  {
    id: 'session.complete',
    label: 'Hoàn thành phiên làm việc',
    description: 'Đóng và lưu trữ phiên khi đã hoàn thành trọn vẹn mục tiêu',
    category: 'session',
    aliases: ['hoàn thành phiên', 'kết thúc phiên', 'xong hết rồi'],
  },
  {
    id: 'session.clear',
    label: 'Hủy hoặc xóa phiên hiện tại',
    description: 'Xóa phiên làm việc hiện tại',
    category: 'session',
    confirmationRequired: true,
    aliases: ['xóa phiên', 'hủy phiên này', 'bỏ phiên hiện tại'],
  },
];

export class ActionRegistry {
  private static actionsMap = new Map<string, AgentActionDefinition>();

  static {
    CORE_AGENT_ACTIONS.forEach((action) => {
      this.actionsMap.set(action.id.toLowerCase(), action);
    });
  }

  public static getAction(id: string): AgentActionDefinition | undefined {
    return this.actionsMap.get(id.toLowerCase());
  }

  public static hasAction(id: string): boolean {
    return this.actionsMap.has(id.toLowerCase());
  }

  public static getAllActions(): AgentActionDefinition[] {
    return Array.from(this.actionsMap.values());
  }

  public static registerCustomAction(action: AgentActionDefinition): void {
    this.actionsMap.set(action.id.toLowerCase(), action);
  }

  public static getActionsByCategory(category: string): AgentActionDefinition[] {
    return Array.from(this.actionsMap.values()).filter(
      (a) => a.category.toLowerCase() === category.toLowerCase()
    );
  }
}
