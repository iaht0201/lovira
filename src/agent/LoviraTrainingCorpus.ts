/**
 * Lovira Client-Side Semantic Training Corpus & Intent Knowledge Base
 */

export interface TrainingExample {
  userUtterance: string;
  context: {
    currentScreen: string;
    currentRoute?: string;
    activeSession?: {
      type: string;
      title: string;
      factsCount?: number;
      tasksCount?: number;
    } | null;
    hasImage?: boolean;
    hasDocument?: boolean;
    hasSelectedText?: boolean;
    hasResult?: boolean;
  };
  expectedAction: string;
  expectedPlan?: Array<{
    action: string;
    reason?: string;
    parameters?: Record<string, unknown>;
  }>;
  feedback: string;
  category: 'navigation' | 'life_scenario' | 'memory_query' | 'accessibility' | 'vision' | 'conversation' | 'document' | 'easyread';
}

export const LOVIRA_FEW_SHOT_TRAINING_CORPUS: TrainingExample[] = [
  // ==================== NAVIGATION ====================
  {
    userUtterance: 'Mở trang nhìn giúp tôi',
    context: { currentScreen: 'dashboard', currentRoute: '/' },
    expectedAction: 'navigation.openVision',
    expectedPlan: [{ action: 'navigation.openVision', reason: 'Mở màn hình Nhìn giúp tôi' }],
    feedback: 'Lovira đã chuyển sang màn hình Nhìn giúp tôi. Bạn có thể bật máy ảnh hoặc tải ảnh lên nhé.',
    category: 'navigation',
  },
  {
    userUtterance: 'Chuyển qua camera xem ảnh',
    context: { currentScreen: 'dashboard', currentRoute: '/' },
    expectedAction: 'navigation.openVision',
    expectedPlan: [
      { action: 'navigation.openVision', reason: 'Mở màn hình Nhìn giúp tôi' },
      { action: 'vision.openCamera', reason: 'Bật máy ảnh quét trực tiếp' },
    ],
    feedback: 'Lovira đã mở Nhìn giúp tôi và bật máy ảnh để hỗ trợ bạn.',
    category: 'navigation',
  },
  {
    userUtterance: 'Vào phần nghe hội thoại',
    context: { currentScreen: 'dashboard', currentRoute: '/' },
    expectedAction: 'navigation.openConversation',
    expectedPlan: [{ action: 'navigation.openConversation', reason: 'Mở màn hình Nghe & ghi lại' }],
    feedback: 'Lovira đã chuyển sang màn hình Nghe & ghi lại. Bấm bắt đầu nghe khi người đối diện nói chuyện nhé.',
    category: 'navigation',
  },
  {
    userUtterance: 'Tôi muốn làm văn bản này dễ hiểu hơn',
    context: { currentScreen: 'dashboard', currentRoute: '/' },
    expectedAction: 'navigation.openEasyRead',
    expectedPlan: [{ action: 'navigation.openEasyRead', reason: 'Mở màn hình Làm nội dung dễ hiểu' }],
    feedback: 'Lovira đã mở Làm nội dung dễ hiểu. Bạn hãy nhập hoặc dán đoạn văn bản cần đơn giản hóa nhé.',
    category: 'navigation',
  },
  {
    userUtterance: 'Mở tài liệu PDF của tôi',
    context: { currentScreen: 'dashboard', currentRoute: '/' },
    expectedAction: 'navigation.openDocument',
    expectedPlan: [{ action: 'navigation.openDocument', reason: 'Mở màn hình Hiểu tài liệu' }],
    feedback: 'Lovira đã mở màn hình Hiểu tài liệu. Bạn có thể tải tệp PDF hoặc Word lên để phân tích.',
    category: 'navigation',
  },
  {
    userUtterance: 'Xem lại các hoạt động trước',
    context: { currentScreen: 'vision', currentRoute: '/vision' },
    expectedAction: 'navigation.openHistory',
    expectedPlan: [{ action: 'navigation.openHistory', reason: 'Mở màn hình Lịch sử' }],
    feedback: 'Lovira đã mở màn hình Lịch sử các hoạt động đã lưu của bạn.',
    category: 'navigation',
  },
  {
    userUtterance: 'Mở cài đặt trợ năng',
    context: { currentScreen: 'dashboard', currentRoute: '/' },
    expectedAction: 'navigation.openSettings',
    expectedPlan: [{ action: 'navigation.openSettings', reason: 'Mở màn hình Cài đặt & Trợ năng' }],
    feedback: 'Lovira đã mở Cài đặt & Trợ năng để bạn tùy chỉnh cỡ chữ, màu sắc và giọng đọc.',
    category: 'navigation',
  },
  {
    userUtterance: 'Về trang chủ',
    context: { currentScreen: 'settings', currentRoute: '/settings' },
    expectedAction: 'navigation.home',
    expectedPlan: [{ action: 'navigation.home', reason: 'Chuyển về trang chủ chính' }],
    feedback: 'Lovira đã đưa bạn về Trang chủ. Các thông tin của bạn vẫn được lưu giữ.',
    category: 'navigation',
  },

  // ==================== LOVIRA LIFE SCENARIOS ====================
  {
    userUtterance: 'Tôi đang đi khám bệnh tại bệnh viện',
    context: { currentScreen: 'dashboard', currentRoute: '/' },
    expectedAction: 'session.create',
    expectedPlan: [
      { action: 'session.create', reason: 'Tạo phiên đi khám bệnh', parameters: { type: 'healthcare', title: 'Đi khám bệnh' } },
      { action: 'navigation.openSession', reason: 'Mở màn hình phiên làm việc' },
    ],
    feedback: 'Lovira đã kích hoạt phiên Đi khám bệnh. Bạn có thể chụp đơn thuốc, phiếu khám hoặc bật ghi âm lời bác sĩ dặn bất cứ lúc nào.',
    category: 'life_scenario',
  },
  {
    userUtterance: 'Tôi đi làm giấy tờ căn cước công dân ở ủy ban',
    context: { currentScreen: 'dashboard', currentRoute: '/' },
    expectedAction: 'session.create',
    expectedPlan: [
      { action: 'session.create', reason: 'Tạo phiên làm thủ tục hành chính', parameters: { type: 'administrative', title: 'Làm thủ tục CCCD' } },
      { action: 'navigation.openSession', reason: 'Mở màn hình phiên làm việc' },
    ],
    feedback: 'Lovira đã tạo phiên Làm thủ tục hành chính. Hãy đưa camera quét các giấy tờ để tôi tạo danh mục hồ sơ cần thiết cho bạn nhé.',
    category: 'life_scenario',
  },
  {
    userUtterance: 'Tôi đang đi siêu thị mua thực phẩm',
    context: { currentScreen: 'dashboard', currentRoute: '/' },
    expectedAction: 'session.create',
    expectedPlan: [
      { action: 'session.create', reason: 'Tạo phiên đi mua sắm', parameters: { type: 'shopping', title: 'Đi siêu thị mua sắm' } },
      { action: 'navigation.openSession', reason: 'Mở màn hình phiên làm việc' },
    ],
    feedback: 'Lovira đã khởi tạo phiên Đi mua đồ. Bạn có thể quét mã vạch, nhãn sản phẩm hoặc hạn sử dụng trên kệ hàng nhé.',
    category: 'life_scenario',
  },
  {
    userUtterance: 'Mở chế độ Lovira Life',
    context: { currentScreen: 'dashboard', currentRoute: '/' },
    expectedAction: 'navigation.openSession',
    expectedPlan: [{ action: 'navigation.openSession', reason: 'Mở màn hình Lovira Life' }],
    feedback: 'Chế độ Lovira Life đã sẵn sàng. Bạn muốn bắt đầu đi khám, làm thủ tục hành chính, hay đi mua sắm?',
    category: 'life_scenario',
  },

  // ==================== CONVERSATIONAL MEMORY & FOLLOW-UPS ====================
  {
    userUtterance: 'Giờ tôi phải làm gì tiếp theo?',
    context: {
      currentScreen: 'session',
      currentRoute: '/session',
      activeSession: { type: 'healthcare', title: 'Đi khám bệnh', factsCount: 2, tasksCount: 3 },
    },
    expectedAction: 'session.getNextStep',
    expectedPlan: [{ action: 'session.getNextStep', reason: 'Kiểm tra nhiệm vụ tiếp theo trong phiên' }],
    feedback: 'Trong phiên khám bệnh này, bước tiếp theo của bạn là đến phòng xét nghiệm và lấy thuốc theo đơn. Bạn có thể mở camera quét phiếu chỉ định.',
    category: 'memory_query',
  },
  {
    userUtterance: 'Tôi còn thiếu giấy tờ gì không?',
    context: {
      currentScreen: 'session',
      currentRoute: '/session',
      activeSession: { type: 'administrative', title: 'Làm thủ tục hành chính', factsCount: 3, tasksCount: 4 },
    },
    expectedAction: 'session.getNextStep',
    expectedPlan: [{ action: 'session.getNextStep', reason: 'Kiểm tra danh mục hồ sơ còn thiếu' }],
    feedback: 'Lovira đang kiểm tra danh mục hồ sơ của bạn. Bạn còn thiếu 01 bản sao hộ khẩu công chứng theo hướng dẫn trên phiếu.',
    category: 'memory_query',
  },
  {
    userUtterance: 'Đọc lại nội dung vừa rồi',
    context: { currentScreen: 'vision', currentRoute: '/vision', hasResult: true },
    expectedAction: 'speech.readResult',
    expectedPlan: [{ action: 'speech.readResult', reason: 'Đọc to kết quả hiện có trên màn hình' }],
    feedback: 'Đang đọc lại toàn bộ kết quả phân tích cho bạn.',
    category: 'memory_query',
  },

  // ==================== ACCESSIBILITY ====================
  {
    userUtterance: 'Chữ nhỏ quá phóng to lên cho tôi',
    context: { currentScreen: 'dashboard', currentRoute: '/' },
    expectedAction: 'accessibility.increaseFont',
    expectedPlan: [{ action: 'accessibility.increaseFont', reason: 'Tăng cỡ chữ giao diện' }],
    feedback: 'Lovira đã tăng kích thước chữ để bạn đọc dễ dàng hơn.',
    category: 'accessibility',
  },
  {
    userUtterance: 'Bật nền tối tương phản cao',
    context: { currentScreen: 'settings', currentRoute: '/settings' },
    expectedAction: 'accessibility.enableHighContrast',
    expectedPlan: [{ action: 'accessibility.enableHighContrast', reason: 'Bật chế độ tương phản cao' }],
    feedback: 'Lovira đã kích hoạt chế độ tương phản cao với viền và nền tối ưu cho thị giác.',
    category: 'accessibility',
  },
  {
    userUtterance: 'Dừng đọc lại',
    context: { currentScreen: 'easy-read', currentRoute: '/easy-read' },
    expectedAction: 'speech.stop',
    expectedPlan: [{ action: 'speech.stop', reason: 'Dừng phát âm thanh ngay lập tức' }],
    feedback: 'Đã dừng đọc.',
    category: 'accessibility',
  },
];
