# Task: Generate HTML Slides for a Video Script

Use this document as the task specification when generating HTML slides for a json-video-player script. Replace `[SCRIPT_PATH]` with the path to the target script before executing.

---

## Step 1: Load All Context

Read the following files **in order** before doing anything else. Do not begin planning or generating until all files are read.

1. `design-templates/generation-guide.md` — visual approach selection, template catalog, sequence handling, image generation workflow, HTML requirements
2. `design-templates/design-guide.md` — color palette, typography scale, layout principles
3. `design-templates/boilerplate.html` — the shared boilerplate that must be copied verbatim into every slide
4. All 8 HTML templates in `design-templates/`:
   - `title-slide.html`
   - `code-slide.html`
   - `big-quote.html`
   - `header-with-image.html`
   - `header-with-svg.html`
   - `two-column-quote-with-image.html`
   - `bullets-with-image.html`
   - `bullets-with-svg.html`
5. All 3 SVG pattern files in `design-templates/` — scan these before planning any SVG scenes:
   - `svg-flow.html` — horizontal flow diagram (boxes + arrows)
   - `svg-bar-chart.html` — horizontal bar chart with ranked rows
   - `svg-word-display.html` — sentence completion + word probability pills
6. `tools/gemini-image-gen.py` — image generation tool reference
7. `[SCRIPT_PATH]` — the video script to generate slides for

---

## Step 2: Produce a Scene Plan

Read the **entire script** before assessing any individual scene. Then produce a scene plan in the following format for every scene:

| Scene | Template | Approach | Notes |
|-------|----------|----------|-------|
| 1 | e.g. `title-slide` | Text | e.g. "Eyebrow: Unit 1, Title: ..." |
| 2 | ... | ... | ... |

**Approach** must be one of: `Text`, `SVG`, `Image Gen`, or `Text + SVG` / `Text + Image Gen`.

After the table, list any **connected sequences** you identified — groups of consecutive scenes that share the same example, metaphor, or concept thread. For each sequence, define its visual vocabulary before any generation begins:

```
Sequence: Scenes [X–Y] — [brief description, e.g. "word probability example"]
  - [Concept A] → [color/shape, e.g. teal rounded box]
  - [Concept B] → [color/shape, e.g. purple rounded box]
  - Arrow style: [e.g. 2px solid #292F36]
  - Font size for labels: [e.g. 20px]
  - no-title: [yes/no]
```

**Wait for approval of the scene plan before generating any HTML.**

---

## Step 3: Generate Slides

Once the scene plan is approved, generate slides in scene order.

### Using templates

- Copy the appropriate template as the starting point for each scene — do not write slides from scratch
- The boilerplate (`:root` CSS variables + resize script) comes from `design-templates/boilerplate.html` — it is identical in every template and must not be modified
- Replace all placeholder text (e.g. `SLIDE_TITLE`, `BULLET_LEAD_1`) with the scene's content
- **Do not modify the boilerplate `<style>` or `<script>` blocks** marked "do not modify"
- Delete optional elements (eyebrow labels, captions, annotations) if the scene does not need them

### Using the image generation tool

For scenes where the approach is `Image Gen`:

1. Write a specific, descriptive prompt (see prompt tips in `generation-guide.md`)
2. Choose the correct aspect ratio for the target template:
   - `header-with-image` → `--aspect-ratio 16:9`
   - `two-column-quote-with-image` → `--aspect-ratio 9:16`
   - `bullets-with-image` → `--aspect-ratio 9:16`
3. Run the tool:
   ```
   python tools/gemini-image-gen.py "your prompt here" --aspect-ratio 9:16
   ```
4. Capture the absolute filepath printed to stdout
5. Insert it as the `src` attribute in the `<img class="image">` tag, replacing the placeholder div:
   ```html
   <img src="/path/to/generated_image.png" alt="descriptive alt text" class="image">
   ```

### Generating SVG diagrams

For scenes where the approach is `SVG` or `Text + SVG`:

- **Start from the matching SVG pattern file** — copy the `<svg>` element from `svg-flow.html`, `svg-bar-chart.html`, or `svg-word-display.html` and replace the `ALL_CAPS` placeholders with the scene's content
- Use `viewBox="0 0 1440 680"` as the default coordinate system (adjust if the diagram's proportions require it)
- Apply the visual vocabulary defined for the sequence — do not improvise colors or element sizes mid-sequence
- Reference brand colors via hex values (SVG cannot use CSS custom properties); the hex values are listed in `boilerplate.html` and in each SVG pattern file's comment block
- Embed the sequence's visual vocabulary as an HTML comment at the top of each connected slide's `<body>` so it is recoverable if context is lost:
  ```html
  <!-- Sequence: [name] | [ConceptA]=teal | [ConceptB]=purple | arrows=2px #292F36 -->
  ```

### Output format

Write each scene as a standalone HTML file in a `scenes/` folder next to `[SCRIPT_PATH]`:

```
scenes/scene_01.html   → scenes[0]
scenes/scene_02.html   → scenes[1]
...
```

Files are 1-indexed and zero-padded to 2 digits. Each file must be a complete, self-contained HTML document (from `<!DOCTYPE html>` to `</html>`).

Once all scenes are written, run the insert tool to populate the JSON:

```
python tools/insert-slides.py [SCRIPT_PATH]
```

This reads each `scene_NN.html` file and inserts its content into the corresponding `"html"` field in the script JSON. Missing scene files are skipped with a warning.

---

## Constraints

- All colors must use CSS custom properties (`var(--color-teal)`, etc.) — no hardcoded hex values in slide-specific styles
- All sizing in `px` — no `rem`, `vw`, `vh`, or `%`
- No external dependencies except Google Fonts
- Do not use `var(--color-aqua)` / `#3CFFF7` unless the scene is explicitly about an AI feature
- Animations must be self-contained (entrance or looping) — no time-synced animations
- Connected sequences must use the visual vocabulary defined in Step 2 — do not vary element sizes, colors, or styles within a sequence
- Slides must be visually minimal — they accompany narration, not replace it:
  - `header-with-image` / `header-with-svg`: heading only, max 8 words, no other text
  - `two-column-quote-with-image`: heading (2–8 words) + one subheading sentence, nothing else
  - `bullets-with-image` / `bullets-with-svg`: max 3 bullets × 4–5 words each (52px font enforces short clauses)
  - `big-quote`: vocabulary term (1–4 words) + one-line definition
  If you feel compelled to write a paragraph or more than 3 bullets, move that content to the narration instead.
- Always use the correct aspect ratio when generating images:
  `header-with-image` → `--aspect-ratio 16:9`;
  `two-column-quote-with-image` and `bullets-with-image` → `--aspect-ratio 9:16`.
  Wrong ratio causes unexpected cropping from `object-fit: cover`.
