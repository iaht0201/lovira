# LOVIRA — PRODUCTION UI/UX IMPROVEMENT PROMPT

## 0. Cách sử dụng prompt này

Sử dụng toàn bộ nội dung file này làm prompt cho coding agent có quyền đọc và sửa repository Lovira hiện tại.

Đây là prompt **cải tiến sản phẩm đang có**, không phải yêu cầu tạo một mockup mới hoặc viết lại toàn bộ ứng dụng từ đầu.

Agent phải:

1. kiểm tra repository hiện tại;
2. chạy ứng dụng;
3. kiểm tra giao diện thật trên desktop và mobile;
4. xác định chức năng nào đang hoạt động;
5. bảo toàn phần đang hoạt động;
6. sửa trực tiếp mã nguồn;
7. kiểm thử lại sau mỗi nhóm thay đổi;
8. không dừng ở nhận xét hoặc wireframe.

---

# 1. SYSTEM ROLE

You are a **Senior Product Designer, Senior React Engineer, Accessibility Specialist, Firebase Engineer, AI Systems Architect, and Vietnamese UX Writer**.

You have deep practical experience with:

- React 18+;
- TypeScript strict mode;
- Vite;
- React Router;
- Tailwind CSS;
- Firebase Authentication;
- Cloud Firestore;
- Firebase Storage;
- Firebase Cloud Functions;
- Google Gemini API;
- responsive product interfaces;
- assistive technology;
- screen readers;
- keyboard-only navigation;
- WCAG 2.2 AA;
- natural Vietnamese UX writing.

Your task is to audit and improve the existing Lovira application as a real, reliable, Vietnamese-first AI accessibility product.

Do not only describe what should be changed.

Modify the actual application code, verify the result, and preserve existing working functionality.

---

# 2. PRODUCT CONTEXT

## Product name

# Lovira

## Brand meaning

**Lovira = Love goes Viral**

- Lov = Love
- Vira = Viral

Lovira represents the idea of spreading love, empathy, inclusion, dignity, and understanding through assistive AI technology.

## Vietnamese tagline

> **AI lan tỏa sự thấu hiểu — Giúp mọi người tiếp cận thông tin theo cách phù hợp nhất.**

## Target event

AI Riser Vietnam 2026.

## Core product principle

> **Công nghệ cần thích nghi với cách mỗi người tiếp nhận thông tin, thay vì buộc người dùng phải thích nghi với công nghệ.**

Lovira is not a generic chatbot.

Lovira is an AI accessibility platform that transforms information into forms that may be easier for each user to receive.

Examples:

```text
Hình ảnh → Mô tả dễ tiếp cận
Hình ảnh → Văn bản được nhận diện

Lời nói → Văn bản
Cuộc trò chuyện → Phụ đề trực tiếp
Cuộc trò chuyện → Tóm tắt

Văn bản phức tạp → Nội dung dễ hiểu
Quy trình → Hướng dẫn từng bước

PDF/DOCX/TXT → Tóm tắt
Tài liệu → Hỏi đáp có căn cứ
```

---

# 3. PRIMARY USERS

Lovira is designed primarily for Vietnamese users who face barriers when accessing information, including:

- people who are blind or have low vision;
- people who are deaf or hard of hearing;
- people with cognitive or learning difficulties;
- people with motor impairments;
- older adults;
- people experiencing temporary access barriers;
- anyone who prefers information in another format.

Never require users to identify or disclose a disability.

Allow every user to choose the assistance features that work best for them.

Do not portray disabled people as helpless.

The interface must communicate:

- independence;
- dignity;
- control;
- clarity;
- trust;
- warmth.

---

# 4. NON-NEGOTIABLE LANGUAGE REQUIREMENT

The primary product experience must be **Vietnamese-first**.

Default language:

```text
Tiếng Việt
```

All primary UI content must use clear, natural Vietnamese, including:

- navigation;
- page titles;
- buttons;
- tabs;
- form labels;
- placeholders;
- instructions;
- permission notices;
- validation messages;
- loading states;
- empty states;
- errors;
- dialogs;
- accessibility settings;
- privacy messages;
- AI result headings.

Do not use English technical suffixes in primary page titles.

Use:

```text
Nhìn giúp tôi
Nghe & ghi lại
Làm nội dung dễ hiểu
Hiểu tài liệu
```

Do not use:

```text
Nhìn giúp tôi (Vision Assistant)
Nghe & ghi lại (Conversation Assistant)
Làm nội dung dễ hiểu (Easy Read)
Hiểu tài liệu (Document Assistant)
```

`Easy Read` may remain as a recognized feature name in secondary labels where helpful, but the primary user-facing action must be natural Vietnamese.

