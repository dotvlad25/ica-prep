/**
 * Lightweight Python syntax highlighter + markdown-to-HTML converter.
 * Shared between LessonPage and ExercisePage.
 */

// ---------------------------------------------------------------------------
// Python syntax highlighting (vs-dark palette)
// ---------------------------------------------------------------------------

const COLORS = {
  keyword:   '#569cd6',
  builtin:   '#dcdcaa',
  string:    '#ce9178',
  number:    '#b5cea8',
  comment:   '#6a9955',
  decorator: '#d7ba7d',
  func:      '#dcdcaa',
  self:      '#9cdcfe',
  const:     '#4ec9b0',
  text:      '#d4d4d4',
};

const KEYWORDS = new Set([
  'and','as','assert','async','await','break','class','continue','def','del',
  'elif','else','except','finally','for','from','global','if','import','in',
  'is','lambda','nonlocal','not','or','pass','raise','return','try','while',
  'with','yield',
]);

const BUILTINS = new Set([
  'print','len','range','int','str','float','list','dict','set','tuple',
  'bool','type','isinstance','issubclass','super','property','staticmethod',
  'classmethod','enumerate','zip','map','filter','sorted','reversed','any',
  'all','min','max','sum','abs','round','hash','id','repr','open','input',
  'hasattr','getattr','setattr','delattr','callable','iter','next','format',
  'vars','dir','globals','locals','exec','eval','compile','__import__',
  'ValueError','TypeError','KeyError','IndexError','RuntimeError',
  'StopIteration','AttributeError','NotImplementedError','Exception',
  'OSError','IOError','FileNotFoundError','PermissionError',
]);

const CONSTS = new Set(['True', 'False', 'None']);

const TOKEN_RE = /"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|#[^\n]*|@\w+(?:\.\w+)*|\b\d+(?:\.\d+)?\b|\b[a-zA-Z_]\w*\b|[^\s]/g;

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function span(color: string, text: string): string {
  return `<span style="color:${color}">${text}</span>`;
}

export function highlightPython(code: string): string {
  let result = '';
  let lastIndex = 0;

  for (const m of code.matchAll(TOKEN_RE)) {
    if (m.index > lastIndex) {
      result += esc(code.slice(lastIndex, m.index));
    }
    lastIndex = m.index + m[0].length;

    const tok = m[0];

    if (tok.startsWith('#')) {
      result += span(COLORS.comment, esc(tok));
    } else if (tok.startsWith('"""') || tok.startsWith("'''") || tok.startsWith('"') || tok.startsWith("'")) {
      result += span(COLORS.string, esc(tok));
    } else if (tok.startsWith('@')) {
      result += span(COLORS.decorator, esc(tok));
    } else if (/^\d/.test(tok)) {
      result += span(COLORS.number, esc(tok));
    } else if (CONSTS.has(tok)) {
      result += span(COLORS.const, esc(tok));
    } else if (KEYWORDS.has(tok)) {
      result += span(COLORS.keyword, esc(tok));
    } else if (tok === 'self' || tok === 'cls') {
      result += span(COLORS.self, esc(tok));
    } else if (BUILTINS.has(tok)) {
      result += span(COLORS.builtin, esc(tok));
    } else {
      const after = code.slice(lastIndex).match(/^\s*\(/);
      if (after && /^[a-zA-Z_]\w*$/.test(tok)) {
        result += span(COLORS.func, esc(tok));
      } else {
        result += span(COLORS.text, esc(tok));
      }
    }
  }

  if (lastIndex < code.length) {
    result += esc(code.slice(lastIndex));
  }
  return result;
}

// ---------------------------------------------------------------------------
// Markdown → HTML with syntax-highlighted code blocks
// ---------------------------------------------------------------------------

export function mdToHtml(md: string): string {
  if (!md) return '';

  // Extract code blocks before escaping
  const codeBlocks: string[] = [];
  let processed = md.replace(/```[\s\S]*?```/g, match => {
    const code = match.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
    codeBlocks.push(code);
    return `%%CODEBLOCK_${codeBlocks.length - 1}%%`;
  });

  processed = processed
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3 style="color:var(--color-accent);font-size:0.85rem;font-weight:600;margin:1rem 0 0.3rem">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-weight:700;font-size:1rem;margin:1rem 0 0.4rem">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-weight:700;font-size:1.25rem;margin:1rem 0 0.5rem">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--color-text)">$1</strong>')
    .replace(/`([^`]+)`/g, '<code style="background:var(--color-surface-2);padding:0.1rem 0.35rem;border-radius:3px;font-family:var(--font-mono);font-size:0.8em;color:var(--color-accent)">$1</code>')
    .replace(/^- (.+)$/gm, '<li style="margin:0.15rem 0;font-size:0.85rem;color:var(--color-muted);line-height:1.5">$1</li>')
    .replace(/\n\n/g, '</p><p style="margin:0.4rem 0;color:var(--color-muted);font-size:0.85rem;line-height:1.5">')
    .replace(/^(?!<[hul]|%%CODE)(.+)$/gm, '<p style="margin:0.4rem 0;color:var(--color-muted);font-size:0.85rem;line-height:1.5">$1</p>')
    .replace(/<p><\/p>/g, '');

  // Restore code blocks with syntax highlighting
  codeBlocks.forEach((code, i) => {
    const highlighted = highlightPython(code);
    processed = processed.replace(
      `%%CODEBLOCK_${i}%%`,
      `<pre style="background:var(--color-surface-2);border:1px solid var(--color-border);border-radius:6px;padding:0.75rem 1rem;overflow-x:auto;margin:0.5rem 0;font-family:var(--font-mono);font-size:0.8rem;line-height:1.5"><code>${highlighted}</code></pre>`,
    );
  });

  return processed;
}
