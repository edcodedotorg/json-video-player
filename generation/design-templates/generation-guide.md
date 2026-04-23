# Slide Generation Guide

Guidance for generating HTML slides for the json-video-player. Covers how to choose the right visual approach for a given scene, which template to use, and the technical requirements every slide must meet.

For colors, typography, and layout design principles, see `design-guide.md`.

---

## Choosing a Visual Approach

Every scene in a video script needs a visual. There are three ways to produce one, and they serve different purposes.

### 1. Text-Based Slides (HTML templates)

**Use when the scene is:**
- Defining a vocabulary term or concept
- Presenting a list of key points, steps, or rules
- Showing a chapter title, section intro, or closing summary
- Displaying a code example
- Delivering a single high-impact idea (a quote, stat, or key phrase)
- Explaining something where the structure of the information *is* the visual

**Why:** HTML/CSS slides are fast, scalable, and perfectly on-brand. They require no external tools and can be generated entirely by an LLM using the templates in this folder.

**Templates available:** `title-slide`, `code-slide`, `big-quote`, `header-with-image`, `header-with-svg`, `two-column-quote-with-image`, `bullets-with-image`, `bullets-with-svg`

---

### 2. AI Image Generation

**Use when the scene is:**
- Built around a metaphor or analogy that benefits from a real-world visual (e.g. "AI is like an improv performer")
- Introducing an abstract concept where an illustration aids comprehension
- Intended to create a specific *feeling* or set a visual tone rather than explain something precisely
- Describing a real-world context (a classroom, a data center, a conversation)

**Why:** Generated images excel at atmosphere and illustration. They give metaphors and analogies visual weight that pure text or diagrams cannot. Use `header-with-image` when the image is the entire visual, `two-column-quote-with-image` when pairing with a key term or quote, or `bullets-with-image` when pairing with 2–3 takeaway points.

**When NOT to use:** Avoid image generation for data, charts, statistics, or any content where accuracy matters — generated images of numbers or charts are unreliable.

