import { Outlet, NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Code2, LayoutDashboard, FileText, CheckCircle2, Circle, ChevronDown, ChevronRight, ChevronLeft, ChevronsRight } from 'lucide-react';
import { curriculum } from '@/data/curriculum';
import { getProgress } from '@/lib/progress';

export default function Layout() {
  const [progress, setProgress] = useState(getProgress());
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1, 2, 3, 4]));
  // Sidebar stays collapsed to a hover rail on every page; hovering reveals it.
  const [collapsed, setCollapsed] = useState<boolean>(true);
  const [hovering, setHovering] = useState(false);

  // Sidebar is visible when pinned open, or when hovering the reveal rail.
  const sidebarVisible = !collapsed || hovering;

  function toggleCollapsed() {
    setCollapsed(prev => {
      if (!prev) setHovering(false);
      return !prev;
    });
  }

  // Refresh progress when navigating back to sidebar
  useEffect(() => {
    const refresh = () => setProgress(getProgress());
    window.addEventListener('focus', refresh);
    window.addEventListener('ica-progress-updated', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('ica-progress-updated', refresh);
    };
  }, []);

  const completedLessons = new Set(Object.keys(progress.completedLessons));

  function toggleDay(n: number) {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n); else next.add(n);
      return next;
    });
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* Hover-reveal rail (only when collapsed) */}
      {collapsed && (
        <div
          onMouseEnter={() => setHovering(true)}
          onClick={() => setHovering(true)}
          title="Show navigation"
          style={{
            width: 14,
            minWidth: 14,
            background: 'var(--color-surface)',
            borderRight: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 20,
          }}
        >
          <ChevronsRight size={14} style={{ color: 'var(--color-muted)' }} />
        </div>
      )}

      {/* Sidebar */}
      <aside
        onMouseLeave={() => { if (collapsed) setHovering(false); }}
        style={{
          width: 260,
          minWidth: 260,
          background: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          // When collapsed, float as an overlay so it doesn't steal editor width.
          ...(collapsed ? {
            position: 'absolute' as const,
            top: 0,
            left: 14,
            height: '100%',
            zIndex: 30,
            transform: sidebarVisible ? 'translateX(0)' : 'translateX(-110%)',
            boxShadow: sidebarVisible ? '4px 0 24px rgba(0,0,0,0.45)' : 'none',
            transition: 'transform 0.18s ease',
          } : {}),
        }}
      >
        {/* Logo */}
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>⚡</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text)' }}>ICA Prep</div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>Zero to hero in 4 days</div>
            </div>
            <button
              onClick={toggleCollapsed}
              title={collapsed ? 'Pin sidebar open' : 'Collapse sidebar'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 24,
                height: 24,
                padding: 0,
                background: 'none',
                border: 'none',
                borderRadius: 6,
                color: 'var(--color-muted)',
                cursor: 'pointer',
              }}
            >
              {collapsed ? <ChevronsRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {/* Dashboard */}
          <NavLink
            to="/"
            end
            style={({ isActive }) => navItemStyle(isActive)}
          >
            <LayoutDashboard size={14} />
            <span>Dashboard</span>
          </NavLink>

          {/* Days */}
          {curriculum.map(day => {
            const expanded = expandedDays.has(day.number);
            const lessons = day.lessons ?? [];
            const exercises = day.exercises ?? [];
            const doneLessons = lessons.filter(l => completedLessons.has(l.id)).length;
            const doneEx = exercises.filter(e => (progress.exercises[e.id]?.highestLevel ?? 0) >= 6).length;
            const total = lessons.length + exercises.length;
            const done = doneLessons + doneEx;

            return (
              <div key={day.number}>
                <button
                  onClick={() => toggleDay(day.number)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-muted)',
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span style={{ flex: 1 }}>Day {day.number}: {day.title}</span>
                  <span style={{ fontSize: 10 }}>{done}/{total}</span>
                </button>

                {expanded && (
                  <div>
                    {lessons.map(lesson => {
                      const done = completedLessons.has(lesson.id);
                      return (
                        <NavLink
                          key={lesson.id}
                          to={`/lesson/${lesson.id}`}
                          style={({ isActive }) => ({
                            ...navItemStyle(isActive),
                            paddingLeft: 28,
                          })}
                        >
                          {done
                            ? <CheckCircle2 size={12} style={{ color: 'var(--color-green)', flexShrink: 0 }} />
                            : <Circle size={12} style={{ color: 'var(--color-muted)', flexShrink: 0 }} />
                          }
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {lesson.title}
                          </span>
                        </NavLink>
                      );
                    })}
                    {exercises.map(ex => {
                      const lvl = progress.exercises[ex.id]?.highestLevel ?? 0;
                      const complete = lvl >= 6;
                      return (
                        <NavLink
                          key={ex.id}
                          to={`/exercise/${ex.id}`}
                          style={({ isActive }) => ({
                            ...navItemStyle(isActive),
                            paddingLeft: 28,
                          })}
                        >
                          <Code2 size={12} style={{ color: complete ? 'var(--color-green)' : lvl > 0 ? 'var(--color-yellow)' : 'var(--color-muted)', flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ex.title}
                          </span>
                          {lvl > 0 && !complete && (
                            <span style={{ fontSize: 10, color: 'var(--color-muted)', marginLeft: 'auto', flexShrink: 0 }}>L{lvl}</span>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Cheat Sheet */}
          <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 8, paddingTop: 8 }}>
            <NavLink
              to="/cheatsheet"
              style={({ isActive }) => navItemStyle(isActive)}
            >
              <FileText size={14} />
              <span>Cheat Sheet</span>
            </NavLink>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--color-bg)' }}>
        <Outlet context={{ refreshProgress: () => setProgress(getProgress()) }} />
      </main>
    </div>
  );
}

function navItemStyle(isActive: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '5px 12px',
    textDecoration: 'none',
    color: isActive ? 'var(--color-text)' : 'var(--color-muted)',
    background: isActive ? 'var(--color-accent-dim)' : 'transparent',
    borderLeft: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
    fontSize: 13,
    transition: 'all 0.15s',
    cursor: 'pointer',
  };
}
