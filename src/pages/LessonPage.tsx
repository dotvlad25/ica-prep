import { useParams, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { getLesson } from '@/data/curriculum';
import { getProgress, markLessonComplete, unmarkLesson } from '@/lib/progress';
import { runCode } from '@/lib/runner';
import { ArrowLeft, CheckCircle2, Play, RotateCcw, Lightbulb, Eye } from 'lucide-react';
import { mdToHtml, highlightPython } from '@/lib/highlight';

export default function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const lesson = getLesson(lessonId ?? '');
  const [progress, setProgress] = useState(getProgress());
  const [activeSection, setActiveSection] = useState(0);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState<{ text: string; isError: boolean } | null>(null);
  const [running, setRunning] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const startTime = useRef(Date.now());

  useEffect(() => {
    if (lesson?.practiceStarterCode) setCode(lesson.practiceStarterCode);
    else setCode('# Write your solution here\n');
    setOutput(null);
    setShowHint(false);
    setShowSolution(false);
    startTime.current = Date.now();
  }, [lessonId, lesson]);

  if (!lesson) {
    return <div style={{ padding: 40, color: 'var(--color-muted)' }}>Lesson not found.</div>;
  }

  const isDone = !!progress.completedLessons[lesson.id];
  const sections = lesson.sections ?? [];

  async function handleRun() {
    setRunning(true);
    setOutput(null);
    try {
      const result = await runCode(code);
      setOutput({ text: result.error ? result.stderr || 'Error (no output)' : result.stdout || '(no output)', isError: result.error });
    } catch (e) {
      setOutput({ text: `Failed to connect to Python server.\nMake sure server/server.py is running.\n\n${e}`, isError: true });
    } finally {
      setRunning(false);
    }
  }

  function handleMarkComplete() {
    const elapsed = Math.round((Date.now() - startTime.current) / 1000);
    markLessonComplete(lesson!.id, elapsed);
    setProgress(getProgress());
    window.dispatchEvent(new Event('ica-progress-updated'));
  }

  function handleUnmark() {
    unmarkLesson(lesson!.id);
    setProgress(getProgress());
    window.dispatchEvent(new Event('ica-progress-updated'));
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{
        padding: '12px 24px',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'var(--color-surface)',
        flexShrink: 0,
      }}>
        <button onClick={() => navigate('/')} style={btnStyle('ghost')}>
          <ArrowLeft size={14} /> Back
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{lesson.title}</div>
          {lesson.description && <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>{lesson.description}</div>}
        </div>
        {isDone ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--color-green)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
              <CheckCircle2 size={14} /> Complete
            </span>
            <button onClick={handleUnmark} style={btnStyle('ghost')}>Unmark</button>
          </div>
        ) : (
          <button onClick={handleMarkComplete} style={btnStyle('primary')}>
            <CheckCircle2 size={14} /> Mark Complete
          </button>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {/* Left: concept sections */}
        <div style={{ width: '45%', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Section tabs */}
          {sections.length > 1 && (
            <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
              {sections.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSection(i)}
                  style={{
                    padding: '8px 16px',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeSection === i ? '2px solid var(--color-accent)' : '2px solid transparent',
                    color: activeSection === i ? 'var(--color-text)' : 'var(--color-muted)',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: activeSection === i ? 600 : 400,
                  }}
                >
                  {s.heading}
                </button>
              ))}
            </div>
          )}

          {/* Section content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            {sections[activeSection] && (
              <div>
                {sections.length === 1 && (
                  <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{sections[0].heading}</h2>
                )}
                <div className="prose" dangerouslySetInnerHTML={{ __html: mdToHtml(sections[activeSection].body) }} />
                {sections[activeSection].codeExample && (
                  <div style={{ marginTop: 16 }}>
                    {sections[activeSection].codeExample!.caption && (
                      <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 6, fontWeight: 600 }}>
                        {sections[activeSection].codeExample!.caption}
                      </div>
                    )}
                    <pre style={{
                      background: 'var(--color-surface-2)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 6,
                      padding: '12px 16px',
                      overflow: 'auto',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 13,
                      lineHeight: 1.6,
                    }}>
                      <code dangerouslySetInnerHTML={{ __html: highlightPython(sections[activeSection].codeExample!.code) }} />
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: practice editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Practice header */}
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>🏋️ Practice</div>
            {lesson.practicePrompt && (
              <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>{lesson.practicePrompt}</div>
            )}
          </div>

          {/* Editor */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <Editor
              height="100%"
              language="python"
              theme="vs-dark"
              value={code}
              onChange={v => setCode(v ?? '')}
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                tabSize: 4,
                insertSpaces: true,
                wordWrap: 'off',
                lineNumbers: 'on',
                renderLineHighlight: 'line',
                padding: { top: 8 },
              }}
            />
          </div>

          {/* Toolbar */}
          <div style={{
            padding: '8px 12px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            background: 'var(--color-surface)',
            flexShrink: 0,
          }}>
            <button onClick={handleRun} disabled={running} style={btnStyle('primary')}>
              <Play size={13} /> {running ? 'Running…' : 'Run'}
            </button>
            <button onClick={() => { setCode(lesson.practiceStarterCode ?? '# Write your solution here\n'); setOutput(null); }} style={btnStyle('ghost')}>
              <RotateCcw size={13} /> Reset
            </button>
            {lesson.practiceHint && (
              <button onClick={() => setShowHint(!showHint)} style={btnStyle('ghost')}>
                <Lightbulb size={13} /> {showHint ? 'Hide Hint' : 'Hint'}
              </button>
            )}
            {lesson.practiceSolution && (
              <button onClick={() => setShowSolution(!showSolution)} style={btnStyle('ghost')}>
                <Eye size={13} /> {showSolution ? 'Hide Solution' : 'Solution'}
              </button>
            )}
          </div>

          {/* Output / hints */}
          {(output || showHint || showSolution) && (
            <div style={{ maxHeight: 200, overflowY: 'auto', borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
              {showHint && lesson.practiceHint && (
                <div style={{ padding: '10px 16px', background: 'var(--color-accent-dim)', borderBottom: '1px solid var(--color-border)', fontSize: 13, color: 'var(--color-accent)' }}>
                  💡 {lesson.practiceHint}
                </div>
              )}
              {showSolution && lesson.practiceSolution && (
                <pre style={{ margin: 0, padding: '10px 16px', background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)', fontFamily: 'var(--font-mono)', fontSize: 12, overflow: 'auto' }}>
                  {lesson.practiceSolution}
                </pre>
              )}
              {output && (
                <pre style={{
                  margin: 0,
                  padding: '10px 16px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: output.isError ? 'var(--color-red)' : 'var(--color-green)',
                  background: output.isError ? 'var(--color-red-dim)' : 'transparent',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                }}>
                  {output.text}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function btnStyle(variant: 'primary' | 'ghost'): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '5px 12px', borderRadius: 5, cursor: 'pointer',
    fontSize: 12, fontWeight: 500, border: 'none', transition: 'all 0.15s',
  };
  if (variant === 'primary') return { ...base, background: 'var(--color-accent)', color: '#fff' };
  return { ...base, background: 'transparent', color: 'var(--color-muted)', border: '1px solid var(--color-border)' };
}
