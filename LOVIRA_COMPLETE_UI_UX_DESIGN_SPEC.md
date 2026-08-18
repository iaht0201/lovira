# LOVIRA — COMPLETE UI/UX DESIGN SPECIFICATION

## Tài liệu thiết kế chi tiết toàn bộ màn hình

**Phiên bản:** 1.0  
**Ngôn ngữ sản phẩm:** Tiếng Việt  
**Mục tiêu trợ năng:** WCAG 2.2 AA  
**Sản phẩm:** Lovira — Love goes Viral  
**Tagline:** AI lan tỏa sự thấu hiểu — Giúp mọi người tiếp cận thông tin theo cách phù hợp nhất.

---

# 1. MỤC ĐÍCH TÀI LIỆU

Tài liệu này là đặc tả thiết kế UI/UX hoàn chỉnh cho Lovira.

Tài liệu có thể được dùng cho:

- thiết kế Figma;
- xây dựng design system;
- triển khai React/Tailwind;
- review UI/UX;
- kiểm thử responsive;
- kiểm thử accessibility;
- chuẩn bị demo AI Riser Vietnam 2026.

Tài liệu tập trung vào cách sản phẩm **trông như thế nào, hoạt động như thế nào và phản hồi ra sao** trên từng màn hình.

Đây không phải wireframe sơ sài. Mỗi màn hình phải được triển khai với:

- nội dung thật;
- trạng thái thật;
- responsive thật;
- tương tác bàn phím thật;
- lỗi và loading thật;
- semantic HTML;
- trải nghiệm tiếng Việt tự nhiên.

Ảnh concept tham chiếu:

```text
outputs/lovira-dashboard-ui-concept-v1.png
```

Ảnh concept là định hướng thị giác, không phải ảnh để chép pixel tuyệt đối. Khi có xung đột, khả năng đọc, khả năng sử dụng và accessibility được ưu tiên.

---

# 2. TRIẾT LÝ THIẾT KẾ

## 2.1 Công nghệ thích nghi với người dùng

Lovira không yêu cầu người dùng khai báo khuyết tật. Người dùng chỉ chọn cách nhận thông tin phù hợp với mình.

## 2.2 Trao quyền, không thương hại

Ngôn ngữ và hình ảnh phải truyền đạt:

- chủ động;
- độc lập;
- tôn trọng;
- bình tĩnh;
- đáng tin cậy.

Không sử dụng thông điệp mô tả người khuyết tật là bất lực hoặc phụ thuộc.

## 2.3 Nhiệm vụ trước, công nghệ sau

Người dùng cần thấy:

```text
Mở camera
Dán văn bản
Bắt đầu nghe
Chọn tài liệu
```

Không cần liên tục thấy:

```text
AI Vision
AI Assistant
Gemini
Machine Learning
Document Intelligence
```

## 2.4 Trạng thái phải trung thực

Không hiển thị “Sẵn sàng” nếu backend chưa được kiểm tra.

Không mô tả dữ liệu là đã lưu nếu thao tác lưu chưa thành công.

Không hiển thị tài khoản là đã đồng bộ nếu Firebase Auth chưa hoàn tất.

## 2.5 Mỗi màn hình có một nhiệm vụ chính

Mỗi màn hình phải có một CTA chính dễ nhận biết. Các hành động phụ không được cạnh tranh thị giác với CTA chính.

---

# 3. DESIGN TOKENS

## 3.1 Màu sắc — Light Theme

```css
:root {
  --canvas: #f6f7fb;
  --surface: #ffffff;
  --surface-subtle: #eef1f7;
  --surface-raised: #ffffff;

  --text-primary: #172038;
  --text-secondary: #536079;
  --text-disabled: #707b91;

  --primary: #3546b5;
  --primary-hover: #293997;
  --primary-active: #202f82;
  --primary-soft: #eef0ff;
  --primary-border: #aeb8f4;

  --teal: #087a78;
  --teal-hover: #066563;
  --teal-soft: #e8f7f6;

  --coral: #c74561;
  --coral-hover: #aa344e;
  --coral-soft: #fff0f3;

  --success: #19704a;
  --success-soft: #eaf7f0;

  --warning: #8a5a00;
  --warning-soft: #fff6dc;

  --error: #b42318;
  --error-hover: #912018;
  --error-soft: #fff0ee;

  --border: #dce2ec;
  --border-strong: #aeb8c8;
  --focus: #1d4ed8;
}
```

## 3.2 Màu sắc — Dark Theme

```css
.dark {
  --canvas: #0f1420;
  --surface: #171e2d;
  --surface-subtle: #20293b;
  --surface-raised: #242e42;

  --text-primary: #f5f7ff;
  --text-secondary: #c7cede;
  --text-disabled: #9aa5b8;

  --primary: #9eabff;
  --primary-hover: #b8c1ff;
  --primary-active: #d2d7ff;
  --primary-soft: #27305d;
  --primary-border: #6472c7;

  --teal: #6bd6d0;
  --teal-hover: #8ce6e1;
  --teal-soft: #163f40;

  --coral: #ff94a8;
  --coral-hover: #ffadbb;
  --coral-soft: #512936;

  --success: #6bd6a3;
  --success-soft: #183e30;

  --warning: #f5c75e;
  --warning-soft: #443715;

  --error: #ff9b91;
  --error-soft: #4d2523;

  --border: #39445a;
  --border-strong: #69758e;
  --focus: #a9c5ff;
}
```

Tất cả cặp màu phải được đo contrast thực tế trước khi đưa vào production.

## 3.3 Màu nhận diện tính năng

| Tính năng | Màu chính | Màu nền nhẹ | Ý nghĩa |
|---|---|---|---|
| Nhìn giúp tôi | Indigo | Primary soft | Tin cậy, nhận diện thị giác |
| Nghe & ghi lại | Teal | Teal soft | Âm thanh, trạng thái hoạt động |
| Làm nội dung dễ hiểu | Coral | Coral soft | Ấm áp, làm rõ nội dung |
| Hiểu tài liệu | Blue-indigo | Primary soft | Tài liệu, cấu trúc, tin cậy |

Màu của tính năng chỉ là gợi ý nhận diện. Không dùng màu làm phương tiện duy nhất để phân biệt tính năng.

## 3.4 Typography

Font đề xuất:

```css
font-family:
  Inter,
  "Noto Sans",
  "Segoe UI",
  Arial,
  sans-serif;
```

Thang chữ:

| Token | Desktop | Mobile | Line-height | Weight |
|---|---:|---:|---:|---:|
| Display | 40px | 32px | 1.15 | 700 |
| Page title | 32px | 28px | 1.2 | 700 |
| Section title | 24px | 22px | 1.3 | 650–700 |
| Card title | 20px | 19px | 1.35 | 650–700 |
| Body large | 18px | 17px | 1.6 | 400–500 |
| Body | 16px | 16px | 1.6 | 400–500 |
| Label | 15px | 15px | 1.4 | 600 |
| Metadata | 14px | 14px | 1.45 | 400–500 |
| Button | 16px | 16px | 1.2 | 650 |

Không dùng nội dung quan trọng dưới 14px.

Không dùng `font-light` cho body text.

Không viết HOA toàn bộ trên navigation, CTA hoặc hướng dẫn.

