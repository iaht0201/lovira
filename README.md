# Lovira - Bộ Công Cụ AI Trợ Năng Đa Năng (Accessibility AI Suite)

> **Lovira — AI lan tỏa sự thấu hiểu.**  
> Nền tảng ứng dụng công nghệ trí tuệ nhân tạo (Gemini AI) giúp người khiếm thị, người giảm thị lực, người có khó khăn trong việc tiếp thu văn bản hành chính hay người khiếm thính tiếp cận thông tin dễ dàng, độc lập và bình đẳng.

---

## 🌟 Tính Năng Cốt Lõi

### 1. 👁️ Nhìn giúp tôi (Vision AI)
- **Mô tả khung cảnh**: Nhận diện không gian, đồ vật, chướng ngại vật xung quanh thông qua camera hoặc hình ảnh tải lên.
- **Đọc chữ trong ảnh (OCR)**: Trích xuất và đọc chính xác nhãn chai lọ, hóa đơn, biển hiệu, tài liệu in.
- **Cảnh báo an toàn**: Phát hiện các nguy cơ nguy hiểm (bậc thang, vật cản, chất lỏng tràn) giúp di chuyển an toàn.

### 2. 🎙️ Nghe & Ghi lại (Conversation Assistant)
- **Nhận diện giọng nói thời gian thực**: Chuyển cuộc trò chuyện trực tiếp hoặc bài giảng thành văn bản hiển thị trên màn hình.
- **Tóm tắt ý chính**: Tự động lọc ra các điểm chính, phân phân vai người nói và tạo danh sách việc cần làm (Action Items).

### 3. 📄 Làm nội dung dễ hiểu (Easy Read)
- **Đơn giản hóa văn bản**: Chuyển hợp đồng, thông báo pháp lý, văn bản hành chính phức tạp thành câu ngắn, từ ngữ phổ thông, dễ hiểu.
- **3 Cấp độ tùy chỉnh**: Tiêu chuẩn (Standard), Dễ hiểu (Easy Read), Siêu ngắn gọn (Ultra Simple).
- **Giải thích thuật ngữ**: Tự động chú giải các từ ngữ chuyên ngành hoặc khái niệm khó.

### 4. 📚 Hiểu tài liệu (Document Assistant)
- **Đọc tệp đa định dạng**: Tải lên tệp PDF, DOCX hoặc TXT.
- **Tóm tắt & Trích xuất hồ sơ**: Liệt kê các giấy tờ cần chuẩn bị, thời hạn và quy trình làm thủ tục hành chính.
- **Hỏi đáp thông minh**: Trả lời bất kỳ câu hỏi nào dựa trên nội dung tài liệu.

### 5. 🤟 Ngôn ngữ Ký hiệu Việt Nam (VSL Avatar)
- **Hình nhân ký hiệu 5 ngón & khớp xương**: Mô phỏng trực quan động tác bàn tay và ngón tay dựa trên ngữ pháp Ngôn ngữ Ký hiệu Việt Nam.
- **Đồng bộ tự động với Voice Action**: Tự động hiển thị và ký hiệu câu thoại khi hệ thống hoặc trợ lý ảo phát âm thanh.
- **Khung nổi cố định thông minh**: Hiển thị ở góc dưới bên phải với chế độ thu nhỏ con nhộng và phát lại (Replay).

### 6. ⚙️ Hệ Thống Trợ Năng & Đồng Bộ Firebase
- **Điều chỉnh giao diện**: Cỡ chữ linh hoạt (100% - 200%), Chế độ tương phản cao (High Contrast), Giảm chuyển động (Reduced Motion).
- **Giọng đọc tự động (Text-to-Speech)**: Đọc kết quả tự động với tốc độ tùy chỉnh (0.75x - 1.5x).
- **Lưu trữ đám mây (Firebase Firestore & Auth)**: Tự động lưu lịch sử hoạt động và cài đặt cá nhân, truy cập liên thiết bị an toàn.

---

## ☁️ Hướng Dẫn Triển Khai Lên Vercel (Vercel Deployment)

Ứng dụng Lovira đã được cấu hình sẵn tệp `vercel.json` và Vercel Serverless Function `api/index.ts` để sửa triệt để lỗi **404 NOT_FOUND**.

### Các Bước Deploy Lên Vercel:

1. **Đẩy mã nguồn lên GitHub/GitLab**.
2. **Truy cập Vercel Dashboard** (`https://vercel.com/new`) ➔ Chọn repository Lovira của bạn.
3. **Cấu hình biến môi trường (Environment Variables)**:
   - Thêm biến **`GEMINI_API_KEY`**: Điền Google Gemini API Key của bạn (Lấy tại Google AI Studio: https://aistudio.google.com/app/apikey).
4. **Build & Output Settings**:
   - Framework Preset: **Vite** (hoặc để Mặc định).
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Nhấn **Deploy**. Vercel sẽ tự động điều hướng tất cả các tuyến API `/api/*` tới Vercel Serverless Function và phục vụ frontend giao diện SPA mượt mà không còn bị lỗi 404!

---

## 🚀 Hướng Dẫn Khởi Chạy Cục Bộ (Local)

### Yêu Cầu Môi Trường
- **Node.js**: v18 trở lên.
- **NPM**: v9 trở lên.

### Cài Đặt & Chạy Ứng Dụng

1. **Cài đặt thư viện**:
   ```bash
   npm install
   ```

2. **Chạy ứng dụng trong môi trường phát triển (Dev Mode)**:
   ```bash
   npm run dev
   ```
   Ứng dụng sẽ chạy tại cổng `http://localhost:3000`.

3. **Đóng gói sản phẩm (Production Build)**:
   ```bash
   npm run build
   npm start
   ```

---

## 🔒 Bảo Mật & Quyền Riêng Tư

- Khóa API Gemini được lưu trữ an toàn ở phía máy chủ (Server-side/Serverless Function), không lộ ra trình duyệt.
- Dữ liệu người dùng trên Firebase Firestore được bảo vệ bằng quy tắc bảo mật `firestore.rules` (Owner-based security).
- Ứng dụng hỗ trợ chế độ ẩn danh (Anonymous Mode) ngay khi bắt đầu sử dụng không cần khai báo thông tin cá nhân.
