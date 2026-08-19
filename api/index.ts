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

// Zod Schemas for Runtime Validation
const VisionResponseSchema = z.object({
  summary: z.string().default('Đã phân tích xong hình ảnh.'),
  details: z.array(z.string()).default([]),
  detectedText: z.array(z.string()).default([]),
  objects: z.array(
    z.object({
      name: z.string().default('Vật thể'),
      description: z.string().default(''),
      position: z.string().optional(),
    })
  ).default([]),
  possibleHazards: z.array(z.string()).default([]),
  confidenceNote: z.string().default('Rõ ràng'),
});

const EasyReadResponseSchema = z.object({
  title: z.string().default('Văn bản Dễ hiểu'),
  summary: z.string().default(''),
  simplifiedText: z.string().default(''),
  keyPoints: z.array(z.string()).default([]),
  steps: z.array(z.string()).default([]),
  importantDates: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  difficultTerms: z.array(
    z.object({
      term: z.string().default(''),
      explanation: z.string().default(''),
    })
  ).default([]),
});

const ConversationSummaryResponseSchema = z.object({
  summary: z.string().default('Tóm tắt cuộc trò chuyện thành công.'),
  keyPoints: z.array(z.string()).default([]),
  decisions: z.array(z.string()).default([]),
  actionItems: z.array(z.string()).default([]),
  datesAndDeadlines: z.array(z.string()).default([]),
});

const DocumentAnalysisResponseSchema = z.object({
  title: z.string().default('Tài liệu'),
  summary: z.string().default('Đã phân tích xong nội dung tài liệu.'),
  keyPoints: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  actions: z.array(z.string()).default([]),
  importantDates: z.array(z.string()).default([]),
  contacts: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
});

// Fallback models list - active high-speed Gemini models for ultra-low latency
const FALLBACK_GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash-lite',
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

