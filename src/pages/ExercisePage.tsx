import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { getExercise } from '@/data/curriculum';
import { cheatSheet } from '@/data/curriculum';
import { getProgress, saveLevelResult, getMockSession, saveMockSession } from '@/lib/progress';
import { runTests } from '@/lib/runner';
import type { TestResult } from '@/lib/runner';
import type { MockSession } from '@/lib/progress';
import {
  ArrowLeft, Play, RotateCcw, Lightbulb, Eye, EyeOff,
  CheckCircle2, Lock, Unlock, ChevronDown, ChevronRight,
  Clock, X, BookOpen, Square, FileCode, FileText as FileTextIcon,
  SkipForward,
} from 'lucide-react';
import { mdToHtml } from '@/lib/highlight';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function timerColor(secs: number): string {
  if (secs <= 300) return 'var(--color-red)';
  if (secs <= 900) return 'var(--color-yellow)';
  return 'var(--color-muted)';
}

function timerBorderColor(secs: number): string {
  if (secs <= 300) return 'var(--color-red)';
  if (secs <= 900) return 'var(--color-yellow)';
  return 'var(--color-border)';
}

function progressBarColor(secs: number): string {
  if (secs <= 300) return 'var(--color-red)';
  return 'var(--color-accent)';
}

function btnStyle(variant: 'primary' | 'ghost' | 'accent' | 'green' | 'amber'): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '5px 12px', borderRadius: 5, cursor: 'pointer',
    fontSize: 12, fontWeight: 500, border: 'none', transition: 'all 0.15s',
  };
  if (variant === 'primary') return { ...base, background: 'var(--color-accent)', color: '#fff' };
  if (variant === 'green') return { ...base, background: 'var(--color-green)', color: '#fff' };
  if (variant === 'accent') return { ...base, background: 'var(--color-accent)', color: '#fff' };
  if (variant === 'amber') return { ...base, background: 'var(--color-yellow-dim)', color: 'var(--color-yellow)', border: '1px solid var(--color-yellow)' };
  return { ...base, background: 'transparent', color: 'var(--color-muted)', border: '1px solid var(--color-border)' };
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ExercisePage() {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const navigate = useNavigate();
  const exercise = getExercise(exerciseId ?? '');
  const [progress, setProgress] = useState(getProgress());

  // Session state
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(5400);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Level & code
  const [activeLevel, setActiveLevel] = useState(1);
  const [code, setCode] = useState('');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Record<number, TestResult[]>>({});
  const [failCounts, setFailCounts] = useState<Record<number, number>>({});
  const [levelPassedAt, setLevelPassedAt] = useState<Record<number, number>>({});

  // UI toggles
  const [showHint, setShowHint] = useState<Record<number, boolean>>({});
  const [showSolution, setShowSolution] = useState<Record<number, boolean>>({});
  const [selectedFile, setSelectedFile] = useState('solution.py');
  const [terminalExpanded, setTerminalExpanded] = useState(true);
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  // Restore / initialize from localStorage on mount
  const initialized = useRef(false);
  useEffect(() => {
    if (!exercise || !exerciseId) return;
    const saved = getMockSession(exerciseId);
    if (saved && saved.code) {
      setCode(saved.code);
      setFailCounts(saved.failCounts);
      setLevelPassedAt(saved.levelPassedAt);
      if (saved.sessionCompleted) {
        setSessionStarted(true);
        setSessionCompleted(true);
        setSecondsLeft(saved.secondsLeft);
      } else if (saved.sessionStartTime) {
        // Restore running session — compute elapsed
        const elapsed = Math.floor((Date.now() - saved.sessionStartTime) / 1000);
        const remaining = Math.max(0, saved.secondsLeft - elapsed);
        setSessionStarted(true);
        setSecondsLeft(remaining);
      }
    } else {
      setCode(exercise.implStarterCode ?? exercise.levels[0]?.starterCode ?? '# Write your solution here\n');
    }
    initialized.current = true;
  }, [exerciseId]);

  // Persist session changes (only after initialization)
  const persistSession = useCallback(() => {
    if (!exerciseId || !initialized.current) return;
    const session: MockSession = {
      exerciseId,
      sessionStartTime: sessionStarted && !sessionCompleted ? Date.now() : null,
      secondsLeft,
      sessionCompleted,
      failCounts,
      code,
      levelPassedAt,
    };
    saveMockSession(session);
  }, [exerciseId, sessionStarted, sessionCompleted, secondsLeft, failCounts, code, levelPassedAt]);

  useEffect(() => { persistSession(); }, [code, failCounts, levelPassedAt, sessionCompleted]);

  // Timer
  useEffect(() => {
    if (sessionStarted && !sessionCompleted && secondsLeft > 0) {
      timerRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [sessionStarted, sessionCompleted]);

  // Time's up toast
  useEffect(() => {
    if (sessionStarted && !sessionCompleted && secondsLeft === 0) {
      // Auto-finish
      setSessionCompleted(true);
    }
  }, [secondsLeft, sessionStarted, sessionCompleted]);

  // Computed state
  const exProgress = progress.exercises[exerciseId ?? ''];
  const passedLevelsFromProgress = new Set((exProgress?.levelResults ?? []).filter(r => r.passed).map(r => r.level));
  const allPassedLevels = new Set([...passedLevelsFromProgress, ...Object.keys(levelPassedAt).map(Number)]);
  const highestPassed = Math.max(0, ...allPassedLevels);
  const highestUnlocked = Math.min(highestPassed + 1, exercise?.levels.length ?? 1);

  if (!exercise) {
    return <div style={{ padding: 40, color: 'var(--color-muted)' }}>Exercise not found.</div>;
  }

  const lv = exercise.levels.find(l => l.level === activeLevel)!;
  const isLocked = activeLevel > highestUnlocked;
  const isLevelPassed = allPassedLevels.has(activeLevel);
  const currentResults = results[activeLevel] ?? null;
  const allPassed = currentResults !== null && currentResults.length > 0 && currentResults.every(r => r.passed);
  const passedCount = currentResults?.filter(r => r.passed).length ?? 0;
  const totalTests = currentResults?.length ?? 0;
  const levelFailCount = failCounts[activeLevel] ?? 0;
  const solutionUnlocked = isLevelPassed || levelFailCount >= 3;

  function startSession() {
    setSessionStarted(true);
    setSecondsLeft(5400);
    persistSession();
  }

  function finishSession() {
    setSessionCompleted(true);
    if (timerRef.current) clearInterval(timerRef.current);
    // Save to main progress
    saveLevelResult(exercise!.id, activeLevel, isLevelPassed, code, passedCount, totalTests);
    setProgress(getProgress());
    window.dispatchEvent(new Event('ica-progress-updated'));
    // Persist mock session
    const session: MockSession = {
      exerciseId: exerciseId!,
      sessionStartTime: null,
      secondsLeft,
      sessionCompleted: true,
      failCounts,
      code,
      levelPassedAt,
    };
    saveMockSession(session);
  }

  async function handleRunTests() {
    if (!lv || !sessionStarted || sessionCompleted) return;
    setRunning(true);
    try {
      const res = await runTests(lv.baseClass ?? '', code, lv.testCases ?? []);
      setResults(prev => ({ ...prev, [activeLevel]: res }));
      const passed = res.every(r => r.passed);
      if (passed) {
        setLevelPassedAt(prev => ({ ...prev, [activeLevel]: Date.now() }));
        saveLevelResult(exercise!.id, activeLevel, true, code, res.filter(r => r.passed).length, res.length);
        setProgress(getProgress());
        window.dispatchEvent(new Event('ica-progress-updated'));
      } else {
        setFailCounts(prev => ({ ...prev, [activeLevel]: (prev[activeLevel] ?? 0) + 1 }));
      }
      setTerminalExpanded(true);
    } catch (e) {
      setResults(prev => ({
        ...prev,
        [activeLevel]: [{
          description: 'Connection error',
          passed: false,
          expected: '',
          actual: '',
          errorMsg: `Failed to connect to Python server.\nMake sure server/server.py is running.\n\n${e}`,
        }],
      }));
      setTerminalExpanded(true);
    } finally {
      setRunning(false);
    }
  }

  function handleReset() {
    setCode(exercise!.implStarterCode ?? exercise!.levels[0]?.starterCode ?? '');
    setResults(prev => { const next = { ...prev }; delete next[activeLevel]; return next; });
    setShowResetDialog(false);
  }

  // Build file tree entries
  const files: { name: string; color: string; readOnly: boolean; content: string }[] = [
    { name: 'solution.py', color: 'var(--color-accent)', readOnly: false, content: code },
    { name: 'base_class.py', color: '#c084fc', readOnly: true, content: lv?.baseClass ?? '' },
  ];
  // Add test files for unlocked levels
  exercise.levels.forEach(l => {
    if (l.level <= highestUnlocked && l.testFileContent) {
      files.push({
        name: `test_level_${l.level}.py`,
        color: 'var(--color-yellow)',
        readOnly: true,
        content: l.testFileContent,
      });
    }
  });

  const activeFileContent = selectedFile === 'solution.py'
    ? code
    : files.find(f => f.name === selectedFile)?.content ?? '';
  const activeFileReadOnly = selectedFile !== 'solution.py';

  // Progress bar (16 segments)
  const progressFraction = secondsLeft / 5400;
  const filledSegments = Math.round(progressFraction * 16);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ================================================================ */}
      {/* Header */}
      {/* ================================================================ */}
      <div style={{
        padding: '8px 16px',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'var(--color-surface)',
        flexShrink: 0,
      }}>
        <button onClick={() => navigate('/')} style={{ ...btnStyle('ghost'), gap: 4 }}>
          <ArrowLeft size={14} /> Dashboard
        </button>
        <span style={{ color: 'var(--color-border)' }}>/</span>
        <span style={{ fontWeight: 600, fontSize: 14 }}>{exercise.title}</span>

        <div style={{ flex: 1 }} />

        {/* Timer (shown after session starts) */}
        {sessionStarted && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 10px',
            border: `1px solid ${timerBorderColor(secondsLeft)}`,
            borderRadius: 6,
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            color: timerColor(secondsLeft),
          }}>
            <Clock size={14} />
            <span>{formatTime(secondsLeft)}</span>
            <div style={{ display: 'flex', gap: 1 }}>
              {Array.from({ length: 16 }, (_, i) => (
                <div key={i} style={{
                  width: 4,
                  height: 10,
                  borderRadius: 1,
                  background: i < filledSegments ? progressBarColor(secondsLeft) : 'var(--color-border)',
                  opacity: i < filledSegments ? 1 : 0.3,
                }} />
              ))}
            </div>
          </div>
        )}

        {/* Cheat Sheet button */}
        <button onClick={() => setShowCheatSheet(true)} style={btnStyle('ghost')}>
          <BookOpen size={14} /> Cheat Sheet
        </button>

        {/* Session control button */}
        {!sessionStarted && (
          <button onClick={startSession} style={{ ...btnStyle('accent'), padding: '6px 16px', fontSize: 13 }}>
            <Play size={14} /> Start Session
          </button>
        )}
        {sessionStarted && !sessionCompleted && (
          <button onClick={finishSession} style={{ ...btnStyle('green'), padding: '6px 16px', fontSize: 13 }}>
            <Square size={12} /> Finish
          </button>
        )}
        {sessionCompleted && (
          <span style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 14px', borderRadius: 5, fontSize: 13, fontWeight: 600,
            background: 'var(--color-green-dim)', color: 'var(--color-green)',
          }}>
            <CheckCircle2 size={14} /> Completed
          </span>
        )}
      </div>

      {/* ================================================================ */}
      {/* Warning banner (pre-session) */}
      {/* ================================================================ */}
      {!sessionStarted && (
        <div style={{
          padding: '8px 16px',
          background: 'var(--color-yellow-dim)',
          borderBottom: '1px solid var(--color-yellow)',
          color: 'var(--color-yellow)',
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexShrink: 0,
        }}>
          ⚠ Click <strong style={{ margin: '0 3px' }}>Start Session</strong> to begin the 90-minute timer. Goal: complete <strong style={{ margin: '0 3px' }}>Levels 1–4</strong> in 90 min (real ICA scope). Levels 5–6 are bonus extension practice.
        </div>
      )}

      {/* ================================================================ */}
      {/* Level tabs */}
      {/* ================================================================ */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        flexShrink: 0,
        overflowX: 'auto',
      }}>
        {exercise.levels.map(l => {
          const locked = l.level > highestUnlocked;
          const passed = allPassedLevels.has(l.level);
          const active = l.level === activeLevel;
          return (
            <button
              key={l.level}
              onClick={() => !locked && !passed && setActiveLevel(l.level)}
              disabled={locked || passed}
              style={{
                padding: '8px 16px',
                background: 'none',
                border: 'none',
                borderBottom: active ? '2px solid var(--color-accent)' : '2px solid transparent',
                color: locked
                  ? 'var(--color-muted)'
                  : passed
                    ? 'var(--color-green)'
                    : active
                      ? 'var(--color-accent)'
                      : 'var(--color-muted)',
                opacity: locked ? 0.4 : passed ? 0.8 : 1,
                cursor: locked || passed ? 'default' : 'pointer',
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {passed ? <CheckCircle2 size={12} /> : locked ? <Lock size={12} /> : <Unlock size={12} />}
              L{l.level}: {l.title}
              {l.level >= 5 && (
                <span style={{
                  fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 8,
                  background: 'var(--color-surface-2)', color: 'var(--color-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                }}>
                  Bonus
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ================================================================ */}
      {/* Main split: Instructions | File tree + Editor + Terminal */}
      {/* ================================================================ */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {/* ============================================================ */}
        {/* Left panel: Instructions (360px) */}
        {/* ============================================================ */}
        <div style={{
          width: 360,
          minWidth: 360,
          borderRight: '1px solid var(--color-border)',
          overflowY: 'auto',
          padding: '16px 20px',
          background: 'var(--color-bg)',
        }}>
          {isLocked ? (
            <div style={{ color: 'var(--color-muted)', textAlign: 'center', marginTop: 60 }}>
              <Lock size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.5 }} />
              <div>Complete Level {activeLevel - 1} to unlock.</div>
            </div>
          ) : (
            <>
              {/* Level badge + time guidance */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{
                  padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                  background: 'var(--color-accent-dim)', color: 'var(--color-accent)',
                }}>
                  Level {lv.level}
                </span>
                {lv.timeGuidanceMinutes && (
                  <span style={{ fontSize: 12, color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Clock size={11} /> ~{lv.timeGuidanceMinutes} min
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, marginTop: 4 }}>{lv.title}</h2>

              {/* Instructions body */}
              <div dangerouslySetInnerHTML={{ __html: mdToHtml(lv.instructions || lv.description) }} />

              {/* Hint toggle */}
              {lv.hint && (
                <div style={{ marginTop: 16 }}>
                  <button
                    onClick={() => setShowHint(prev => ({ ...prev, [activeLevel]: !prev[activeLevel] }))}
                    style={btnStyle('amber')}
                  >
                    <Lightbulb size={12} /> {showHint[activeLevel] ? 'Hide Hint' : '💡 Show Hint'}
                  </button>
                  {showHint[activeLevel] && (
                    <div style={{
                      marginTop: 8, padding: '10px 14px', borderRadius: 6,
                      background: 'var(--color-yellow-dim)', border: '1px solid var(--color-yellow)',
                      fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-yellow)',
                      lineHeight: 1.5, whiteSpace: 'pre-wrap',
                    }}>
                      {lv.hint}
                    </div>
                  )}
                </div>
              )}

              {/* View Solution toggle */}
              {lv.solution && (
                <div style={{ marginTop: 12 }}>
                  {!solutionUnlocked ? (
                    <button disabled style={{ ...btnStyle('ghost'), opacity: 0.5, cursor: 'default' }}>
                      <Eye size={12} /> View Solution
                      <span style={{ fontSize: 11, color: 'var(--color-muted)', marginLeft: 4 }}>
                        ({3 - levelFailCount} attempt{3 - levelFailCount !== 1 ? 's' : ''} remaining)
                      </span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setShowSolution(prev => ({ ...prev, [activeLevel]: !prev[activeLevel] }))}
                        style={btnStyle('ghost')}
                      >
                        {showSolution[activeLevel] ? <EyeOff size={12} /> : <Eye size={12} />}
                        {showSolution[activeLevel] ? 'Hide Solution' : '👁 View Solution'}
                      </button>
                      {showSolution[activeLevel] && (
                        <div style={{ marginTop: 8 }}>
                          <Editor
                            height={260}
                            language="python"
                            theme="vs-dark"
                            value={lv.solution}
                            options={{
                              readOnly: true,
                              fontSize: 12,
                              minimap: { enabled: false },
                              scrollBeyondLastLine: false,
                              lineNumbers: 'on',
                              padding: { top: 8 },
                              renderLineHighlight: 'none',
                              domReadOnly: true,
                            }}
                          />
                          <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 6, fontStyle: 'italic' }}>
                            Study the solution, then try implementing it from memory.
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Level passed actions */}
              {isLevelPassed && (
                <div style={{ marginTop: 20 }}>
                  <div style={{
                    padding: '10px 14px', borderRadius: 6,
                    background: 'var(--color-green-dim)', color: 'var(--color-green)',
                    fontSize: 14, fontWeight: 600, marginBottom: 12,
                  }}>
                    ✓ Level {activeLevel} Passed!
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {activeLevel < exercise.levels.length && (
                      <button
                        onClick={() => setActiveLevel(activeLevel + 1)}
                        style={btnStyle('accent')}
                      >
                        <SkipForward size={12} /> Level {activeLevel + 1}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ============================================================ */}
        {/* Right panel: File tree + Editor + Terminal */}
        {/* ============================================================ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
            {/* File tree (176px) */}
            <div style={{
              width: 176,
              minWidth: 176,
              borderRight: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              overflowY: 'auto',
              padding: '8px 0',
            }}>
              <div style={{
                padding: '4px 12px 8px',
                fontSize: 10,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--color-muted)',
              }}>
                📂 Files
              </div>
              {files.map(f => {
                const isActive = selectedFile === f.name;
                const isTest = f.name.startsWith('test_');
                return (
                  <button
                    key={f.name}
                    onClick={() => setSelectedFile(f.name)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 12px',
                      background: isActive ? 'var(--color-accent-dim)' : 'transparent',
                      border: 'none',
                      borderLeft: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
                      cursor: 'pointer',
                      color: isActive ? 'var(--color-text)' : 'var(--color-muted)',
                      fontSize: 12,
                      textAlign: 'left',
                    }}
                  >
                    {isTest
                      ? <FileTextIcon size={12} style={{ color: f.color, flexShrink: 0 }} />
                      : <FileCode size={12} style={{ color: f.color, flexShrink: 0 }} />
                    }
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.name}
                    </span>
                    {f.readOnly && <Lock size={10} style={{ opacity: 0.4, flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>

            {/* Editor area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              {/* Editor toolbar */}
              <div style={{
                padding: '6px 12px',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--color-surface)',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 12, fontWeight: 500, flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {selectedFile}
                  {activeFileReadOnly && (
                    <span style={{
                      fontSize: 10, padding: '1px 6px', borderRadius: 3,
                      background: 'var(--color-surface-2)', color: 'var(--color-muted)',
                    }}>
                      read-only
                    </span>
                  )}
                </span>
                {selectedFile === 'solution.py' && (
                  <>
                    <button
                      onClick={() => setShowResetDialog(true)}
                      disabled={isLocked}
                      style={btnStyle('ghost')}
                    >
                      <RotateCcw size={12} /> Reset
                    </button>
                    <button
                      onClick={handleRunTests}
                      disabled={running || !sessionStarted || sessionCompleted || isLocked}
                      style={{
                        ...btnStyle('primary'),
                        opacity: (!sessionStarted || sessionCompleted || running) ? 0.5 : 1,
                      }}
                    >
                      <Play size={12} /> {running ? 'Running…' : 'Run Tests'}
                    </button>
                  </>
                )}
              </div>

              {/* Monaco Editor */}
              <div style={{ flex: 1, minHeight: 0 }}>
                <Editor
                  key={`${selectedFile}-${activeLevel}`}
                  height="100%"
                  language="python"
                  theme="vs-dark"
                  value={activeFileContent}
                  onChange={v => {
                    if (selectedFile === 'solution.py') setCode(v ?? '');
                  }}
                  options={{
                    fontSize: 13,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    tabSize: 4,
                    insertSpaces: true,
                    readOnly: activeFileReadOnly || isLocked,
                    padding: { top: 8 },
                    wordWrap: 'off',
                    lineNumbers: 'on',
                    renderLineHighlight: activeFileReadOnly ? 'none' : 'line',
                  }}
                />
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* Terminal panel */}
          {/* ============================================================ */}
          <div style={{
            height: terminalExpanded ? 200 : 36,
            minHeight: terminalExpanded ? 200 : 36,
            borderTop: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            transition: 'height 0.15s',
          }}>
            {/* Terminal header */}
            <button
              onClick={() => setTerminalExpanded(!terminalExpanded)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-muted)',
                fontSize: 12,
                fontWeight: 500,
                width: '100%',
                textAlign: 'left',
                flexShrink: 0,
              }}
            >
              {terminalExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <span>Terminal</span>
              {running && (
                <span style={{ color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  · <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span> Running…
                </span>
              )}
              {currentResults && !running && (
                <>
                  <span style={{ color: allPassed ? 'var(--color-green)' : 'var(--color-red)' }}>
                    · {allPassed ? '✓' : '✗'} {passedCount}/{totalTests} passed
                  </span>
                  {allPassed && (
                    <span style={{
                      padding: '1px 6px', borderRadius: 3, fontSize: 10, fontWeight: 600,
                      background: 'var(--color-green-dim)', color: 'var(--color-green)',
                      marginLeft: 4,
                    }}>
                      LEVEL PASSED
                    </span>
                  )}
                </>
              )}
            </button>

            {/* Terminal body */}
            {terminalExpanded && (
              <div style={{ flex: 1, overflowY: 'auto', borderTop: '1px solid var(--color-border)' }}>
                {!currentResults && !running && (
                  <div style={{ padding: 16, color: 'var(--color-muted)', fontSize: 12, textAlign: 'center' }}>
                    {!sessionStarted
                      ? 'Start the session to run tests.'
                      : 'Click "Run Tests" to execute test cases.'}
                  </div>
                )}
                {currentResults && currentResults.map((r, i) => (
                  <div key={i} style={{
                    padding: '6px 12px',
                    background: r.passed ? 'transparent' : 'var(--color-red-dim)',
                    borderBottom: '1px solid var(--color-border)',
                    fontSize: 12,
                  }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      color: r.passed ? 'var(--color-green)' : 'var(--color-red)',
                    }}>
                      <span>{r.passed ? '✓' : '✗'}</span>
                      <span>{r.description}</span>
                    </div>
                    {!r.passed && (
                      <div style={{ paddingLeft: 18, marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                        {r.expected && (
                          <div><span style={{ color: 'var(--color-green)' }}>Expected:</span> <span style={{ color: 'var(--color-muted)' }}>{r.expected}</span></div>
                        )}
                        {r.actual && (
                          <div><span style={{ color: 'var(--color-red)' }}>Got:</span> <span style={{ color: 'var(--color-muted)' }}>{r.actual}</span></div>
                        )}
                        {r.errorMsg && (
                          <pre style={{ color: 'var(--color-red)', whiteSpace: 'pre-wrap', margin: '4px 0 0', fontSize: 11 }}>
                            {r.errorMsg}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {/* Post-pass actions in terminal */}
                {allPassed && (
                  <div style={{ padding: '10px 12px', display: 'flex', gap: 8 }}>
                    {activeLevel < exercise.levels.length && (
                      <button onClick={() => setActiveLevel(activeLevel + 1)} style={btnStyle('accent')}>
                        <SkipForward size={12} /> Level {activeLevel + 1}
                      </button>
                    )}
                    {activeLevel === exercise.levels.length && (
                      <span style={{ fontSize: 13, color: 'var(--color-green)', fontWeight: 600 }}>
                        🎉 All levels complete!
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* Reset confirmation dialog */}
      {/* ================================================================ */}
      {showResetDialog && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}
          onClick={() => setShowResetDialog(false)}
        >
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 10, padding: '24px 28px', maxWidth: 360,
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Reset to starter code?</h3>
            <p style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 20, lineHeight: 1.5 }}>
              Your current code will be lost. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowResetDialog(false)} style={btnStyle('ghost')}>Cancel</button>
              <button onClick={handleReset} style={btnStyle('primary')}>Reset Code</button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* Cheat Sheet overlay */}
      {/* ================================================================ */}
      {showCheatSheet && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', justifyContent: 'flex-end', zIndex: 100,
          }}
          onClick={() => setShowCheatSheet(false)}
        >
          <div
            style={{
              width: 380, background: 'var(--color-surface)', height: '100%',
              overflowY: 'auto', padding: '16px 20px',
              borderLeft: '1px solid var(--color-border)',
              animation: 'slideIn 0.2s ease-out',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>📋 Cheat Sheet</h2>
              <button onClick={() => setShowCheatSheet(false)} style={{ ...btnStyle('ghost'), padding: 4 }}>
                <X size={16} />
              </button>
            </div>
            {cheatSheet.sections.map((section, idx) => (
              <div key={idx} style={{ marginBottom: 20 }}>
                <div style={{
                  fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
                  color: 'var(--color-accent)', marginBottom: 8,
                }}>
                  {section.title}
                </div>
                {(section.items ?? []).map((item, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    {item.label && <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 3 }}>{item.label}</div>}
                    {item.code && (
                      <pre style={{
                        background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                        borderRadius: 5, padding: '8px 10px', fontFamily: 'var(--font-mono)',
                        fontSize: 11, overflow: 'auto', margin: 0,
                      }}>
                        {item.code}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