## 3.5 Spacing

```text
4px   — khoảng cách rất nhỏ giữa icon và indicator
8px   — thành phần liên quan gần nhau
12px  — icon và label, khoảng cách trong control nhỏ
16px  — padding control, khoảng cách nội dung cơ bản
20px  — card compact
24px  — section hoặc card thông thường
32px  — khoảng cách giữa section
40px  — page section lớn
48px  — khoảng cách bố cục rộng
```

## 3.6 Radius

```text
Button/input: 12px
Compact card: 16px
Feature panel: 20px
Dialog: 20px
Pill/tag: 999px, chỉ khi nội dung thực sự là tag hoặc segmented control
```

Không biến mọi control thành pill.

## 3.7 Shadow

Sử dụng shadow rất nhẹ để phân biệt elevation, không tạo glassmorphism.

```css
--shadow-sm: 0 1px 2px rgb(23 32 56 / 0.06);
--shadow-md: 0 8px 24px rgb(23 32 56 / 0.08);
--shadow-dialog: 0 24px 64px rgb(15 23 42 / 0.22);
```

## 3.8 Focus

```css
:focus-visible {
  outline: 3px solid var(--focus);
  outline-offset: 3px;
}
```

Focus không được bị cắt bởi `overflow: hidden`.

---

# 4. BREAKPOINTS VÀ RESPONSIVE

## 4.1 Breakpoints

```text
Mobile nhỏ:       320–359px
Mobile chuẩn:     360–479px
Mobile lớn:       480–767px
Tablet:           768–1023px
Laptop:           1024–1279px
Desktop:          1280px+
```

## 4.2 Nguyên tắc responsive

- Mobile bắt đầu bằng một cột.
- Không dùng hai cột ở 320–479px trừ khi mỗi control vẫn rộng ít nhất 144px và nội dung không bị cắt.
- Hai workspace panel trên desktop chuyển thành stack hoặc accessible tabs trên mobile.
- Không tạo horizontal scroll vô tình.
- Text và filename dài phải wrap hoặc truncate có tooltip/accessible full name.
- Fixed bottom navigation phải có content padding tương ứng.
- Dùng `min-width: 0` cho flex/grid children.
- Dialog rộng tối đa `calc(100vw - 32px)` trên mobile.
- Tất cả layout phải hoạt động ở 175% font scale.

## 4.3 Chiều rộng nội dung

```text
Desktop max content width: 1440px
Reading text max width: 72ch
Form text max width: 65ch
Sidebar desktop: 260–280px
Main page padding desktop: 32–40px
Main page padding mobile: 16px
```

---

# 5. APPLICATION SHELL

## 5.1 Skip link

Vị trí đầu tiên trong DOM:

```text
Chuyển đến nội dung chính
```

Mặc định ẩn ngoài viewport, hiện rõ khi focus.

## 5.2 Desktop sidebar

### Cấu trúc

```text
Lovira
Love goes Viral

Công cụ
  Trang chủ
  Nhìn giúp tôi
  Nghe & ghi lại
  Easy Read
  Hiểu tài liệu

Cá nhân
  Lịch sử
  Trợ năng
  Cài đặt
```

### Kích thước

```text
Width: 272px
Item height: minimum 48px
Horizontal padding: 16px
Gap between groups: 28–32px
```

### Selected state

- nền `primary-soft`;
- text `primary`;
- icon `primary`;
- một indicator dọc 3–4px hoặc icon/weight rõ;
- `aria-current="page"`;
- không chỉ dựa vào màu.

### Hover

- surface thay đổi nhẹ;
- không scale item;
- transition 160ms;
- tắt transition khi reduced motion.

## 5.3 Desktop top bar

Chỉ chứa các control có ích toàn cục:

```text
[Cỡ chữ] [Giao diện] [Trạng thái tài khoản]
```

Không thêm badge trang trí hoặc một vòng tròn trống không có nhãn.

Icon-only button phải có `aria-label` và tooltip.

## 5.4 Mobile top bar

```text
[Logo Lovira]                 [Cỡ chữ] [Menu]
```

Height tối thiểu 64px.

Top bar không chứa quá bốn hành động.

## 5.5 Mobile bottom navigation

```text
Trang chủ | Nhìn | Nghe | Easy Read | Thêm
```

### Yêu cầu

- fixed ở đáy;
- nền đặc, không blur phụ thuộc;
- border-top rõ;
- target ít nhất 48×48px;
- icon 22–24px;
- label 12–13px nhưng phải đọc được;
- safe-area bottom;
- không che CTA cuối trang;
- selected state dùng icon, text weight và indicator.

## 5.6 More menu mobile

Mở dưới dạng bottom sheet hoặc full-height sheet:

```text
Hiểu tài liệu
Lịch sử
Trợ năng
Cài đặt
```

Bottom sheet phải:

- có heading;
- có nút Đóng;
- đóng bằng Escape;
- trap focus;
- trả focus về nút Thêm.

---

# 6. COMPONENT LIBRARY

## 6.1 Button

### Variants

```text
Primary
Secondary
Tertiary
Destructive
Icon-only
```

### Normal size

```text
Height: minimum 48px
Horizontal padding: 18–22px
Icon: 20px
Gap: 10px
```

### Large Controls size

```text
Height: minimum 56px
Horizontal padding: 22–26px
Icon: 22–24px
```

### States

- default;
- hover;
- focus-visible;
- active;
- disabled;
- loading.

Disabled text vẫn phải đọc được. Không dùng opacity dưới mức khiến contrast thất bại.

## 6.2 Input và textarea

### Input

```text
Height: minimum 48px
Font: 16px
Radius: 12px
Border: 1px, focus 2px hoặc focus ring ngoài
```

### Textarea

```text
Minimum height mobile: 180px
Minimum height desktop: 260px
Resize: vertical where appropriate
Line-height: 1.6
```

Label luôn nằm ngoài input. Placeholder không thay thế label.

## 6.3 Toggle

Mỗi toggle gồm:

- tên setting;
- mô tả;
- switch;
- text trạng thái “Đang bật” hoặc “Đang tắt” nếu cần.

Không dùng màu switch làm tín hiệu duy nhất.

## 6.4 Segmented control

Dùng cho lựa chọn loại trừ lẫn nhau với 2–4 giá trị ngắn.

Trên mobile, nếu nhãn không vừa:

- chuyển thành select;
- hoặc radio cards một cột;
- hoặc tabs cuộn có báo hiệu overflow.

Không làm chữ bị cắt.

## 6.5 Notice

Variants:

```text
Thông tin
Thành công
Cảnh báo
Lỗi
Quyền riêng tư
Không được hỗ trợ
```

Mỗi notice có:

- icon;
- heading ngắn;
- nội dung;
- action nếu có;
- `role="status"` hoặc `role="alert"` phù hợp.

Không dùng side-stripe màu dày.

## 6.6 Dialog

### Desktop

```text
Width: 480–640px
Max height: calc(100vh - 64px)
```

### Mobile

```text
Width: calc(100vw - 32px)
Max height: calc(100dvh - 32px)
```

Dialog có:

- heading;
- description;
- close control;
- primary/secondary action;
- focus trap;
- Escape;
- focus restore.