async function generateTextWithDualEngine(params: {
  systemInstruction: string;
  prompt: string;
  responseMimeType?: string;
  customApiKey?: string;
}): Promise<string> {
  const { systemInstruction, prompt, responseMimeType, customApiKey } = params;

  // 1. If customApiKey is provided by the user in Settings, always use custom Gemini API!
  if (customApiKey && customApiKey.trim().length > 0) {
    console.log('[DualEngine] Using Custom Gemini API Key from settings.');
    const ai = getGenAIClient(customApiKey);
    const response = await generateWithModelFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType,
      },
    });
    return response.text || '';
  }

  // 2. If no custom API key, check if GROQ_API_KEY is available in environment for high speed & multi-model fallback!
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0) {
    console.log('[DualEngine] Using high-speed Groq LPU default engine.');
    const groqModels = [
      'openai/gpt-oss-20b',
      'openai/gpt-oss-120b',
      'qwen/qwen3.6-27b',
      'groq/compound-mini'
    ];

    let lastError: any = null;
    for (const model of groqModels) {
      try {
        console.log(`[Groq API] Attempting generation with model: ${model}`);
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY.trim()}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: prompt }
            ],
            response_format: responseMimeType === 'application/json' ? { type: 'json_object' } : undefined,
            temperature: 0.1,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Groq API error (status ${response.status}): ${errText}`);
        }

        const json = await response.json() as any;
        const resultText = json.choices?.[0]?.message?.content;
        if (resultText && resultText.trim().length > 0) {
          console.log(`[Groq API] Success with model: ${model}`);
          return resultText;
        }
      } catch (err: any) {
        console.warn(`[Groq API] Model ${model} failed: ${err.message}. Trying next fallback...`);
        lastError = err;
      }
    }
    console.warn('[DualEngine] Groq LPU API completely exhausted. Falling back to default Gemini API...', lastError);
  }

  // 3. Default fallback to Server-Side Gemini API
  console.log('[DualEngine] Using default Server-Side Gemini API.');
  const ai = getGenAIClient();
  const response = await generateWithModelFallback(ai, {
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType,
    },
  });
  return response.text || '';
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

    const parsedRaw = safeParseJson<Record<string, unknown>>(response.text);
    const parsed = VisionResponseSchema.safeParse(parsedRaw || {});
    const validData = parsed.success ? parsed.data : {
      summary: response.text || 'Đã phân tích xong hình ảnh.',
      details: [],
      detectedText: [],
      objects: [],
      possibleHazards: [],
      confidenceNote: 'Rõ ràng',
    };

    console.log('[Lovira API] vision request completed');
    return res.json({ success: true, data: validData });
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

    const resultText = await generateTextWithDualEngine({
      systemInstruction: LOVIRA_SYSTEM_INSTRUCTION,
      prompt,
      responseMimeType: 'application/json',
      customApiKey,
    });

    const parsedRaw = safeParseJson<Record<string, unknown>>(resultText);
    const parsed = EasyReadResponseSchema.safeParse(parsedRaw || {});

    if (!parsed.success || (!parsed.data.summary && !parsed.data.simplifiedText)) {
      console.error('[Lovira API] Easy Read Zod parsing failed, raw text preview:', resultText?.slice(0, 150));
      return res.status(502).json({
        success: false,
        error: 'Lovira nhận được phản hồi AI chưa đúng định dạng. Vui lòng thử lại.',
        category: 'transient',
        code: 'BAD_JSON_OUTPUT',
      });
    }

    const data = {
      title: parsed.data.title || 'Văn bản Dễ hiểu',
      summary: parsed.data.summary || parsed.data.simplifiedText,
      simplifiedText: parsed.data.simplifiedText || parsed.data.summary,
      keyPoints: parsed.data.keyPoints,
      steps: parsed.data.steps,
      importantDates: parsed.data.importantDates,
      warnings: parsed.data.warnings,
      difficultTerms: parsed.data.difficultTerms,
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

    const resultText = await generateTextWithDualEngine({
      systemInstruction: LOVIRA_SYSTEM_INSTRUCTION,
      prompt,
      responseMimeType: 'application/json',
      customApiKey,
    });

    const parsedRaw = safeParseJson<Record<string, unknown>>(resultText);
    const parsed = ConversationSummaryResponseSchema.safeParse(parsedRaw || {});

    const data = parsed.success ? parsed.data : {
      summary: 'Tóm tắt cuộc trò chuyện thành công.',
      keyPoints: [],
      decisions: [],
      actionItems: [],
      datesAndDeadlines: [],
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

    const resultText = await generateTextWithDualEngine({
      systemInstruction: LOVIRA_SYSTEM_INSTRUCTION,
      prompt,
      responseMimeType: 'application/json',
      customApiKey,
    });

    const parsedRaw = safeParseJson<Record<string, unknown>>(resultText);
    const parsed = DocumentAnalysisResponseSchema.safeParse(parsedRaw || {});

    const data = parsed.success ? parsed.data : {
      title: fileName || 'Tài liệu',
      summary: 'Đã phân tích xong nội dung tài liệu.',
      keyPoints: [],
      requirements: [],
      actions: [],
      importantDates: [],
      contacts: [],
      warnings: [],
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

    const answer = await generateTextWithDualEngine({
      systemInstruction: LOVIRA_SYSTEM_INSTRUCTION,
      prompt,
      customApiKey,
    });

    console.log('[Lovira API] document-qa completed');
    return res.json({ success: true, data: { answer }, answer });
  } catch (err: unknown) {
    return handleApiError(res, 'document-qa', err);
  }
});

// 7. POST /api/ai/verify-key (Verify user custom Gemini API key)
app.post('/api/ai/verify-key', async (req: Request, res: Response) => {
  console.log('[Lovira API] verify-key request received');
  res.setHeader('Content-Type', 'application/json');
  try {
    const { customApiKey } = req.body || {};
    if (!customApiKey || typeof customApiKey !== 'string' || !customApiKey.trim()) {
      return res.status(400).json({ success: false, error: 'API Key không hợp lệ.' });
    }

    // Attempt a super lightweight request
    const ai = getGenAIClient(customApiKey.trim());
    await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Ping',
      config: {
        maxOutputTokens: 5,
      },
    });

    return res.json({ success: true, message: 'Kết nối Gemini thành công.' });
  } catch (err: unknown) {
    const norm = normalizeGeminiError(err);
    return res.status(norm.status).json({
      success: false,
      error: 'Lovira chưa thể sử dụng khóa Gemini này. Kiểm tra lại khóa hoặc hạn mức API của bạn.',
      category: norm.category,
      code: norm.code,
    });
  }
});

// 8. POST /api/ai/voice-intent (Classify natural language voice commands with Screen-Action Registry)
app.post('/api/ai/voice-intent', async (req: Request, res: Response) => {
  console.log('[Lovira API] voice-intent request received');
  res.setHeader('Content-Type', 'application/json');
  try {
    const { command, context = {}, screenContext = null, globalActions = [], customApiKey } = req.body || {};
    if (!command || typeof command !== 'string' || !command.trim()) {
      return res.status(400).json({ success: false, error: 'Câu lệnh là bắt buộc.' });
    }

    const VOICE_INTENT_SYSTEM_INSTRUCTION = `You are the action router for Lovira, a Vietnamese accessibility platform.