Do not show ordinary users raw technical terms such as:

```text
FirebaseError
GEMINI_API_KEY
Vercel Function
JSON.parse
TypeError
NotAllowedError
FUNCTION_INVOCATION_FAILED
```

Technical details may be written to secure developer logs, not shown in the normal user experience.

---

# 5. PRESERVE AND IMPROVE — DO NOT REWRITE BLINDLY

Before modifying code:

1. inspect the current directory structure;
2. inspect `package.json` and installed dependencies;
3. inspect existing routes, components, hooks, services, Firebase setup, API routes, and styles;
4. run the current production build;
5. run the current application locally;
6. inspect all existing primary routes;
7. identify working behavior and broken behavior;
8. inspect the current git status;
9. preserve unrelated user changes.

Do not replace working code only to match a personal architectural preference.

Refactor only where it materially improves:

- reliability;
- accessibility;
- maintainability;
- performance;
- UX consistency;
- security.

Do not create fake features, fake AI responses, fake authentication, fake histories, or non-functional buttons.

Do not leave:

```text
TODO
implement later
mock response
placeholder action
fake data
```

If configuration is missing, implement the real integration and show a clear developer setup note separately from the end-user UI.

---

# 6. CURRENT PRODUCTION ISSUES TO VERIFY FIRST

Do not assume these issues still exist. Reproduce and verify each issue against the current code and running application before changing it.

## P0 — Critical

### 6.1 AI backend availability

Verify whether the deployed or local AI endpoints return successful structured responses.

The previously observed production Easy Read request returned:

```text
HTTP 500
FUNCTION_INVOCATION_FAILED
```

If AI is unavailable:

- fix the backend integration;
- do not delete user input;
- provide a retry action;
- do not show a false “Sẵn sàng hỗ trợ” system status;
- show a user-friendly Vietnamese error;
- keep technical diagnostics out of the normal UI.

### 6.2 Firebase Anonymous Authentication

Verify whether production actually initializes Firebase and obtains a real Firebase anonymous UID.

Do not silently treat a locally generated device ID as equivalent to a Firebase authenticated user.

Required behavior:

```text
Application startup
→ initialize Firebase
→ subscribe to auth state
→ reuse restored user when available
→ signInAnonymously only when no user exists
→ create/read Firestore profile
→ render private user data only after auth initialization
```

Loading message:

```text
Đang chuẩn bị Lovira cho bạn…
```

If Firebase configuration is missing in development, show a developer-facing configuration state. Do not pretend the user is Firebase-authenticated.

### 6.3 Authenticated AI requests

System Gemini requests must require Firebase Authentication, including anonymous authenticated users.

Preferred architecture:

```text
React SPA
→ Firebase callable Cloud Function
→ request.auth verification
→ parameter validation
→ Gemini API
→ response validation
→ minimal structured response
```

Do not expose the system Gemini key in the browser.

Do not accept unauthenticated production AI requests.

### 6.4 Truthful system status

Never show:

```text
Sẵn sàng hỗ trợ
```

unless the application has enough evidence that the required services are available.

Prefer a neutral CTA when no health check exists:

```text
Chọn một công cụ để bắt đầu
```

When a service is unavailable, show a status that helps the user recover.

---

# 7. VISUAL DESIGN DIRECTION

## 7.1 Brand personality

The visual experience should feel:

- warm;
- calm;
- respectful;
- trustworthy;
- capable;
- modern without being futuristic;
- accessible without looking childish.

## 7.2 Anti-references

Lovira must not look like:

- a charity donation website;
- a hospital management system;
- a generic admin dashboard;
- a generic AI chatbot;
- a developer tool;
- a cyberpunk interface;
- an overly futuristic AI product;
- a childish disability interface;
- an interface that portrays disabled users as dependent.

Avoid:

- decorative glassmorphism;
- gradient text;
- excessive glow;
- tiny uppercase labels;
- letter spacing that makes Vietnamese difficult to read;
- nested cards;
- identical cards repeated everywhere;
- color without semantic purpose;
- animation that does not communicate state.

## 7.3 Color system

Use CSS variables as the source of truth.

Suggested accessible direction:

```css
:root {
  --color-canvas: #f6f7fb;
  --color-surface: #ffffff;
  --color-surface-subtle: #eef1f7;

  --color-text: #172038;
  --color-text-muted: #536079;

  --color-primary: #3546b5;
  --color-primary-hover: #293997;
  --color-primary-soft: #eef0ff;

  --color-teal: #087a78;
  --color-teal-soft: #e8f7f6;

  --color-coral: #c74561;
  --color-coral-soft: #fff0f3;

  --color-border: #dce2ec;
  --color-focus: #1d4ed8;

  --color-success: #19704a;
  --color-warning: #8a5a00;
  --color-error: #b42318;
}
```

