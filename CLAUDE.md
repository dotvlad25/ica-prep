# ICA Prep React — LLM Context

> This file provides context for LLMs working on this codebase.
> For human-readable docs, see [README.md](./README.md).

## What This Is

A self-contained study tool for Anthropic's ICA (Internal Coding Assessment). React/TypeScript frontend with a Python FastAPI backend that executes user code in sandboxed subprocesses. Everything runs locally — no auth, no external APIs, no database.

## Architecture Overview

```
Browser (React SPA)
  ├── Vite dev server (port 5173)
  │     └── proxies /api/* → localhost:8000
  └── FastAPI server (port 8000)
        └── subprocess.run(python3, timeout=10s)
```

**Data flow:** Curriculum content is a static JSON file imported at build time. User code is sent to `/api/run` or `/api/test` for execution. Progress and mock session state are persisted to localStorage.

## Directory Map

```
src/
├── main.tsx                 # createRoot entry, renders <App />
├── App.tsx                  # BrowserRouter with 4 routes inside <Layout />
├── index.css                # Tailwind v4 @theme (oklch dark palette), prose styles, keyframes
│
├── components/
│   └── Layout.tsx           # Persistent shell: 260px sidebar + <Outlet />
│                              Sidebar shows day-grouped lessons/exercises with progress icons.
│                              Refreshes via window 'focus' and custom 'ica-progress-updated' event.
│
├── pages/
│   ├── Dashboard.tsx        # Home page: stat cards, countdown to assessment, day cards
│   ├── LessonPage.tsx       # Split-pane: tabbed markdown sections (left) + Monaco editor (right)
│   ├── ExercisePage.tsx     # Mock exercise environment (see "Exercise Page" section below)
│   └── CheatSheetPage.tsx   # Accordion-style collapsible Python reference
│
├── data/
│   ├── types.ts             # TypeScript interfaces: Exercise, ExerciseLevel, Lesson, TestCase, etc.
│   ├── curriculum.ts        # Imports curriculum.json, exports getLesson(), getExercise(), etc.
│   └── curriculum.json      # ~3500-line JSON: 16 lessons, 6 exercises (6 levels each), cheat sheet
│                              Each exercise has implStarterCode (shared), per-level baseClass,
│                              testCases, testFileContent, instructions, hint, solution.
│
└── lib/
    ├── highlight.ts         # highlightPython(): regex tokenizer → colored HTML spans (vs-dark palette)
    │                          mdToHtml(): markdown → HTML with syntax-highlighted code blocks
    │                          Shared by LessonPage and ExercisePage.
    ├── progress.ts          # localStorage persistence for lesson/exercise progress and mock sessions
    │                          Key: 'ica-prep-progress' (lessons + exercise level results)
    │                          Key: 'ica-mock-session-{id}' (per-exercise session state)
    └── runner.ts            # fetch client: POST /api/run (arbitrary code), POST /api/test (test cases)

server/
├── server.py                # FastAPI: /api/run, /api/test, /api/health
│                              Writes code to tempfile, runs via subprocess.run with 10s timeout.
│                              CORS configured for localhost:5173.
└── requirements.txt         # fastapi, uvicorn, pydantic
```

## Routes

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | `Dashboard` | Progress overview, day cards, assessment countdown |
| `/lesson/:lessonId` | `LessonPage` | View lesson content + practice coding |
| `/exercise/:exerciseId` | `ExercisePage` | Mock exercise with timer, file tree, tests |
| `/cheatsheet` | `CheatSheetPage` | Python quick reference |
| `*` | redirect → `/` | Catch-all |

## Exercise Page (Most Complex Component)

The exercise page implements a timed mock assessment environment:

### Session lifecycle
1. **Pre-session**: UI visible but Run Tests disabled. Yellow warning banner shown.
2. **Active session**: 90-minute countdown, Run Tests enabled, timer in header.
3. **Completed**: Timer stopped, "✓ Completed" badge, tests still viewable.

