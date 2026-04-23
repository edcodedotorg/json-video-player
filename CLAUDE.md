# json-video-player

A browser-based "fake video player" that plays structured JSON files instead of real video. Each JSON file describes a sequence of scenes, where each scene is a self-contained HTML document rendered in an iframe. Designed to be LLM-friendly: simple enough for an AI to generate, human-editable, and exportable to MP4 via FFmpeg.js.

## Project Structure

The project has two distinct parts:

### Player (root)
The core video player — do not modify unless working on player features.

- `json-video.js` — `<json-video>` custom web component (playback, captions, audio sync)
- `json-video-styles.js` — player CSS
- `video-exporter.js` — FFmpeg.js-based MP4 export
- `index.html` — editor/player UI (load JSON, edit scenes, preview, export)
- `examples/example.json` — reference example of the JSON video format

### Generation (`generation/`)
Everything needed to author and generate video content. This is the active working area.

```
generation/
├── generate-html-slides-task.md     ← reusable task prompt for generating slides from a script
├── design-templates/
│   ├── design-guide.md              ← color palette, typography, layout principles
│   ├── generation-guide.md          ← when to use which template/approach, sequence handling
│   ├── boilerplate.html             ← copy-paste reference for the required slide boilerplate
│   ├── title-slide.html             ← chapter opener, gradient background
│   ├── code-slide.html              ← dark-themed code block
│   ├── big-quote.html               ← vocabulary term definition (term + one-line definition)
│   ├── header-with-image.html       ← full-bleed image with heading banner at top
│   ├── header-with-svg.html         ← SVG diagram with heading banner at top
│   ├── two-column-quote-with-image.html ← large heading/subheading left, portrait image right
│   ├── bullets-with-image.html      ← heading + 3 large bullets left, portrait image right
│   ├── bullets-with-svg.html        ← heading + 3 large bullets left, SVG diagram right
│   ├── svg-flow.html                ← SVG pattern: horizontal flow/pipeline diagram
│   ├── svg-bar-chart.html           ← SVG pattern: ranked bar chart
│   ├── svg-word-display.html        ← SVG pattern: sentence completion + probability pills
│   └── retired/                     ← superseded templates (do not use for new generation)
│       ├── title-bullets.html
│       ├── two-col-text-image.html
│       └── diagram-slide.html
├── tools/
│   ├── gemini-image-gen.py          ← generates images via Gemini API, prints filepath to stdout
│   ├── embed-images.py              ← converts local image paths → base64 data URIs in a script.json
│   ├── insert-slides.py             ← batch-inserts scene_NN.html files into a script.json
│   └── base64_clean.py              ← strips base64 payloads from a script.json for LLM editing
└── videos/
    └── ai-video-1/
        └── script.json              ← scene scripts with speech, timing, and html fields
```

## JSON Video Format

```json
{
  "width": 1600,
  "height": 900,
  "audio": "data:audio/mpeg;base64,...",
  "scenes": [
    {
      "comment": "Scene description",
      "duration": "8.5s",
      "html": "<complete self-contained HTML document>",
      "speech": "Caption text shown to viewer",
      "elevenlabs": "[tone] narration text"
    }
  ]
}
```

The `html` field is the primary authoring target. It must be a complete, self-contained HTML document.

## Slide Design System

All slides follow a fixed-canvas approach: designed at **1600×900px**, scaled to fit the player via a CSS `transform: scale()` snippet. This means:

- **All sizing in `px`** — no `rem`, `vw`, `vh`, or `%`
- **All colors via CSS custom properties** — `var(--color-teal)`, `var(--color-purple)`, etc. No hardcoded hex values in slide-specific styles
- **No external dependencies** except Google Fonts (Barlow Semi Condensed + Figtree)
- **Every slide includes the same boilerplate** `<style>` and `<script>` block — never modify it

See `generation/design-templates/design-guide.md` for the full color palette, typography scale, and layout principles.

## Generating Slides

**Full guidance is in `generation/design-templates/generation-guide.md`.** Key points:

- There are three visual approaches: text-based HTML templates, AI image generation, and inline SVG
- Always read the full script before assessing individual scenes — connected sequences must be identified and planned as a group before any generation begins
- Use `generation/design-templates/generate-html-slides-task.md` as the task specification when starting a new slide generation session

## Tools

### `generation/tools/gemini-image-gen.py`
Generates a single image from a text prompt using Gemini. Prints the absolute filepath to stdout only — all logging goes to stderr.

```bash
python generation/tools/gemini-image-gen.py "prompt text" --aspect-ratio 16:9
```

Saves to `generation/tools/generated-images/`. Requires `GOOGLE_API_KEY` in `generation/tools/.env`.

### `generation/tools/embed-images.py`
Final production step. Scans a `script.json` for `<img>` tags with local file paths and replaces them with base64 data URIs so the player can load them without browser file-access restrictions.

```bash
python generation/tools/embed-images.py videos/ai-video-1/script.json
# or to a new file:
python generation/tools/embed-images.py input.json output.json
```

### `generation/tools/insert-slides.py`
Batch-inserts individual `scene_NN.html` files into a `script.json`. Reads from a `scenes/` folder alongside the script. Useful when an LLM authors scenes as separate files to avoid JSON escaping issues.

```bash
python generation/tools/insert-slides.py videos/ai-video-1/script.json
```

### `generation/tools/base64_clean.py`
Strips base64 payloads from a `script.json` to make it small enough for an LLM to read and edit. Preserves the data URI prefix so the structure stays intact. Writes a `_cleaned` copy — the original is not modified. Inverse of `embed-images.py`.

```bash
python generation/tools/base64_clean.py videos/ai-video-1/script.json
# → writes videos/ai-video-1/script_cleaned.json
```

Use this before asking an LLM to review or edit a script that has already had images embedded. Re-run `embed-images.py` after editing to restore the payloads.

## Player Development

```bash
npx http-server . --cors -p 4173 \
  --header "Cross-Origin-Opener-Policy: same-origin" \
  --header "Cross-Origin-Embedder-Policy: require-corp"
```

SharedArrayBuffer (required for FFmpeg export) needs the COOP/COEP headers above. VS Code Live Preview also works for basic playback without export.

Tests: `npx playwright test`