This is a direction, not permission to blindly replace an existing accessible brand system. Preserve established brand colors where they already work.

Use color semantically:

- primary: main actions, active navigation, focus;
- teal: listening, captions, success;
- coral: restrained brand warmth;
- red: destructive actions and errors only;
- amber: warnings;
- neutral colors: normal content and surfaces.

Do not use color as the only way to communicate state.

## 7.4 Theme system

Support:

```text
Sáng
Tối
Theo hệ thống
Tương phản cao
```

Use light or system theme as the normal initial experience unless the stored preference or operating system specifies otherwise.

High Contrast must override decorative theme choices.

High Contrast must change more than border width. Verify:

- body text;
- muted text;
- placeholder text;
- icons;
- selected navigation;
- focus indicators;
- inputs;
- disabled controls;
- status messages;
- dialogs.

---

# 8. TYPOGRAPHY REQUIREMENTS

Typography is an accessibility feature.

Do not use important text smaller than `14px` at 100% scale.

Recommended scale:

```text
Page title:       30–34px, line-height 1.2, weight 650–700
Section title:    22–24px, line-height 1.3, weight 650–700
Card title:       19–20px, line-height 1.35, weight 650
Body:             16–18px, line-height 1.55–1.7, weight 400–500
Secondary text:   15–16px, line-height 1.5
Form label:       15–16px, line-height 1.4, weight 600
Button:           16px, line-height 1.2, weight 650
Metadata:         minimum 14px
```

Avoid `font-light` for body content.

Avoid using all-uppercase Vietnamese for navigation, instructions, or primary actions.

Avoid excessive letter spacing.

Headings should use natural sentence casing.

Long prose should be limited to approximately `65–75ch`.

Placeholder text must meet contrast requirements.

---

# 9. GLOBAL APPLICATION SHELL

## 9.1 Desktop

Use:

```text
Sidebar | Main workspace
```

Suggested navigation structure:

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

The current route must use `aria-current="page"`.

Selected navigation should not depend only on color.

## 9.2 Mobile

Use a standard, reliable bottom navigation:

```text
Trang chủ
Nhìn
Nghe
Easy Read
Thêm
```

Requirements:

- each target is at least `48 × 48px`;
- icons are `22–24px`;
- labels are readable and not all uppercase;
- respect `safe-area-inset-bottom`;
- add enough page padding so the bar never covers content;
- selected state uses icon, text, and an additional visual cue;
- support 200% browser zoom and Lovira font scaling.

Avoid a floating pill if it creates content overlap or breaks at large font sizes.

## 9.3 Routing

Use real application routes:

```text
/
/vision
/conversation
/easy-read
/documents
/history
/settings
/settings/accessibility
```

Do not rely on hash-only routing unless deployment constraints make it unavoidable and the reason is documented.

Direct navigation and refresh must work for every route.

Configure hosting rewrites correctly for the SPA.

---

# 10. DASHBOARD REDESIGN

The dashboard must let a user begin a primary task in one or two actions.

Do not spend the first screen on decorative system metadata.

Prioritize:

```text
Xin chào
Lovira có thể giúp gì cho bạn hôm nay?
```

Primary actions:

```text
Chụp ảnh
Nghe trực tiếp
Dán văn bản
Chọn tài liệu
```

Suggested desktop structure:

```text
Xin chào
Lovira có thể giúp gì cho bạn hôm nay?

[ Nhìn giúp tôi ]    [ Nghe & ghi lại ]
[ Easy Read ]        [ Hiểu tài liệu ]

Tùy chỉnh nhanh
[ Cỡ chữ ] [ Tương phản ] [ Giảm chuyển động ]

Hoạt động gần đây
```

Suggested mobile hierarchy:

1. camera/Vision as the most prominent action;
2. Conversation and Easy Read as compact secondary actions;
3. Document assistant;
4. quick accessibility settings;
5. recent activity.

Do not use four identical cards if another composition creates clearer priority.

Remove or demote information that does not help the user start:

- decorative date display;
- “AI Accessibility Suite” headings;
- unnecessary system labels;
- redundant counts such as “4 công cụ trợ năng AI đa năng”.

## 10.1 Optional accessibility card

Keep onboarding non-blocking.

Use:

```text
Làm Lovira phù hợp hơn với bạn
```

On mobile, do not put five controls in one horizontal row.

Use a vertical or responsive layout.

Quick actions may include:

```text
Cỡ chữ
Tương phản cao
Giảm chuyển động
```

Link to full settings:

```text
Mở cài đặt trợ năng
```

---

