# ĐẶC TẢ THIẾT KẾ & TÀI LIỆU KỸ THUẬT: TRỢ NĂNG NGÔN NGỮ KÝ HIỆU VIỆT NAM (VSL)

**Sản phẩm:** Lovira — AI lan tỏa sự thấu hiểu  
**Phân hệ:** Trợ năng Ký hiệu Đa giác quan (Multimodal VSL Accessibility)  
**Tiêu chuẩn:** WCAG 2.2 AA / Vietnamese Sign Language (VSL) Skeleton Framework  
**Trạng thái:** Sẵn sàng trên môi trường Production  

---

## 1. TỔNG QUAN VÀ MỤC ĐÍCH TÍNH NĂNG

### 1.1 Vấn đề thực tế
Người Điếc và người khiếm thính tại Việt Nam thường gặp rào cản lớn khi tiếp nhận thông tin chỉ qua giọng đọc (TTS) hoặc các câu văn bản dài. Ngôn ngữ Ký hiệu Việt Nam (VSL) là tiếng mẹ đẻ và phương thức giao tiếp trực quan, thân thuộc nhất của cộng đồng người Điếc.

### 1.2 Giải pháp từ Lovira
Lovira tích hợp **Hình nhân Ký hiệu 5 ngón & Khớp xương (VSL Avatar Stick)** hoạt động đồng bộ với hệ thống **Voice Action** và **Giọng đọc (TTS)**:
- Mỗi khi Voice Action hoặc hệ thống phát câu thoại tiếng Việt, câu nói sẽ tự động được phân giải thành các hình thái ký hiệu bàn tay (Handshape), hướng lòng bàn tay (Orientation), vị trí không gian (Location) và chuyển động (Movement).
- Khung hiển thị nổi cố định (Fixed Floating Panel) ở góc dưới bên phải màn hình giúp người dùng khiếm thính theo dõi ký hiệu liên tục mà không che khuất nội dung làm việc chính.
- Khả năng hoạt động độc lập hoàn toàn: nếu âm thanh bị tắt hoặc trình duyệt không hỗ trợ Web Speech Synthesis, hình nhân VSL vẫn tiếp tục ký hiệu chuẩn xác.

---

## 2. KIẾN TRÚC KỸ THUẬT & LUỒNG DỮ LIỆU

### 2.1 Sơ đồ luồng xử lý (Data Flow)
```text
[ Người dùng / Voice Action / TTS ]
               │
               ▼
   [ vslAccessibilityService ] (Event Bus)
               │
               ├──► [ Voice Playback / Web Speech API ] (Âm thanh)
               │
               └──► [ VSLAccessibilityPanel ] (Khung nổi cố định)
                             │
                             ▼
                    [ VSLAvatarStick ] (SVG 2D Canvas)
                             │
                     ├── [ Từ điển cử chỉ VSL (50+ động tác cơ bản) ]
                     ├── [ Thuật toán đánh vần ngón tay (Fingerspelling A-Z, 0-9) ]
                     └── [ Nội suy chuyển động Smooth Interpolation ]
```

### 2.2 Các Module Thành phần chính trong Mã nguồn:
1. **`src/services/vslAccessibilityService.ts`**:
   - Quản lý Event Bus trung gian phát tín hiệu (`dispatchText`).
   - Kết nối hai chiều giữa SpeechManager, VoiceSessionManager, và giao diện VSL.
2. **`src/components/vsl-avatar/VSLAccessibilityPanel.tsx`**:
   - Khung giao diện nổi cố định góc dưới bên phải (`fixed bottom-4 right-4 z-50`).
   - Cung cấp các chế độ: *Thu nhỏ bong bóng tròn (Minimized)*, *Khung thẻ đầy đủ (Full Card)*, *Xem câu thoại đầy đủ*, *Phát lại ký hiệu (Replay)*.
