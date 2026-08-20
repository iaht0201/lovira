import { speakText, stopSpeaking } from '../../lib/speech';

class ReadingEngine {
  private isReading = false;
  private queue: string[] = [];
  private currentIndex = 0;

  public readChunks(chunks: string[], onDone?: () => void) {
    this.stop();
    this.queue = chunks.filter((c) => c && c.trim().length > 0);
    this.currentIndex = 0;
    this.isReading = true;
    this.readNext(onDone);
  }

  private readNext(onDone?: () => void) {
    if (!this.isReading || this.currentIndex >= this.queue.length) {
      this.isReading = false;
      if (onDone) onDone();
      return;
    }

    const chunk = this.queue[this.currentIndex];
    this.currentIndex++;

    speakText(chunk, {
      onEnd: () => {
        if (this.isReading) {
          this.readNext(onDone);
        }
      },
    });
  }

  public readText(text: string, onDone?: () => void, rate?: number, voiceURI?: string) {
    this.stop();
    this.isReading = true;
    speakText(text, {
      rate: rate || 1.0,
      voiceURI,
      onEnd: () => {
        this.isReading = false;
        if (onDone) onDone();
      },
    });
  }

  public stop() {
    this.isReading = false;
    this.queue = [];
    this.currentIndex = 0;
    stopSpeaking();
  }

  public getIsReading(): boolean {
    return this.isReading;
  }

  public describePage(screenId?: string): string {
    const mainEl = document.getElementById('main-content');
    const heading = mainEl?.querySelector('h1, h2')?.textContent;
    const msg = heading
      ? `Bạn đang ở màn hình ${heading}. Hãy nói câu lệnh hoặc yêu cầu trợ giúp.`
      : `Bạn đang ở ứng dụng Lovira. Hãy chọn một công cụ trợ năng hoặc nói câu lệnh.`;
    this.readText(msg);
    return msg;
  }

  public readPage(route?: string, rate?: number, voiceURI?: string) {
    const mainEl = document.getElementById('main-content');
    if (!mainEl) {
      this.readText('Không tìm thấy nội dung để đọc.', undefined, rate, voiceURI);
      return;
    }
    const textNodes: string[] = [];
    const elements = mainEl.querySelectorAll('h1, h2, h3, p, li, [role="alert"], [role="status"]');
    elements.forEach((el) => {
      const t = el.textContent?.trim();
      if (t) textNodes.push(t);
    });
    if (textNodes.length > 0) {
      this.readChunks(textNodes);
    } else {
      this.readText(mainEl.innerText || 'Trang không có nội dung văn bản.', undefined, rate, voiceURI);
    }
  }

  public readCurrentResult(rateOrResult?: any, voiceURI?: string) {
    if (typeof rateOrResult === 'string' || (typeof rateOrResult === 'object' && rateOrResult !== null && 'summary' in rateOrResult)) {
      const text = typeof rateOrResult === 'string' ? rateOrResult : rateOrResult.summary || JSON.stringify(rateOrResult);
      this.readText(`Kết quả là: ${text}`, undefined, undefined, voiceURI);
      return;
    }
    const mainEl = document.getElementById('main-content');
    const resultBox = mainEl?.querySelector('[role="region"], [data-result], .result-box, article');
    if (resultBox) {
      this.readText(resultBox.textContent || 'Đã đọc kết quả.', undefined, typeof rateOrResult === 'number' ? rateOrResult : 1.0, voiceURI);
    } else {
      this.readText('Chưa có kết quả phân tích nào trên màn hình.', undefined, typeof rateOrResult === 'number' ? rateOrResult : 1.0, voiceURI);
    }
  }

  public readCurrentRegion(rate?: number, voiceURI?: string) {
    const focused = document.activeElement;
    if (focused && focused !== document.body) {
      this.readText(focused.textContent || 'Khu vực đang được chọn.', undefined, rate, voiceURI);
    } else {
      this.readPage(undefined, rate, voiceURI);
    }
  }

  public readNextRegion(rate?: number, voiceURI?: string) {
    this.readText('Chuyển sang phần tiếp theo.', undefined, rate, voiceURI);
  }

  public readPreviousRegion(rate?: number, voiceURI?: string) {
    this.readText('Quay lại phần trước.', undefined, rate, voiceURI);
  }

  public readCurrentFocus(rate?: number, voiceURI?: string) {
    const focused = document.activeElement;
    if (focused && focused.getAttribute) {
      const label = focused.getAttribute('aria-label') || focused.textContent || 'Phần tử được chọn';
      this.readText(`Đang chọn: ${label}`, undefined, rate, voiceURI);
    } else {
      this.readText('Chưa có phần tử nào được chọn.', undefined, rate, voiceURI);
    }
  }

  public readInteractiveElements(rate?: number, voiceURI?: string) {
    const buttons = document.querySelectorAll('button, a, input, [role="button"]');
    const count = buttons.length;
    this.readText(`Màn hình có ${count} nút và ô nhập liệu có thể tương tác.`, undefined, rate, voiceURI);
  }
}

export const LoviraReadingEngine = new ReadingEngine();