## 6.7 Toast

Toast chỉ dùng cho xác nhận ngắn:

```text
Đã sao chép
Đã lưu
Đã đổi tên
```

Không dùng toast cho lỗi cần hành động. Lỗi cần retry phải ở trong luồng nội dung.

## 6.8 Loading state

Không dùng spinner đơn độc.

Luôn kèm text:

```text
Lovira đang phân tích hình ảnh…
Đang đọc trang 3 / 12…
```

## 6.9 Empty state

Mỗi empty state có:

1. heading;
2. giải thích;
3. một hoặc hai hành động tiếp theo.

---

# 7. MÀN HÌNH 1 — KHỞI ĐỘNG VÀ AUTH INITIALIZATION

## Route

Không có route riêng. Đây là trạng thái toàn trang trước khi auth hoàn tất.

## Mục tiêu

Cho người dùng biết Lovira đang chuẩn bị, không tạo cảm giác ứng dụng bị treo.

## Nội dung

```text
Lovira
Đang chuẩn bị Lovira cho bạn…
```

## Layout

- logo ở giữa hoặc trên một panel gọn;
- skeleton nhẹ hoặc progress indicator;
- không render lịch sử/private data;
- không nhấp nháy từ guest sang account state.

## Accessibility

- `role="status"`;
- `aria-live="polite"`;
- reduced motion dùng indicator tĩnh;
- focus không bị đưa vào nội dung chưa sẵn sàng.

## Error state

Nếu Firebase không kết nối:

```text
Lovira chưa thể chuẩn bị phiên sử dụng
Hãy kiểm tra kết nối Internet và thử lại.

[Thử lại]
```

Không âm thầm giả Firebase UID bằng local device ID trong production.

---

# 8. MÀN HÌNH 2 — DASHBOARD

## Route

```text
/
```

## Mục tiêu

Người dùng hiểu Lovira làm gì và bắt đầu một công cụ trong một hoặc hai hành động.

## Desktop layout

```text
┌──────────────────────────────────────────────────────────┐
│ Xin chào                                                 │
│ Lovira có thể giúp gì cho bạn hôm nay?                   │
│                                                          │
│ ┌────────────────────────┐ ┌───────────────────────────┐ │
│ │ Nhìn giúp tôi          │ │ Nghe & ghi lại            │ │
│ │ Mô tả hoặc đọc chữ     │ │ Theo dõi lời nói          │ │
│ │ trong ảnh.             │ │ trực tiếp.                │ │
│ │ [Mở camera]            │ │ [Bắt đầu nghe]            │ │
│ └────────────────────────┘ ├───────────────────────────┤ │
│                            │ Làm nội dung dễ hiểu      │ │
│                            │ [Dán văn bản]             │ │
│                            └───────────────────────────┘ │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Hiểu tài liệu                         [Chọn tài liệu]│ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ Tùy chỉnh nhanh                                          │
│ [Cỡ chữ 125%] [Tương phản cao] [Giảm chuyển động]        │
│                                      Mở cài đặt trợ năng │
│                                                          │
│ Hoạt động gần đây                                        │
└──────────────────────────────────────────────────────────┘
```

## Mobile layout

Thứ tự:

1. lời chào;
2. Vision feature nổi bật;
3. Conversation;
4. Easy Read;
5. Documents;
6. tùy chỉnh nhanh;
7. hoạt động gần đây.

Mỗi panel chiếm toàn bộ chiều rộng khả dụng.

## Header copy

```text
Xin chào
Lovira có thể giúp gì cho bạn hôm nay?
```

Không cần:

- ngày hiện tại;
- “Trạng thái hệ thống”;
- “AI Accessibility Suite”;
- thống kê số lượng công cụ.

## Feature panel 1 — Nhìn giúp tôi

```text
Nhìn giúp tôi
Mô tả khung cảnh hoặc đọc chữ trong ảnh.

[Mở camera]
[Tải ảnh lên]
```

Đây là panel được ưu tiên thị giác trên mobile.

## Feature panel 2 — Nghe & ghi lại

```text
Nghe & ghi lại
Theo dõi lời nói bằng văn bản trực tiếp.

[Bắt đầu nghe]
```

## Feature panel 3 — Làm nội dung dễ hiểu

```text
Làm nội dung dễ hiểu
Chuyển văn bản phức tạp thành nội dung rõ ràng hơn.

[Dán văn bản]
```

## Feature panel 4 — Hiểu tài liệu

```text
Hiểu tài liệu
Tóm tắt và hỏi đáp PDF, DOCX hoặc TXT.

[Chọn tài liệu]
```

## Quick settings

```text
Tùy chỉnh nhanh
Cỡ chữ 125%
Tương phản cao
Giảm chuyển động
Mở cài đặt trợ năng
```

Trên mobile, quick settings dùng một cột hoặc 2×2 khi đủ rộng. Không ép bốn hoặc năm nút vào một hàng.

## Recent activity

### Có dữ liệu

Hiển thị tối đa 3 mục:

```text
[Loại]
Tiêu đề
Mô tả ngắn
Thời gian
[Mở lại]
```

### Không có dữ liệu

```text
Bạn chưa lưu hoạt động nào
Kết quả bạn chọn lưu sẽ xuất hiện ở đây.

[Thử Easy Read]
```

## Service unavailable state

Chỉ hiện khi có lỗi thật:

```text
Một số tính năng AI đang tạm thời chưa hoạt động
Bạn vẫn có thể nhập nội dung và thử lại sau.

[Kiểm tra lại]
```

Không hiển thị “Sẵn sàng hỗ trợ” khi chưa có health state đáng tin cậy.

---

# 9. MÀN HÌNH 3 — NHÌN GIÚP TÔI: TRẠNG THÁI BAN ĐẦU

## Route

```text
/vision
```

## Page header

```text
Nhìn giúp tôi
Chụp hoặc tải ảnh để Lovira mô tả khung cảnh và đọc chữ trong ảnh.
```

Actions:

```text
[Mở camera]
[Tải ảnh lên]
```

## Desktop layout

```text
Page header

Chọn cách Lovira hỗ trợ
[Mô tả khung cảnh] [Đọc chữ trong ảnh]
[Giải thích vật thể] [Tóm tắt nhanh]

┌─────────────────────────────────────────────────┐
│ Kéo ảnh vào đây                                 │
│ hoặc                                            │
│ [Chọn ảnh từ thiết bị]                          │
│                                                 │
│ JPG, PNG hoặc WEBP • Tối đa 10 MB               │
└─────────────────────────────────────────────────┘

Privacy note
```

## Mobile layout

```text
Nhìn giúp tôi
Description

[Mở camera]
[Tải ảnh lên]

Chế độ phân tích
[Mô tả khung cảnh ▼]

Upload area
```

## Upload states

### Drag over

- border primary;
- background primary soft;
- text “Thả ảnh để chọn”.

### Invalid type

```text
Lovira chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.

[Chọn ảnh khác]
```

### File too large

```text
Ảnh này lớn hơn 10 MB
Hãy chọn ảnh nhỏ hơn để Lovira có thể xử lý.
```

### Permission denied

```text
Lovira chưa được phép sử dụng camera
Bạn có thể cấp quyền trong trình duyệt hoặc tải ảnh từ thiết bị.

[Thử mở camera lại]
[Tải ảnh lên]
```

