"""
base64_clean.py — Strip base64 payloads from a script.json to make it LLM-readable.

Large script.json files often contain base64-encoded images and audio embedded directly
in the JSON (as data URIs). These payloads can be hundreds of kilobytes each, making the
file too large for an LLM to read or edit. This tool strips the base64 data while
preserving the data URI prefix, so the file remains valid JSON and its structure stays
intact — but is small enough to work with.

This is the inverse of embed-images.py:
  embed-images.py   →  local file paths → base64 data URIs   (production step)
  base64_clean.py   →  base64 data URIs → empty prefix only  (drafting/editing step)

USAGE
-----
    python tools/base64_clean.py <path/to/script.json>

    If no argument is given, the script prompts for a file path interactively.

OUTPUT
------
    Writes a new file alongside the input with "_cleaned" appended before the extension:
        script.json  →  script_cleaned.json

    The original file is NOT modified.

WHAT IS STRIPPED
----------------
    - <img src="data:image/png;base64,<data>">  →  <img src="data:image/png;base64,">
    - "data:audio/mpeg;base64,<data>"           →  "data:audio/mpeg;base64,"

    The data URI prefix is preserved so the file can still be parsed as a JSON video
    and identified as containing embedded media — just without the bulky payload.

WHEN TO USE
-----------
    Use this before asking an LLM to read, review, or edit a script.json that has
    already been through the embed-images.py production step. After the LLM finishes
    editing, re-run embed-images.py to restore the base64 payloads before playback.
"""

import re
import os
import sys

def clean_file_once(input_path):
    file_name, file_ext = os.path.splitext(input_path)
    output_path = f"{file_name}_cleaned{file_ext}"

    # REFINED REGEX: 
    # Added [^"'>\\\s] to ensure it stops at single quotes and closing brackets.
    image_pattern = r'(<img\s+src=\\?"data:image/png;(?:base64,)?)[^"\'<>\\\s]+'
    audio_pattern = r'("data:audio/mpeg;(?:base64,)?)[^"\'<>\\\s]+'
    
    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # re.subn handles the ENTIRE file in one call
        content, img_count = re.subn(image_pattern, r'\1', content)
        content, aud_count = re.subn(audio_pattern, r'\1', content)

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"Summary:")
        print(f" - Found and cleaned {img_count} image strings.")
        print(f" - Found and cleaned {aud_count} audio strings.")
        print(f"\nSaved to: {output_path}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else input("File path: ").strip('"')
    clean_file_once(target)