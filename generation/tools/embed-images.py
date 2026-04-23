"""
embed-images.py — Convert local image/audio paths to base64 data URIs in a JSON video file.

Scans all scene HTML for <img> tags whose src is an absolute local file path and
replaces each src with a data:image/...;base64 URI. Also converts a top-level
"audio" field that holds a local file path to a data:audio/...;base64 URI.
Both changes allow the video player to load assets without browser file-access
restrictions.

USAGE
-----
    python tools/embed-images.py input.json [output.json]

    If output.json is omitted, the file is modified in-place.

EXIT CODES
----------
    0  Success
    1  Input file not found or unreadable
    2  JSON parse error
"""

import base64
import json
import mimetypes
import re
import sys
from pathlib import Path


def path_to_data_uri(src: str) -> str | None:
    """Return a base64 data URI for a local file path, or None if not a local path."""
    # Treat as local if it looks like an absolute path (Windows or Unix) or file:// URI
    is_local = (
        src.startswith("file://")
        or re.match(r"^[A-Za-z]:[/\\]", src)  # Windows absolute: C:\... or C:/...
        or src.startswith("/")                  # Unix absolute
    )
    if not is_local:
        return None

    path = Path(src.removeprefix("file:///").removeprefix("file://"))
    if not path.exists():
        print(f"  WARNING: image not found, skipping: {path}", file=sys.stderr)
        return None

    mime, _ = mimetypes.guess_type(str(path))
    mime = mime or "image/png"
    data = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{data}"


def embed_images_in_html(html: str) -> tuple[str, int]:
    """Replace local img src attributes with data URIs. Returns (new_html, count)."""
    count = 0

    def replace_src(match):
        nonlocal count
        quote = match.group(1)
        src = match.group(2)
        uri = path_to_data_uri(src)
        if uri:
            count += 1
            return f'src={quote}{uri}{quote}'
        return match.group(0)

    result = re.sub(r'src=(["\'])([^"\']+)\1', replace_src, html)
    return result, count


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(0)

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2]) if len(sys.argv) > 2 else input_path

    if not input_path.exists():
        print(f"ERROR: file not found: {input_path}", file=sys.stderr)
        sys.exit(1)

    try:
        data = json.loads(input_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"ERROR: JSON parse error: {e}", file=sys.stderr)
        sys.exit(2)

    total = 0
    for i, scene in enumerate(data.get("scenes", [])):
        html = scene.get("html", "")
        if not html:
            continue
        new_html, count = embed_images_in_html(html)
        if count:
            scene["html"] = new_html
            total += count
            print(f"  Scene {i + 1}: embedded {count} image(s)", file=sys.stderr)

    audio_src = data.get("audio", "")
    if audio_src:
        uri = path_to_data_uri(audio_src)
        if uri:
            data["audio"] = uri
            print(f"  Audio: embedded {Path(audio_src).name}", file=sys.stderr)

    output_path.write_text(json.dumps(data, indent=4, ensure_ascii=False), encoding="utf-8")
    print(f"Done. {total} image(s) embedded -> {output_path}", file=sys.stderr)


if __name__ == "__main__":
    main()
