import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';

dotenv.config();

const app = express();

// Body parsing with safe limits
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Auth guard middleware for /api/gemini/*
app.use('/api/gemini', (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Content-Type', 'application/json');
  const authHeader = req.headers.authorization;
  const clientHeader = req.headers['x-lovira-client'];

  if (!authHeader && !clientHeader) {
    return res.status(401).json({
      success: false,
      error: 'Yêu cầu chưa được xác thực. Vui lòng kết nối từ ứng dụng Lovira.',
      category: 'auth',
      code: 'UNAUTHENTICATED'
    });
  }
  next();
});

// Environment validation
function hasGeminiConfig(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
}

export interface NormalizedGeminiError {
  status: number;
  code: string;
  message: string;
  category: 'auth' | 'invalid_argument' | 'model_not_found' | 'quota' | 'rate_limit' | 'transient' | 'unknown';
  isRetryable: boolean;
  originalMessage: string;
}

function sanitizeText(text: string): string {
  if (!text) return '';
  let sanitized = text.replace(/AIzaSy[A-Za-z0-9_-]{33}/g, '[REDACTED_API_KEY]');
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0) {
    sanitized = sanitized.replaceAll(process.env.GEMINI_API_KEY, '[REDACTED_API_KEY]');
  }
  return sanitized;
}

export function normalizeGeminiError(err: unknown): NormalizedGeminiError {
  if (!err) {
    return {
      status: 500,
      code: 'UNKNOWN_ERROR',
      message: 'Máy chủ gặp sự cố không xác định.',
      category: 'unknown',
      isRetryable: false,
      originalMessage: '',
    };
  }

  // Handle already normalized error objects
  if (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    'category' in err &&
    'message' in err &&
    typeof (err as Record<string, unknown>).status === 'number'
  ) {
    return err as NormalizedGeminiError;
  }

  const errorObj = typeof err === 'object' && err !== null ? (err as Record<string, unknown>) : {};
  const rawMessage = sanitizeText(err instanceof Error ? err.message : String(err));
  const msgLower = rawMessage.toLowerCase();

  let status = 500;
  if (typeof errorObj.status === 'number' && errorObj.status >= 100 && errorObj.status < 600) {
    status = errorObj.status;
  } else if (typeof errorObj.statusCode === 'number' && errorObj.statusCode >= 100 && errorObj.statusCode < 600) {
    status = errorObj.statusCode;
  } else if (typeof (errorObj.error as Record<string, unknown>)?.code === 'number') {
    status = (errorObj.error as Record<string, unknown>).code as number;
  } else {
    const match = rawMessage.match(/\b(400|401|403|404|408|429|500|502|503|504)\b/);
    if (match) {
      status = parseInt(match[1], 10);
    }
  }

  let code = 'GEMINI_ERROR';
  if (typeof errorObj.code === 'string' && errorObj.code) {
    code = errorObj.code;
  } else if (typeof (errorObj.error as Record<string, unknown>)?.status === 'string') {
    code = (errorObj.error as Record<string, unknown>).status as string;
  }

  let category: NormalizedGeminiError['category'] = 'unknown';
  let isRetryable = false;
  let userMessage = 'Máy chủ Lovira gặp sự cố khi xử lý dịch vụ AI. Vui lòng thử lại sau.';

  if (
    status === 401 ||
    status === 403 ||
    msgLower.includes('gemini_api_key') ||
    msgLower.includes('api key') ||
    msgLower.includes('unauthenticated') ||
    msgLower.includes('permission_denied') ||
    msgLower.includes('invalid_api_key') ||
    msgLower.includes('chưa được cấu hình')
  ) {
    category = 'auth';
    status = status === 403 ? 403 : 401;
    code = 'AUTH_ERROR';
    userMessage = 'Lovira chưa được cấu hình khóa dịch vụ AI (GEMINI_API_KEY) hợp lệ.';
    isRetryable = false;
  } else if (status === 400 || msgLower.includes('invalid_argument') || msgLower.includes('bad request')) {
    category = 'invalid_argument';
    status = 400;
    code = 'INVALID_ARGUMENT';
    userMessage = 'Yêu cầu không hợp lệ hoặc dữ liệu gửi tới AI không đúng định dạng.';
    isRetryable = false;
  } else if (
    status === 404 ||
    msgLower.includes('not_found') ||
    msgLower.includes('not found') ||
    (msgLower.includes('model') && msgLower.includes('is not supported'))
  ) {
    category = 'model_not_found';
    status = 404;
    code = 'MODEL_NOT_FOUND';
    userMessage = 'Mô hình AI được yêu cầu hiện không khả dụng.';
    isRetryable = false;
  } else if (status === 429 || msgLower.includes('resource_exhausted') || msgLower.includes('429')) {
    if (msgLower.includes('quota') || msgLower.includes('limit exceeded') || msgLower.includes('exceeded your current quota')) {
      category = 'quota';
      status = 429;
      code = 'QUOTA_EXCEEDED';
      userMessage = 'Hạn ngạch sử dụng dịch vụ AI đã hết trong ngày. Vui lòng thử lại sau hoặc cập nhật API Key.';
      isRetryable = false;
    } else {
      category = 'rate_limit';
      status = 429;
      code = 'RATE_LIMIT_EXCEEDED';
      userMessage = 'Hệ thống AI đang nhận quá nhiều yêu cầu. Vui lòng đợi vài giây và thử lại.';
      isRetryable = true;
    }
  } else if (
    status >= 500 ||
    msgLower.includes('unavailable') ||
    msgLower.includes('deadline_exceeded') ||
    msgLower.includes('overloaded') ||
    msgLower.includes('econnreset') ||
    msgLower.includes('fetch failed')
  ) {
    category = 'transient';
    status = status >= 500 ? status : 503;
    code = 'TRANSIENT_SERVICE_ERROR';
    userMessage = 'Dịch vụ AI tạm thời gián đoạn. Vui lòng thử lại trong giây lát.';
    isRetryable = true;
  } else {
    category = 'unknown';
    isRetryable = status >= 500;
    userMessage = rawMessage.length > 0 && rawMessage.length < 200 ? rawMessage : 'Máy chủ gặp sự cố xử lý dịch vụ AI.';
  }

  return {
    status,
    code,
    message: userMessage,
    category,
    isRetryable,
    originalMessage: rawMessage,
  };
}

// Safe Lazy Gemini Client Initialization
function getGenAIClient(customApiKey?: string): GoogleGenAI {
  const apiKey = customApiKey && customApiKey.trim().length > 0 ? customApiKey.trim() : process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    throw {
      status: 401,
      code: 'GEMINI_KEY_MISSING',
      message: 'Lovira chưa được cấu hình khóa dịch vụ AI (GEMINI_API_KEY) hợp lệ.',
      category: 'auth',
      isRetryable: false,
      originalMessage: 'GEMINI_API_KEY is missing or empty.',
    } as NormalizedGeminiError;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Safe JSON parser to prevent crashing on invalid model outputs
function safeParseJson<T>(text: string | undefined): T | null {
  if (!text || typeof text !== 'string') return null;
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/```\s*$/, '')
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

// Fallback models list - active high-speed Gemini models
const FALLBACK_GEMINI_MODELS = [
  'gemini-3.7-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
];

async function generateWithModelFallback(
  ai: GoogleGenAI,
  params: Omit<Parameters<GoogleGenAI['models']['generateContent']>[0], 'model'>
) {
  let lastErrorNorm: NormalizedGeminiError | null = null;
  let primaryNonNotFoundError: NormalizedGeminiError | null = null;

  for (const modelName of FALLBACK_GEMINI_MODELS) {
    try {
      const result = await ai.models.generateContent({
        ...params,
        model: modelName,
      });
      return result;
    } catch (err: unknown) {
      const norm = normalizeGeminiError(err);
      lastErrorNorm = norm;

      if (norm.category !== 'model_not_found' && !primaryNonNotFoundError) {
        primaryNonNotFoundError = norm;
      }

      // Non-retryable errors throw immediately
      if (norm.category === 'auth' || norm.category === 'invalid_argument' || norm.category === 'quota') {
        console.error(`[Lovira API] Non-retryable error on model ${modelName} (${norm.category}): ${norm.message}`);
        throw norm;
      }

      // Fast fallback to next model immediately
      console.warn(`[Lovira API] Model ${modelName} unavailable (${norm.category}, status ${norm.status}). Falling back to next model...`);
    }
  }

  throw primaryNonNotFoundError || lastErrorNorm || normalizeGeminiError(new Error('Tất cả các mô hình AI đều không thể phản hồi.'));
}

function handleApiError(res: Response, endpointName: string, err: unknown) {
  const norm = normalizeGeminiError(err);
  console.error(`[Lovira API] ${endpointName} error: [Category: ${norm.category}] [Status: ${norm.status}]`, norm.originalMessage.slice(0, 200));
  return res.status(norm.status).json({
    success: false,
    error: norm.message,
    category: norm.category,
    code: norm.code,
  });
}

const LOVIRA_SYSTEM_INSTRUCTION = `Bạn là Lovira (Love goes Viral) - Trợ lý Trợ năng AI nhân văn hàng đầu cho người Việt Nam. 
Nhiệm vụ chính của bạn là hỗ trợ người khuyết tật (người khiếm thị, khiếm thính, khó khăn đọc hiểu, người cao tuổi) và tất cả mọi người tiếp cận thông tin một cách bình đẳng, rõ ràng và thuận tiện nhất.
Quy tắc phản hồi:
1. Luôn sử dụng tiếng Việt tự nhiên, lịch sự, tôn trọng, ngắn gọn, dễ hiểu.
2. Tránh thuật ngữ chuyên môn rườm rà. Nếu buộc phải dùng, hãy kèm giải thích đơn giản.
3. Luôn ưu tiên độ chính xác tuyệt đối đối với thời gian, ngày tháng, tên riêng, số điện thoại, khoản phí, địa chỉ, hướng dẫn an toàn. Không tự sáng tạo thông tin không có trong dữ liệu đầu vào.
4. Trình bày cấu trúc mạch lạc (sử dụng gạch đầu dòng, tiêu đề rõ ràng, câu ngắn).`;

// 1. GET /api/health
app.get(['/api/health', '/health'], (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    status: 'ok',
    app: 'Lovira',
    geminiConfigured: hasGeminiConfig(),
    timestamp: new Date().toISOString(),
  });
});

// 2. POST /api/gemini/vision
app.post('/api/gemini/vision', async (req: Request, res: Response) => {
  console.log('[Lovira API] vision request received');
  res.setHeader('Content-Type', 'application/json');
  try {
    const { imageBase64, mimeType, mode = 'scene', customApiKey } = req.body || {};

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ success: false, error: 'Hình ảnh là bắt buộc.', category: 'invalid_argument', code: 'MISSING_IMAGE' });
    }

    const ai = getGenAIClient(customApiKey);

    let promptModeInstruction = 'Mô tả khung cảnh tổng thể, vị trí các vật thể quan trọng, lối đi, biển báo và lưu ý an toàn.';
    if (mode === 'text') {
      promptModeInstruction = 'Tập trung đọc và trích xuất tất cả chữ viết, nhãn hiệu, bảng hiệu xuất hiện trong ảnh.';
    } else if (mode === 'object') {
      promptModeInstruction = 'Tập trung giải thích và mô tả chi tiết vật thể chính trong ảnh, công dụng và cách tương tác.';
    } else if (mode === 'quick') {
      promptModeInstruction = 'Tóm tắt cực kỳ ngắn gọn trong 1-2 câu nội dung cốt lõi nhất của bức ảnh.';
    }

    const prompt = `Phân tích hình ảnh này cho người dùng trợ năng. 
${promptModeInstruction}

Trả về định dạng JSON với các trường:
- summary: Mô tả tổng quan ngắn gọn (1-2 câu).
- details: Mảng danh sách các chi tiết chính quan sát được.
- detectedText: Mảng các đoạn chữ/văn bản đọc được trong ảnh (nếu không có chữ hãy để mảng rỗng).
- objects: Mảng đối tượng nhận diện được, mỗi đối tượng có { name, description, position }.
- possibleHazards: Mảng lưu ý chướng ngại vật/mối nguy hiểm tiềm ẩn (bậc thang, cửa kính, vật cản, v.v.).
- confidenceNote: Ghi chú mức độ rõ ràng của ảnh.`;

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const response = await generateWithModelFallback(ai, {
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: cleanBase64,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        systemInstruction: LOVIRA_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            details: { type: Type.ARRAY, items: { type: Type.STRING } },
            detectedText: { type: Type.ARRAY, items: { type: Type.STRING } },
            objects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  position: { type: Type.STRING },
                },
              },
            },
            possibleHazards: { type: Type.ARRAY, items: { type: Type.STRING } },
            confidenceNote: { type: Type.STRING },
          },
          required: ['summary', 'details', 'detectedText', 'objects', 'possibleHazards'],
        },
      },
    });

    interface VisionParsed {
      summary?: string;
      details?: string[];
      detectedText?: string[];
      objects?: Array<{ name: string; description: string; position?: string }>;
      possibleHazards?: string[];
      confidenceNote?: string;
    }

    const parsed = safeParseJson<VisionParsed>(response.text);

    const data = {
      summary: parsed?.summary || response.text || 'Đã phân tích xong hình ảnh.',
      details: Array.isArray(parsed?.details) ? parsed.details : [],
      detectedText: Array.isArray(parsed?.detectedText) ? parsed.detectedText : [],
      objects: Array.isArray(parsed?.objects) ? parsed.objects : [],
      possibleHazards: Array.isArray(parsed?.possibleHazards) ? parsed.possibleHazards : [],
      confidenceNote: parsed?.confidenceNote || 'Rõ ràng',
    };

    console.log('[Lovira API] vision request completed');
    return res.json({ success: true, data });
  } catch (err: unknown) {
    return handleApiError(res, 'vision', err);
  }
});

// 3. POST /api/gemini/easy-read
app.post('/api/gemini/easy-read', async (req: Request, res: Response) => {
  console.log('[Lovira API] easy-read request received');
  res.setHeader('Content-Type', 'application/json');
  try {
    const { text, level = 'easy', customApiKey } = req.body || {};

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Văn bản cần làm dễ hiểu không được để trống.', category: 'invalid_argument', code: 'MISSING_TEXT' });
    }

    if (text.length > 50000) {
      return res.status(400).json({ success: false, error: 'Văn bản quá dài (tối đa 50,000 ký tự).', category: 'invalid_argument', code: 'TEXT_TOO_LONG' });
    }

    const ai = getGenAIClient(customApiKey);

    let levelInstruction = 'Viết lại văn bản bằng ngôn ngữ cực kỳ đơn giản, câu ngắn, rõ nghĩa, loại bỏ từ ngữ hành chính rườm rà.';
    if (level === 'step') {
      levelInstruction = 'Chuyển đổi văn bản/quy trình thành các bước thực hiện đánh số thứ tự rõ ràng (1, 2, 3...).';
    } else if (level === 'standard') {
      levelInstruction = 'Tóm tắt và diễn đạt lại mạch lạc, dễ tiếp thu nhưng giữ đầy đủ các chi tiết cần thiết.';
    }

    const prompt = `Hãy đóng vai chuyên gia Easy Read (Văn bản Dễ đọc).
Nhiệm vụ: Chuyển đổi văn bản sau đây thành dạng Easy Read cho người có khó khăn đọc hiểu hoặc muốn tiếp nhận nhanh.
${levelInstruction}

Văn bản gốc:
"""
${text.trim()}
"""

Trả về JSON chứa:
- title: Tiêu đề tóm tắt chủ đề của văn bản.
- summary: Tóm tắt ý cốt lõi nhất (1-2 câu ngắn).
- simplifiedText: Bản văn bản đã được đơn giản hóa đầy đủ.
- keyPoints: Mảng các ý chính ngắn gọn.
- steps: Mảng các bước thực hiện (nếu là bài hướng dẫn/quy trình).
- importantDates: Mảng các mốc thời gian, ngày tháng quan trọng (nếu có).
- warnings: Mảng các lưu ý đặc biệt hoặc cảnh báo quan trọng.
- difficultTerms: Mảng đối tượng giải thích thuật ngữ khó { term: string, explanation: string }.`;

    const response = await generateWithModelFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: LOVIRA_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            simplifiedText: { type: Type.STRING },
            keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            steps: { type: Type.ARRAY, items: { type: Type.STRING } },
            importantDates: { type: Type.ARRAY, items: { type: Type.STRING } },
            warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
            difficultTerms: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
              },
            },
          },
          required: ['summary', 'simplifiedText', 'keyPoints'],
        },
      },
    });

    interface EasyReadParsed {
      title?: string;
      summary?: string;
      simplifiedText?: string;
      keyPoints?: string[];
      steps?: string[];
      importantDates?: string[];
      warnings?: string[];
      difficultTerms?: Array<{ term: string; explanation: string }>;
    }

    const parsed = safeParseJson<EasyReadParsed>(response.text);

    if (!parsed || (!parsed.summary && !parsed.simplifiedText)) {
      console.error('[Lovira API] Easy Read parsing failed, raw text preview:', response.text?.slice(0, 150));
      return res.status(502).json({
        success: false,
        error: 'Lovira nhận được phản hồi AI chưa đúng định dạng. Vui lòng thử lại.',
        category: 'transient',
        code: 'BAD_JSON_OUTPUT',
      });
    }

    const data = {
      title: parsed.title || 'Văn bản Dễ hiểu',
      summary: parsed.summary || parsed.simplifiedText || '',
      simplifiedText: parsed.simplifiedText || parsed.summary || '',
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
      steps: Array.isArray(parsed.steps) ? parsed.steps : [],
      importantDates: Array.isArray(parsed.importantDates) ? parsed.importantDates : [],
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
      difficultTerms: Array.isArray(parsed.difficultTerms) ? parsed.difficultTerms : [],
    };

    console.log('[Lovira API] easy-read request completed');
    return res.json({ success: true, data });
  } catch (err: unknown) {
    return handleApiError(res, 'easy-read', err);
  }
});

// 4. POST /api/gemini/conversation-summary
app.post('/api/gemini/conversation-summary', async (req: Request, res: Response) => {
  console.log('[Lovira API] conversation-summary request received');
  res.setHeader('Content-Type', 'application/json');
  try {
    const { transcript, customApiKey } = req.body || {};

    if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
      return res.status(400).json({ success: false, error: 'Nội dung cuộc trò chuyện không được để trống.', category: 'invalid_argument', code: 'MISSING_TRANSCRIPT' });
    }

    if (transcript.length > 50000) {
      return res.status(400).json({ success: false, error: 'Nội dung ghi chép quá dài (tối đa 50,000 ký tự).', category: 'invalid_argument', code: 'TRANSCRIPT_TOO_LONG' });
    }

    const ai = getGenAIClient(customApiKey);

    const prompt = `Phân tích đoạn ghi chép cuộc trò chuyện sau đây để giúp người dùng khiếm thính hoặc khó nghe nắm bắt nhanh nội dung:

Nội dung ghi chép:
"""
${transcript.trim()}
"""

Trả về JSON gồm:
- summary: Tóm tắt nội dung chính cuộc nói chuyện (2-3 câu).
- keyPoints: Mảng danh sách các ý chính trao đổi.
- decisions: Mảng các quyết định đã đồng ý (nếu có).
- actionItems: Mảng công việc/hành động cần thực hiện tiếp theo (nếu có).
- datesAndDeadlines: Mảng các ngày, giờ, thời hạn được nhắc tới (nếu có).`;

    const response = await generateWithModelFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: LOVIRA_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            decisions: { type: Type.ARRAY, items: { type: Type.STRING } },
            actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
            datesAndDeadlines: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['summary', 'keyPoints', 'decisions', 'actionItems', 'datesAndDeadlines'],
        },
      },
    });

    interface ConvParsed {
      summary?: string;
      keyPoints?: string[];
      decisions?: string[];
      actionItems?: string[];
      datesAndDeadlines?: string[];
    }

    const parsed = safeParseJson<ConvParsed>(response.text);

    const data = {
      summary: parsed?.summary || 'Tóm tắt cuộc trò chuyện thành công.',
      keyPoints: Array.isArray(parsed?.keyPoints) ? parsed.keyPoints : [],
      decisions: Array.isArray(parsed?.decisions) ? parsed.decisions : [],
      actionItems: Array.isArray(parsed?.actionItems) ? parsed.actionItems : [],
      datesAndDeadlines: Array.isArray(parsed?.datesAndDeadlines) ? parsed.datesAndDeadlines : [],
    };

    console.log('[Lovira API] conversation-summary completed');
    return res.json({ success: true, data });
  } catch (err: unknown) {
    return handleApiError(res, 'conversation-summary', err);
  }
});

// 5. POST /api/gemini/document-analysis
app.post('/api/gemini/document-analysis', async (req: Request, res: Response) => {
  console.log('[Lovira API] document-analysis request received');
  res.setHeader('Content-Type', 'application/json');
  try {
    const { documentText, fileName, customApiKey } = req.body || {};

    if (!documentText || typeof documentText !== 'string' || !documentText.trim()) {
      return res.status(400).json({ success: false, error: 'Nội dung tài liệu không được để trống.', category: 'invalid_argument', code: 'MISSING_DOCUMENT' });
    }

    const ai = getGenAIClient(customApiKey);

    const prompt = `Phân tích tài liệu có tên "${fileName || 'Tài liệu'}" để trích xuất thông tin trợ năng cho người dùng:

Nội dung tài liệu:
"""
${documentText.slice(0, 30000)}
"""

Trả về JSON gồm:
- title: Tên/Tiêu đề tài liệu.
- summary: Tóm tắt tổng quan ngắn gọn, dễ hiểu.
- keyPoints: Mảng các ý quan trọng nhất trong tài liệu.
- requirements: Mảng các điều kiện, hồ sơ, giấy tờ hoặc yêu cầu cần chuẩn bị.
- actions: Mảng các việc người dùng cần thực hiện.
- importantDates: Mảng các hạn chót, ngày bắt đầu/kết thúc, thời gian cần lưu ý.
- contacts: Mảng thông tin liên hệ (số điện thoại, email, địa chỉ, đơn vị phụ trách).
- warnings: Mảng các lưu ý quan trọng, khoản phí hoặc lưu ý pháp lý.`;

    const response = await generateWithModelFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: LOVIRA_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
            actions: { type: Type.ARRAY, items: { type: Type.STRING } },
            importantDates: { type: Type.ARRAY, items: { type: Type.STRING } },
            contacts: { type: Type.ARRAY, items: { type: Type.STRING } },
            warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['summary', 'keyPoints', 'requirements', 'actions', 'importantDates', 'contacts', 'warnings'],
        },
      },
    });

    interface DocParsed {
      title?: string;
      summary?: string;
      keyPoints?: string[];
      requirements?: string[];
      actions?: string[];
      importantDates?: string[];
      contacts?: string[];
      warnings?: string[];
    }

    const parsed = safeParseJson<DocParsed>(response.text);

    const data = {
      title: parsed?.title || fileName || 'Tài liệu',
      summary: parsed?.summary || 'Đã phân tích xong nội dung tài liệu.',
      keyPoints: Array.isArray(parsed?.keyPoints) ? parsed.keyPoints : [],
      requirements: Array.isArray(parsed?.requirements) ? parsed.requirements : [],
      actions: Array.isArray(parsed?.actions) ? parsed.actions : [],
      importantDates: Array.isArray(parsed?.importantDates) ? parsed.importantDates : [],
      contacts: Array.isArray(parsed?.contacts) ? parsed.contacts : [],
      warnings: Array.isArray(parsed?.warnings) ? parsed.warnings : [],
    };

    console.log('[Lovira API] document-analysis completed');
    return res.json({ success: true, data });
  } catch (err: unknown) {
    return handleApiError(res, 'document-analysis', err);
  }
});

// 6. POST /api/gemini/document-qa
app.post('/api/gemini/document-qa', async (req: Request, res: Response) => {
  console.log('[Lovira API] document-qa request received');
  res.setHeader('Content-Type', 'application/json');
  try {
    const { documentText, question, conversationHistory = [], customApiKey } = req.body || {};

    if (!documentText || typeof documentText !== 'string' || !documentText.trim() || !question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ success: false, error: 'Nội dung tài liệu và câu hỏi là bắt buộc.', category: 'invalid_argument', code: 'MISSING_PARAMS' });
    }

    const ai = getGenAIClient(customApiKey);

    const historyFormatted = Array.isArray(conversationHistory)
      ? conversationHistory
          .map((h: { role: string; content: string }) => `${h.role === 'user' ? 'Người dùng' : 'Lovira'}: ${h.content}`)
          .join('\n')
      : '';

    const prompt = `Dựa vào tài liệu bên dưới để trả lời câu hỏi của người dùng một cách chính xác, ngắn gọn và dễ hiểu.
Nếu tài liệu KHÔNG chứa thông tin để trả lời, hãy lịch sự thông báo: "Tôi không tìm thấy thông tin này trong tài liệu." Không tự suy đoán hoặc sáng tạo thông tin ngoài tài liệu.

Lịch sử trò chuyện trước đó:
${historyFormatted}

Tài liệu:
"""
${documentText.slice(0, 30000)}
"""

Câu hỏi hiện tại của người dùng: "${question.trim()}"

Trả lời bằng tiếng Việt thân thiện, rõ ràng:`;

    const response = await generateWithModelFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: LOVIRA_SYSTEM_INSTRUCTION,
      },
    });

    const answer = response.text || 'Tôi không tìm thấy thông tin phù hợp trong tài liệu.';
    console.log('[Lovira API] document-qa completed');
    return res.json({ success: true, data: { answer }, answer });
  } catch (err: unknown) {
    return handleApiError(res, 'document-qa', err);
  }
});

// Global Express error handler
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const norm = normalizeGeminiError(err);
  console.error('[Lovira API] Unhandled Express error:', norm.originalMessage.slice(0, 200));
  res.status(norm.status).json({ success: false, error: norm.message, category: norm.category, code: norm.code });
});

export default app;
