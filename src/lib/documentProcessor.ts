import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Initialize PDF.js worker URL safely
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
}

export interface DocumentExtractResult {
  text: string;
  pageCount?: number;
  fileName: string;
  fileType: 'pdf' | 'docx' | 'txt' | 'image' | 'unknown';
  warning?: string;
  isScannedPdf?: boolean;
}

export async function extractTextFromDocument(
  file: File,
  onProgress?: (progressMessage: string) => void
): Promise<DocumentExtractResult> {
  const fileName = file.name;
  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  if (extension === 'pdf' || file.type === 'application/pdf') {
    return extractPdfText(file, onProgress);
  } else if (extension === 'docx' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return extractDocxText(file, onProgress);
  } else if (extension === 'txt' || file.type === 'text/plain') {
    return extractTxtText(file, onProgress);
  } else if (['png', 'jpg', 'jpeg', 'webp'].includes(extension) || file.type.startsWith('image/')) {
    return {
      text: '',
      fileName,
      fileType: 'image',
      warning: 'Đây là tệp hình ảnh. Lovira sẽ dùng công cụ phân tích thị giác AI để đọc nội dung ảnh.',
    };
  } else {
    throw new Error('Định dạng tệp chưa được hỗ trợ. Vui lòng tải PDF, DOCX hoặc TXT.');
  }
}

async function extractPdfText(
  file: File,
  onProgress?: (msg: string) => void
): Promise<DocumentExtractResult> {
  onProgress?.('Đang mở tài liệu PDF…');
  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDocument = await loadingTask.promise;
  const numPages = pdfDocument.numPages;

  const maxPages = 30;
  const processPages = Math.min(numPages, maxPages);

  let fullText = '';
  let totalExtractedLength = 0;

  for (let pageNum = 1; pageNum <= processPages; pageNum++) {
    onProgress?.(`Đang đọc trang ${pageNum} / ${processPages}…`);
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: unknown) => (item as { str?: string }).str || '')
      .join(' ');
    
    fullText += `--- Trang ${pageNum} ---\n${pageText}\n\n`;
    totalExtractedLength += pageText.trim().length;
  }

  let warning: string | undefined;
  let isScannedPdf = false;

  if (numPages > maxPages) {
    warning = `Tài liệu có ${numPages} trang. Lovira đã xử lý ${maxPages} trang đầu tiên.`;
  }

  if (totalExtractedLength < 50) {
    isScannedPdf = true;
    warning = 'Có vẻ đây là tài liệu dạng ảnh (scan). Lovira có thể phân tích nội dung từ hình ảnh qua AI.';
  }

  return {
    text: fullText.trim(),
    pageCount: numPages,
    fileName: file.name,
    fileType: 'pdf',
    warning,
    isScannedPdf,
  };
}

async function extractDocxText(
  file: File,
  onProgress?: (msg: string) => void
): Promise<DocumentExtractResult> {
  onProgress?.('Đang xử lý tài liệu DOCX…');
  const arrayBuffer = await file.arrayBuffer();
  
  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    return {
      text: result.value.trim(),
      fileName: file.name,
      fileType: 'docx',
      warning: result.messages && result.messages.length > 0 ? 'Có một số định dạng trong DOCX không thể đọc trọn vẹn.' : undefined,
    };
  } catch (err) {
    console.error('Error in mammoth docx extraction:', err);
    throw new Error('Lovira chưa thể đọc tài liệu DOCX này. Hãy thử lưu tài liệu dưới dạng PDF hoặc TXT.');
  }
}

async function extractTxtText(
  file: File,
  onProgress?: (msg: string) => void
): Promise<DocumentExtractResult> {
  onProgress?.('Đang đọc tệp văn bản TXT…');
  const text = await file.text();
  return {
    text: text.trim(),
    fileName: file.name,
    fileType: 'txt',
  };
}

export function chunkText(text: string, maxChunkLength: number = 4000): string[] {
  if (text.length <= maxChunkLength) return [text];

  const chunks: string[] = [];
  const paragraphs = text.split('\n');
  let currentChunk = '';

  for (const para of paragraphs) {
    if ((currentChunk + para).length > maxChunkLength && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
    currentChunk += para + '\n';
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