---

# 10. MÀN HÌNH 4 — CAMERA

## Presentation

Mobile ưu tiên full-screen camera view. Desktop có thể dùng dialog lớn.

## Layout

```text
[Đóng camera]

Camera preview

Hướng dẫn ngắn nếu cần

[Chụp ảnh]
```

## Controls

- Đóng camera;
- chuyển camera trước/sau nếu được hỗ trợ;
- Chụp ảnh;
- trạng thái camera;
- permission notice.

## Accessibility

- camera preview có accessible description;
- controls có text hoặc `aria-label`;
- không dựa vào icon đơn độc;
- khi đóng camera, focus về nút “Mở camera”;
- stop toàn bộ media tracks.

## Error

```text
Lovira chưa thể mở camera
Camera có thể đang được ứng dụng khác sử dụng.

[Thử lại]
[Tải ảnh lên]
```

---

# 11. MÀN HÌNH 5 — VISION PREVIEW

## Mục tiêu

Cho người dùng xác nhận ảnh và chế độ trước khi tạo AI request.

## Desktop layout

```text
┌───────────────────────┬──────────────────────────┐
│ Ảnh đã chọn           │ Chế độ phân tích         │
│                       │                          │
│ [Image preview]       │ Radio/select            │
│                       │                          │
│ [Chụp lại]            │ [Phân tích ảnh]          │
│ [Chọn ảnh khác]       │                          │
└───────────────────────┴──────────────────────────┘
```

## Mobile

Stack:

1. preview;
2. chọn mode;
3. CTA Phân tích ảnh;
4. secondary actions.

## Copy

```text
Ảnh đã chọn
Chọn cách Lovira hỗ trợ
Phân tích ảnh
Chụp lại
Chọn ảnh khác
```

---

# 12. MÀN HÌNH 6 — VISION PROCESSING

Giữ nguyên ảnh preview.

Overlay hoặc result panel hiển thị:

```text
Lovira đang phân tích hình ảnh…
Đang tìm nội dung quan trọng và đọc chữ trong ảnh.
```

Actions:

```text
[Hủy]
```

Không cho gửi request trùng.

Reduced Motion dùng progress indicator tĩnh.

---

# 13. MÀN HÌNH 7 — VISION RESULT

## Desktop layout

```text
┌───────────────────────┬──────────────────────────────┐
│ Ảnh gốc               │ Mô tả nhanh                 │
│                       │                              │
│ [Image preview]       │ Chi tiết                    │
│                       │                              │
│ [Chọn ảnh khác]       │ Văn bản nhận diện           │
│                       │                              │
│                       │ Vật thể                     │
│                       │                              │
│                       │ Lưu ý                       │
└───────────────────────┴──────────────────────────────┘

[Đọc thành tiếng] [Hỏi thêm]
[Sao chép] [Lưu] [Phân tích lại]
```

## Mobile layout

```text
Ảnh
[preview]

Mô tả nhanh
...

[Đọc thành tiếng] [Hỏi thêm]

Chi tiết
...

Văn bản nhận diện
...

Lưu ý
...

[Thêm hành động]
```

Primary actions có thể sticky dưới viewport nhưng không che content.

## Empty fields

Không render section trống không có ý nghĩa.

Ví dụ:

```text
Lovira không tìm thấy chữ rõ ràng trong ảnh này.
```

## Safety note

```text
Mô tả AI có thể chưa hoàn toàn chính xác. Không nên sử dụng Lovira như phương tiện duy nhất để đảm bảo an toàn khi di chuyển.
```

## AI format error

```text
Lovira đã nhận được phản hồi chưa đúng định dạng
Ảnh của bạn vẫn được giữ lại.

[Thử lại]
```

---

# 14. MÀN HÌNH 8 — VISION FOLLOW-UP

Không thiết kế như một chatbot toàn màn hình.

Follow-up nằm dưới kết quả hoặc trong sheet:

```text
Hỏi thêm về ảnh

[Biển phía trước ghi gì?]
[Có cầu thang không?]
[Bên phải có gì?]

Input: Nhập câu hỏi về ảnh…
[Gửi câu hỏi]
```

Mỗi câu trả lời gồm:

```text
Câu hỏi
Câu trả lời có căn cứ
```

Nếu không chắc:

```text
Lovira chưa nhìn thấy đủ thông tin trong ảnh để trả lời câu hỏi này.
```

Không tạo avatar chatbot hoặc bubble trang trí quá mức.

---

# 15. MÀN HÌNH 9 — NGHE & GHI LẠI: BAN ĐẦU

## Route

```text
/conversation
```

## Header

```text
Nghe & ghi lại
Theo dõi lời nói bằng văn bản và tạo bản tóm tắt khi bạn cần.
```

## Desktop layout

```text
┌───────────────────────────┬───────────────────────────┐
│ Cuộc trò chuyện           │ Tóm tắt                   │
│                           │                           │
│ Micro đang tắt            │ Tóm tắt sẽ xuất hiện      │
│ [Bắt đầu nghe]            │ ở đây.                    │
│                           │                           │
│ Văn bản trực tiếp         │ Hãy nghe trực tiếp hoặc   │
│ Empty state               │ dán nội dung bên trái.    │
│                           │                           │
│ Nhập hoặc dán nội dung    │                           │
│ [Textarea]                │                           │
└───────────────────────────┴───────────────────────────┘
```

## Mobile layout

```text
Status
[Bắt đầu nghe]

Văn bản cuộc trò chuyện
[Live transcript]

Hoặc nhập nội dung
[Textarea]

[Tạo bản tóm tắt]
```

Summary hiển thị dưới transcript hoặc qua tab:

```text
Cuộc trò chuyện | Tóm tắt
```

## Unsupported browser

```text
Trình duyệt này chưa hỗ trợ nhận diện giọng nói trực tiếp
Bạn vẫn có thể nhập hoặc dán nội dung cuộc trò chuyện bên dưới.
```

Textarea luôn khả dụng.

---

# 16. MÀN HÌNH 10 — MICROPHONE PERMISSION

Không hiển thị dialog giả trước browser permission nếu không cần. Có thể dùng inline primer ngắn:

```text
Cho phép Lovira sử dụng micro
Lovira cần quyền micro để chuyển lời nói thành văn bản trực tiếp.

[Tiếp tục]
[Dùng bàn phím]
```

Permission denied:

```text
Lovira chưa được phép sử dụng micro
Bạn vẫn có thể nhập nội dung bằng bàn phím.

[Thử lại]
[Nhập nội dung]
```

---

# 17. MÀN HÌNH 11 — CONVERSATION RECORDING

## Status block

Đang ghi:

```text
Micro đang hoạt động
Lovira đang chuyển lời nói thành văn bản.
```

Controls:

```text
[Tạm dừng]
[Kết thúc]
```

Tạm dừng:

```text
Đã tạm dừng
[Tiếp tục]
[Kết thúc]
```

Không dùng chấm đỏ/teal làm tín hiệu duy nhất.

## Transcript item

```text
10:32
Nội dung câu đã được nhận diện…
```

Nếu không xác định được người nói, không tự đặt tên người nói.

