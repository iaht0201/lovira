import { VisionResult, EasyReadResult, ConversationSummary, DocumentAnalysis } from '../types';
import { auth } from '../lib/firebase';

function getCustomApiKey(providedKey?: string): string | undefined {
  if (providedKey && providedKey.trim()) return providedKey.trim();
  try {
    const saved = localStorage.getItem('lovira_custom_gemini_key');
    return saved && saved.trim() ? saved.trim() : undefined;
  } catch {
    return undefined;
  }
}

export async function fetchApi<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const customApiKey = getCustomApiKey(body.customApiKey as string | undefined);
  const payload = customApiKey ? { ...body, customApiKey } : body;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Lovira-Client': 'web-app',
  };

  if (auth?.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch {
      // continue with client header
    }
  } else {
    // Pass local session token if offline or initializing
    try {
      const localUid = localStorage.getItem('lovira_local_user_v1') || 'anon_guest';
      headers['Authorization'] = `Bearer guest_${localUid}`;
    } catch {
      // ignore
    }
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error(`[Lovira Network Error] Endpoint: ${endpoint}`, err);
    throw new Error('Không thể kết nối tới máy chủ.');
  }

  const contentType = response.headers.get('content-type') || '';
  let json: { success?: boolean; data?: T; error?: string } = {};

  if (contentType.includes('application/json')) {
    try {
      json = await response.json();
    } catch {
      throw new Error('Lovira nhận được phản hồi chưa đúng định dạng. Vui lòng thử lại.');
    }
  } else {
    const rawText = await response.text();
    console.error(`[Lovira Non-JSON Response] Endpoint: ${endpoint}, Status: ${response.status}`, rawText.slice(0, 300));
    if (response.status === 401 || response.status === 403) {
      throw new Error('Phiên truy cập chưa được xác thực. Vui lòng tải lại trang để tiếp tục.');
    }
    if (response.status === 504 || rawText.includes('TIMEOUT') || rawText.includes('504')) {
      throw new Error('Yêu cầu xử lý phản hồi quá thời gian cho phép. Vui lòng thử lại với đoạn văn bản ngắn hơn.');
    }
    if (response.status === 404) {
      throw new Error('Dịch vụ xử lý hiện chưa sẵn sàng. Vui lòng tải lại trang.');
    }
    throw new Error('Hệ thống Lovira đang bận hoặc kết nối chưa ổn định. Vui lòng thử lại trong giây lát.');
  }

  if (!response.ok || !json.success) {
    const rawErr = json.error || '';
    if (
      rawErr.includes('429') ||
      rawErr.includes('RESOURCE_EXHAUSTED') ||
      rawErr.includes('quota') ||
      rawErr.includes('QUOTA')
    ) {
      throw new Error('Hệ thống AI đang nhận quá nhiều lượt gọi. Vui lòng đợi vài giây và thử lại.');
    }
    if (rawErr.includes('401') || rawErr.includes('UNAUTHENTICATED')) {
      throw new Error('Phiên làm việc chưa được xác thực. Vui lòng tải lại trang.');
    }
    if (rawErr) {
      throw new Error(rawErr);
    }
    throw new Error('Lovira chưa thể xử lý yêu cầu lúc này. Vui lòng thử lại.');
  }

  return json.data as T;
}

export async function analyzeVision(
  imageBase64: string,
  mode: 'scene' | 'text' | 'object' | 'quick' = 'scene',
  mimeType?: string,
  customApiKey?: string
): Promise<VisionResult> {
  return fetchApi<VisionResult>('/api/gemini/vision', {
    imageBase64,
    mode,
    mimeType,
    customApiKey,
  });
}

export async function simplifyTextEasyRead(
  text: string,
  level: 'standard' | 'easy' | 'step' = 'easy',
  customApiKey?: string
): Promise<EasyReadResult> {
  return fetchApi<EasyReadResult>('/api/gemini/easy-read', {
    text,
    level,
    customApiKey,
  });
}

export async function summarizeConversation(
  transcript: string,
  customApiKey?: string
): Promise<ConversationSummary> {
  return fetchApi<ConversationSummary>('/api/gemini/conversation-summary', {
    transcript,
    customApiKey,
  });
}

export async function analyzeDocument(
  documentText: string,
  fileName?: string,
  customApiKey?: string
): Promise<DocumentAnalysis> {
  return fetchApi<DocumentAnalysis>('/api/gemini/document-analysis', {
    documentText,
    fileName,
    customApiKey,
  });
}

export async function askDocumentQuestion(
  documentText: string,
  question: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  customApiKey?: string
): Promise<string> {
  const res = await fetchApi<{ answer: string }>('/api/gemini/document-qa', {
    documentText,
    question,
    conversationHistory,
    customApiKey,
  });
  return res.answer || (res as unknown as string);
}
