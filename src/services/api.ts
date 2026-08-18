import { VisionResult, EasyReadResult, ConversationSummary, DocumentAnalysis } from '../types';
import { auth } from '../lib/firebase';

async function fetchApi<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth?.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch {
      // continue without token
    }
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
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
    if (rawText.includes('GEMINI_API_KEY') || rawText.includes('chưa được cấu hình')) {
      throw new Error('Lovira chưa được cấu hình dịch vụ AI.');
    }
    throw new Error('Máy chủ Lovira gặp sự cố. Vui lòng thử lại.');
  }

  if (!response.ok || !json.success) {
    const rawErr = json.error || '';
    if (rawErr.includes('GEMINI_API_KEY') || rawErr.includes('chưa được cấu hình')) {
      throw new Error('Lovira chưa được cấu hình dịch vụ AI.');
    }
    if (
      rawErr.includes('429') ||
      rawErr.includes('RESOURCE_EXHAUSTED') ||
      rawErr.includes('quota') ||
      rawErr.includes('bận')
    ) {
      throw new Error('Dịch vụ AI đang bận. Vui lòng thử lại sau.');
    }
    if (rawErr.includes('chưa đúng định dạng') || rawErr.includes('format')) {
      throw new Error('Lovira nhận được phản hồi chưa đúng định dạng. Vui lòng thử lại.');
    }
    if (rawErr) {
      throw new Error(rawErr);
    }
    throw new Error('Máy chủ Lovira gặp sự cố. Vui lòng thử lại.');
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
