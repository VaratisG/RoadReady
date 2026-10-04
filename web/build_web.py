"""Builds the browser version of RoadReady into docs/app/ (served by GitHub Pages).

Run from the repo root with the project venv:
    .venv\\Scripts\\python.exe web\\build_web.py

docs/app/ is generated: it is a copy of frontend/ plus the question data, a
meta.json derived from desktop/main.py, and the browser API adapter in web/.
Re-run it whenever frontend/, data/ or the category tables in desktop/main.py change.
"""
import importlib.util
import json
import re
import shutil
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Loaded by path (not `import desktop.main`) so the category tables and
# question-file list stay defined in one place, the desktop backend.
_spec = importlib.util.spec_from_file_location("roadready_backend", ROOT / "desktop" / "main.py")
backend = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(backend)

OUT = ROOT / "docs" / "app"


def patch(text, old, new):
    if old not in text:
        raise SystemExit(f"build_web: marker not found in index.html: {old!r}")
    return text.replace(old, new, 1)


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(ROOT / "frontend", OUT)

    data_dir = OUT / "data"
    data_dir.mkdir()
    for vehicle, path in backend.QUESTIONS_PATHS.items():
        questions = json.loads(Path(path).read_text(encoding="utf-8"))
        for q in questions:
            q.pop("explanationVerified", None)
        (data_dir / f"questions_{vehicle}.json").write_text(
            json.dumps(questions, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
        )

    meta = {
        "simulationSize": backend.SIMULATION_SIZE,
        "vehicleLabels": backend.VEHICLE_LABELS,
        "vehicleLabelsEn": backend.VEHICLE_LABELS_EN,
        "categoryIcons": backend.CATEGORY_ICONS,
        "categoryLabelsEn": backend.CATEGORY_LABELS_EN,
    }
    (data_dir / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    shutil.copy(ROOT / "web" / "web-api.js", OUT / "scripts" / "web-api.js")
    shutil.copy(ROOT / "web" / "web.css", OUT / "styles" / "web.css")
    shutil.copy(ROOT / "docs" / "assets" / "favicon.ico", OUT / "assets" / "favicon.ico")

    index = OUT / "index.html"
    html = index.read_text(encoding="utf-8")
    html = patch(html, '<link rel="stylesheet" href="styles/app.css">',
                 '<link rel="icon" href="assets/favicon.ico">\n'
                 '<link rel="stylesheet" href="styles/app.css">\n'
                 '<link rel="stylesheet" href="styles/web.css">')
    html = patch(html, '<script src="scripts/app.js"></script>',
                 '<script src="scripts/web-api.js"></script>\n<script src="scripts/app.js"></script>')
    # GitHub Pages caches assets for ~10 minutes; a fresh query string makes
    # browsers (especially phones) pick up each rebuild immediately.
    build_id = str(int(time.time()))
    html = re.sub(r'((?:href|src)="(?:styles|scripts)/[^"?]+)"', rf'\1?v={build_id}"', html)
    index.write_text(html, encoding="utf-8")

    size_mb = sum(f.stat().st_size for f in OUT.rglob("*") if f.is_file()) / 1e6
    print(f"Built {OUT} ({size_mb:.1f} MB)")


if __name__ == "__main__":
    main()
