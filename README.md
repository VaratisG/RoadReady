# RoadReady

An offline, Greek-language driving theory quiz app for Windows, covering both
car (Category B) and motorcycle/truck/bus/professional-certificate licenses.
Built as a single self-contained `.exe` — no internet connection, no
installer, nothing to configure.

## Features

- **Five license categories**: Αυτοκίνητο (car), Μοτοσικλέτα (motorcycle),
  Φορτηγό (truck), Λεωφορείο (bus), and ΠΕΙ Φορτηγό (truck driver
  professional-competence certificate) — 1,800+ real theory questions across
  all of them, each with real sign/diagram images and category icons.
- **Exam simulation** with configurable question count (20/30/40), an
  optional countdown timer, and a choice between immediate answer feedback
  or a full review at the end.
- **Progress tracking** — every completed quiz is saved to a local SQLite
  database, with a summary screen showing your overall average, per-vehicle
  breakdown, and recent attempt history. Persists across restarts.
- **Light/dark theme** (or follow the system setting), with the native
  Windows title bar recoloring to match.
- **Adjustable text size** via a zoom slider in Settings.
- Paginated section menus, a frosted-glass header/footer, and a themed
  background pattern.

## Tech stack

- **Python** + [pywebview](https://pywebview.flowrl.com/) (Windows backend:
  WinForms + WebView2) for the desktop shell.
- Plain **HTML / CSS / JavaScript** for the UI — no framework, no build step.
- **SQLite** (stdlib `sqlite3`) for local progress history.
- **PyInstaller** to package everything into a single `.exe`.

## Project structure

```
app/                  Python backend (pywebview entry point + Api class)
  main.py             Window setup, question/history API, title-bar theming
  data/                *.seed.json question banks, one per vehicle
frontend/             The web UI loaded into the pywebview window
  index.html
  scripts/app.js       All UI logic (screens, quiz flow, settings, progress)
  styles/              app.css, tokens.css (design tokens / theme variables)
  assets/              icons, sign images, background art, brand logo
design/                Source design assets (app icon, background pattern
                       originals) before they were processed into frontend/
docs/                  Project planning notes and an early static HTML mockup
RoadReady.spec         PyInstaller build spec
run-dev.bat            Launches the app from source (no build step)
```

## Running it

Requires Python 3 and a virtual environment with the dependencies installed:

```bash
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
```

Then either double-click `run-dev.bat`, or:

```bash
.venv\Scripts\python app\main.py
```

## Building the `.exe`

```bash
.venv\Scripts\pip install -r requirements-build.txt
.venv\Scripts\pyinstaller RoadReady.spec
```

The finished executable is written to `dist/RoadReady.exe` — a single file,
nothing else needed to run it on another Windows machine.

## Data source

Question content, sign images, and category icons were originally sourced
from a Greek driving-theory practice website. The tooling used to gather that
content isn't part of this repo — only the resulting `app/data/*.seed.json`
question banks are included.

## Notes

- Windows-only: the title-bar theming and window chrome use Windows-specific
  APIs (DWM, WinForms), so this won't run as-is on macOS/Linux.
- No license file is included yet — add one if you plan to publish this
  publicly, and double-check the terms around the scraped question content
  before distributing it further.
