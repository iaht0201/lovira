import { LoviraSpeechManager } from './SpeechManager';

export class ReadingEngine {
  private currentRegionIndex = 0;
  private currentRegions: HTMLElement[] = [];

  // Scans DOM for all readable sections
  private updateRegionsList() {
    if (typeof document === 'undefined') return;
    const elements = Array.from(
      document.querySelectorAll('[data-lovira-readable-region]')
    ) as HTMLElement[];
    this.currentRegions = elements;
  }

  public describePage(currentRoute: string): string {
    const route = currentRoute.replace('#', '') || '/';
    
    if (route === '/') {
      return 'Bạn đang ở Trang chủ của Lovira. Đây là nơi điều hướng nhanh đến các công cụ trợ năng chính như Nhìn giúp tôi, Nghe và ghi lại, Làm nội dung dễ hiểu, và Hiểu tài liệu.';
    }
    if (route.startsWith('/vision')) {
      return 'Bạn đang ở trang Nhìn giúp tôi. Công cụ này giúp bạn chụp hoặc tải ảnh lên để mô tả chi tiết không gian, đọc chữ viết trong ảnh hoặc tìm kiếm vật thể.';
    }
    if (route.startsWith('/conversation')) {
      return 'Bạn đang ở trang Nghe và ghi lại. Công cụ này giúp chuyển lời nói xung quanh thành văn bản trực tiếp và tóm tắt cuộc hội thoại cho người khiếm thính.';
    }
    if (route.startsWith('/easy-read')) {
      return 'Bạn đang ở trang Làm nội dung dễ hiểu. Công cụ này hỗ trợ diễn đạt lại văn bản hành chính phức tạp thành ngôn ngữ cực kỳ ngắn gọn, câu ngắn và dễ tiếp thu.';
    }
    if (route.startsWith('/documents')) {
      return 'Bạn đang ở trang Hiểu tài liệu. Bạn có thể tải lên tệp văn bản hoặc tài liệu PDF để Lovira phân tích, tóm tắt các điểm quan trọng và trả lời câu hỏi.';
    }
    if (route.startsWith('/history')) {
      return 'Bạn đang ở trang Lịch sử. Nơi lưu trữ tất cả các kết quả xử lý ảnh, ghi chép cuộc gọi, tài liệu đã làm đơn giản trước đó.';
    }
    if (route.startsWith('/settings')) {
      return 'Bạn đang ở trang Cài đặt. Bạn có thể cấu hình cỡ chữ, chủ đề sáng tối, giọng đọc trợ lý ảo hoặc liên kết tài khoản Google tại đây.';
    }
    return 'Bạn đang sử dụng Lovira, ứng dụng trợ năng AI nhân văn hàng đầu cho người Việt.';
  }

  public readPage(currentRoute: string, speechRate: number, voiceURI?: string) {
    this.updateRegionsList();
    
    let textToRead = '';
    if (this.currentRegions.length > 0) {
      // Read all marked sections sequentially
      textToRead = this.currentRegions.map((r) => r.innerText).join('. \n');
    } else {
      // Fallback to page description
      textToRead = this.describePage(currentRoute);
    }

    LoviraSpeechManager.speak(textToRead, { rate: speechRate, voiceURI });
  }

  public readCurrentRegion(speechRate: number, voiceURI?: string) {
    this.updateRegionsList();
    if (this.currentRegions.length === 0) {
      LoviraSpeechManager.speak('Không tìm thấy vùng thông tin phù hợp để đọc trên trang này.', { rate: speechRate, voiceURI });
      return;
    }

    // Ensure index is valid
    if (this.currentRegionIndex >= this.currentRegions.length) {
      this.currentRegionIndex = 0;
    }

    const region = this.currentRegions[this.currentRegionIndex];
    const text = region.innerText;
    LoviraSpeechManager.speak(text, { rate: speechRate, voiceURI });
  }

  public readNextRegion(speechRate: number, voiceURI?: string) {
    this.updateRegionsList();
    if (this.currentRegions.length <= 1) {
      this.readCurrentRegion(speechRate, voiceURI);
      return;
    }

    this.currentRegionIndex = (this.currentRegionIndex + 1) % this.currentRegions.length;
    this.readCurrentRegion(speechRate, voiceURI);
  }

  public readPreviousRegion(speechRate: number, voiceURI?: string) {
    this.updateRegionsList();
    if (this.currentRegions.length <= 1) {
      this.readCurrentRegion(speechRate, voiceURI);
      return;
    }

    this.currentRegionIndex = (this.currentRegionIndex - 1 + this.currentRegions.length) % this.currentRegions.length;
    this.readCurrentRegion(speechRate, voiceURI);
  }

  public readCurrentFocus(speechRate: number, voiceURI?: string) {
    if (typeof document === 'undefined') return;
    const focused = document.activeElement as HTMLElement;
    if (focused && focused !== document.body) {
      const label = focused.getAttribute('aria-label') || focused.innerText || focused.title || 'Phần tử hiện tại';
      LoviraSpeechManager.speak(label, { rate: speechRate, voiceURI });
    } else {
      LoviraSpeechManager.speak('Không có mục nào đang được chọn tập trung.', { rate: speechRate, voiceURI });
    }
  }

  public readCurrentResult(speechRate: number, voiceURI?: string) {
    this.updateRegionsList();
    // Look for region containing result
    const resultRegion = this.currentRegions.find((r) => {
      const id = r.getAttribute('data-lovira-readable-region');
      return id && (id.includes('result') || id.includes('summary') || id.includes('output'));
    });

    if (resultRegion) {
      LoviraSpeechManager.speak(resultRegion.innerText, { rate: speechRate, voiceURI });
    } else {
      // Speak the last region if any, or general notice
      if (this.currentRegions.length > 0) {
        LoviraSpeechManager.speak(this.currentRegions[this.currentRegions.length - 1].innerText, { rate: speechRate, voiceURI });
      } else {
        LoviraSpeechManager.speak('Hiện chưa có kết quả nào hiển thị trên màn hình.', { rate: speechRate, voiceURI });
      }
    }
  }

  public readInteractiveElements(speechRate: number, voiceURI?: string) {
    if (typeof document === 'undefined') return;
    // Query buttons, inputs, links
    const nodes = Array.from(
      document.querySelectorAll('button, a, select, input[type="button"], input[type="submit"]')
    ) as HTMLElement[];

    const visibleNodes = nodes.filter((n) => {
      const rect = n.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && window.getComputedStyle(n).display !== 'none';
    });

    if (visibleNodes.length === 0) {
      LoviraSpeechManager.speak('Không tìm thấy nút bấm hay lựa chọn tương tác nào trên màn hình.', { rate: speechRate, voiceURI });
      return;
    }

    const optionsText = visibleNodes
      .map((n, idx) => `Lựa chọn số ${idx + 1}: ${n.innerText || n.getAttribute('aria-label') || 'Nút không tên'}`)
      .join('. \n');

    LoviraSpeechManager.speak(`Có ${visibleNodes.length} lựa chọn trên trang: \n` + optionsText, { rate: speechRate, voiceURI });
  }
}

export const LoviraReadingEngine = new ReadingEngine();
