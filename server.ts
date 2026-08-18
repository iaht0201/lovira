import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limits for base64 image uploads & document payloads
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Helper to get GoogleGenAI client (prefers custom key if provided, else process.env.GEMINI_API_KEY)
function getGenAIClient(customApiKey?: string) {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY chưa được cấu hình trên máy chủ.');
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

// Fallback models order to ensure resilience during temporary high-demand spikes
const FALLBACK_GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
];

async function generateWithModelFallback(ai: GoogleGenAI, params: Omit<Parameters<GoogleGenAI['models']['generateContent']>[0], 'model'>) {
  let lastError: unknown;
  for (const modelName of FALLBACK_GEMINI_MODELS) {
    try {
      return await ai.models.generateContent({
        ...params,
        model: modelName,
      });
    } catch (err: unknown) {
      console.warn(`[Gemini Fallback] Model ${modelName} failed or unavailable, trying next model...`, err instanceof Error ? err.message : err);
      lastError = err;
    }
  }
  throw lastError;
}

// System instruction constant
const LOVIRA_SYSTEM_INSTRUCTION = `Bạn là Lovira (Love goes Viral) - Trợ lý Trợ năng AI nhân văn hàng đầu cho người Việt Nam. 
Nhiệm vụ chính của bạn là hỗ trợ người khuyết tật (người khiếm thị, khiếm thính, khó khăn đọc hiểu, người cao tuổi) và tất cả mọi người tiếp cận thông tin một cách bình đẳng, rõ ràng và thuận tiện nhất.
Quy tắc phản hồi:
1. Luôn sử dụng tiếng Việt tự nhiên, lịch sự, tôn trọng, ngắn gọn, dễ hiểu.
2. Tránh thuật ngữ chuyên môn rườm rà. Nếu buộc phải dùng, hãy kèm giải thích đơn giản.
3. Luôn ưu tiên độ chính xác tuyệt đối đối với thời gian, ngày tháng, tên riêng, số điện thoại, khoản phí, địa chỉ, hướng dẫn an toàn. Không tự sáng tạo thông tin không có trong dữ liệu đầu vào.
4. Trình bày cấu trúc mạch lạc (sử dụng gạch đầu dòng, tiêu đề rõ ràng, câu ngắn).`;

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', app: 'Lovira', timestamp: new Date().toISOString() });
});

// 1. Vision Analysis Endpoint
app.post('/api/gemini/vision', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType, mode = 'scene', customApiKey } = req.body || {};

    if (!imageBase64) {
      res.status(400).json({ error: 'Hình ảnh là bắt buộc.' });
      return;
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

    const response = await generateWithModelFallback(ai, {
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
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

    const jsonText = response.text || '{}';
    try {
      const parsed = JSON.parse(jsonText);
      res.json({ success: true, data: parsed });
    } catch (parseError) {
      res.json({
        success: true,
        data: {
          summary: response.text || 'Đã phân tích ảnh xong.',
          details: [],
          detectedText: [],
          objects: [],
          possibleHazards: [],
        },
      });
    }
  } catch (err: unknown) {
    console.error('Vision API error:', err);
    const message = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi phân tích hình ảnh.';
    res.status(500).json({ error: message });
  }
});

// 2. Easy Read Simplification Endpoint
app.post('/api/gemini/easy-read', async (req: Request, res: Response) => {
  try {
    const { text, level = 'easy', customApiKey } = req.body || {};

    if (!text || typeof text !== 'string' || !text.trim()) {
      res.status(400).json({ error: 'Văn bản cần làm dễ hiểu không được để trống.' });
      return;
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
${text}
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

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (err: unknown) {
    console.error('Easy Read API error:', err);
    const message = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi làm dễ hiểu văn bản.';
    res.status(500).json({ error: message });
  }
});

// 3. Conversation Summary Endpoint
app.post('/api/gemini/conversation-summary', async (req: Request, res: Response) => {
  try {
    const { transcript, customApiKey } = req.body || {};

    if (!transcript || !transcript.trim()) {
      res.status(400).json({ error: 'Nội dung cuộc trò chuyện không được để trống.' });
      return;
    }

    const ai = getGenAIClient(customApiKey);

    const prompt = `Phân tích đoạn ghi chép cuộc trò chuyện sau đây để giúp người dùng khiếm thính hoặc khó nghe nắm bắt nhanh nội dung:

Nội dung ghi chép:
"""
${transcript}
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

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (err: unknown) {
    console.error('Conversation Summary API error:', err);
    const message = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tóm tắt cuộc trò chuyện.';
    res.status(500).json({ error: message });
  }
});

// 4. Document Analysis Endpoint
app.post('/api/gemini/document-analysis', async (req: Request, res: Response) => {
  try {
    const { documentText, fileName, customApiKey } = req.body || {};

    if (!documentText || !documentText.trim()) {
      res.status(400).json({ error: 'Nội dung tài liệu không được để trống.' });
      return;
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

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (err: unknown) {
    console.error('Document Analysis API error:', err);
    const message = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi phân tích tài liệu.';
    res.status(500).json({ error: message });
  }
});

// 5. Document Q&A Endpoint
app.post('/api/gemini/document-qa', async (req: Request, res: Response) => {
  try {
    const { documentText, question, conversationHistory = [], customApiKey } = req.body || {};

    if (!documentText || !question) {
      res.status(400).json({ error: 'Nội dung tài liệu và câu hỏi là bắt buộc.' });
      return;
    }

    const ai = getGenAIClient(customApiKey);

    const historyFormatted = conversationHistory
      .map((h: { role: string; content: string }) => `${h.role === 'user' ? 'Người dùng' : 'Lovira'}: ${h.content}`)
      .join('\n');

    const prompt = `Dựa vào tài liệu bên dưới để trả lời câu hỏi của người dùng một cách chính xác, ngắn gọn và dễ hiểu.
Nếu tài liệu KHÔNG chứa thông tin để trả lời, hãy lịch sự thông báo: "Tôi không tìm thấy thông tin này trong tài liệu." Không tự suy đoán hoặc sáng tạo thông tin ngoài tài liệu.

Lịch sử trò chuyện trước đó:
${historyFormatted}

Tài liệu:
"""
${documentText.slice(0, 30000)}
"""

Câu hỏi hiện tại của người dùng: "${question}"

Trả lời bằng tiếng Việt thân thiện, rõ ràng:`;

    const response = await generateWithModelFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: LOVIRA_SYSTEM_INSTRUCTION,
      },
    });

    res.json({ success: true, data: { answer: response.text || 'Tôi không tìm thấy thông tin phù hợp trong tài liệu.' } });
  } catch (err: unknown) {
    console.error('Document QA API error:', err);
    const message = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi trả lời câu hỏi tài liệu.';
    res.status(500).json({ error: message });
  }
});

// Global Express error handler
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  const message = err instanceof Error ? err.message : 'Máy chủ gặp sự cố xử lý yêu cầu.';
  res.status(500).json({ success: false, error: message });
});

// Vite Integration for dev & production
async function startServer() {
  if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (process.env.VERCEL !== '1') {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (process.env.VERCEL !== '1') {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Lovira Server running on http://0.0.0.0:${PORT}`);
    });
  }
}

if (process.env.VERCEL !== '1') {
  startServer();
}

export default app;
