# ICA Prep — Python Coding Assessment Study Tool

A self-contained, offline-capable study tool for preparing for the Python ICA — the [**CodeSignal Industry Coding Assessment**](https://codesignal.com/) (also called the Industry Coding Framework): a timed, multi-level OOP system-building exam. Practice assessment-style problems in an in-browser environment with an embedded Monaco code editor and a local Python execution sandbox.

> Built as a React + FastAPI app, but the subject you practice is **Python** — this is a Python interview-prep tool, not a React tutorial.

> ⚠️ **Unofficial & not affiliated.** This is a personal project I built to help myself prepare — it is **not an official preparation guide** and is **not affiliated with, endorsed by, or sponsored by CodeSignal**. All problems are original, invented examples. Please read the full [**Disclaimer**](#disclaimer) before using.

![Python](https://img.shields.io/badge/Practice-Python-3776AB?logo=python)
![React](https://img.shields.io/badge/Built%20with-React%2019-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)

---

## Features

- **16 Python lessons** across 2 days — syntax, OOP, data structures, system-building patterns
- **6 mock exercises** with 6 progressive levels each (36 Python coding challenges total)
- **Timed mock sessions** — 90-minute countdown with visual progress bar
- **Monaco editor** with Python syntax highlighting
- **Local Python test runner** — code executes via a FastAPI subprocess sandbox
- **Level unlock system** — pass Level N to unlock Level N+1
- **File tree navigation** — switch between `solution.py`, `base_class.py`, and test files
- **Cheat sheet overlay** — quick Python reference accessible during exercises
- **Progress persistence** — saved in browser localStorage, survives refreshes
- **Fully offline** — no internet required after initial install

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Python | 3.9+ (3.11+ recommended) | `python3 --version` |
| Node.js | 18+ | `node --version` |
| pnpm | 9+ | `pnpm --version` |

> **Don't have pnpm?** Install it with `npm install -g pnpm`.

## Quick Start

### macOS / Linux

```bash
chmod +x start.sh
./start.sh
```

This single command:
1. Finds a compatible Python (3.9+), creates a virtual environment
2. Installs Python dependencies (FastAPI, uvicorn)
3. Installs Node dependencies via pnpm
4. Starts the Python execution server (port 8000)
5. Starts the Vite dev server (port 5173)

Open **http://localhost:5173** and start learning.

Press **Ctrl+C** to stop both servers.

### Windows

Open two terminals in the project directory:

**Terminal 1 — Python server:**
```powershell
cd server
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python server.py
```

**Terminal 2 — React app:**
```powershell
pnpm install
pnpm dev
```

Open **http://localhost:5173**.

### Manual Setup (any OS)

```bash
# 1. Python server
cd server
python3 -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python3 server.py &

# 2. React app
cd ..
pnpm install
pnpm dev
```

## Curriculum

### Day 1 — Python Syntax & OOP Refresher
| Lesson | Topic |
|--------|-------|
| Classes & OOP | Inheritance, dunder methods, properties |
| Dicts & Counters | `defaultdict`, `Counter`, dict operations |
| Comprehensions | List/dict comprehensions, generator expressions |
| Deque & Heapq | `deque`, `heapq`, sorted structures |
| Dataclasses | `@dataclass`, type hints, frozen classes |
| Sorting & Lambdas | `sorted()`, `lambda`, `map/filter/reduce` |

### Day 2 — System-Building Patterns
| Lesson | Topic |
|--------|-------|
| OOP System Design | Class hierarchies for ICA problems |
| State & Transactions | Undo/redo, rollback patterns |
| TTL & Time Logic | Expiry, scheduling, time-based eviction |
| Extensibility | Strategy, observer, plugin patterns |
| Common ICA Patterns | Frequently tested system archetypes |
| Archetypes (×4) | File system, rate limiter, task scheduler, file cache |
| Threading & Locks | `threading.Lock`, `RLock`, thread-safe collections |

### Day 3 — Mock Assessments · Core Archetypes (3 exercises × 6 levels)
| Exercise | Levels cover |
|----------|-------------|
| In-Memory Database | CRUD → prefix scan → TTL → transactions → threading → persistence |
| Banking System | Accounts → transfers → ranking → cashback → concurrency → interest |
| File Cache | Basic cache → eviction → byte limits → statistics → thread-safe → multi-tier |

### Day 4 — Mock Assessments · Advanced Archetypes (3 exercises × 6 levels)
| Exercise | Levels cover |
|----------|-------------|
| File System | Files/dirs → metadata → move/copy → permissions → symlinks → quotas |
| Rate Limiter | Fixed window → sliding window → per-user → burst/penalty → token bucket → adaptive |
| Task Scheduler | Queue → delayed → run-all-due → recurring → dependency DAG → worker pool |

> Each mock is a 90-minute timed session, so ~3 fit in a focused day. The goal per mock is **Levels 1–4 in 90 min** (real ICA scope); Levels 5–6 are bonus extension practice.

## Mock Session Mode

Exercises feature a timed mock session that simulates ICA conditions:

1. Click **Start Session** to begin the 90-minute countdown
2. Write your solution in `solution.py`
3. Click **Run Tests** to validate against test cases
4. Pass all tests to unlock the next level
5. Click **Finish** when done (or let the timer expire)

The session tracks:
- ⏱ Timer with color-coded warnings (amber ≤15 min, red ≤5 min)
- 📊 Fail count per level (solution unlocks after 3 failed attempts)
- 💾 Auto-saves code and progress to localStorage

## Project Structure

```
├── src/
│   ├── main.tsx                # React entry point
│   ├── App.tsx                 # Router (4 routes)
│   ├── index.css               # Tailwind v4 theme (oklch dark palette)
│   ├── components/
│   │   └── Layout.tsx          # Sidebar + outlet shell
│   ├── pages/
│   │   ├── Dashboard.tsx       # Progress overview
│   │   ├── LessonPage.tsx      # Lesson viewer + practice editor
│   │   ├── ExercisePage.tsx    # Mock exercise environment
│   │   └── CheatSheetPage.tsx  # Python reference
│   ├── data/
│   │   ├── curriculum.json     # All content (lessons + exercises)
│   │   ├── curriculum.ts       # Data access helpers
│   │   └── types.ts            # TypeScript interfaces
│   └── lib/
│       ├── highlight.ts        # Python syntax highlighter + markdown renderer
│       ├── progress.ts         # localStorage persistence
│       └── runner.ts           # Python execution API client
├── server/
│   ├── server.py               # FastAPI code execution sandbox
│   └── requirements.txt        # Python dependencies
├── start.sh                    # One-command launcher
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `./start.sh` | Start both servers (recommended) |
| `pnpm dev` | Vite dev server only (port 5173) |
| `pnpm build` | Type-check + production build |
| `pnpm preview` | Serve the production build |
| `pnpm lint` | Run oxlint |

## Resetting Progress

**Reset all progress:**
Open DevTools → Application → Local Storage → delete `ica-prep-progress`.

**Reset a mock session:**
Delete the `ica-mock-session-{exercise-id}` key (e.g., `ica-mock-session-ex-inmemory-db`).

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `bad interpreter` error | Delete `server/.venv/` and re-run `./start.sh` |
| `list[X]` type error | Your Python is too old. Need 3.9+. `start.sh` auto-detects 3.9+ |
| pnpm won't start | Check `node --version` matches pnpm requirements |
| Port 5173 in use | Vite auto-picks the next port. Check terminal output |
| Port 8000 in use | Kill the old server: `lsof -ti:8000 \| xargs kill` |
| Tests fail to connect | Ensure the Python server is running on port 8000 |

## Tech Stack

- **Frontend:** React 19, TypeScript 6, Vite 8
- **Editor:** Monaco Editor (`@monaco-editor/react`)
- **Styling:** Tailwind CSS v4 (theme layer) + inline styles
- **Icons:** Lucide React
- **Routing:** React Router v7
- **Backend:** FastAPI + uvicorn (Python subprocess sandbox)
- **Linter:** oxlint

## Not Included

- **AI Code Review** — requires an LLM API key; available only in the hosted version

## Disclaimer

**Please read this section carefully.**

### Not affiliated with CodeSignal
This is an independent, unofficial, personal project. It is **not affiliated with, endorsed by, sponsored by, or connected to CodeSignal** in any way. "CodeSignal," "Industry Coding Assessment," and "Industry Coding Framework" are trademarks of their respective owner and are referenced here **only nominatively** — to describe the general type of assessment this tool is meant to help someone practice for. No claim of ownership over those marks is made or implied.

### Not an official preparation guide
This is **not an official study guide, and not authoritative**. It is simply an app I built to help *myself* prepare for the ICA, shared as-is. It does not reflect how any real assessment is scored, structured, or administered, and using it does not guarantee any particular result on an actual assessment.

### All content is original and invented
Every lesson, exercise, prompt, base class, test case, hint, and solution in this repository is **original content that I wrote from scratch**. None of it is copied, scraped, transcribed, or otherwise derived from any real CodeSignal assessment or from CodeSignal's proprietary content. The problems are **invented practice examples** modeled loosely on common, publicly-known system-design *archetypes* (in-memory database, cache, file system, rate limiter, etc.) — ideas and formats that are general programming concepts, not anyone's protected content.

**Any resemblance to actual assessment questions is purely coincidental and unintentional.** I have no knowledge of, and have not reproduced, the specific contents of any live CodeSignal assessment.

### No warranty
This software and its content are provided **"AS IS", without warranty of any kind**, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, accuracy, or non-infringement. The code executes user-submitted Python locally with limited sandboxing (a subprocess timeout only) — run it only on your own machine and at your own risk. In no event shall the author be liable for any claim, damages, or other liability arising from the use of this software.

### Respect the real assessment's rules
If you take an actual CodeSignal assessment, **follow that assessment's own rules and terms.** This tool is for building general Python and system-design skills beforehand — not for use during a live, proctored assessment. For the official assessment and preparation guidance, visit [codesignal.com](https://codesignal.com/).

### Contact
If you are a rights holder and believe anything here is inappropriate, open an issue on this repository and I will address it promptly.

## License

Licensed under the [PolyForm Noncommercial License 1.0.0](./LICENSE.md).

In plain terms: you are free to use, copy, modify, and share this project for **any noncommercial purpose** — including your own interview preparation, studying, and personal or educational use. **Commercial use is not permitted** — for example, you may not sell it, or host/offer it as a paid service. See [`LICENSE.md`](./LICENSE.md) for the full terms. The software is provided **as is, without warranty and without liability** (see the Disclaimer above).