### Layout structure
```
┌─ Header: [← Dashboard / Title]  [Timer ██░░]  [Cheat Sheet] [Start/Finish] ─┐
├─ Warning banner (pre-session only) ──────────────────────────────────────────┤
├─ Level tabs: [✓ L1] [🔓 L2] [🔒 L3] ... ───────────────────────────────────┤
├─ Instructions (360px) │ File tree (176px) │ Editor (flex) ───────────────────┤
│  - Level badge         │ solution.py       │ Monaco (python, vs-dark)        │
│  - Markdown body       │ base_class.py     │                                 │
│  - Hint toggle         │ test_level_N.py   ├─────────────────────────────────┤
│  - Solution toggle     │                   │ Terminal (200px / 36px)         │
│  - Pass actions        │                   │ test results, pass/fail        │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Key behaviors
- **Level unlock**: L1 always unlocked. Pass all tests → next level unlocks. Passed tabs show ✓ and are non-clickable.
- **Solution gate**: Locked until 3 failed attempts on that level, or level already passed.
- **File tree**: Shows `solution.py` (editable), `base_class.py` (read-only, per-level), `test_level_N.py` (read-only, only for unlocked levels).
- **Monaco key prop**: Editor uses `key={selectedFile-activeLevel}` to force remount on file/level switch (Monaco doesn't reliably sync controlled `value`).
- **Timer colors**: neutral (>15 min), amber (≤15 min), red (≤5 min).

### State persistence (MockSession in localStorage)
```typescript
interface MockSession {
  exerciseId: string;
  sessionStartTime: number | null;
  secondsLeft: number;
  sessionCompleted: boolean;
  failCounts: Record<number, number>;
  code: string;
  levelPassedAt: Record<number, number>;
}
```
An `initialized` ref guard prevents the persist effect from saving empty state before the init effect runs.

## Data Model

### Exercise (from curriculum.json)
```typescript
interface Exercise {
  id: string;                  // e.g. "ex-inmemory-db"
  title: string;
  subtitle?: string;
  archetype?: string;          // e.g. "OOP Design"
  totalLevels?: number;        // always 6
  implStarterCode?: string;    // seeds solution.py (shared across all levels)
  levels: ExerciseLevel[];
}
```

### ExerciseLevel
```typescript
interface ExerciseLevel {
  level: number;               // 1–6
  title: string;
  description: string;
  instructions: string;        // markdown for instructions panel
  requirements: string[];
  baseClass: string;           // seeds base_class.py (varies per level)
  starterCode: string;         // per-level starter (implStarterCode used instead)
  testCases: TestCase[];
  testFileContent?: string;    // seeds test_level_N.py (read-only)
  hint?: string;
  solution?: string;
  timeGuidanceMinutes?: number;
}
```

### Test execution model
```
full_code = level.baseClass + "\n\n" + user_code + "\n\n" + testCase.input
→ run as Python subprocess
→ compare stdout.strip() == expectedOutput.strip()
```

## Styling Patterns

- **Theme**: Tailwind CSS v4 `@theme` directive with oklch color space. Dark palette.
- **Components**: Inline `style` objects exclusively. No CSS modules, no utility classes on JSX.
- **CSS variables used everywhere**: `--color-bg`, `--color-surface`, `--color-accent`, `--color-green`, `--color-red`, `--color-yellow`, `--color-muted`, `--color-border`, `--color-text`, plus `-dim` variants.
- **Fonts**: Inter (sans), JetBrains Mono (mono).
- **`clsx` and `tailwind-merge`**: declared as dependencies but currently unused.

## Cross-Component Communication

- No state management library. Local `useState` only.
- **Custom DOM event**: `window.dispatchEvent(new Event('ica-progress-updated'))` — fired after any progress change. Layout listens and refreshes sidebar.
- **Outlet context**: Layout passes `{ refreshProgress }` to child pages via React Router's outlet context.

## Python Syntax Highlighting

`src/lib/highlight.ts` provides a regex-based tokenizer that produces colored HTML spans matching the vs-dark theme. Used for:
- Code blocks in markdown content (via `mdToHtml`)
- `codeExample` blocks in lesson sections
- Not used for Monaco editor (Monaco has its own highlighting)

## Build & Dev

| Command | What it does |
|---------|-------------|
| `./start.sh` | Creates venv (auto-detects Python 3.9+), installs deps, starts both servers |
| `pnpm dev` | Vite dev server on 5173 (proxies /api → 8000) |
| `pnpm build` | `tsc -b` + Vite production build |
| `pnpm lint` | oxlint (Rust-based, replaces ESLint) |

## Known Limitations

- No frontend tests (no Vitest/Jest setup)
- AI Review feature omitted (would need Anthropic API key)
- Monaco `@monaco-editor/react` loads editor from CDN on first use (only external network call)
- Python server has no auth and no sandboxing beyond subprocess timeout
- `start.sh` is macOS/Linux only; Windows needs manual setup
