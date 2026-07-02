import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { curriculum } from '@/data/curriculum';
import { getProgress } from '@/lib/progress';
import { CheckCircle2, Code2, BookOpen, Calendar } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(getProgress());

  useEffect(() => {
    setProgress(getProgress());
  }, []);

  const completedLessons = new Set(Object.keys(progress.completedLessons));
  const totalLessons = curriculum.reduce((s, d) => s + (d.lessons?.length ?? 0), 0);
  const totalExercises = curriculum.reduce((s, d) => s + (d.exercises?.length ?? 0), 0);
  const doneLessons = completedLessons.size;
  const doneExercises = Object.values(progress.exercises).filter(e => e.highestLevel >= 6).length;

  const target = new Date('2026-07-03');
  const now = new Date();
  const daysLeft = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div style={{ padding: '32px 40px', maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px', color: 'var(--color-text)' }}>
          ⚡ Your Prep Dashboard
        </h1>
        <p style={{ color: 'var(--color-muted)', margin: 0 }}>
          Zero to hero in 4 days — structured, focused, built for the real ICA.
        </p>
      </div>

      {/* Countdown */}
      {daysLeft > 0 && (
        <div style={{
          background: 'var(--color-accent-dim)',
          border: '1px solid var(--color-accent)',
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          color: 'var(--color-accent)',
        }}>
          <Calendar size={16} />
          <span><strong>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong> until July 3 — assessment day</span>
        </div>
      )}
      {daysLeft === 0 && (
        <div style={{ background: 'var(--color-red-dim)', border: '1px solid var(--color-red)', borderRadius: 8, padding: '12px 16px', marginBottom: 24, color: 'var(--color-red)' }}>
          🚨 Assessment day is today! Good luck.
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard label="Lessons Done" value={`${doneLessons}/${totalLessons}`} icon={<BookOpen size={18} />} />
        <StatCard label="Exercises Done" value={`${doneExercises}/${totalExercises}`} icon={<Code2 size={18} />} />
        <StatCard label="Days Left" value={String(Math.max(0, daysLeft))} icon={<Calendar size={18} />} />
      </div>

      {/* Day cards */}
      {curriculum.map(day => {
        const lessons = day.lessons ?? [];
        const exercises = day.exercises ?? [];
        const doneL = lessons.filter(l => completedLessons.has(l.id)).length;
        const doneE = exercises.filter(e => (progress.exercises[e.id]?.highestLevel ?? 0) >= 6).length;
        const total = lessons.length + exercises.length;
        const done = doneL + doneE;
        const pct = total > 0 ? Math.round(100 * done / total) : 0;

        return (
          <div key={day.number} style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 10,
            marginBottom: 20,
            overflow: 'hidden',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>Day {day.number}: {day.title}</span>
                  {day.subtitle && <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>{day.subtitle}</div>}
                </div>
                <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>{pct}% — {done}/{total}</span>
              </div>
              {/* Progress bar */}
              <div style={{ height: 4, background: 'var(--color-surface-2)', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${pct}%`, background: 'var(--color-accent)', borderRadius: 2, transition: 'width 0.3s' }} />
              </div>
            </div>

            <div style={{ padding: '12px 20px' }}>
              {lessons.length > 0 && (
                <div style={{ marginBottom: exercises.length > 0 ? 12 : 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Lessons</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 6 }}>
                    {lessons.map(lesson => {
                      const done = completedLessons.has(lesson.id);
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => navigate(`/lesson/${lesson.id}`)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 12px',
                            background: 'var(--color-surface-2)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 6,
                            cursor: 'pointer',
                            color: 'var(--color-text)',
                            fontSize: 13,
                            textAlign: 'left',
                            transition: 'border-color 0.15s',
                          }}
                        >
                          {done
                            ? <CheckCircle2 size={14} style={{ color: 'var(--color-green)', flexShrink: 0 }} />
                            : <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid var(--color-border)', flexShrink: 0 }} />
                          }
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lesson.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {exercises.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Exercises</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 6 }}>
                    {exercises.map(ex => {
                      const lvl = progress.exercises[ex.id]?.highestLevel ?? 0;
                      const complete = lvl >= 6;
                      return (
                        <button
                          key={ex.id}
                          onClick={() => navigate(`/exercise/${ex.id}`)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 12px',
                            background: 'var(--color-surface-2)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 6,
                            cursor: 'pointer',
                            color: 'var(--color-text)',
                            fontSize: 13,
                            textAlign: 'left',
                          }}
                        >
                          <Code2 size={14} style={{ color: complete ? 'var(--color-green)' : lvl > 0 ? 'var(--color-yellow)' : 'var(--color-muted)', flexShrink: 0 }} />
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.title}</span>
                          {lvl > 0 && <span style={{ fontSize: 11, color: complete ? 'var(--color-green)' : 'var(--color-yellow)', flexShrink: 0 }}>{complete ? '✓' : `L${lvl}/6`}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 8,
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      <div style={{ color: 'var(--color-accent)' }}>{icon}</div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>{label}</div>
      </div>
    </div>
  );
}