## Accessibility

- announce state changes;
- không announce từng partial word;
- auto-scroll chỉ khi người dùng đang ở cuối transcript;
- nếu người dùng scroll lên, không kéo họ xuống tự động;
- có nút “Đi đến nội dung mới nhất”.

---

# 18. MÀN HÌNH 12 — CONVERSATION SUMMARY

## Desktop

Giữ transcript bên trái, summary bên phải.

## Sections

```text
Tóm tắt
Ý chính
Quyết định
Việc cần làm
Ngày / thời hạn
```

## Actions

```text
[Chuyển sang nội dung dễ hiểu]
[Đọc thành tiếng]
[Sao chép]
[Lưu]
```

## No data category

Không render bullet “Không có” lặp lại nhiều lần. Có thể ẩn section trống hoặc ghi một lần:

```text
Cuộc trò chuyện không có quyết định rõ ràng.
```

## Error

```text
Lovira chưa thể tạo bản tóm tắt
Nội dung cuộc trò chuyện vẫn được giữ lại.

[Thử lại]
```

---

# 19. MÀN HÌNH 13 — EASY READ: BAN ĐẦU

## Route

```text
/easy-read
```

## Header

```text
Làm nội dung dễ hiểu
Chuyển văn bản phức tạp thành nội dung rõ ràng, ngắn gọn hơn.
```

## Desktop layout

```text
┌────────────────────────────┬────────────────────────────┐
│ Văn bản gốc                │ Nội dung dễ hiểu           │
│                            │                            │
│ [Textarea]                 │ Kết quả sẽ xuất hiện       │
│                            │ ở đây.                     │
│ Số ký tự                   │                            │
│                            │ Văn bản gốc của bạn sẽ     │
│ Mức độ                     │ không bị xóa.              │
│ [Tiêu chuẩn] [Dễ hiểu]     │                            │
│ [Từng bước]                │                            │
│                            │                            │
│ [Làm nội dung dễ hiểu]     │                            │
└────────────────────────────┴────────────────────────────┘
```

## Mobile

Tabs:

```text
Bản gốc | Kết quả
```

Input controls ở tab Bản gốc. Kết quả không làm mất input.

## Textarea copy

Label:

```text
Văn bản gốc
```

Placeholder:

```text
Dán thông báo, hợp đồng hoặc hướng dẫn cần làm rõ…
```

Helper text:

```text
Lovira sẽ giữ lại tên, ngày, khoản phí, số điện thoại, địa chỉ và cảnh báo quan trọng.
```

## Sample content

Section:

```text
Thử với một ví dụ
```

Examples:

```text
Thông báo thủ tục hành chính
Hướng dẫn khám chữa bệnh bảo hiểm y tế
```

Mỗi sample có nút “Dùng mẫu”.

---

# 20. MÀN HÌNH 14 — EASY READ PROCESSING

Giữ nguyên văn bản trong input.

Result panel:

```text
Đang làm nội dung dễ hiểu hơn…
Lovira đang giữ lại các thông tin quan trọng.
```

Disable request trùng.

Actions:

```text
[Hủy]
```

---

# 21. MÀN HÌNH 15 — EASY READ RESULT

## Result order

```text
Tóm tắt
Điểm cần nhớ
Bạn cần làm gì
Ngày quan trọng
Cảnh báo
Từ khó
```

## Visual structure

- summary: prose ngắn;
- key points: bullets;
- steps: numbered list;
- dates: definition list hoặc compact items;
- warning: warning notice;
- difficult terms: term/explanation pairs.

## Actions

```text
[Đọc thành tiếng]
[Sao chép]
[Lưu]
[Tăng cỡ chữ]
[Hỏi về nội dung]
[Xóa]
```

Primary actions:

```text
Đọc thành tiếng
Sao chép
```

Xóa nằm trong secondary menu hoặc cuối danh sách.

## Mobile sticky actions

```text
[Đọc] [Sao chép] [Lưu] [Thêm]
```

Không che section cuối.

## Format error

```text
Lovira đã nhận được phản hồi chưa đúng định dạng
Văn bản gốc của bạn vẫn được giữ lại.

[Thử lại]
```

---

# 22. MÀN HÌNH 16 — EASY READ QUESTION

Không chuyển thành full chatbot.

Sheet hoặc inline section:

```text
Hỏi về nội dung

Gợi ý:
[Tôi cần chuẩn bị gì?]
[Hạn cuối là ngày nào?]
[Có khoản phí nào không?]

Input
[Gửi câu hỏi]
```

Câu trả lời chỉ dựa trên văn bản gốc/result context.

Nếu thiếu thông tin:

```text
Lovira không tìm thấy thông tin này trong nội dung.
```

---

# 23. MÀN HÌNH 17 — HIỂU TÀI LIỆU: UPLOAD

## Route

```text
/documents
```

## Header

```text
Hiểu tài liệu
Tóm tắt, tìm thông tin quan trọng và đặt câu hỏi về tài liệu.
```

## Upload area

```text
Kéo tài liệu vào đây
hoặc
[Chọn tài liệu]

PDF, DOCX hoặc TXT
Tối đa 10 MB • PDF tối đa 30 trang
```

## Privacy

```text
Nội dung chỉ được xử lý để cung cấp tính năng bạn yêu cầu.
```

## Sample document

Optional:

```text
Thử với tài liệu mẫu
Thông báo thủ tục cấp phép xây dựng
[Mở tài liệu mẫu]
```

Sample phải được ghi rõ là tài liệu mẫu.

## Invalid format

```text
Định dạng tài liệu chưa được hỗ trợ
Hãy chọn tệp PDF, DOCX hoặc TXT.
```

## Oversized

```text
Tài liệu lớn hơn 10 MB
Hãy chọn tệp nhỏ hơn hoặc chia tài liệu thành nhiều phần.
```

---

# 24. MÀN HÌNH 18 — DOCUMENT PROCESSING

## Layout

```text
Tên tài liệu
Loại • Kích thước

Đang đọc tài liệu…
Đang đọc trang 3 / 12
[Progress bar]

[Hủy]
```

## DOCX

```text
Đang xử lý tài liệu DOCX…
```

## TXT

```text
Đang đọc tệp văn bản…
```

## Accessibility

- progress có accessible label;
- cập nhật theo trang nhưng không flood screen reader;
- announce milestone hợp lý;
- Hủy có confirmation nếu đã xử lý lâu.

---

# 25. MÀN HÌNH 19 — SCANNED PDF DETECTION

```text
Có vẻ đây là tài liệu scan
Lovira chưa tìm thấy đủ văn bản trong tệp.

[Thử đọc từ hình ảnh]
[Chọn tài liệu khác]
```

Giải thích ngắn:

```text
Việc đọc từ hình ảnh có thể mất thêm thời gian.
```

Không hiển thị dead-end.

---

# 26. MÀN HÌNH 20 — DOCUMENT WORKSPACE

## Desktop layout

```text
┌─────────────────────────────┬─────────────────────────────┐
│ Tài liệu                    │ Lovira có thể giúp          │
│                             │                             │
│ Tên file                    │ [Tóm tắt]                   │
│ Số trang                    │ [Easy Read]                 │
│                             │ [Thông tin quan trọng]      │
│ Nội dung đã trích xuất      │ [Hỏi tài liệu]              │
│ hoặc document preview       │                             │
│                             │ Kết quả / empty state       │
└─────────────────────────────┴─────────────────────────────┘
```