**Tool:** `tools/gemini-image-gen.py` — see the [Image Generation Workflow](#image-generation-workflow) section below.

---

### 3. SVG Generation

**Use when the scene is:**
- Visualizing a flow, process, or sequence (boxes and arrows)
- Displaying data with real numbers (probability charts, bar charts, comparisons)
- Showing a structured diagram where relationships between elements matter
- Presenting a fill-in-the-blank or sentence-completion concept where text layout is the point
- Any case where precision matters and an image would be fuzzy or inaccurate

**Why:** LLMs can generate SVG reliably for structured content. SVGs embed directly in slide HTML with no extra production steps — no API calls, no base64 conversion. They scale perfectly and can use the brand color system via inline styles.

**Good SVG candidates:** Flow diagrams, probability visualizations, word-weight charts, annotated sentence displays, comparison grids, simple icon-style illustrations.

**Avoid SVG for:** Complex realistic illustrations, photos, or scenes requiring artistic rendering.

**SVG pattern templates available:** `svg-flow.html` (horizontal flow/pipeline), `svg-bar-chart.html` (ranked bar chart), `svg-word-display.html` (sentence completion + probability pills). Start from the matching pattern — do not write SVG from scratch.

**After generating a new diagram type:** If you create an SVG diagram that has no existing pattern template, save a reusable version as a new `svg-*.html` file in `design-templates/` once the script is complete. Follow the same ALL_CAPS placeholder convention as the existing patterns so future generations can use it without redesigning from scratch.

**For complex diagrams — consider ai-figure:** If a scene requires a diagram with many nodes in non-linear topology (decision trees, binary trees, neural network layers, ER diagrams, state machines, or arbitrary node graphs), manual coordinate placement becomes unreliable. In these cases, raise ai-figure ([https://github.com/hustcc/ai-figure](https://github.com/hustcc/ai-figure)) with the user before proceeding. ai-figure is a JS rendering engine that auto-lays out structured diagrams from a compact config — an LLM can call it as a Node tool alongside the existing Python tools. Discuss whether the complexity warrants adding it for that generation session.

---

### Quick Decision Guide

| Scene type | Template |
|---|---|
| Chapter intro / outro / transition | `title-slide` |
| Code example | `code-slide` |
| Vocabulary term definition (no image) | `big-quote` |
| Metaphor, analogy, or mood — image carries the scene | `header-with-image` |
| Flow, process, or data diagram | `header-with-svg` |
| Key stat, pull quote, or concept + portrait image | `two-column-quote-with-image` |
| 2–3 key takeaways + supporting portrait image | `bullets-with-image` |
| 2–3 key takeaways + diagram | `bullets-with-svg` |

---

## Template Catalog

### `title-slide.html`
**Use for:** Opening a video, introducing a new section, transitioning between major topics, or closing a video.
**Structure:** Full-bleed purple-to-teal gradient, centered title, optional eyebrow label above and subtitle below.
**Tip:** The eyebrow label is useful for section numbering (e.g. "Unit 3 · Lesson 2"). Delete it if not needed.

### `code-slide.html`
**Use for:** Displaying and explaining a code example in any programming language.
**Structure:** Title at top, dark-themed code block (VS Code-style), optional annotation line beneath.
**Tip:** The template defines color variables for keyword, string, comment, number, and function token types. Use inline `<span style="color: var(--code-keyword)">` etc. for syntax highlighting — no external library needed.

### `big-quote.html`
**Use for:** Introducing a vocabulary term and its definition. The term dominates the slide; the definition appears below it.
**Structure:** White card on purple background, large decorative quotation mark, oversized term, definition line below.
**Tip:** Use the term as BIG_TEXT and the definition as SECONDARY_TEXT. Delete the quote mark for non-quote terms.
**Do not use for:** Stats or pull quotes — use `two-column-quote-with-image` for those.

### `header-with-image.html`
**Use for:** Scenes built around a metaphor, analogy, or mood where an image carries the entire visual weight. The heading frames it; the image IS the content.
**Structure:** 140px heading banner at top (teal left accent), image fills the remaining 760px edge-to-edge.
**Image:** Generate at `--aspect-ratio 16:9`. `object-fit: cover` fills the full area.
**Tip:** Keep the heading to 8 words or fewer. This template has no body text — the narration provides all explanation.

### `header-with-svg.html`
**Use for:** Any scene where an SVG diagram is the primary visual — flow diagrams, data charts, probability visualizations, sentence-completion displays, or concept maps.
**Structure:** 140px heading banner at top, SVG fills the remaining area with padding for breathing room.
**Class toggle:** Add `class="no-title"` to `<body>` to hide the heading and give the SVG the full canvas. Use when the heading would just repeat the narration or when the diagram needs maximum space.
**SVG viewBox:** `"0 0 1440 660"` with title shown; `"0 0 1440 820"` in no-title mode.
**SVG guidance:** Start from a pattern file (`svg-flow.html`, `svg-bar-chart.html`, `svg-word-display.html`). Reference brand colors via hex; use `font-family="Figtree, sans-serif"` for text.

### `two-column-quote-with-image.html`
**Use for:** A key concept, stat, or quote paired with a portrait image. Left side has a large heading and subheading; right side has the image.
**Structure:** Left column (flex: 1) with 96px heading + 36px subheading + teal left accent. Right column: portrait image sized by height (9:16 ratio, ~452px wide at full slide height).
**Image:** Generate at `--aspect-ratio 9:16`. The column is portrait-shaped and sized to the image height.
**Tip:** Heading = the term or concept (2–8 words). Subheading = one framing sentence. No bullets or paragraphs.

### `bullets-with-image.html`
**Use for:** 2–3 key takeaways that pair with a supporting portrait image.
**Structure:** 140px heading banner at top. Below: large-font bullet list on the left (flex: 1), portrait image on the right (sized by height, 9:16 ratio, ~382px wide).
**Bullets:** Max 3. Each bullet: 4–5 words in 52px Barlow Semi Condensed. Longer text wraps badly at this size — enforce short clauses.
**Image:** Generate at `--aspect-ratio 9:16`.

### `bullets-with-svg.html`
**Use for:** 2–3 key takeaways that pair with a diagram where precision matters.
**Structure:** 140px heading banner at top. Below: large-font bullet list on the left (flex: 1), SVG diagram on the right (fixed 560px wide column).
**Bullets:** Same as `bullets-with-image` — max 3, 4–5 words each, 52px Barlow.
**SVG viewBox:** `"0 0 540 640"` as a starting point for this column size. Start from a pattern file.

---

## Image Generation Workflow

### Tool: `tools/gemini-image-gen.py`

Generates a single image from a text prompt using Google's Gemini model and saves it to `tools/generated-images/`.

**Invocation:**
```bash
python tools/gemini-image-gen.py "<prompt>" [--aspect-ratio RATIO]
```

- `prompt` — required, text description of the image
- `--aspect-ratio` — optional, one of `1:1`, `9:16`, `16:9`, `4:3`, `3:4` (default: `16:9`)

**Output:** The absolute filepath of the saved image is printed to stdout — nothing else. Use this filepath directly as the `src` in a slide template.

### Step-by-step process

1. Decide image generation is the right approach for the scene (metaphor, analogy, mood — not data or diagrams)
2. Choose the correct aspect ratio for the template:
   - `header-with-image` → `--aspect-ratio 16:9` (landscape image area, ~2:1)
   - `two-column-quote-with-image` → `--aspect-ratio 9:16` (portrait right column)
   - `bullets-with-image` → `--aspect-ratio 9:16` (portrait right column)
3. Write a prompt (see tips below) and run the script:
   ```
   python tools/gemini-image-gen.py "your prompt here" --aspect-ratio 16:9
   ```
4. Capture the absolute filepath printed to stdout
5. Replace the `<div class="image-placeholder">` in the template with:
   ```html
   <img src="/path/to/tools/generated-images/generated_image_<uuid>.png" alt="Description" class="image">
   ```
6. During final production, run `tools/embed-images.py` to convert all local image paths to base64 data URIs

> **Tip — editing a production script:** If a `script.json` already has base64 images embedded and you need an LLM to read or edit it, run `tools/base64_clean.py` first to strip the payloads. This produces a `_cleaned` copy that is small enough to work with. Re-run `embed-images.py` afterward to restore the images.

### Prompt writing tips

- **Be specific** about scene, setting, and mood — vague prompts produce generic results
- **Name a visual style:** "flat illustration", "digital art", "watercolor", "photograph"
- **Include educational context** where relevant: "for a K-12 computer science lesson", "educational illustration"
- **Do not request text, labels, or charts** — Gemini renders these unreliably; use SVG for anything that needs accurate text or data
- **Keep scenes simple** — one or two subjects with a clear focal point work better than complex multi-element scenes

| Goal | Example prompt |
|---|---|
| Metaphor visual | `"Two people on a stage doing improv comedy, warm stage lighting, flat illustration style"` |
| Real-world context | `"A vast server room filled with rows of blinking computers, digital art, cinematic lighting"` |
| Abstract concept | `"A friendly cartoon robot reading an enormous open book, colorful flat illustration, educational"` |
| Weak prompt (avoid) | `"AI doing things"` |

---

## Script Alignment Process

**Before generating any slides, read the entire script.** Do not assess scenes one at a time in isolation — connected sequences need to be identified first and planned as a group (see below).

When assessing each scene, ask:

1. **What is this scene communicating?** A fact, a definition, a process, an analogy, or an example?
2. **Does the content have inherent visual structure?** Lists and steps → text slide. Flow or data → SVG. Metaphor or mood → image.
3. **How long is the scene?** Short scenes (under 5s) suit simple slides (big-quote, title-slide). Longer scenes support richer layouts.
4. **Is precision required?** If numbers or structured relationships matter, prefer SVG over image generation.
5. **Is there an existing template that fits?** Prefer templates over custom layouts — templates maintain design consistency and are faster to generate.
6. **Is this scene part of a connected sequence?** See below.

---

## Identifying and Handling Connected Sequences

A connected sequence is a group of consecutive scenes that share the same example, metaphor, or concept thread. Scenes in a sequence must use a consistent visual language — the same color-to-concept mapping, element sizing, and diagram style — so the viewer perceives them as one continuous explanation rather than unrelated slides.

### Signals that scenes form a sequence

Look for these patterns when reading the script:

- **Continuation language:** "the same way," "this is why," "let's see," "as we just saw," "now watch what happens when..." — these phrases explicitly link a scene to the one before it
- **A shared example carried across scenes:** an example introduced in one scene and extended or resolved in the next 1–3 scenes
- **Setup → payoff structure:** one scene poses a question or introduces a term; the next scene answers or illustrates it
- **The same subject matter in the same template type across consecutive scenes:** e.g. three consecutive `header-with-svg` entries that all deal with the same concept
- **Definition followed immediately by application:** a `big-quote` defining a term, then a `header-with-svg` or `bullets-with-svg` showing how that term works

### What to do when you find a sequence

1. **Identify the full extent of the sequence** before generating any of its slides — know where it starts and ends
2. **Define a visual vocabulary for the sequence:** decide which color represents which concept and which shapes/elements will be reused. Write this down as a comment or note before generating. Example:
   - User input → teal box
   - AI processing → purple box
   - Output → gray box
   - Arrows → 2px solid `#292F36`
3. **Generate the slides in order**, using the first slide's visual treatment as the explicit reference for each subsequent one. If generating via an LLM, include the first slide's SVG or layout as context when generating the next.
4. **Keep element sizes and proportions consistent** across the sequence — same font sizes for equivalent text, same box dimensions, same arrow styles, same padding
5. **Use the `no-title` toggle consistently** within a sequence — if one scene hides the title to let the diagram breathe, the connected scenes should match

---

## Slide Text Density

**Slides accompany narration — they do not replace it.** The narration carries the explanation; the slide reinforces the key point visually. Keep slides minimal:

- **`title-slide`**: title + optional subtitle only. No body text.
- **`code-slide`**: the code speaks for itself; annotation is optional and one line max.
- **`big-quote`**: term (1–4 words) + one-line definition. No additional text.
- **`header-with-image`** / **`header-with-svg`**: heading only — max 8 words. No body text whatsoever.
- **`two-column-quote-with-image`**: heading (2–8 words) + one subheading sentence. No bullets or paragraphs.
- **`bullets-with-image`** / **`bullets-with-svg`**: heading + max 3 bullets × 4–5 words each. The 52px font enforces this — longer text wraps badly.

If you feel compelled to write a paragraph, a sentence of explanation, or more than 3 bullets, that content belongs in the narration. Move it there and shorten the slide.

---

## HTML Generation Requirements

### Every slide must be self-contained
- No external dependencies except Google Fonts
- Images referenced by URL during drafting; base64 data URIs for final production
- SVGs embedded inline — no external SVG files

### Required boilerplate
Every slide must include this exact structure. Do not modify it.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title><!-- slide title --></title>
  <link href="https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@600&family=Figtree:wght@400;600&display=swap" rel="stylesheet">
  <style>
    /* ── Boilerplate: do not modify ── */
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
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 1600px;
      height: 900px;
      overflow: hidden;
      transform-origin: top left;
      font-family: 'Figtree', sans-serif;
      background: var(--color-gray-light);
      color: var(--color-text-primary);
    }
    /* ── End boilerplate ── */

    /* Template-specific styles go here */
  </style>
</head>
<body>

  <!-- Slide content goes here -->

  <!-- Boilerplate: do not modify -->
  <script>
    function resize() {
      document.documentElement.style.transform = `scale(${window.innerWidth / 1600})`;
    }
    window.addEventListener('resize', resize);
    resize();
  </script>
</body>
</html>
```

### Why all sizes use px

Slides are fixed at 1600×900px and scaled as a single unit by the resize script. Relative units (`rem`, `vw`, `vh`, `%`) are unnecessary and may produce inconsistent results. Use plain `px` for all font sizes, padding, margins, widths, and heights.

### Color usage rules
- All colors via CSS variables — no hardcoded hex values in template-specific styles
- Reserve `var(--color-aqua)` exclusively for slides about AI features
- Use semantic colors appropriately: `var(--color-error)` for mistakes/warnings, `var(--color-success)` for correct answers, etc.

---

## Animation Guidelines

- CSS keyframe animations and transitions are encouraged
- **Entrance animations** (fire once on load): fade-in, slide-up, scale-in — keep duration around 400ms
- **Ambient/looping animations**: floating, pulsing, shimmer — fine for background elements
- **Do not use time-based animations** intended to sync with specific narration moments — the player has no mechanism to trigger these. Animations should be self-contained and meaningful at any point during the scene.

---

## Sample Content Themes

- Programming concepts (loops, variables, functions, conditionals)
- Coding challenges and exercises
- Lesson plans and curriculum units
- Student progress and assessment
- Teacher resources and guides
- AI literacy and digital citizenship