# 11. VISION ASSISTANT UX

Route:

```text
/vision
```

Primary title:

```text
Nhìn giúp tôi
```

Description:

```text
Chụp hoặc tải ảnh để Lovira mô tả khung cảnh và đọc chữ trong ảnh.
```

## 11.1 Input flow

Use an explicit sequence:

```text
Choose/capture image
→ preview image
→ choose analysis mode
→ analyze
→ show structured result
```

Do not automatically spend an AI request immediately after file selection unless this behavior is clearly communicated and intentionally designed.

Actions:

```text
Mở camera
Tải ảnh lên
Chụp lại
Chọn ảnh khác
Phân tích ảnh
```

Validate:

- exact MIME type;
- JPEG/JPG/PNG/WEBP only;
- file size;
- empty input;
- corrupt image where practical;
- image dimensions where practical.

Do not accept arbitrary `image/*` types.

## 11.2 Modes

Provide:

```text
Mô tả khung cảnh
Đọc chữ trong ảnh
Giải thích vật thể
Tóm tắt nhanh
```

Desktop may use a segmented control.

Mobile must use tabs that can wrap/scroll accessibly, a select, or a compact radio group. Never create horizontal overflow.

## 11.3 Result hierarchy

Render structured sections in this order:

```text
Mô tả nhanh
Chi tiết
Văn bản nhận diện
Vật thể
Lưu ý
```

Primary result actions:

```text
Đọc thành tiếng
Hỏi thêm
```

Secondary actions:

```text
Sao chép
Lưu
Phân tích lại
```

## 11.4 Follow-up grounding

Follow-up answers must be grounded in the original image, not only in the first generated summary.

If the system cannot determine an answer, say:

```text
Lovira chưa nhìn thấy đủ thông tin trong ảnh để trả lời câu hỏi này.
```

Never fabricate signs, hazards, object positions, or navigation information.

## 11.5 Safety note

Where relevant, display a calm note:

> **Mô tả AI có thể chưa hoàn toàn chính xác. Không nên sử dụng Lovira như phương tiện duy nhất để đảm bảo an toàn khi di chuyển.**

Do not make this message frightening or patronizing.

---

# 12. CONVERSATION ASSISTANT UX

Route:

```text
/conversation
```

Title:

```text
Nghe & ghi lại
```

## 12.1 Desktop layout

Always reserve a useful two-column workspace:

```text
Transcript | Tóm tắt
```

Before a summary exists, show an educational empty state in the right column:

```text
Tóm tắt sẽ xuất hiện ở đây
Bạn có thể nghe trực tiếp hoặc dán nội dung cuộc trò chuyện.
```

Do not leave half of the desktop workspace blank.

## 12.2 State-specific controls

Before recording:

```text
Bắt đầu nghe
```

Recording:

```text
Micro đang hoạt động
Tạm dừng
Kết thúc
```

Paused:

```text
Đã tạm dừng
Tiếp tục
Kết thúc
```

Stopped:

```text
Đã ghi xong
Tạo bản tóm tắt
Xóa
```

Do not represent recording state only with red/green color.

Do not show a visually dominant disabled AI button without explaining how it becomes available.

## 12.3 Speech API fallback

Detect:

```typescript
window.SpeechRecognition || window.webkitSpeechRecognition
```

When unsupported, show:

```text
Trình duyệt này chưa hỗ trợ nhận diện giọng nói trực tiếp.
Bạn vẫn có thể nhập hoặc dán nội dung cuộc trò chuyện bên dưới.
```

The manual textarea fallback is mandatory and must remain fully functional.

## 12.4 Transcript accessibility

Transcript text should be large and readable.

Use timestamps when helpful.

Do not make a screen reader announce every partial word. Announce completed phrases or meaningful status changes with `aria-live="polite"`.

## 12.5 Summary structure

Render:

```text
Tóm tắt
Ý chính
Quyết định
Việc cần làm
Ngày / thời hạn
```

Empty categories must remain empty. Never invent information.

---

# 13. EASY READ UX

Route:

```text
/easy-read
```

Title:

```text
Làm nội dung dễ hiểu
```

## 13.1 Desktop

Always use:

```text
Văn bản gốc | Nội dung dễ hiểu
```

Before processing, show an empty result state on the right:

```text
Nội dung dễ hiểu sẽ xuất hiện ở đây.
Văn bản gốc của bạn sẽ không bị xóa.
```

Do not collapse the input into half of the workspace while leaving the other half blank.

## 13.2 Mobile

Use accessible tabs:

```text
Bản gốc
Kết quả
```

After processing, the UI may switch to the result tab, but it must:

- announce completion;
- preserve the original text;
- provide a clear way back;
- keep retry available.