## Mobile

Tabs:

```text
Tài liệu | Phân tích
```

Primary action menu luôn dễ truy cập nhưng không che nội dung.

## Document metadata

```text
Tên tài liệu
PDF • 12 trang • 2,4 MB
Đã đọc xong
```

Actions:

```text
[Đổi tài liệu]
[Xóa]
```

---

# 27. MÀN HÌNH 21 — DOCUMENT SUMMARY

Sections:

```text
Tóm tắt
Ý chính
Yêu cầu
Việc cần làm
Ngày quan trọng
Liên hệ
Cảnh báo
```

Actions:

```text
[Đọc thành tiếng]
[Chuyển sang nội dung dễ hiểu]
[Sao chép]
[Lưu]
```

Nếu một category trống, ẩn hoặc ghi một câu rõ, không tạo dữ liệu giả.

---

# 28. MÀN HÌNH 22 — IMPORTANT INFORMATION

Page/panel title:

```text
Thông tin quan trọng
```

Render theo nhóm:

```text
Hạn cuối
Giấy tờ cần chuẩn bị
Khoản phí
Địa điểm
Thông tin liên hệ
Việc cần làm
Cảnh báo
```

Mỗi item có source reference khi có thể:

```text
Trang 4
```

Không dùng big-number cards nếu không cần.

---

# 29. MÀN HÌNH 23 — DOCUMENT Q&A

Không thiết kế như chatbot generic.

## Header

```text
Hỏi tài liệu
Lovira chỉ trả lời dựa trên nội dung tài liệu này.
```

## Suggested questions

```text
Tài liệu này nói về điều gì?
Tôi cần chuẩn bị những gì?
Hạn cuối là ngày nào?
Có khoản phí nào không?
Tôi cần liên hệ với ai?
```

## Answer

```text
Câu trả lời
...

Nguồn: Trang 3–4
```

Nếu thiếu thông tin:

```text
Lovira không tìm thấy thông tin này trong tài liệu.
```

## Actions

```text
[Đọc thành tiếng]
[Sao chép]
```

---

# 30. MÀN HÌNH 24 — LỊCH SỬ

## Route

```text
/history
```

## Header

```text
Lịch sử
Mở lại những kết quả bạn đã chọn lưu.
```

## Search

Label accessible:

```text
Tìm trong lịch sử
```

Placeholder:

```text
Tìm theo tiêu đề hoặc nội dung…
```

## Filters

```text
Tất cả
Nhìn giúp tôi
Nghe & ghi lại
Easy Read
Tài liệu
```

Trên mobile dùng horizontal filter row có scroll indicator hoặc select.

## History item

```text
[Type icon] [Type label]
Tiêu đề
Preview tối đa 2–3 dòng
18 tháng 8, 2026 • 14:32

[Mở lại]
[Thêm]
```

Menu Thêm:

```text
Đổi tên
Xóa
```

## Empty state

```text
Bạn chưa có hoạt động nào
Khi bạn lưu một kết quả, kết quả đó sẽ xuất hiện ở đây.

[Thử Nhìn giúp tôi]
[Thử Easy Read]
```

## No search result

```text
Không tìm thấy kết quả phù hợp
Hãy thử từ khóa khác hoặc xóa bộ lọc.

[Xóa bộ lọc]
```

---

# 31. MÀN HÌNH 25 — HISTORY DETAIL

Có thể dùng route:

```text
/history/:historyId
```

## Layout

- breadcrumb về Lịch sử;
- type;
- editable title;
- saved timestamp;
- original input/asset metadata;
- saved result;
- actions.

Actions:

```text
[Đọc thành tiếng]
[Sao chép]
[Đổi tên]
[Xóa]
```

Khi asset gốc không còn, giải thích rõ thay vì hiển thị broken preview.

---

# 32. DIALOG — ĐỔI TÊN LỊCH SỬ

```text
Đổi tên hoạt động

Tên mới
[Input]

[Hủy]
[Lưu tên]
```

Validation:

```text
Hãy nhập tên cho hoạt động này.
```

Sau khi lưu:

```text
Đã đổi tên
```

---

# 33. DIALOG — XÓA LỊCH SỬ

```text
Xóa hoạt động này?
Bạn sẽ không thể mở lại kết quả sau khi xóa.

[Giữ lại]
[Xóa]
```

Default focus ở “Giữ lại”, không phải “Xóa”.

Không dùng double-negative copy.

---

# 34. MÀN HÌNH 26 — TRỢ NĂNG

## Route

```text
/settings/accessibility
```

## Header

```text
Trợ năng
Điều chỉnh Lovira theo cách bạn đọc, nghe và thao tác.
```

## Section 1 — Hiển thị

### Cỡ chữ

```text
Cỡ chữ
Thay đổi kích thước chữ trên toàn bộ Lovira.

[100%] [125%] [150%] [175%]
```

### Tương phản cao

```text
Tương phản cao
Tăng độ rõ giữa chữ, nền và các điều khiển.
```

### Giao diện

```text
Giao diện
[Sáng] [Tối] [Theo hệ thống]
```

### Nút lớn

```text
Nút lớn
Tăng vùng bấm và khoảng cách giữa các điều khiển.
```

## Section 2 — Chuyển động và âm thanh

### Giảm chuyển động

```text
Giảm chuyển động
Giảm hiệu ứng chuyển động và nhấp nháy không cần thiết.
```

### Tự động đọc kết quả

```text
Tự động đọc kết quả
Đọc kết quả sau khi bạn đã cho phép âm thanh trên thiết bị này.
```

### Tốc độ đọc

```text
Tốc độ đọc
[0,75×] [1×] [1,25×] [1,5×]
```

Có nút:

```text
[Nghe thử]
```

## Section 3 — Nội dung

### Phụ đề mặc định

```text
Phụ đề mặc định
Ưu tiên hiển thị nội dung lời nói bằng văn bản.
```

### Ưu tiên nội dung dễ hiểu

```text
Ưu tiên nội dung dễ hiểu
Đề xuất Easy Read khi nội dung dài hoặc phức tạp.
```

### Ngôn ngữ

```text
Ngôn ngữ
[Tiếng Việt]
[English]
```

Tiếng Việt là mặc định và đầy đủ nhất.

## Footer actions

```text
[Khôi phục cài đặt mặc định]
```

Khôi phục cần confirmation.

## Live preview

Desktop có thể có preview nhỏ:

```text
Xem trước
Đây là cách nội dung sẽ hiển thị trên Lovira.
[Nút mẫu]
```

Không bắt buộc trên mobile.

---

# 35. DIALOG — KHÔI PHỤC CÀI ĐẶT

```text
Khôi phục cài đặt mặc định?
Các tùy chỉnh trợ năng hiện tại sẽ được đặt lại.

[Giữ cài đặt]
[Khôi phục]
```

---

# 36. MÀN HÌNH 27 — CÀI ĐẶT TÀI KHOẢN

## Route

```text
/settings
```

## Header

```text
Cài đặt
Quản lý tài khoản, dữ liệu và các tùy chọn nâng cao.
```