Lovira users may have visual, hearing, cognitive, or mobility difficulties.
Your core principle: "USER UTTERANCE -> UNDERSTAND INTENT -> MATCH CURRENT SCREEN & AVAILABLE ACTIONS -> EXECUTE ACTION DIRECTLY -> BRIEF RESPECTFUL FEEDBACK".

CRITICAL RULES:
1. DIRECT ACTION FIRST: When a user requests an operation, ALWAYS return the corresponding action ID to EXECUTE it. NEVER just provide advice or say "you can click button X".
2. SEMANTIC INTENT MAPPING: Do NOT require exact 100% keyword matches with button labels. For example:
   - "Làm dễ hiểu", "Đơn giản hóa nội dung", "Làm đoạn này dễ đọc hơn", "Xử lý nội dung này" -> maps to simplifyText / SIMPLIFY_CURRENT_TEXT
   - "Xem hộ tôi", "Nhìn giúp tôi", "Bật camera", "Tôi muốn dùng chức năng nhìn" -> maps to openVision / OPEN_VISION
   - "Chọn ảnh", "Tải ảnh" -> maps to uploadImage
   - "Chụp ảnh" -> maps to openCamera / captureImage
3. CURRENT SCREEN & AVAILABLE ACTIONS:
   Check the current screen's available actions provided in screenContext.availableActions first! If the user's intent matches an action on the screen, use that action's ID.
4. CONTEXTUAL COMMANDS:
   - If user says "Đọc cho tôi" or "Đọc cái này":
     * If in Vision page and result is available: readResult
     * If in Documents page and document is analyzed: readSummary
     * If in Conversation page: readTranscript / readSummary
     * If in Easy Read page: readResult
     * Otherwise: READ_PAGE
   - If user says "Làm lại":
     * resetCurrentScreen or re-run the previous action
5. PREREQUISITE CHECKING (Case 7):
   If an action exists on the screen but has "isSatisfied": false (e.g. user says "Phân tích ngay" but no image has been selected/uploaded yet):
   Return "action": "PREREQUISITE_MISSING" with the "feedback" set to the action's promptForMissing or a friendly guide like "Bạn chưa chọn ảnh. Bạn muốn mở camera hay chọn ảnh từ máy?", and "suggestedAction" set to the next required action ID.
6. CHAINED / MULTI-STEP ACTIONS (Case 6):
   If the user expresses a multi-step command like:
   - "Mở Nhìn giúp tôi rồi chọn đọc chữ trong ảnh" -> "action": "OPEN_VISION", "chainAction": { "action": "readImageText", "parameters": { "mode": "text" } }, "feedback": "Đang mở Nhìn giúp tôi và chuyển sang chế độ đọc chữ."
   - "Vào cài đặt và bật tương phản cao" -> "action": "OPEN_SETTINGS", "chainAction": { "action": "ENABLE_HIGH_CONTRAST" }, "feedback": "Đang mở Cài đặt và bật tương phản cao."
   - "Vào nghe thoại và bắt đầu nghe" -> "action": "OPEN_CONVERSATION", "chainAction": { "action": "startListening" }, "feedback": "Đang mở Nghe thoại và bắt đầu lắng nghe."
7. AMBIGUITY RESOLUTION (Case 8):
   If multiple distinct actions could match and there is genuinely not enough context to disambiguate:
   Return "action": "CLARIFICATION_REQUIRED" with a brief, friendly "feedback" asking the user to clarify (e.g. "Bạn muốn mở Camera hay chọn ảnh từ máy?").