## 13.3 Levels

Use:

```text
Tiêu chuẩn
Dễ hiểu
Từng bước
```

Include concise explanations so users can choose without guessing.

## 13.4 Result structure

Prioritize:

```text
Tóm tắt
Điểm cần nhớ
Bạn cần làm gì
Ngày quan trọng
Cảnh báo
Từ khó
```

Preserve:

- names;
- dates;
- fees;
- phone numbers;
- addresses;
- deadlines;
- requirements;
- warnings.

Never infantilize the user.

## 13.5 Actions

Provide:

```text
Đọc thành tiếng
Sao chép
Lưu
Tăng cỡ chữ
Hỏi về nội dung
Xóa
```

Place destructive “Xóa” away from the primary action.

---

# 14. DOCUMENT ASSISTANT UX

Route:

```text
/documents
```

Title:

```text
Hiểu tài liệu
```

## 14.1 Upload state

Clearly show:

```text
PDF, DOCX hoặc TXT
Tối đa 10 MB
PDF tối đa 30 trang
```

Use:

```text
Kéo tài liệu vào đây
hoặc
Chọn tài liệu
```

Add concise privacy copy:

```text
Nội dung chỉ được xử lý để cung cấp tính năng bạn yêu cầu.
```

## 14.2 Processing progress

Examples:

```text
Đang mở tài liệu PDF…
Đang đọc trang 3 / 12…
Đang xử lý tài liệu DOCX…
Đang chuẩn bị nội dung để phân tích…
```

Respect Reduced Motion.

## 14.3 Desktop workspace

Use:

```text
Tài liệu | Phân tích
```

Primary actions:

```text
Tóm tắt
Easy Read
Thông tin quan trọng
Hỏi tài liệu
```

## 14.4 Scanned PDF

When little text is extracted, show:

```text
Có vẻ đây là tài liệu scan
Lovira chưa tìm thấy đủ văn bản trong tệp.
```

Actions:

```text
Thử đọc từ hình ảnh
Chọn tài liệu khác
```

Do not show a dead-end notice.

## 14.5 Document processing rules

Do not send a raw browser `File` directly to Gemini.

Use PDF.js for PDF extraction, Mammoth for DOCX, and `file.text()` for TXT.

Validate file size and type.

Chunk long documents.

Preserve chunk order and page references where practical.

For missing answers, say:

```text
Lovira không tìm thấy thông tin này trong tài liệu.
```

Never invent fees, contacts, deadlines, or requirements.

---

# 15. HISTORY UX

Route:

```text
/history
```

Filters:

```text
Tất cả
Nhìn giúp tôi
Nghe & ghi lại
Easy Read
Tài liệu
```

Empty state:

```text
Bạn chưa có hoạt động nào
Khi bạn lưu một kết quả, kết quả đó sẽ xuất hiện ở đây.
```

Actions:

```text
Thử Nhìn giúp tôi
Thử Easy Read
```

Each history item should show:

- type;
- title;
- preview;
- date and time;
- open action;
- rename action;
- more menu.

Place delete inside a secondary menu unless deletion is the primary task.

Deletion requires a confirmation dialog.

Dialogs must:

- trap focus;
- close with Escape;
- have accessible names;
- restore focus to the trigger.

---

# 16. ACCESSIBILITY SETTINGS

Route:

```text
/settings/accessibility
```

Group settings into meaningful sections.

## Hiển thị

- Cỡ chữ
- Tương phản cao
- Giao diện
- Nút lớn

## Chuyển động và âm thanh

- Giảm chuyển động
- Tự động đọc kết quả
- Tốc độ đọc

## Nội dung

- Phụ đề mặc định
- Ưu tiên nội dung dễ hiểu
- Ngôn ngữ

Each setting must include:

- a clear Vietnamese name;
- a one-sentence explanation;
- the control;
- a non-color-only state indicator.

## 16.1 Font scale

Implement the exact visible choices:

```text
100%
125%
150%
175%
```

Do not label `137.5%` as `175%`.

At real 175% scale:

- no clipped text;
- no overlapping controls;
- no missing buttons;
- no avoidable horizontal scrolling;
- dialogs remain usable;
- bottom navigation remains usable;
- file upload controls remain usable.

## 16.2 Large controls

The “Nút lớn” setting must have an observable effect.

When enabled:

- buttons should generally be at least `52–56px` high;
- icon-only controls receive larger hit targets;
- spacing between actions increases;
- toggles and checkboxes receive larger interaction areas;
- navigation remains stable.

Do not persist a setting that has no UI effect.

## 16.3 Reduced motion

Honor both:

- Lovira's stored preference;
- `@media (prefers-reduced-motion: reduce)`.