3. **`src/components/vsl-avatar/VSLAvatarStick.tsx`**:
   - Bộ dựng hình nhân ký hiệu 2D chuẩn SVG với đầy đủ **5 ngón tay độc lập**, các khớp đốt ngón tay (MCP, PIP, DIP, TIP), cổ tay, khuỷu tay và biểu cảm khuôn mặt.
   - Hỗ trợ nội suy góc xoay chuyển động mượt mà bằng `requestAnimationFrame`.
4. **`src/components/vsl-playground/VSLPlaygroundView.tsx`**:
   - Phòng thử nghiệm chuyên sâu: gõ văn bản tùy ý, tra cứu từ điển ký hiệu VSL, điều chỉnh tốc độ ký hiệu (0.5x - 2.0x), phóng to thu nhỏ góc nhìn.
5. **`src/components/voice-access/VoiceSessionManager.tsx` & `localIntentMatcher.ts`**:
   - Điều khiển bật/tắt khung ký hiệu VSL hoàn toàn bằng giọng nói tự nhiên.

---

## 3. MÔ TẢ CHI TIẾT GIAO DIỆN & TRẠNG THÁI MÀN HÌNH

### 3.1 Khung Nổi Trợ Năng VSL (VSLAccessibilityPanel)

#### A. Trạng thái Đầy đủ (Full Floating Card)
- **Vị trí:** Cố định ở góc dưới bên phải (`bottom-4 right-4`), kích thước `290px` (mobile) đến `320px` (desktop). Không cho phép kéo thả lung tung (non-draggable) để đảm bảo tuân thủ tiêu chuẩn trợ năng và tránh xung đột thao tác chạm.
- **Thanh tiêu đề (Header):**
  - Biểu tượng bàn tay VSL và tiêu đề "Ký hiệu VSL".
  - **Huy hiệu trạng thái (Status Badge):**
    - *Sẵn sàng (Xanh dương)*: Khung đang ở chế độ chờ câu thoại mới.
    - *Đang dịch (Vàng nhấp nháy)*: Hệ thống đang phân tích ngữ pháp tiếng Việt sang chuỗi cử chỉ VSL.
    - *Đang ký hiệu (Xanh lá & Pulse)*: Hình nhân đang thực hiện các động tác cử chỉ tay.
  - **Nút điều khiển nhanh:** Nút Phát lại (Replay), Nút Thu nhỏ (Minimize), Nút Đóng (Close).
- **Vùng hiển thị hình nhân (Avatar Canvas):**
  - Tỷ lệ khung hình `4:3.7`, nền dải màu Slate tối tương phản cao (`slate-950` đến `slate-900`) giúp các đường nét xương khớp ngón tay màu ngọc bích (Emerald) và vàng kim (Amber) nổi bật rõ nét.
  - Vẽ chi tiết 5 ngón tay với khớp xương riêng biệt, góc xoay bàn tay và hình dáng lòng bàn tay (Handshape: nắm tay, mở bàn tay, chỉ ngón trỏ, chữ V, chữ L...).
- **Chân thẻ (Footer):**
  - Hiển thị tóm tắt câu thoại đang được ký hiệu.
  - Nút mở rộng/thu gọn văn bản đầy đủ (`vsl-toggle-transcript-btn`).
  - Nút liên kết chuyển nhanh vào **"Phòng thử nghiệm VSL"**.

#### B. Trạng thái Thu nhỏ (Minimized Floating Bubble)
- Biến thành một thanh con nhộng (Pill Bubble) nhỏ gọn có viền neon màu xanh dương.
- Hiển thị biểu tượng bàn tay ký hiệu kèm chấm đèn tín hiệu hoạt động (Active Ping Dot).
- Nút bấm mở rộng (Maximize) giúp quay lại kích thước đầy đủ ngay tức thì.

---

### 3.2 Màn hình Phòng Thử Nghiệm Ký Hiệu (VSLPlaygroundView - `/vsl-playground`)
- **Khung nhập liệu:** Ô nhập văn bản tiếng Việt tự do với bộ đếm ký tự.
- **Thư viện mẫu câu nhanh:** Các nút chọn mẫu câu thông dụng:
  - *"Xin chào"*
  - *"Cảm ơn"*
  - *"Bạn có khỏe không?"*
  - *"Tôi yêu bạn"*
  - *"Giúp tôi với"*
  - *"Hẹn gặp lại"*
