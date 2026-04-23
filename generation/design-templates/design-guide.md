# Slide Design System

Reference for the visual design principles that govern all slides in the json-video-player. For guidance on when to use which slide type and how to generate HTML content, see `generation-guide.md`.

---

## Color Palette

**Primary Brand Colors:**
- Brand Teal: #0093A4 (active state, highlights, accent bars)
- Brand Purple: #8C52BA (primary accents, headings, decorative elements)
- Brand Aqua: #3CFFF7 — **AI features only. Do not use for general slide elements.**

**Semantic Colors:**
- Error Red: #E02D16
- Warning Yellow: #F9CB28
- Success Green: #3EA33E
- Info Blue: #1892E3

**Neutral Colors:**
- Text Primary: #292F36 (headings, primary text)
- Text Secondary: #4C5661 (body text)
- Light Gray: #F7F8FA (slide backgrounds)
- Medium Gray: #D1D4D8 (borders, dividers, placeholder fills)
- Dark Gray: #5F6872 (captions, labels, muted text)

All colors must be referenced via CSS custom properties — no hardcoded hex values in slide-specific styles:

```css
:root {
  --color-teal:           #0093A4;
  --color-purple:         #8C52BA;
  --color-aqua:           #3CFFF7; /* AI features only */
  --color-error:          #E02D16;
  --color-warning:        #F9CB28;
  --color-success:        #3EA33E;
  --color-info:           #1892E3;
  --color-text-primary:   #292F36;
  --color-text-secondary: #4C5661;
  --color-gray-light:     #F7F8FA;
  --color-gray-medium:    #D1D4D8;
  --color-gray-dark:      #5F6872;
}
```

---

## Typography

**Fonts:** Barlow Semi-Condensed (headings), Figtree (body text)
**Icons:** SVG icons or Unicode symbols only — no external icon libraries.

Import from Google Fonts in every slide's `<head>`:
```html
<link href="https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@600&family=Figtree:wght@400;600&display=swap" rel="stylesheet">
```

**Type Scale (all values in px — see generation-guide for why):**
- H1: 48px, Semi Bold
- H2: 34px, Semi Bold
- H3: 28px, Semi Bold
- H4: 24px, Semi Bold
- H5: 20px, Semi Bold
- H6: 16px, Semi Bold
- Body 1: 20px, Regular (primary body text)
- Body 2: 16px, Regular (secondary text)
- Body 3: 14px, Regular (small body text)
- Caption: 14px, Semi Bold

Special display sizes (title and quote slides only): 72px and 80px are permitted for maximum visual impact.

---

## Layout Principles

- **Spacing:** 8px grid system for all padding and margins
- **Cards:** White backgrounds, subtle box shadows, rounded corners (12px radius)
- **Grid:** 2-column and 3-column layouts as needed; columns separated by 48–64px gaps
- **Hierarchy:** Clear visual hierarchy using typography scale and color — one dominant element per slide
- **Aspect ratio:** All slides are 16:9 at 1600×900px

---

## Content Blocks

- **Cards:** White background (`#ffffff`), subtle shadow (`0 4px 16px rgba(0,0,0,0.08)`), 12px border radius
- **Accent bars:** 16px wide, full-height, brand teal — used to anchor left-aligned layouts
- **Dividers:** 1–4px height, medium gray or semi-transparent white depending on background
- **Layout options:** Full-width, 2-column (55/45 or 50/50 split), 3-column equal