Disable or simplify:

- ping animations;
- continuous pulse animations;
- decorative transitions;
- smooth scrolling;
- loading movement where a static alternative works.

---

# 17. WCAG 2.2 AA REQUIREMENTS

Target WCAG 2.2 AA as a core product requirement.

## 17.1 Skip link

Provide:

```html
<a href="#main-content">Chuyển đến nội dung chính</a>
```

It must become visible when focused.

## 17.2 Contrast

Verify, do not guess:

- normal text: at least `4.5:1`;
- large text: at least `3:1`;
- important controls and focus indicators: at least `3:1`;
- placeholder text: at least `4.5:1` when it conveys instructions.

Test both light and dark themes.

## 17.3 Keyboard

Support:

```text
Tab
Shift + Tab
Enter
Space
Escape
```

No keyboard traps.

Do not create clickable `div` elements when a semantic button or link is appropriate.

## 17.4 Focus

Every interactive element must have a visible `:focus-visible` state.

Do not remove outlines unless replaced with an equally visible indicator.

Do not rely only on a subtle shadow.

## 17.5 Semantics

Prefer:

- `header`;
- `nav`;
- `main`;
- `section`;
- `form`;
- `fieldset`;
- `legend`;
- `button`;
- `label`;
- semantic heading order.

Use ARIA only when needed.

## 17.6 Screen readers

Use `aria-live` for meaningful asynchronous state changes, not continuous partial transcript updates.

Announce:

- processing started;
- processing completed;
- errors;
- microphone state;
- save completed;
- dialog opened where necessary.

## 17.7 Target size

Meet WCAG 2.2 target-size expectations.

Prefer at least `44 × 44px` for normal controls and larger when “Nút lớn” is enabled.

---

# 18. RESPONSIVE REQUIREMENTS

Test at minimum:

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

Also test:

- browser zoom 200%;
- Lovira font scale 175%;
- Large Controls enabled;
- long Vietnamese labels;
- dark theme;
- high contrast;
- reduced motion.

There must be no accidental horizontal overflow.

Common fixes to verify:

- `min-width: 0` on flex/grid children;
- controls may wrap;
- mobile grids begin with one column;
- long words and filenames wrap or truncate accessibly;
- fixed bottom navigation does not cover content;
- safe-area padding is applied;
- dialogs fit within the viewport;
- two-column workspaces stack or use accessible tabs.

Do not hide essential actions on small screens.

---

# 19. LOADING, ERROR, EMPTY, AND DISABLED STATES

## 19.1 Loading

Every asynchronous operation must show a clear state.

Examples:

```text
Lovira đang phân tích hình ảnh…
Đang đọc trang 3 / 12…
Đang tóm tắt cuộc trò chuyện…
Đang làm nội dung dễ hiểu hơn…
Đang lưu…
```

Keep user input visible while processing.

Disable duplicate submission without erasing content.

## 19.2 Error

Use a standard recoverable pattern:

```text
Lovira chưa thể xử lý yêu cầu này
Nội dung của bạn vẫn được giữ lại để bạn có thể thử lại.

[Thử lại]
[Quay lại chỉnh sửa]
```

## 19.3 Empty state

Every empty state must explain:

- what the area is for;
- why it is empty;
- what the user can do next.

## 19.4 Disabled controls

Disabled states must remain readable.

Do not use very low opacity.

Explain nearby why an action is unavailable.

If an action is irrelevant until a condition is satisfied, consider not rendering it until needed.

---

# 20. TEXT-TO-SPEECH UX

Detect support before use.

Controls:

```text
Đọc
Tạm dừng
Tiếp tục
Dừng
```

Do not start speech automatically before an explicit user interaction.

Maintain a user-interaction unlock state.

When automatic reading is enabled but not unlocked, show:

```text
Chạm hoặc nhấn một phím để bật chức năng đọc tự động.
```

Cancel speech when appropriate during navigation or component cleanup.

If unsupported, show:

```text
Trình duyệt này chưa hỗ trợ đọc thành tiếng.
```

---

# 21. DATA, PRIVACY, AND TRUST UX

Use concise, truthful statements.

Suggested message:

> **Nội dung của bạn chỉ được xử lý để cung cấp tính năng bạn yêu cầu. Bạn có thể xóa lịch sử bất cứ lúc nào.**

Do not claim:

- legal compliance that has not been implemented;
- “maximum security” without evidence;
- permanent encryption properties that are not verified;
- that data is stored in Firebase when the application is using local fallback.

Make system status and persistence behavior truthful.

If the application is temporarily local-only in a development environment, clearly identify that state to developers without confusing normal users.

---

# 22. STRUCTURED AI RESPONSE SAFETY

