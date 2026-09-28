# DriveQuiz — desktop quiz app for a driving license school

A Duolingo-style quiz app, built as a native desktop app, that a driving school can use to
drill students on traffic signs and rules of the road. Questions pair a reference photo/illustration
with 1–4 multiple-choice answers, instant feedback, and a lightweight progress system.

This plan captures the direction already prototyped in `drivequiz-preview.html` (a
self-contained HTML mock built to test the flow and visual style) so a build in Claude Code
starts from a settled design instead of a blank page.

---

## 1. Goals

- Offline-first desktop app (Windows + Mac) students can use on school computers or their own laptop.
- Quiz format: one question at a time, a reference photo/sign illustration, 1–4 answers, immediate
  right/wrong feedback with a short explanation.
- Lightweight motivation loop: a streak counter and a 3-attempt "fuel gauge" per quiz run, not a
  full gamification system.
- Content (questions, images, answers) must be easy for non-developers at the school to add or edit
  later, without touching code.
- Local-only for v1. Multi-student / instructor-visible progress is an explicit v2 decision, not
  baked into the architecture from day one (see §7).

## 2. Reference prototype

`drivequiz-preview.html` is a working, click-through HTML mock of the intended UI and interaction
flow (vanilla HTML/CSS/JS, no build step). Open it in a browser as the visual/UX reference while
building — it is the source of truth for spacing, copy, states, and motion described below, not
just a mood board.

## 3. Design direction

**Theme:** road / traffic, not a generic "app UI." Leans into the subject matter instead of a
generic card-kit look.

**Color tokens** (light mode → dark mode):

| Role | Light | Dark |
|---|---|---|
| Background | `#F0EFEA` | `#15171A` |
| Card surface | `#FFFFFF` | `#21252A` |
| Ink (primary text) | `#23262B` | `#F1F1ED` |
| Ink soft (secondary text) | `#5A5F66` | `#A7ACB2` |
| Border | `#E1DFD8` | `#33383F` |
| Lane yellow (accent/primary) | `#F5A623` | `#FFC12E` |
| Go green (correct) | `#1E9E5A` | `#35C17E` |
| Stop red (incorrect) | `#D93A3A` | `#FF6363` |
| Sky blue (info accent) | `#2E6FA5` | `#6FA8DA` |

Both modes should be supported via `prefers-color-scheme`; don't hardcode light-only colors.

**Typography:** `Baloo 2` (rounded, chunky — used for headings, buttons, the streak/score numbers)
paired with `Manrope` (body text, answer options). Two families, clearly distinct weights, no third
typeface.

**Layout concept:** content lives in a single centered "app frame" (max width ~480px) with a fake
desktop window titlebar (three dots — literally styled as a red/yellow/green traffic light, tying
back to the theme). Inside: a topbar (logo + streak chip + fuel gauge), a dashed "road" progress
bar with a small car icon that slides along it as questions advance, a question card with a framed
sign illustration, a 2-column grid of answer buttons, an inline feedback panel, and a primary
"Continue" button pinned to the bottom.

**Motion:** kept to one deliberate moment — the progress car sliding smoothly to its new position
between questions — plus small button press feedback. No decorative hover animations elsewhere.

**Iconography:** no emoji, no stock icon set. Traffic signs are drawn as flat inline SVGs (stop
octagon, yield triangle, speed-limit circle, no-entry circle, roundabout circle, pedestrian warning
triangle) using real sign colors (sign colors are fixed/universal — red, white, blue — independent
of the light/dark theme tokens above).

## 4. Screens & states

1. **Start screen** — small road/car illustration, title, one-line description, three stat chips
   (question count / attempts / est. time), primary "Start quiz" button.
2. **Quiz screen** (repeats per question)
   - Road progress bar (fills + car marker advances based on `currentIndex / totalQuestions`).
   - Question card: category label, framed photo/illustration, question text.
   - Answer grid: up to 4 buttons. On selection: buttons disable, correct answer highlights green,
     wrong selection (if any) highlights red, explanation text appears, "Continue" enables.
   - Streak increments on correct, resets to 0 on incorrect. Fuel gauge loses one cell on incorrect.
3. **Out-of-attempts screen** — shown if the fuel gauge hits zero mid-quiz. Short message + "Try
   again" (full reset).
