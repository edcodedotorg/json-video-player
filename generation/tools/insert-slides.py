"""
insert-slides.py — Batch-insert scene HTML files into a script.json

Reads scene_01.html, scene_02.html, … from a scenes/ folder next to the script
and inserts each file's content into the corresponding "html" field in the JSON.

USAGE
-----
    python tools/insert-slides.py videos/ai-video-1/script.json

SCENE FILE NAMING
-----------------
    scenes/scene_01.html   → scenes[0]["html"]
    scenes/scene_02.html   → scenes[1]["html"]
    ...

    Files are 1-indexed, zero-padded to 2 digits.
    The scenes/ folder must be a sibling of the script.json file.

BEHAVIOR
--------
    - Missing scene files produce a warning; the existing "html" value is left untouched.
    - Scene files whose index exceeds the number of scenes in the JSON produce an error.
    - The JSON is saved back in-place after all insertions.

EXIT CODES
----------
    0   Success (warnings are non-fatal)
    1   Fatal error (JSON parse failure, out-of-range scene index, file I/O error)
"""

import json
import os
import sys


def main():
    if len(sys.argv) < 2:
        print("Usage: python tools/insert-slides.py <path/to/script.json>", file=sys.stderr)
        sys.exit(1)

    script_path = os.path.abspath(sys.argv[1])

    if not os.path.isfile(script_path):
        print(f"ERROR: script not found: {script_path}", file=sys.stderr)
        sys.exit(1)

    # Load the JSON
    try:
        with open(script_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"ERROR: could not parse JSON: {e}", file=sys.stderr)
        sys.exit(1)

    scenes = data.get("scenes", [])
    if not scenes:
        print("ERROR: no scenes found in script JSON", file=sys.stderr)
        sys.exit(1)

    scenes_dir = os.path.join(os.path.dirname(script_path), "scenes")
    total = len(scenes)
    inserted = 0
    skipped = 0

    for i in range(total):
        scene_num = i + 1
        filename = f"scene_{scene_num:02d}.html"
        filepath = os.path.join(scenes_dir, filename)

        if not os.path.isfile(filepath):
            print(f"Scene {scene_num:02d}: SKIPPED  (no file found at scenes/{filename})")
            skipped += 1
            continue

        try:
            with open(filepath, "r", encoding="utf-8") as f:
                html = f.read()
        except OSError as e:
            print(f"ERROR: could not read {filepath}: {e}", file=sys.stderr)
            sys.exit(1)

        if not html.strip():
            print(f"Scene {scene_num:02d}: SKIPPED  (file is empty)")
            skipped += 1
            continue

        scenes[i]["html"] = html
        print(f"Scene {scene_num:02d}: inserted ({len(html):,} chars)")
        inserted += 1

    # Save back in-place
    try:
        with open(script_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except OSError as e:
        print(f"ERROR: could not write script: {e}", file=sys.stderr)
        sys.exit(1)

    print(f"\nDone — {inserted} inserted, {skipped} skipped of {total} scenes.")


if __name__ == "__main__":
    main()