## Anonymous account state

```text
Đồng bộ Lovira

Bạn đang sử dụng Lovira mà không cần tài khoản.
Liên kết Google để sử dụng lại dữ liệu trên các thiết bị khác.

[Liên kết tài khoản Google]
```

Không gọi anonymous user là “tài khoản tạm” theo cách gây mất tin tưởng.

## Linked account state

```text
Tài khoản đã liên kết
[Avatar]
Tên
Email

Dữ liệu Lovira được đồng bộ với tài khoản này.
```

## Data section

```text
Dữ liệu của bạn
Lịch sử đã lưu
Tài liệu đã lưu

[Mở lịch sử]
[Xóa dữ liệu]
```

Xóa dữ liệu cần mô tả phạm vi và confirmation.

## Privacy section

```text
Quyền riêng tư
Nội dung chỉ được xử lý để cung cấp tính năng bạn yêu cầu.
Bạn có thể xóa lịch sử bất cứ lúc nào.
```

---

# 37. DIALOG — GOOGLE LINKING CONFLICT

```text
Tài khoản Google này đã được sử dụng với Lovira

Bạn có thể giữ phiên hiện tại hoặc đăng nhập vào tài khoản Lovira đã có.
Dữ liệu hiện tại sẽ không bị xóa nếu bạn hủy.

[Hủy]
[Đăng nhập vào tài khoản đã có]
```

Không tự động merge hoặc ghi đè dữ liệu.

---

# 38. MÀN HÌNH 28 — CÀI ĐẶT NÂNG CAO / BYOK

Route có thể là:

```text
/settings/advanced
```

## Section

```text
Nâng cao

Sử dụng Gemini API Key riêng
API Key riêng được lưu trên thiết bị này.
Không sử dụng API Key nhạy cảm trên thiết bị công cộng.
```

Input:

```text
Gemini API Key riêng
[••••••••••••ABCD] [Hiện/Ẩn]
```

Actions:

```text
[Kiểm tra kết nối]
[Lưu trên thiết bị]
[Xóa khóa]
```

Status:

```text
Đã kết nối
Không thể xác minh khóa này
```

BYOK không nằm trong luồng chính và không xuất hiện trên Dashboard.

Không lưu BYOK vào Firestore, Storage, Analytics hoặc logs.

---

# 39. GLOBAL ERROR BOUNDARY

```text
Có điều gì đó chưa hoạt động đúng
Bạn có thể thử lại mà không cần tải lại toàn bộ Lovira.

[Thử lại]
[Về trang chủ]
```

Nếu có dữ liệu input chưa lưu, không reset dữ liệu trừ khi không thể tránh.

Focus vào heading lỗi khi fallback xuất hiện.

---

# 40. OFFLINE VÀ NETWORK ERROR

Inline notice:

```text
Không thể kết nối
Hãy kiểm tra Internet. Nội dung của bạn vẫn được giữ lại.

[Thử lại]
```

Nếu browser báo offline:

```text
Bạn đang ngoại tuyến
Một số tính năng AI cần kết nối Internet.
```

Không xóa image preview, transcript, Easy Read input hoặc extracted document text.

---

# 41. TEXT-TO-SPEECH CONTROL

## Compact control

```text
[Đọc thành tiếng]
```

## Active control

```text
Đang đọc
[Tạm dừng]
[Dừng]
```

## Paused

```text
Đã tạm dừng
[Tiếp tục]
[Dừng]
```

## Unsupported

```text
Trình duyệt này chưa hỗ trợ đọc thành tiếng.
```

## Autoplay locked

```text
Chạm hoặc nhấn một phím để bật chức năng đọc tự động.
```

Không tự đọc khi page render nếu chưa có explicit interaction.

---

# 42. TOAST VÀ THÔNG BÁO NGẮN

Approved toast copy:

```text
Đã sao chép
Đã lưu
Đã đổi tên
Đã xóa
Đã liên kết tài khoản Google
Đã cập nhật cài đặt
```

Toast:

- không che bottom navigation;
- `aria-live="polite"`;
- không tự biến mất quá nhanh;
- không chứa action quan trọng duy nhất.

---

# 43. MICROCOPY CHUẨN

| Tránh dùng | Nên dùng |
|---|---|
| Nhìn giúp tôi (Vision Assistant) | Nhìn giúp tôi |
| Nghe & ghi lại (Conversation Assistant) | Nghe & ghi lại |
| Hiểu tài liệu (Document Assistant) | Hiểu tài liệu |
| Lovira / AI Accessibility Suite | Bỏ hoặc dùng breadcrumb tiếng Việt |
| Tóm tắt bằng AI | Tạo bản tóm tắt |
| Chưa bật micro | Micro đang tắt |
| Sẵn sàng hỗ trợ | Chọn một công cụ để bắt đầu |
| Duyệt tệp từ thiết bị | Chọn tệp từ thiết bị |
| Không thể hoàn thành phân tích | Lovira chưa thể phân tích nội dung này |
| Đọc phản hồi | Tự động đọc kết quả |
| Easy Read mặc định | Ưu tiên nội dung dễ hiểu |
| Xóa tất cả lịch sử hoạt động | Xóa toàn bộ lịch sử |

Ngôn ngữ phải:

- ngắn;
- rõ;
- tôn trọng;
- không đổ lỗi;
- không quá kỹ thuật;
- không trẻ con hóa người dùng.

---

# 44. MOTION

## Cho phép

- hover/focus transition 150–200ms;
- tab change 160–220ms;
- dialog fade/scale nhẹ;
- progress state có chủ đích;
- toast entrance nhẹ.

## Không cho phép

- bounce;
- elastic;
- animation lặp vô hạn để trang trí;
- pulse liên tục trên account status;
- page-load choreography;
- content bị ẩn cho đến khi animation chạy.

## Reduced Motion

Khi bật hoặc hệ điều hành yêu cầu:

- bỏ transform animation;
- bỏ smooth scroll;
- thay spinner/ping bằng indicator tĩnh khi có thể;
- transition gần như tức thời;
- không nhấp nháy.

---

# 45. ACCESSIBILITY ACCEPTANCE CRITERIA

## Keyboard

- Tab order theo thứ tự thị giác;
- không keyboard trap;
- Enter/Space kích hoạt button;
- Escape đóng dialog/sheet;
- focus trả về trigger;
- skip link hoạt động;
- focus không bị cắt.

## Screen reader

- một `h1` rõ trên mỗi page;
- heading hierarchy không bỏ cấp tùy tiện;
- icon decorative có `aria-hidden`;
- icon-only button có accessible name;
- input có label;
- progress có accessible value;
- errors liên kết với field;
- async status được announce hợp lý;
- live transcript không flood.

## Vision

- preview có alt mô tả trạng thái, không giả kết quả AI;
- camera controls có label;
- mode là radio group/select semantic;
- result sections có headings.

## Conversation

- microphone state có text;
- transcript text tối thiểu 16–18px;
- manual fallback luôn khả dụng;
- summary heading order đúng.

## Easy Read

- original và result có labels;
- mobile tabs keyboard accessible;
- result không tự xóa original;
- numbered steps dùng `<ol>`.

## Documents