Use structured JSON responses where appropriate.

Validate AI responses with Zod or an equivalent runtime validator.

Never assume parsed data has the expected shape.

Required schemas include:

- VisionResult;
- EasyReadResult;
- ConversationSummary;
- DocumentAnalysis;
- DocumentQuestionResult.

Use `safeParse`.

When validation fails, do not crash:

```text
Lovira đã nhận được phản hồi chưa đúng định dạng.
Bạn có thể thử lại mà không cần nhập lại nội dung.
```

Action:

```text
Thử lại
```

Do not rely on fragile Markdown parsing for structured product UI.

---

# 23. METADATA AND VIETNAMESE DOCUMENT LANGUAGE

Set:

```html
<html lang="vi">
```

Use product metadata:

```html
<title>Lovira — AI lan tỏa sự thấu hiểu</title>
<meta
  name="description"
  content="Lovira giúp bạn nhìn, nghe và hiểu thông tin theo cách phù hợp nhất bằng AI trợ năng."
/>
```

Update Open Graph and Twitter metadata.

Remove defaults such as:

```text
My Google AI Studio App
An application built with Google AI Studio.
```

---

# 24. PERFORMANCE

Implement proportionate optimizations:

- lazy-load feature routes;
- split heavy PDF and DOCX processing code;
- avoid loading PDF.js on the Dashboard;
- avoid duplicate AI requests;
- compress images when appropriate;
- preserve user input after errors;
- clean up MediaStreams;
- clean up speech synthesis;
- unsubscribe Firebase listeners;
- avoid unnecessary rerenders;
- do not ship unnecessary SDK code to every route.

Do not over-engineer the MVP.

---

# 25. UX COPY REPLACEMENT GUIDE

Prefer these changes where applicable:

| Avoid | Prefer |
|---|---|
| Nhìn giúp tôi (Vision Assistant) | Nhìn giúp tôi |
| Nghe & ghi lại (Conversation Assistant) | Nghe & ghi lại |
| Làm nội dung dễ hiểu (Easy Read) | Làm nội dung dễ hiểu |
| Hiểu tài liệu (Document Assistant) | Hiểu tài liệu |
| Lovira / AI Accessibility Suite | Trang chủ, or remove |
| Tóm tắt bằng AI | Tạo bản tóm tắt |
| Chưa bật micro | Micro đang tắt |
| Sẵn sàng hỗ trợ | Chọn một công cụ để bắt đầu |
| Duyệt tệp từ thiết bị | Chọn tệp từ thiết bị |
| Không thể hoàn thành phân tích | Lovira chưa thể phân tích nội dung này |
| Đọc phản hồi | Tự động đọc kết quả |
| Easy Read mặc định | Luôn ưu tiên nội dung dễ hiểu |
| Khóa API Gemini | Khóa Gemini API riêng, only in Advanced settings |

Use short, respectful sentences.

Avoid bureaucratic language unless quoting source material.

Avoid repeated mentions of “AI” when the action itself is already clear.

---

# 26. IMPLEMENTATION PRIORITY

Implement and verify in this order.

## Phase 1 — Truth and reliability

1. reproduce production/local failures;
2. fix AI backend invocation;
3. make system status truthful;
4. verify Firebase Anonymous Authentication;
5. require authenticated AI requests;
6. preserve user input on all errors.

## Phase 2 — Mobile and accessibility blockers

1. eliminate horizontal overflow;
2. implement real 100/125/150/175% scaling;
3. implement Large Controls;
4. honor `prefers-reduced-motion`;
5. fix small text and contrast;
6. verify keyboard and dialogs.

## Phase 3 — Application shell

1. real routes and deep links;
2. responsive sidebar/bottom navigation;
3. Vietnamese metadata;
4. consistent buttons, inputs, notices, dialogs, tabs, and states.

## Phase 4 — Dashboard

1. shorten hero;
2. prioritize task entry;
3. simplify quick accessibility controls;
4. improve empty/recent activity states.

## Phase 5 — Feature workspaces

1. Vision preview → mode → analyze flow;
2. Conversation two-column layout;
3. Easy Read persistent two-column layout;
4. Document upload/progress/analysis layout;
5. History actions and recovery states.

## Phase 6 — AI response hardening

1. Zod schemas;
2. safe JSON parsing;
3. image-grounded follow-up;
4. document chunking;
5. retry behavior;
6. duplicate request prevention.

## Phase 7 — Final polish

1. typography rhythm;
2. restrained color warmth;
3. icon consistency;
4. focus and hover states;
5. dark/high-contrast themes;
6. performance;
7. full responsive QA.

---

# 27. REQUIRED QA

Do not claim completion before running relevant checks.

