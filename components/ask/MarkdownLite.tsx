import { Fragment, type ReactNode } from 'react';

/**
 * Tiny, dependency-free Markdown renderer for AI chat answers.
 *
 * The "Ask the Markets" model replies in Markdown (**bold**, numbered/bulleted
 * lists, blank-line-separated paragraphs). Rendering the raw string showed the
 * literal `**` and collapsed every line break into one wall of text. This turns
 * that structure into real elements: paragraphs, ordered/unordered lists, and
 * inline bold / italic / code. Scope is intentionally small — it covers what
 * the model actually emits, not the full CommonMark spec.
 */

// Matches **bold**, `code`, *italic*, _italic_ (no newlines inside a span).
const INLINE_RE = /(\*\*[^*\n]+\*\*|`[^`\n]+`|\*[^*\n]+\*|_[^_\n]+_)/g;

function renderInline(text: string): ReactNode[] {
  return text.split(INLINE_RE).map((part, i) => {
    if (!part) return null;
    if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-gray-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.length > 2 && part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="rounded bg-gray-800 px-1 py-0.5 font-mono text-[0.85em] text-gray-200">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.length > 2 && ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_')))) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

type Block =
  | { kind: 'p'; lines: string[] }
  | { kind: 'h'; text: string }
  | { kind: 'ol'; items: string[] }
  | { kind: 'ul'; items: string[] };

function parseBlocks(text: string): Block[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: { kind: 'ol' | 'ul'; items: string[] } | null = null;

  const flushPara = () => {
    if (para.length) {
      blocks.push({ kind: 'p', lines: para });
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      blocks.push(list);
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushPara();
      flushList();
      continue;
    }
    const ol = line.match(/^\d+[.)]\s+(.*)$/);
    const ul = line.match(/^[-*•]\s+(.*)$/);
    const h = line.match(/^#{1,6}\s+(.*)$/);
    if (ol) {
      flushPara();
      if (!list || list.kind !== 'ol') {
        flushList();
        list = { kind: 'ol', items: [] };
      }
      list.items.push(ol[1]);
      continue;
    }
    if (ul) {
      flushPara();
      if (!list || list.kind !== 'ul') {
        flushList();
        list = { kind: 'ul', items: [] };
      }
      list.items.push(ul[1]);
      continue;
    }
    flushList();
    if (h) {
      flushPara();
      blocks.push({ kind: 'h', text: h[1] });
      continue;
    }
    para.push(line);
  }
  flushPara();
  flushList();
  return blocks;
}

// Hard cap on rendered markdown — a runaway/compromised upstream answer
// shouldn't be able to hang the tab with megabytes of regex work.
const MAX_CHARS = 50_000;

export function MarkdownLite({ text }: { text: string }) {
  const blocks = parseBlocks(text.length > MAX_CHARS ? `${text.slice(0, MAX_CHARS)}…` : text);
  return (
    <div className="space-y-2.5">
      {blocks.map((b, i) => {
        if (b.kind === 'h') {
          return (
            <p key={i} className="font-semibold text-gray-100">
              {renderInline(b.text)}
            </p>
          );
        }
        if (b.kind === 'ol') {
          return (
            <ol key={i} className="list-decimal space-y-1.5 pl-5 marker:text-gray-500">
              {b.items.map((it, j) => (
                <li key={j}>{renderInline(it)}</li>
              ))}
            </ol>
          );
        }
        if (b.kind === 'ul') {
          return (
            <ul key={i} className="list-disc space-y-1.5 pl-5 marker:text-gray-500">
              {b.items.map((it, j) => (
                <li key={j}>{renderInline(it)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i}>
            {b.lines.map((ln, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {renderInline(ln)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

export default MarkdownLite;
