"""Run this next to index.html whenever you add or change files in Data/.

    python make_data.py

It packs every Data/*.txt into Data/data.js so index.html can load them
even when opened straight from disk (file://).
"""
import json
from pathlib import Path

root = Path(__file__).parent
data = root / "Data"
items = [
    {"name": f.name, "text": f.read_text(encoding="utf-8", errors="ignore")}
    for f in sorted(data.glob("*.txt"))
]
(data / "data.js").write_text(
    "window.DATA_TEXTS = " + json.dumps(items, ensure_ascii=False) + ";\n",
    encoding="utf-8",
)
print(f"Packed {len(items)} text file(s) into Data/data.js")