/**
 * Progress persistence via localStorage.
 * No server, no auth — everything stored locally in the browser.
 */

const KEY = 'ica-prep-progress';

export interface LevelResult {
  level: number;
  passed: boolean;
  code: string;
  testsPassed: number;
  testsTotal: number;
  submittedAt: string;
}

export interface Progress {
  completedLessons: Record<string, { completedAt: string; timeSpentSec: number }>;
  exercises: Record<string, {
    highestLevel: number;
    levelResults: LevelResult[];
    startedAt: string;
    completedAt?: string;
  }>;
}

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Progress;
  } catch {
    // ignore
  }
  return { completedLessons: {}, exercises: {} };
}

function save(p: Progress): void {
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function getProgress(): Progress {
  return load();
}

export function markLessonComplete(lessonId: string, timeSpentSec = 0): void {
  const p = load();
  p.completedLessons[lessonId] = {
    completedAt: new Date().toISOString(),
    timeSpentSec,
  };
  save(p);
}

export function unmarkLesson(lessonId: string): void {
  const p = load();
  delete p.completedLessons[lessonId];
  save(p);
}

export function saveLevelResult(
  exerciseId: string,
  level: number,
  passed: boolean,
  code: string,
  testsPassed: number,
  testsTotal: number,
): void {
  const p = load();
  if (!p.exercises[exerciseId]) {
    p.exercises[exerciseId] = {
      highestLevel: 1,
      levelResults: [],
      startedAt: new Date().toISOString(),
    };
  }
  const ex = p.exercises[exerciseId];
  // upsert this level
  ex.levelResults = ex.levelResults.filter(r => r.level !== level);
  ex.levelResults.push({ level, passed, code, testsPassed, testsTotal, submittedAt: new Date().toISOString() });
  if (passed) {
    ex.highestLevel = Math.max(ex.highestLevel, level);
  }
  save(p);
}

export function resetProgress(): void {
  localStorage.removeItem(KEY);
}

// ---------------------------------------------------------------------------
// Mock session persistence (kept separate from exercise progress)
// ---------------------------------------------------------------------------

export interface MockSession {
  exerciseId: string;
  sessionStartTime: number | null;  // Date.now() when started
  secondsLeft: number;              // starts at 5400
  sessionCompleted: boolean;
  failCounts: Record<number, number>; // level -> fail count
  code: string;                      // shared code across all levels
  levelPassedAt: Record<number, number>; // level -> timestamp
}

function mockSessionKey(exerciseId: string): string {
  return `ica-mock-session-${exerciseId}`;
}

export function getMockSession(exerciseId: string): MockSession | null {
  try {
    const raw = localStorage.getItem(mockSessionKey(exerciseId));
    if (raw) return JSON.parse(raw) as MockSession;
  } catch {
    // ignore
  }
  return null;
}

export function saveMockSession(session: MockSession): void {
  localStorage.setItem(mockSessionKey(session.exerciseId), JSON.stringify(session));
}

export function clearMockSession(exerciseId: string): void {
  localStorage.removeItem(mockSessionKey(exerciseId));
}
