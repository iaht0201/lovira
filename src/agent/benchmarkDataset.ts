export interface BenchmarkTestCase {
  id: string;
  category:
    | 'direct_command'
    | 'paraphrase'
    | 'context_dependent'
    | 'referential'
    | 'multi_step'
    | 'ambiguous'
    | 'prerequisite_missing'
    | 'session_memory';
  utterance: string;
  context: {
    currentScreen: string;
    hasImage?: boolean;
    hasDocument?: boolean;
    hasSelection?: boolean;
    hasResult?: boolean;
    hasActiveSession?: boolean;
    sessionType?: string;
  };
  expectedIntent: string;
  expectedActions: string[];
  expectedFeedbackIncludes?: string;
}

export const BENCHMARK_DATASET: BenchmarkTestCase[] = [
  // ==================== 1. DIRECT COMMANDS (1-10) ====================
  {
    id: 'tc_01',
    category: 'direct_command',
    utterance: 'Về trang chủ',
    context: { currentScreen: 'vision' },
    expectedIntent: 'exact_action_navigation.home',
    expectedActions: ['navigation.home'],
  },
  {
    id: 'tc_02',
    category: 'direct_command',
    utterance: 'Mở nhìn giúp tôi',
    context: { currentScreen: 'dashboard' },
    expectedIntent: 'exact_action_navigation.openVision',
    expectedActions: ['navigation.openVision'],
  },
  {
    id: 'tc_03',
    category: 'direct_command',
    utterance: 'Mở nghe & ghi lại',
    context: { currentScreen: 'dashboard' },
    expectedIntent: 'exact_action_navigation.openConversation',
    expectedActions: ['navigation.openConversation'],
  },
  {
    id: 'tc_04',
    category: 'direct_command',
    utterance: 'Mở làm nội dung dễ hiểu',
    context: { currentScreen: 'dashboard' },
    expectedIntent: 'exact_action_navigation.openEasyRead',
    expectedActions: ['navigation.openEasyRead'],
  },
  {
    id: 'tc_05',
    category: 'direct_command',
    utterance: 'Mở hiểu tài liệu',
    context: { currentScreen: 'dashboard' },
    expectedIntent: 'exact_action_navigation.openDocument',
    expectedActions: ['navigation.openDocument'],
  },
  {
    id: 'tc_06',
    category: 'direct_command',
    utterance: 'Bật tương phản cao',
    context: { currentScreen: 'settings' },
    expectedIntent: 'exact_action_accessibility.enableHighContrast',
    expectedActions: ['accessibility.enableHighContrast'],
  },
  {
    id: 'tc_07',
    category: 'direct_command',
    utterance: 'Tăng cỡ chữ',
    context: { currentScreen: 'dashboard' },
    expectedIntent: 'exact_action_accessibility.increaseFont',
    expectedActions: ['accessibility.increaseFont'],
  },
  {
    id: 'tc_08',
    category: 'direct_command',
    utterance: 'Bật chế độ nút lớn',
    context: { currentScreen: 'settings' },
    expectedIntent: 'exact_action_accessibility.enableLargeControls',
    expectedActions: ['accessibility.enableLargeControls'],
  },
  {
    id: 'tc_09',
    category: 'direct_command',
    utterance: 'Dừng đọc',
    context: { currentScreen: 'dashboard' },
    expectedIntent: 'exact_action_speech.stop',
    expectedActions: ['speech.stop'],
  },
  {
    id: 'tc_10',
    category: 'direct_command',
    utterance: 'Đọc chậm lại',
    context: { currentScreen: 'dashboard' },
    expectedIntent: 'exact_action_speech.slower',
    expectedActions: ['speech.slower'],
  },

  // ==================== 2. PARAPHRASES & NATURAL LANGUAGE (11-20) ====================
  {
    id: 'tc_11',
    category: 'paraphrase',
    utterance: 'Tôi không thấy rõ, xem hộ tôi với',
    context: { currentScreen: 'dashboard' },
    expectedIntent: 'open_vision',
    expectedActions: ['navigation.openVision'],
  },
  {
    id: 'tc_12',
    category: 'paraphrase',
    utterance: 'Đoạn này viết khó hiểu quá',
    context: { currentScreen: 'dashboard' },
    expectedIntent: 'open_easy_read',
    expectedActions: ['navigation.openEasyRead'],
  },
  {
    id: 'tc_13',
    category: 'paraphrase',
    utterance: 'Nghe giúp tôi xem họ nói gì',
    context: { currentScreen: 'dashboard' },
    expectedIntent: 'open_conversation',
    expectedActions: ['navigation.openConversation'],
  },
  {
    id: 'tc_14',
    category: 'paraphrase',
    utterance: 'Chữ nhỏ quá nhìn không ra',
    context: { currentScreen: 'dashboard' },
    expectedIntent: 'increase_font',
    expectedActions: ['accessibility.increaseFont'],
  },
  {
    id: 'tc_15',
    category: 'paraphrase',
    utterance: 'Làm chữ to lên cho dễ nhìn',
    context: { currentScreen: 'dashboard' },
    expectedIntent: 'increase_font',
    expectedActions: ['accessibility.increaseFont'],
  },
  {
    id: 'tc_16',
    category: 'paraphrase',
    utterance: 'Nói nhanh lên một chút',
    context: { currentScreen: 'dashboard' },
    expectedIntent: 'faster_speech',
    expectedActions: ['speech.faster'],
  },
  {
    id: 'tc_17',
    category: 'paraphrase',
    utterance: 'Tôi muốn đọc file pdf này',
    context: { currentScreen: 'dashboard' },
    expectedIntent: 'open_documents',
    expectedActions: ['navigation.openDocument'],
  },
  {
    id: 'tc_18',
    category: 'paraphrase',
    utterance: 'Cho tôi xem lịch sử những lần dùng trước',
    context: { currentScreen: 'dashboard' },
    expectedIntent: 'open_history',
    expectedActions: ['navigation.openHistory'],
  },
  {
    id: 'tc_19',
    category: 'paraphrase',
    utterance: 'Đổi nền sang màu dễ nhìn hơn',
    context: { currentScreen: 'settings' },
    expectedIntent: 'high_contrast',
    expectedActions: ['accessibility.enableHighContrast'],
  },
  {
    id: 'tc_20',
    category: 'paraphrase',
    utterance: 'Nút bé quá khó bấm',
    context: { currentScreen: 'dashboard' },
    expectedIntent: 'large_controls',
    expectedActions: ['accessibility.enableLargeControls'],
  },

  // ==================== 3. CONTEXT-DEPENDENT COMMANDS (21-28) ====================
  {
    id: 'tc_21',
    category: 'context_dependent',
    utterance: 'Đọc chữ',
    context: { currentScreen: 'vision', hasImage: true },
    expectedIntent: 'vision_read_text',
    expectedActions: ['vision.readText'],
  },
  {
    id: 'tc_22',
    category: 'context_dependent',
    utterance: 'Đọc chữ',
    context: { currentScreen: 'dashboard' },
    expectedIntent: 'open_vision_and_read_text',
    expectedActions: ['navigation.openVision', 'vision.readText'],
  },
  {
    id: 'tc_23',
    category: 'context_dependent',
    utterance: 'Giản lược ngay',
    context: { currentScreen: 'easyRead' },
    expectedIntent: 'easy_read_simplify',
    expectedActions: ['easyRead.simplify'],
  },
  {
    id: 'tc_24',
    category: 'context_dependent',
    utterance: 'Bắt đầu nghe',
    context: { currentScreen: 'conversation' },
    expectedIntent: 'conversation_start',
    expectedActions: ['conversation.start'],
  },
  {
    id: 'tc_25',
    category: 'context_dependent',
    utterance: 'Tóm tắt nội dung',
    context: { currentScreen: 'documents', hasDocument: true },
    expectedIntent: 'document_summarize',
    expectedActions: ['document.summarize'],
  },
  {
    id: 'tc_26',
    category: 'context_dependent',
    utterance: 'Tóm tắt nội dung',
    context: { currentScreen: 'conversation' },
    expectedIntent: 'conversation_summarize',
    expectedActions: ['conversation.summarize'],
  },
  {
    id: 'tc_27',
    category: 'context_dependent',
    utterance: 'Chụp ảnh',
    context: { currentScreen: 'vision' },
    expectedIntent: 'vision_capture',
    expectedActions: ['vision.capture'],
  },
  {
    id: 'tc_28',
    category: 'context_dependent',
    utterance: 'Mô tả cảnh vật',
    context: { currentScreen: 'vision', hasImage: true },
    expectedIntent: 'vision_describe',
    expectedActions: ['vision.describeScene'],
  },

  // ==================== 4. REFERENTIAL LANGUAGE (29-35) ====================
  {
    id: 'tc_29',
    category: 'referential',
    utterance: 'Đọc lại kết quả',
    context: { currentScreen: 'vision', hasResult: true },
    expectedIntent: 'read_result',
    expectedActions: ['speech.readResult'],
  },
  {
    id: 'tc_30',
    category: 'referential',
    utterance: 'Đọc đoạn này cho tôi',
    context: { currentScreen: 'easyRead', hasSelection: true },
    expectedIntent: 'read_selection',
    expectedActions: ['speech.readCurrent'],
  },
  {
    id: 'tc_31',
    category: 'referential',
    utterance: 'Nói lại',
    context: { currentScreen: 'documents', hasResult: true },
    expectedIntent: 'read_result',
    expectedActions: ['speech.readResult'],
  },
  {
    id: 'tc_32',
    category: 'referential',
    utterance: 'Làm dễ hiểu đoạn này',
    context: { currentScreen: 'documents', hasSelection: true },
    expectedIntent: 'simplify_selected',
    expectedActions: ['easyRead.simplifySelectedText'],
  },
  {
    id: 'tc_33',
    category: 'referential',
    utterance: 'Cái này có nguy hiểm không',
    context: { currentScreen: 'vision', hasImage: true },
    expectedIntent: 'detect_safety',
    expectedActions: ['vision.detectSafety'],
  },
  {
    id: 'tc_34',
    category: 'referential',
    utterance: 'Trong tài liệu này ngày nào là hạn chót',
    context: { currentScreen: 'documents', hasDocument: true },
    expectedIntent: 'extract_dates',
    expectedActions: ['document.extractDates'],
  },
  {
    id: 'tc_35',
    category: 'referential',
    utterance: 'Giấy này yêu cầu những gì',
    context: { currentScreen: 'documents', hasDocument: true },
    expectedIntent: 'extract_requirements',
    expectedActions: ['document.extractRequirements'],
  },

  // ==================== 5. MULTI-STEP WORKFLOWS (36-42) ====================
  {
    id: 'tc_36',
    category: 'multi_step',
    utterance: 'Vào cài đặt và bật tương phản cao',
    context: { currentScreen: 'dashboard' },
    expectedIntent: 'settings_high_contrast',
    expectedActions: ['navigation.openSettings', 'accessibility.enableHighContrast'],
  },
  {
    id: 'tc_37',
    category: 'multi_step',
    utterance: 'Vào cài đặt và phóng to chữ',
    context: { currentScreen: 'dashboard' },
    expectedIntent: 'settings_increase_font',
    expectedActions: ['navigation.openSettings', 'accessibility.increaseFont'],
  },
  {
    id: 'tc_38',
    category: 'multi_step',
    utterance: 'Mở Nhìn giúp tôi rồi chuyển sang đọc chữ',
    context: { currentScreen: 'dashboard' },
    expectedIntent: 'open_vision_and_read_text',
    expectedActions: ['navigation.openVision', 'vision.readText'],
  },
  {
    id: 'tc_39',
    category: 'multi_step',
    utterance: 'Vào nghe thoại và bắt đầu nghe',
    context: { currentScreen: 'dashboard' },
    expectedIntent: 'open_conversation_and_start',
    expectedActions: ['navigation.openConversation', 'conversation.start'],
  },
  {
    id: 'tc_40',
    category: 'multi_step',
    utterance: 'Mở tài liệu và tóm tắt',
    context: { currentScreen: 'dashboard' },
    expectedIntent: 'open_doc_and_summarize',
    expectedActions: ['navigation.openDocument', 'document.summarize'],
  },
  {
    id: 'tc_41',
    category: 'multi_step',
    utterance: 'Về trang chủ và mở lịch sử',
    context: { currentScreen: 'vision' },
    expectedIntent: 'open_history',
    expectedActions: ['navigation.openHistory'],
  },
  {
    id: 'tc_42',
    category: 'multi_step',
    utterance: 'Vào Cài đặt rồi bật chế độ nút lớn',
    context: { currentScreen: 'dashboard' },
    expectedIntent: 'settings_large_controls',
    expectedActions: ['navigation.openSettings', 'accessibility.enableLargeControls'],
  },

  // ==================== 6. LIFE SESSIONS & SESSION MEMORY (43-52) ====================
  {
    id: 'tc_43',
    category: 'session_memory',
    utterance: 'Tôi đang đi khám',
    context: { currentScreen: 'dashboard' },
    expectedIntent: 'create_healthcare_session',
    expectedActions: ['session.create', 'navigation.openSession'],
  },
  {
    id: 'tc_44',
    category: 'session_memory',
    utterance: 'Tôi đang làm thủ tục hành chính',
    context: { currentScreen: 'dashboard' },
    expectedIntent: 'create_admin_session',
    expectedActions: ['session.create', 'navigation.openSession'],
  },
  {
    id: 'tc_45',
    category: 'session_memory',
    utterance: 'Tôi đang đi mua sắm',
    context: { currentScreen: 'dashboard' },
    expectedIntent: 'create_shopping_session',
    expectedActions: ['session.create', 'navigation.openSession'],
  },
  {
    id: 'tc_46',
    category: 'session_memory',
    utterance: 'Giờ tôi phải làm gì',
    context: { currentScreen: 'session', hasActiveSession: true, sessionType: 'healthcare' },
    expectedIntent: 'session_next_step',
    expectedActions: ['session.getNextStep'],
  },
  {
    id: 'tc_47',
    category: 'session_memory',
    utterance: 'Tiếp theo làm gì',
    context: { currentScreen: 'session', hasActiveSession: true },
    expectedIntent: 'session_next_step',
    expectedActions: ['session.getNextStep'],
  },
  {
    id: 'tc_48',
    category: 'session_memory',
    utterance: 'Tôi còn thiếu gì',
    context: { currentScreen: 'session', hasActiveSession: true },
    expectedIntent: 'session_next_step',
    expectedActions: ['session.getNextStep'],
  },
  {
    id: 'tc_49',
    category: 'session_memory',
    utterance: 'Tóm tắt toàn bộ phiên này',
    context: { currentScreen: 'session', hasActiveSession: true },
    expectedIntent: 'session_summarize',
    expectedActions: ['session.summarize'],
  },
  {
    id: 'tc_50',
    category: 'session_memory',
    utterance: 'Tạm dừng phiên',
    context: { currentScreen: 'session', hasActiveSession: true },
    expectedIntent: 'session_pause',
    expectedActions: ['session.pause'],
  },
  {
    id: 'tc_51',
    category: 'session_memory',
    utterance: 'Hoàn thành phiên làm việc',
    context: { currentScreen: 'session', hasActiveSession: true },
    expectedIntent: 'session_complete',
    expectedActions: ['session.complete'],
  },
  {
    id: 'tc_52',
    category: 'session_memory',
    utterance: 'Xem phiên hiện tại',
    context: { currentScreen: 'dashboard', hasActiveSession: true },
    expectedIntent: 'open_session',
    expectedActions: ['navigation.openSession'],
  },
];
