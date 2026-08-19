# Hướng Dẫn Sử Dụng Chi Tiết - Lovira AI

Chủ đề: **Tài Liệu Hướng Dẫn Sử Dụng Ứng Dụng Trợ Năng Lovira**  
Phiên bản: 1.2.0 (Hỗ trợ PWA, Voice Access On-Demand & Dual AI)

---

## 📖 Mục Lục
1. [Giới Thiệu Chung](#1-giới-thiệu-chung)
2. [Hướng Dẫn Tính Năng "Nhìn Giúp Tôi" (Vision AI)](#2-hướng-dẫn-tính-năng-nhìn-giúp-tôi-vision-ai)
3. [Hướng Dẫn Tính Năng "Nghe & Ghi Lại" (Conversation Assistant)](#3-hướng-dẫn-tính-năng-nghe--ghi-lại-conversation-assistant)
4. [Hướng Dẫn Tính Năng "Làm Nội Dung Dễ Hiểu" (Easy Read)](#4-hướng-dẫn-tính-năng-làm-nội-dung-dễ-hiểu-easy-read)
5. [Hướng Dẫn Tính Năng "Hiểu Tài Liệu" (Document Assistant)](#5-hướng-dẫn-tính-năng-hiểu-tài-liệu-document-assistant)
6. [Quản Lý Lịch Sử Hoạt Động (History)](#6-quản-lý-lịch-sử-hoạt-động-history)
7. [Tùy Chỉnh Trợ Năng & Giao Diện (Settings)](#7-tùy-chỉnh-trợ-năng--giao-diện-settings)
8. [Đồng Bộ Dữ Liệu Với Firebase](#8-đồng-bộ-dữ-liệu-với-firebase)
9. [Cài Đặt Ứng Dụng Trên Màn Hình Chính (PWA)](#9-cài-đặt-ứng-dụng-trên-màn-hình-chính-pwa)
10. [Điều Khiển Bằng Giọng Nói (Voice Access 2-Click)](#10-điều-khiển-bằng-giọng-nói-voice-access-2-click)
11. [Lựa Chọn Nhà Cung Cấp AI & Bảo Mật Khóa Riêng (BYOK)](#11-lựa-chọn-nhà-cung-cấp-ai--bảo-mật-khóa-riêng-byok)

---

## 1. Giới Thiệu Chung
**Lovira** là nền tảng AI hỗ trợ tiếp cận thông tin đa giác quan dành cho mọi người, đặc biệt tối ưu cho người khiếm thị, khiếm thính, người cao tuổi và người gặp khó khăn trong việc tiếp nhận thông tin phức tạp.

**Các điểm nổi bật về trải nghiệm:**
- Giao diện tiếng Việt tự nhiên, thân thiện và tôn trọng người dùng.
- Chuẩn trợ năng quốc tế **WCAG 2.2 AA**: Tương phản cao, giảm chuyển động, nút bấm lớn, phóng to chữ linh hoạt.
- Hỗ trợ **Điều khiển bằng giọng nói theo phiên (Voice Access On-Demand)** không cần chạm liên tục.
- Khả năng cài đặt thành **Ứng dụng màn hình chính (PWA)** độc lập, mượt mà trên cả Android, iOS, Windows và macOS.
- Tùy chọn kết nối **Mã khóa Gemini cá nhân (BYOK)** để bảo vệ quyền riêng tư tuyệt đối cho dữ liệu của bạn.

---

## 2. Hướng Dẫn Tính Năng "Nhìn Giúp Tôi" (Vision AI)
Tính năng hỗ trợ mô tả không gian xung quanh, đọc văn bản in và cảnh báo an toàn qua ảnh chụp hoặc tệp ảnh.

### Các bước thực hiện:
1. Tại trang chủ hoặc thanh điều hướng, chọn mục **"Nhìn giúp tôi"**.
2. **Chọn chế độ phân tích phù hợp**:
   - **Mô tả cảnh vật**: Đọc không gian tổng thể, xác định vị trí các đồ vật và vật cản.
   - **Đọc chữ trong ảnh**: Trích xuất chính xác văn bản trên nhãn thuốc, hóa đơn, giấy tờ, biển báo.
   - **Cảnh báo an toàn**: Nhận diện bậc thang, cửa kính, vũng nước, lối đi hẹp.
3. **Tải ảnh lên hoặc Chụp ảnh trực tiếp**:
   - Nhấp **"Chụp ảnh từ Camera"** để mở camera trực tiếp.
   - Hoặc nhấp **"Chọn ảnh từ máy"** để tải tệp ảnh có sẵn.
4. Nhấp nút **"Phân tích ngay"** (hoặc dùng câu lệnh giọng nói *"Chụp ảnh"*).
5. Lovira sẽ trả về tóm tắt nhanh và phân tích chi tiết. Nhấp nút **"Phát giọng đọc"** (biểu tượng loa) để nghe kết quả đọc to rõ ràng.

---

## 3. Hướng Dẫn Tính Năng "Nghe & Ghi Lại" (Conversation Assistant)
Chuyển đổi âm thanh cuộc trò chuyện trực tiếp thành văn bản thời gian thực và tự động tóm tắt các điểm then chốt.

### Các bước thực hiện:
1. Chọn mục **"Nghe & Ghi lại"**.
2. Nhấp nút **"Bắt đầu nghe"** (biểu tượng Micro). Cấp quyền truy cập Micro khi trình duyệt yêu cầu.
3. Nói chuyện bình thường. Hệ thống sẽ nhận diện và hiển thị câu nói trực tiếp lên màn hình.
4. Bạn có thể nhấn **"Tạm dừng"** hoặc **"Dừng nghe"** khi kết thúc cuộc đối thoại.
5. Nhấp nút **"Tóm tắt cuộc trò chuyện bằng AI"** để hệ thống tạo nhanh biên bản tóm tắt và danh sách việc cần làm.
6. *Lưu ý về Micro*: Hệ thống tự động điều phối để tránh xung đột quyền micro giữa màn hình đàm thoại và tính năng Voice Access.

---

## 4. Hướng Dẫn Tính Năng "Làm Nội Dung Dễ Hiểu" (Easy Read)
Giúp chuyển đổi các văn bản hành chính, pháp lý, y tế hay bài viết dài dòng thành ngôn ngữ đời thường, ngắn gọn, dễ tiếp thu.

### Các bước thực hiện:
1. Chọn mục **"Làm nội dung dễ hiểu"**.
2. Dán đoạn văn bản cần chuyển đổi vào ô **Văn bản gốc** (hoặc chọn các mẫu văn bản hành chính/y tế thực tế có sẵn).
3. **Chọn mức độ làm đơn giản**:
   - *Tiêu chuẩn*: Giữ nguyên cấu trúc nhưng giải thích rõ ràng từng ý.
   - *Dễ hiểu*: Dùng từ vựng thông dụng, các câu ngắn dưới 15 từ.
   - *Siêu ngắn gọn*: Rút gọn thành 3 - 5 gạch đầu dòng cốt lõi nhất.
4. Nhấp nút **"Làm dễ hiểu ngay"**.
5. Nhận kết quả ở khung bên phải kèm từ điển giải thích các thuật ngữ chuyên môn khó hiểu.

---

## 5. Hướng Dẫn Tính Năng "Hiểu Tài Liệu" (Document Assistant)
Đọc, phân tích và giải đáp thắc mắc chuyên sâu từ các tệp tài liệu PDF, DOCX, TXT.

### Các bước thực hiện:
1. Chọn mục **"Hiểu tài liệu"**.
2. Nhấp **"Chọn tài liệu"** và tải lên tệp PDF, DOCX hoặc văn bản từ máy của bạn.
3. Lovira sẽ tự động trích xuất nội dung và tổng hợp:
   - Tóm tắt tổng thể tài liệu.
   - Danh sách thủ tục, hồ sơ hoặc thời hạn quan trọng.
4. **Hỏi đáp tương tác**: Đặt câu hỏi vào ô trò chuyện bên dưới (ví dụ: *"Hồ sơ này cần nộp trước ngày nào?"*) để AI trích xuất câu trả lời chính xác từ văn bản.

---

## 6. Quản Lý Lịch Sử Hoạt Động (History)
- Toàn bộ kết quả phân tích hình ảnh, tóm tắt cuộc trò chuyện và tài liệu đều được tự động lưu trữ trong mục **"Lịch sử"**.
- Tìm kiếm nhanh theo từ khóa nội dung hoặc lọc theo từng loại tính năng.
- Nhấp vào từng thẻ lịch sử để xem lại toàn bộ chi tiết hoặc xóa bớt khi không cần lưu giữ.

---

## 7. Tùy Chỉnh Trợ Năng & Giao Diện (Settings)
Tại mục **Cài đặt**, bạn có thể tùy biến mọi khía cạnh để phù hợp với thói quen sử dụng:
- **Cỡ chữ hiển thị**: Chọn 100%, 125%, 150% hoặc 175% (cỡ chữ siêu lớn cho người kém thị lực).
- **Chế độ tương phản cao (High Contrast)**: Đậm viền, nền đen chữ vàng/trắng tăng cường độ sắc nét.
- **Giảm chuyển động (Reduced Motion)**: Tắt các hiệu ứng hoạt ảnh nhấp nháy, di chuyển nhanh.
- **Nút lớn & Vùng bấm rộng (Large Controls)**: Mở rộng kích thước tối thiểu của mọi nút bấm lên 48px.
- **Tốc độ đọc giọng nói**: Điều chỉnh linh hoạt từ 0.6x (chậm rãi) đến 2.0x (nhanh).
- **Tự động đọc phản hồi (Spoken Feedback)**: Tự động phát âm thanh mô tả ngay sau khi AI phân tích xong.

---

## 8. Đồng Bộ Dữ Liệu Với Firebase
- Mọi dữ liệu lịch sử và cài đặt cá nhân của bạn được sao lưu an toàn và bảo mật trên nền tảng đám mây **Firebase**.
- Sử dụng cơ chế Đăng nhập Ẩn danh (Anonymous Auth) giúp bạn trải nghiệm trọn vẹn ngay lập tức mà không bắt buộc tạo tài khoản.
- Có thể liên kết tài khoản Google trong mục Cài đặt để đồng bộ sang thiết bị khác.

---

## 9. Cài Đặt Ứng Dụng Trên Màn Hình Chính (PWA)
Lovira được tích hợp đầy đủ công nghệ **Progressive Web App (PWA)**, cho phép bạn biến trang web thành một ứng dụng độc lập trên điện thoại/máy tính:
- Mở toàn màn hình không có thanh địa chỉ trình duyệt.
- Tốc độ tải trang nhanh, mượt mà và lưu trữ cục bộ an toàn.

### Hướng dẫn cài đặt trên từng thiết bị:
1. **Thiết bị Android / Trình duyệt Chrome, Edge**:
   - Khi vào Lovira, một biểu ngữ thông báo **“Cài đặt Lovira vào màn hình chính”** sẽ hiển thị ở cuối màn hình.
   - Nhấp nút **"Cài đặt"** và xác nhận trên hộp thoại của hệ thống.
   - Nếu biểu ngữ bị ẩn, nhấp biểu tượng ba chấm ở góc trên trình duyệt và chọn **"Cài đặt ứng dụng"** (Install App).
2. **Thiết bị iOS (iPhone / iPad) / Trình duyệt Safari**:
   - Nhấp vào biểu tượng **Chia sẻ (Share)** ở thanh công cụ phía dưới của Safari (biểu tượng ô vuông có mũi tên hướng lên).
   - Cuộn danh sách xuống và chọn mục **"Thêm vào MH chính"** (Add to Home Screen).
   - Nhấn **"Thêm"** (Add) ở góc trên bên phải để hoàn tất tạo biểu tượng Lovira trên màn hình chính.

---

## 10. Điều Khiển Bằng Giọng Nói (Voice Access 2-Click)
Hỗ trợ điều khiển Lovira hoàn toàn bằng giọng nói tiếng Việt theo cơ chế **Chạm đúp (2-Click) bật phiên** và **Tự động kết thúc sau khi nói xong**.

### Cách kích hoạt & sử dụng:
1. Vào **Cài đặt** -> Bật tùy chọn **"Sử dụng Voice Access"** (cấp quyền truy cập micro).
2. **Kích hoạt phiên ra lệnh**:
   - **Cách 1**: Chạm 2 lần liên tiếp (**Double Tap / Double Click**) vào bất kỳ vị trí trống nào trên màn hình.
   - **Cách 2**: Bấm trực tiếp vào thanh trạng thái giọng nói nổi ở cuối màn hình: **"Nhấp đúp hoặc bấm để ra lệnh"**.
3. **Nói câu lệnh và Tự động hoàn tất**:
   - Nói câu lệnh mong muốn (ví dụ: *"Về trang chủ"*, *"Phóng to chữ"*, *"Mở camera"*).
   - Ngay khi bạn dứt câu, Lovira sẽ tự động tiếp nhận câu lệnh, thực hiện hành động, phản hồi lại bằng giọng đọc (nếu bật Spoken Feedback) và tự động đóng phiên nghe. Bạn không cần phải bấm tắt micro thủ công!

### Bảng câu lệnh tiếng Việt phổ biến:
| Nhóm chức năng | Khẩu lệnh mẫu | Tác vụ thực hiện |
| :--- | :--- | :--- |
| **Điều hướng** | *"Về trang chủ"*, *"Quay lại"* | Di chuyển về màn hình chính hoặc trang trước |
| | *"Mở camera"*, *"Mở nhìn giúp tôi"* | Mở tính năng nhận diện ảnh/camera |
| | *"Mở nghe thoại"*, *"Mở dễ hiểu"*, *"Mở tài liệu"*, *"Mở lịch sử"*, *"Mở cài đặt"* | Chuyển đến tính năng tương ứng |
| **Giao diện** | *"Phóng to chữ"*, *"Thu nhỏ chữ"* | Tăng/giảm cỡ chữ hiển thị |
| | *"Bật tương phản cao"*, *"Tắt tương phản cao"* | Bật/tắt chế độ màu tương phản cao |
| | *"Bật nút lớn"*, *"Tắt nút lớn"* | Bật/tắt chế độ nút bấm trợ năng lớn |
| **Đọc màn hình** | *"Đọc trang này"*, *"Đọc vùng hiện tại"* | Đọc toàn bộ hoặc phân vùng nội dung hiện tại |
| | *"Đọc phần tiếp theo"*, *"Đọc phần trước"* | Di chuyển và đọc các phân đoạn |
| | *"Đọc to kết quả"*, *"Dừng đọc"* | Đọc kết quả phân tích hoặc dừng phát âm thanh |
| | *"Đọc chậm lại"*, *"Đọc nhanh lên"* | Điều chỉnh tốc độ phát giọng nói |
| **Tác vụ nhanh** | *"Chụp ảnh"* | Chụp ảnh tức thì khi đang mở màn hình camera |
| | *"Mô tả cảnh vật"*, *"Đọc chữ trong ảnh"* | Phân tích hình ảnh đang hiển thị |
| | *"Đơn giản hóa văn bản này"* | Làm dễ hiểu nội dung đang mở |
| **Hủy / Dừng** | *"Hủy"*, *"Dừng lại"* | Đóng phiên lắng nghe |

---

## 11. Lựa Chọn Nhà Cung Cấp AI & Bảo Mật Khóa Riêng (BYOK)
Lovira áp dụng cơ chế kiến trúc Dual AI linh hoạt:

### 1. Chế độ Lovira Mặc định (Groq Server-Side)
- Được cấu hình sẵn và hoàn toàn miễn phí cho tất cả người dùng.
- Tốc độ phản hồi cực nhanh, tối ưu cho các tác vụ hỏi đáp thông thường và chuyển đổi văn bản dễ hiểu.

### 2. Chế độ Khóa Cá Nhân (Bring Your Own Key - Gemini BYOK)
- Dành cho người dùng muốn sử dụng năng lực mô hình Gemini cao cấp từ Google AI Studio bằng chính mã khóa API cá nhân của mình.
- **Bảo mật tuyệt đối**: Dữ liệu ảnh, tài liệu và giọng nói được gửi trực tiếp theo khóa của bạn.
- **Lưu trữ cục bộ an toàn**: Khóa API chỉ lưu duy nhất trên bộ nhớ trình duyệt thiết bị (LocalStorage) của bạn, không bao giờ được tải lên cơ sở dữ liệu của hệ thống.
- **Kiểm tra kết nối trực tiếp**: Giao diện Cài đặt cung cấp nút kiểm tra tình trạng khóa API theo thời gian thực.
- **Hủy kết nối linh hoạt**: Bạn có thể xóa khóa API cá nhân bất cứ lúc nào để quay lại chế độ mặc định chỉ bằng 1 thao tác nhấn nút.

---
*Chúc bạn có trải nghiệm thuận tiện và độc lập cùng Lovira AI!*