- file input có label;
- drag/drop không phải cách duy nhất;
- progress announce hợp lý;
- Q&A source reference đọc được.

---

# 46. FONT SCALE ACCEPTANCE

Thực hiện đúng:

```text
100% = 1.00
125% = 1.25
150% = 1.50
175% = 1.75
```

Không ánh xạ 175% thành 137,5%.

Ở 175%:

- sidebar có thể collapse nếu cần;
- text wrap;
- button tăng chiều cao;
- segmented controls chuyển layout;
- không clip label;
- không horizontal overflow;
- bottom navigation label vẫn dùng được;
- dialog vẫn scroll được;
- form controls không bị che.

---

# 47. LARGE CONTROLS ACCEPTANCE

Khi bật Nút lớn:

- button ít nhất 56px;
- nav item ít nhất 56px;
- icon-only target ít nhất 52px;
- toggle target ít nhất 52px;
- gap action tăng ít nhất 4px;
- bottom navigation cao hơn và content padding tăng theo;
- không làm mất CTA;
- không chỉ tăng font.

---

# 48. RESPONSIVE ACCEPTANCE MATRIX

Kiểm thử từng màn hình ở:

```text
320 × 568
360 × 800
390 × 844
412 × 915
768 × 1024
1024 × 768
1280 × 800
1440 × 900
```

Kết hợp với:

```text
100% font
175% font
200% browser zoom
Nút lớn
Tương phản cao
Dark theme
Reduced Motion
```

Mỗi màn hình phải đạt:

- không overflow ngang vô tình;
- không text clip;
- không button biến mất;
- không content bị bottom nav che;
- không dialog vượt viewport;
- không form field nhỏ hơn target size;
- không control phụ thuộc hover.

---

# 49. DESKTOP DEMO FLOW

Demo đề xuất trong khoảng một phút:

## Bước 1

Dashboard:

```text
Mở camera
```

## Bước 2

Vision:

```text
Chọn ảnh
→ Mô tả khung cảnh
→ Đọc thành tiếng
```

## Bước 3

Easy Read:

```text
Dùng mẫu thủ tục hành chính
→ Làm nội dung dễ hiểu
→ Xem các bước và ngày quan trọng
```

## Bước 4

Conversation hoặc Documents nếu còn thời gian.

Demo data phải thực tế tại Việt Nam.

Không dùng fake AI result trong production. Nếu dùng dữ liệu demo offline riêng, phải ghi rõ là “Bản minh họa” và tách khỏi luồng thật.

---

# 50. FIGMA DELIVERABLE STRUCTURE

Nếu dựng Figma, dùng cấu trúc page:

```text
00 — Cover
01 — Foundations
02 — Components
03 — Desktop Shell
04 — Mobile Shell
05 — Dashboard
06 — Vision
07 — Conversation
08 — Easy Read
09 — Documents
10 — History
11 — Settings
12 — Errors & Empty States
13 — Accessibility States
14 — Responsive QA
15 — Prototype Flow
```

Mỗi screen có variants:

```text
Light
Dark
High Contrast
Mobile
Desktop
Loading
Empty
Error
Success
175% text where relevant
```

Component names nên map được sang React component names.

Ví dụ:

```text
Button/Primary/Default
Button/Primary/Loading
Notice/Error/Inline
Navigation/Desktop/Selected
FeaturePanel/Vision/Desktop
ResultSection/KeyPoints
Dialog/ConfirmDelete
```

---

# 51. REACT COMPONENT MAPPING

Thiết kế nên map sang component:

```text
AppLayout
DesktopSidebar
MobileTopBar
MobileNavigation
MoreMenuSheet

PageHeader
FeaturePanel
QuickAccessibilitySettings
RecentActivity

Button
IconButton
TextField
TextArea
Toggle
SegmentedControl
Tabs
Select

FileUploader
ImagePreview
CameraCapture
DocumentProgress

AIResultLayout
ResultSection
ReadAloudControls
QuestionPanel

Notice
LoadingState
ErrorState
EmptyState
Toast

AccessibleDialog
ConfirmDialog
BottomSheet
```

Shared components phải có đầy đủ states, không thiết kế riêng từng page với vocabulary khác nhau.

---

# 52. FINAL UI/UX DEFINITION OF DONE

Thiết kế được xem là hoàn chỉnh khi:

1. Người dùng hiểu Lovira trong vòng vài giây.
2. Bốn công cụ chính được bắt đầu trong một hoặc hai hành động.
3. UI chính là tiếng Việt tự nhiên.
4. Không còn technical English trong title chính.
5. Typography mặc định đủ lớn và dễ đọc.
6. Không còn text quan trọng 10–12px.
7. Dashboard không lãng phí first viewport cho metadata trang trí.
8. Vision có preview trước khi gửi phân tích.
9. Conversation tận dụng hai cột desktop.
10. Easy Read luôn có source/result workspace rõ.
11. Documents có upload, progress, scan fallback và analysis workspace.
12. History có CTA trong empty state.
13. Settings được nhóm theo nhu cầu người dùng.
14. Font scale đúng 100/125/150/175%.
15. Nút lớn có tác dụng thật.
16. Reduced Motion hỗ trợ cả app setting và OS preference.
17. High Contrast thay đổi toàn hệ thống, không chỉ border.
18. Keyboard sử dụng được mọi chức năng chính.
19. Screen reader nhận được labels và status hợp lý.
20. Mobile 320–412px không overflow ngang.
21. Bottom navigation không che nội dung.
22. Dialog trap/restore focus.
23. Errors giữ lại nội dung và có retry.
24. Loading giải thích hệ thống đang làm gì.
25. Empty state hướng dẫn hành động tiếp theo.
26. Trạng thái hệ thống trung thực.
27. Không có fake button hoặc fake result.
28. Light, Dark và High Contrast đều đạt contrast mục tiêu.
29. Design vocabulary nhất quán giữa mọi màn hình.
30. Sản phẩm truyền đạt sự độc lập, tôn trọng, ấm áp và đáng tin.

---

# 53. PROMPT NGẮN DÙNG KÈM TÀI LIỆU

Copy đoạn dưới đây khi giao tài liệu này cho designer hoặc coding agent:

```text
Hãy sử dụng LOVIRA_COMPLETE_UI_UX_DESIGN_SPEC.md làm đặc tả UI/UX chính và lovira-dashboard-ui-concept-v1.png làm visual reference.

Thiết kế/triển khai toàn bộ các màn hình Lovira theo đúng hierarchy, responsive behavior, states, Vietnamese copy và accessibility acceptance criteria trong tài liệu.

Không sao chép ảnh concept thành một giao diện tĩnh. Hãy xây dựng component thật, semantic HTML thật và interaction thật.

Không tạo chatbot generic, dashboard kỹ thuật, giao diện bệnh viện, phong cách từ thiện hoặc giao diện trẻ con.

Ưu tiên khả năng đọc, tính trung thực, sự độc lập của người dùng và WCAG 2.2 AA.

Trước khi sửa, kiểm tra code hiện tại và bảo toàn chức năng đang hoạt động. Sau khi sửa, kiểm tra desktop, mobile, 175% font scale, 200% browser zoom, keyboard, screen reader semantics, Dark, High Contrast và Reduced Motion.
```