- **Bảng tra cứu cử chỉ VSL:** Hiển thị danh sách từ vựng hỗ trợ sẵn và hướng dẫn cách hệ thống tự động chuyển sang chế độ đánh vần từng chữ cái (Fingerspelling) khi gặp từ chưa có trong từ điển.
- **Bảng điều khiển tốc độ & góc nhìn:**
  - Tốc độ: 0.5x, 0.75x, 1.0x, 1.25x, 1.5x.
  - Nút tạm dừng / tiếp tục / phát lại từ đầu.

---

### 3.3 Màn hình Cài Đặt Trợ Năng (SettingsView - `/settings`)
- Đã bổ sung mục cấu hình: **"Ngôn ngữ Ký hiệu Việt Nam (VSL)"**.
- **Công tắc Bật/Tắt:**
  - Bật: Khung ký hiệu VSL tự động xuất hiện ở góc dưới bên phải mỗi khi Voice Action hoặc TTS phản hồi.
  - Tắt: Ẩn khung ký hiệu để tối ưu không gian cho người không có nhu cầu sử dụng.

---

## 4. BẢNG KHẨU LỆNH ĐIỀU KHIỂN BẰNG GIỌNG NÓI (VOICE ACCESS)

Người dùng có thể điều khiển tính năng ký hiệu VSL hoàn toàn rảnh tay thông qua các khẩu lệnh tiếng Việt:

| Nhóm khẩu lệnh | Câu lệnh mẫu | Hành động của Lovira |
| :--- | :--- | :--- |
| **Bật trợ năng VSL** | *"Bật ngôn ngữ ký hiệu"*, *"Bật ký hiệu"*, *"Bật VSL"*, *"Bật người ký hiệu"*, *"Hiện hình nhân ký hiệu"* | Kích hoạt `vslAccessibilityEnabled: true`, mở khung nổi ở góc màn hình và phát câu xác nhận. |
| **Tắt trợ năng VSL** | *"Tắt ngôn ngữ ký hiệu"*, *"Tắt ký hiệu"*, *"Tắt VSL"*, *"Ẩn người ký hiệu"* | Tắt `vslAccessibilityEnabled: false`, thu hồi khung nổi. |
| **Mở phòng thử nghiệm** | *"Mở ngôn ngữ ký hiệu"*, *"Mở thử nghiệm ký hiệu"*, *"Mở VSL"*, *"VSL Playground"* | Điều hướng sang trang `/vsl-playground`. |

---

## 5. TIÊU CHUẨN TRỢ NĂNG & WCAG 2.2 AA COMPLIANCE

1. **Độ tương phản (Contrast Ratio):**
   - Các khớp xương và đường nét bàn tay đạt tỷ lệ tương phản > 7:1 so với nền tối.
   - Chữ văn bản phụ đề đi kèm đạt chuẩn WCAG AA (> 4.5:1).
2. **Không che chắn tương tác (Non-blocking Overlay):**
   - Khung nổi được đặt ở vị trí cố định góc dưới bên phải, không che các nút điều hướng chính của điện thoại hoặc thanh công cụ đáy.
   - Hỗ trợ thu nhỏ thành nút bấm 1 chạm khi cần quan sát toàn bộ trang.
3. **Điều khiển bàn phím (Keyboard Accessibility):**
   - Các nút chức năng (Thu nhỏ, Đóng, Phát lại, Mở rộng câu thoại) có đầy đủ thuộc tính `aria-label`, `title`, `id` duy nhất và vòng viền chỉ báo lấy nét (`:focus-visible`).
4. **Hỗ trợ giảm chuyển động (Reduced Motion):**
   - Tôn trọng thiết lập `reducedMotion` của người dùng: giảm thiểu các hiệu ứng giật nảy của khung thẻ.
