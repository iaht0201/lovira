import { VisionResult, EasyReadResult, ConversationSummary, DocumentAnalysis } from '../types';

async function fetchApi<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const json = await response.json();

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
  const response = await fetch('/api/gemini/document-qa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      documentText,
      question,
      conversationHistory,
      customApiKey,
    }),
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.error || 'Không thể trả lời câu hỏi tài liệu.');
  }

  return json.answer as string;
}