8. GLOBAL ACTIONS (Always available on any screen):
   - GO_HOME: Về trang chủ
   - GO_BACK: Quay lại trang trước
   - OPEN_VISION: Mở Nhìn giúp tôi
   - OPEN_CONVERSATION: Mở Nghe & Ghi lại
   - OPEN_EASY_READ: Mở Làm nội dung dễ hiểu
   - OPEN_DOCUMENTS: Mở Hiểu tài liệu
   - OPEN_HISTORY: Mở Lịch sử
   - OPEN_SETTINGS: Mở Cài đặt
   - INCREASE_FONT: Phóng to chữ
   - DECREASE_FONT: Thu nhỏ chữ
   - ENABLE_HIGH_CONTRAST / DISABLE_HIGH_CONTRAST: Bật/Tắt tương phản cao
   - ENABLE_LARGE_CONTROLS / DISABLE_LARGE_CONTROLS: Bật/Tắt nút lớn
   - STOP_READING: Dừng đọc
   - READ_PAGE: Đọc toàn bộ trang
   - SPEAK_SLOWER / SPEAK_FASTER: Đọc chậm lại / Đọc nhanh lên

CURRENT SCREEN CONTEXT:
${JSON.stringify(screenContext || context, null, 2)}

GLOBAL ACTIONS AVAILABLE:
${JSON.stringify(globalActions, null, 2)}

You must return a raw JSON object with the following schema:
{
  "action": string (the exact action ID from availableActions or globalActions, or "PREREQUISITE_MISSING", "CLARIFICATION_REQUIRED", "UNKNOWN"),
  "confidence": number (0.0 to 1.0),
  "parameters": object (any parameters needed, e.g. { "mode": "text" } or { "level": "easy" }),
  "confirmationRequired": boolean,
  "feedback": string (a short, warm, supportive confirmation or guidance in Vietnamese, e.g. "Đã mở Nhìn giúp tôi.", "Đang phân tích ảnh.", "Đã bật tương phản cao."),
  "chainAction": object | null (optional next step, e.g. { "action": "readImageText", "parameters": { "mode": "text" } }),
  "suggestedAction": string | null (optional suggested action when prerequisite is missing),
  "clarificationQuestion": string | null (optional if clarification is required)
}

Do not include markdown or code block fences, return raw JSON only.`;

    const rawResponse = await generateTextWithDualEngine({
      systemInstruction: VOICE_INTENT_SYSTEM_INSTRUCTION,
      prompt: `User Utterance: "${command.trim()}"`,
      responseMimeType: 'application/json',
      customApiKey,
    });

    const parsed = safeParseJson<any>(rawResponse);
    if (!parsed || !parsed.action) {
      console.warn('[VoiceIntent] Failed to parse semantic AI output as JSON:', rawResponse);
      return res.json({
        success: true,
        provider: customApiKey ? 'gemini' : 'groq',
        data: {
          action: 'UNKNOWN',
          confidence: 0,
          confirmationRequired: false,
          feedback: 'Lovira chưa hiểu rõ yêu cầu này. Bạn có thể nói lại một cách tự nhiên hơn nhé.',
        },
      });
    }

    return res.json({
      success: true,
      provider: customApiKey ? 'gemini' : 'groq',
      data: parsed,
    });
  } catch (err: unknown) {
    return handleApiError(res, 'voice-intent', err);
  }
});

// 9. POST /api/ai/agent-plan (Multimodal Context-Aware Agent Planner for Lovira Life)
app.post('/api/ai/agent-plan', async (req: Request, res: Response) => {
  console.log('[Lovira API] agent-plan request received');
  res.setHeader('Content-Type', 'application/json');
  try {
    const {
      userInput,
      currentScreen = 'dashboard',
      currentRoute = '/',
      activeSession = null,
      activeImage = null,
      activeDocument = null,
      currentResult = null,
      selectedText = null,
      availableActions = [],
      customApiKey,
    } = req.body || {};

    if (!userInput || typeof userInput !== 'string' || !userInput.trim()) {
      return res.status(400).json({ success: false, error: 'Yêu cầu của người dùng là bắt buộc.' });
    }

    const allowedActionIds: string[] = Array.isArray(availableActions)
      ? availableActions.map((a: { id: string }) => a.id)
      : [];

    const AGENT_PLANNER_SYSTEM_INSTRUCTION = `You are the Multimodal Accessibility Agent Planner for Lovira Life, an intelligent assistant empowering Vietnamese users with visual, hearing, cognitive, or mobility difficulties.

YOUR MISSION:
The user describes what they want in natural Vietnamese (e.g., "Tôi đang đi khám", "Tôi không hiểu giấy này", "Đọc chữ trong ảnh", "Giờ tôi phải làm gì?", "Vào cài đặt bật tương phản cao").
You must:
1. Understand their intent based on their utterance and the CURRENT CONTEXT.
2. Formulate a concise, executable plan using ONLY action IDs explicitly listed in ALLOWED_ACTIONS.
3. Provide a warm, brief, respectful feedback message in natural Vietnamese. Never expose internal technical jargon (no "calling API", "running tool", "JSON", "OCR", "LLM").

