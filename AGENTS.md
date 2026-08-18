# AGENTS.md — LOVIRA GUIDELINES & SPECIFICATIONS

## 🎯 MANDATORY SPECIFICATION FILES
Always adhere strictly to the rules, design tokens, microcopy, accessibility criteria, and production instructions defined in:
1. `/LOVIRA_COMPLETE_UI_UX_DESIGN_SPEC.md`
2. `/LOVIRA_PRODUCTION_UI_UX_IMPROVEMENT_PROMPT.md`

## 🇻🇳 CORE PRODUCT RULES FOR LOVIRA
- **Vietnamese-First Experience**: Primary UI content, titles, buttons, forms, and alerts must be natural, respectful Vietnamese without raw English technical suffixes in primary page titles (e.g., use "Nhìn giúp tôi", "Nghe & ghi lại", "Làm nội dung dễ hiểu", "Hiểu tài liệu").
- **Accessibility & WCAG 2.2 AA**:
  - Minimum font size: 14px (no important text smaller than 14px).
  - High contrast support, Reduced Motion support, Large Controls toggle.
  - Font scaling: 100%, 125%, 150%, 175%.
  - Visible focus indicators (`:focus-visible`), Skip Links, semantic HTML elements (`main`, `nav`, `section`, `header`, `button`, `label`).
- **Truthful System Status**: Never show false "Sẵn sàng" statuses if backend health checks fail. Always preserve user inputs on error and provide clear, friendly retry actions.
- **Privacy & Dignity**: Empower users, never portray disabled users as dependent or helpless. Keep user data private and grounded.