4. **Results screen** — score (`x / total`), a message that scales with performance, a list of any
   missed questions (or a "clean sheet" message if none), "Retake quiz" button.

## 5. Content data model

Each question needs:

```
id              string, unique
category        string   (e.g. "Regulatory sign", "Warning sign", "Priority sign")
question        string
image           string   (path to a local image file, or an id mapping to a bundled illustration)
answers         string[] (length 1–4)
correctIndex    integer  (0-based index into answers)
explanation     string   (shown after answering, both correct and incorrect)
```

Suggested SQLite schema (local file, bundled with the app):

```sql
CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  image_path TEXT NOT NULL,
  answers TEXT NOT NULL,       -- JSON array, 1-4 strings
  correct_index INTEGER NOT NULL,
  explanation TEXT NOT NULL
);

CREATE TABLE attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id TEXT NOT NULL REFERENCES questions(id),
  was_correct INTEGER NOT NULL,   -- 0/1
  answered_at TEXT NOT NULL       -- ISO timestamp
);
```

`attempts` is what lets you later surface "questions this student keeps missing" without adding
any networked infrastructure — it's just a local log.

## 6. Tech stack

| Layer | Choice | Why |
|---|---|---|
| App shell | **Tauri** | Native webview instead of bundled Chromium → installers in the low single-digit MBs instead of 100MB+, much lower RAM use. Backend logic in Rust. |
| Frontend | **React** + plain CSS (the tokens above as CSS variables) | Matches the component structure of the prototype (screens as components, answer buttons as a list, etc.). Vue works equally well if preferred. |
| Local data | **SQLite** via Tauri's SQL plugin | Stores questions + local attempt history; no server needed. |
| Images | Bundled local files under `src/assets/signs/`, referenced by `image_path` | No image hosting needed for v1. |
| Packaging | Tauri bundler | Produces `.msi`/`.exe` (Windows) and `.dmg`/`.app` (Mac) from one config. |

*(If Rust/Tauri turns out to be a blocker for whoever maintains this, Electron + the same
React/SQLite stack is a drop-in fallback — heavier installer and RAM footprint, but pure
JavaScript.)*

## 7. Open decision: does the school need cross-device progress?

Everything above is local-only by design. If the school later wants an instructor to see progress
across multiple school computers (e.g. "which students are weak on right-of-way questions"), that
requires a small backend (Node/Express or a hosted service like Supabase) plus per-student login.
Don't build this speculatively — it's a clean v2 addition on top of the `attempts` table structure
above, not a v1 requirement.

## 8. Suggested project structure

```
drivequiz/
├── src/
│   ├── components/
│   │   ├── StartScreen.tsx
│   │   ├── QuizScreen.tsx
│   │   ├── OutOfAttemptsScreen.tsx
│   │   ├── ResultsScreen.tsx
│   │   ├── SignIllustration.tsx     # renders the SVG per question.image
│   │   ├── AnswerGrid.tsx
│   │   └── RoadProgress.tsx
│   ├── data/
│   │   └── questions.seed.json      # starter content before wiring SQLite
│   ├── styles/
│   │   └── tokens.css               # color/type variables from §3
│   ├── assets/signs/                # bundled sign images/illustrations
│   └── App.tsx
├── src-tauri/
│   ├── src/main.rs
│   └── tauri.conf.json
└── package.json
```

## 9. Build phases

1. **Scaffold** — `npm create tauri-app@latest`, React + TypeScript template. Get an empty window
   building and running on both target platforms early.
2. **Static quiz engine** — port the prototype's screens/state machine into React components,
   backed by `questions.seed.json` (no database yet). Goal: the exact flow from
   `drivequiz-preview.html`, running natively.
3. **Persistence** — wire up SQLite: load `questions` from the DB instead of the JSON seed, write
   each answer to `attempts`.
4. **Content workflow** — decide how the school will actually add questions (a small in-app editor
   screen, vs. hand-editing the seed JSON/DB — start with the JSON approach and only build an editor
   UI if the school will genuinely maintain content themselves).
5. **Packaging** — configure `tauri.conf.json` (app name, icon, identifier), produce signed builds
   for Windows and Mac.

## 10. Starter content

Six sample questions already exist in the prototype (stop sign, yield, speed limit, no entry,
roundabout, pedestrian crossing) and can seed `questions.seed.json` directly — see the `SIGNS` and
`QUESTIONS` objects in `drivequiz-preview.html`.
