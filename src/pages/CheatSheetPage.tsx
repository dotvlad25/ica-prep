import { useState } from 'react';
import { cheatSheet } from '@/data/curriculum';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function CheatSheetPage() {
  const [open, setOpen] = useState<Set<string>>(new Set());

  function toggle(key: string) {
    setOpen(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 800 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>📋 Python Cheat Sheet</h1>
      <p style={{ color: 'var(--color-muted)', marginBottom: 24 }}>
        Quick reference for ICA patterns — keep this open during practice.
      </p>

      {Object.entries(cheatSheet).map(([key, section]) => {
        const isOpen = open.has(key);
        return (
          <div key={key} style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            marginBottom: 12,
            overflow: 'hidden',
          }}>
            <button
              onClick={() => toggle(key)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text)',
                fontSize: 14,
                fontWeight: 600,
                textAlign: 'left',
              }}
            >
              {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              {section.title}
            </button>
            {isOpen && (
              <div style={{ borderTop: '1px solid var(--color-border)', padding: '12px 16px' }}>
                {(section.items ?? []).map((item, i) => (
                  <div key={i} style={{ marginBottom: 16 }}>
                    {item.label && (
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{item.label}</div>
                    )}
                    {item.note && (
                      <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 6 }}>{item.note}</div>
                    )}
                    {item.code && (
                      <pre style={{
                        background: 'var(--color-surface-2)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 6,
                        padding: '10px 14px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        overflow: 'auto',
                        margin: 0,
                      }}>
                        {item.code}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