## Build

- TypeScript succeeds;
- production build succeeds;
- no major console errors;
- no white screen;
- direct routes and refresh work.

## Authentication

- anonymous auth succeeds;
- refresh restores the same user;
- the app does not create a new anonymous UID unnecessarily;
- Firestore profile is created once;
- private data is not rendered before auth initialization;
- Google linking preserves anonymous data where Firebase allows.

## AI

- system key is not present in the browser bundle;
- unauthenticated requests are rejected;
- authenticated anonymous users can call the AI function;
- structured responses are validated;
- invalid AI output cannot crash the UI;
- backend failures preserve user input.

## Vision

- supported image types work;
- invalid type and oversized files are rejected politely;
- preview works;
- camera permissions are handled;
- media tracks stop after leaving;
- follow-up is grounded in the image;
- result actions work.

## Conversation

- supported recognition works;
- unsupported browsers show the manual fallback;
- microphone denied does not break the page;
- Pause, Resume, Stop, and Clear states are correct;
- the transcript remains readable;
- summary renders structured sections.

## Easy Read

- Vietnamese input works;
- source content remains after errors;
- all levels work;
- names, dates, fees, addresses, phone numbers, and warnings remain accurate;
- mobile tabs work;
- desktop two-column layout works.

## Documents

- TXT works;
- PDF uses PDF.js;
- DOCX uses Mammoth;
- file size/type limits work;
- scanned PDF state has a next action;
- long documents are chunked;
- Q&A does not invent missing information.

## Accessibility

- keyboard-only navigation;
- visible focus;
- skip link;
- semantic heading hierarchy;
- screen reader labels;
- dialogs trap and restore focus;
- real 175% scale;
- 200% browser zoom;
- Large Controls;
- Reduced Motion;
- high contrast;
- light and dark contrast checks;
- no status communicated only by color.

## Responsive

- 320px;
- 360px;
- 390px;
- 412px;
- tablet portrait;
- tablet landscape;
- laptop;
- desktop.

There must be no unwanted horizontal scrolling.

---

# 28. DEFINITION OF DONE

The UI/UX improvement is complete only when:

1. A Vietnamese user can immediately understand what Lovira does.
2. The user can begin each primary task within one or two actions.
3. Primary UI is natural Vietnamese.
4. No false system status is displayed.
5. AI failures preserve all user work and offer retry.
6. Firebase Anonymous Authentication is real, not simulated with a local ID.
7. AI endpoints require authenticated users.
8. Mobile 320–412px has no accidental horizontal overflow.
9. Font scaling is exactly 100/125/150/175%.
10. Large Controls produces a visible, useful effect.
11. Reduced Motion honors both Lovira and operating-system preferences.
12. Normal text and controls meet WCAG 2.2 AA contrast targets.
13. Keyboard-only users can complete all important workflows.
14. Screen-reader users receive meaningful labels and status updates.
15. Vision results and follow-up questions remain grounded.
16. Conversation has a safe manual fallback.
17. Easy Read preserves original content and critical facts.
18. PDF/DOCX/TXT processing is real and robust.
19. Long documents are chunked.
20. History and settings persist under the correct Firebase UID.
21. Google linking is optional and conflict-safe.
22. The system Gemini key is not exposed to the browser.
23. AI JSON is runtime-validated.
24. Direct routes and refresh work.
25. Metadata identifies Lovira and declares Vietnamese.
26. Production build and TypeScript checks succeed.
27. There are no fake buttons, mock results, or incomplete visible modules.
28. The product is suitable for a live AI Riser Vietnam 2026 demonstration.

---

# 29. REQUIRED FINAL REPORT

After implementation, provide a concise evidence-based report containing:

1. files changed;
2. major UX changes;
3. accessibility changes;
4. Firebase/Auth changes;
5. Gemini/backend changes;
6. tests and builds run;
7. responsive sizes checked;
8. remaining external configuration, if any;
9. known limitations that are genuinely outside the current scope.

Do not claim a test passed unless it was actually run.

Do not hide failed checks.

---

# FINAL COMMAND

Now inspect the existing Lovira repository and deployed/current application.

Verify the existing behavior before changing it.

Then implement the improvements in the priority order above.

Preserve working functionality and unrelated user changes.

Do not stop at a critique, design description, wireframe, or visual prototype.

Modify the real application, repair broken integrations, validate accessibility and responsive behavior, run the production build, and report concrete evidence.

The final Lovira experience must be:

- Vietnamese-first;
- warm and dignified;
- easy to understand;
- easy to operate;
- reliable under failure;
- responsive on real phones;
- keyboard and screen-reader accessible;
- technically honest;
- ready for a live Vietnam-focused demonstration.
