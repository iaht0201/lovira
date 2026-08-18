import { VisionResult, EasyReadResult, ConversationSummary, DocumentAnalysis } from '../types';

async function fetchApi<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new Error('Không thể kết nối tới máy chủ. Vui lòng kiểm tra lại kết nối mạng.');
  }

  const contentType = response.headers.get('content-type') || '';
  let json: { success?: boolean; data?: T; error?: string } = {};

  if (contentType.includes('application/json')) {
    try {
      json = await response.json();
    } catch {
      throw new Error(`Phản hồi từ máy chủ không hợp lệ (mã lỗi ${response.status}).`);
    }
  } else {
    const rawText = await response.text();
    console.error(`API response error (${response.status}):`, rawText);
    if (!response.ok) {
      if (rawText.includes('GEMINI_API_KEY')) {
        throw new Error('Chưa cấu hình GEMINI_API_KEY trên máy chủ/Vercel.');
      }
      throw new Error(`Máy chủ gặp sự cố (${response.status}). Vui lòng thử lại sau giây lát.`);
    }
    throw new Error('Định dạng phản hồi từ máy chủ không hợp lệ.');
  }

  if (!response.ok || !json.success) {
    throw new Error(json.error || 'Có lỗi xảy ra khi xử lý yêu cầu AI.');
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