STRICT ARCHITECTURAL RULES:
1. ONLY USE ACTIONS FROM ALLOWED_ACTIONS. Do NOT invent new action IDs. If an action does not exist, reject or pick the closest available action or ask for clarification.
2. LIFE MODES & SESSIONS:
   - If the user says "Tôi đang đi khám" / "Đi khám bệnh": create a healthcare session ("session.create" with parameter { "type": "healthcare" }).
   - If "Làm thủ tục" / "Làm giấy tờ": create administrative session ("session.create" with { "type": "administrative" }).
   - If "Đi mua đồ" / "Mua sắm": create shopping session ("session.create" with { "type": "shopping" }).
   - If "Đọc & hiểu": create reading session ("session.create" with { "type": "reading" }).
3. SESSION MEMORY:
   - If user asks "Giờ tôi phải làm gì?", "Tiếp theo làm gì?", "Tôi còn thiếu gì?" and an activeSession exists: Use action "session.getNextStep".
4. MULTI-STEP ORCHESTRATION:
   - "Vào Nhìn giúp tôi rồi đọc chữ" -> ["navigation.openVision", "vision.readText"]
   - "Vào cài đặt rồi bật tương phản cao" -> ["navigation.openSettings", "accessibility.enableHighContrast"]
   - "Tôi không hiểu giấy này" with active image -> ["vision.readText", "easyRead.simplify", "speech.readResult"]
5. MAXIMUM 4 STEPS PER PLAN.
6. CLARIFICATION POLICY:
   - If the request is truly ambiguous and lacks context, set "needsClarification": true with a friendly "clarificationQuestion" in Vietnamese.

ALLOWED_ACTIONS:
${JSON.stringify(allowedActionIds, null, 2)}

CURRENT CONTEXT:
${JSON.stringify(
  {
    currentScreen,
    currentRoute,
    activeSession,
    hasImage: !!activeImage,
    hasDocument: !!activeDocument,
    hasSelectedText: !!selectedText,
    hasResult: !!currentResult,
  },
  null,
  2
)}

OUTPUT SCHEMA (Raw JSON only):
{
  "intent": string,
  "confidence": number (0.0 to 1.0),
  "needsClarification": boolean,
  "clarificationQuestion": string | null,
  "message": string (short friendly feedback in Vietnamese),
  "plan": [
    {
      "action": string (must match an ID from ALLOWED_ACTIONS),
      "reason": string (brief explanation for debugging),
      "parameters": object
    }
  ],
  "suggestedSessionType": "healthcare" | "administrative" | "shopping" | "reading" | "general" | null,
  "newFacts": [
    { "type": "date" | "time" | "location" | "person" | "requirement" | "instruction" | "warning" | "other", "value": string }
  ],
  "newTasks": [
    { "title": string, "status": "todo" | "doing" | "done" }
  ]
}`;

    const rawResponse = await generateTextWithDualEngine({
      systemInstruction: AGENT_PLANNER_SYSTEM_INSTRUCTION,
      prompt: `User Request: "${userInput.trim()}"`,
      responseMimeType: 'application/json',
      customApiKey,
    });

    const parsed = safeParseJson<any>(rawResponse);
    if (!parsed || !Array.isArray(parsed.plan)) {
      console.warn('[AgentPlan] Failed to parse agent planner response as JSON:', rawResponse);
      return res.json({
        success: true,
        data: {
          intent: 'fallback',
          confidence: 0.5,
          needsClarification: false,
          message: 'Lovira đang thực hiện cho bạn.',
          plan: [{ action: 'navigation.home', reason: 'Về trang chủ' }],
        },
      });
    }

    // Filter plan to strictly allowed actions
    parsed.plan = parsed.plan.filter((step: { action: string }) =>
      allowedActionIds.includes(step.action)
    );

    return res.json({
      success: true,
      data: parsed,
    });
  } catch (err: unknown) {
    return handleApiError(res, 'agent-plan', err);
  }
});

// Global Express error handler
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const norm = normalizeGeminiError(err);
  console.error('[Lovira API] Unhandled Express error:', norm.originalMessage.slice(0, 200));
  res.status(norm.status).json({ success: false, error: norm.message, category: norm.category, code: norm.code });
});

export default app;
