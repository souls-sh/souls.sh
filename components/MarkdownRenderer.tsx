'use client';

import { FileText, Ghost } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
}

interface ParsedContent {
  summary?: string;
  body: string;
}

function parseFrontmatter(content: string): ParsedContent {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n?/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { body: content };
  }

  const frontmatter = match[1];
  const body = content.replace(frontmatterRegex, '');

  // Parse summary from frontmatter
  const summaryMatch = frontmatter.match(/^summary:\s*(.+)$/m);
  const summary = summaryMatch ? summaryMatch[1].trim().replace(/^["']|["']$/g, '') : undefined;

  return { summary, body };
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const { summary, body } = parseFrontmatter(content);
  return (
    <div className="prose prose-invert max-w-none">
      {summary && (
        <>
          <section className="mb-10">
            <div className="mb-3 flex items-center gap-4">
              <FileText className="h-4 w-4 text-(--ds-gray-600)" />
              <span className="text-foreground font-mono text-sm font-medium tracking-normal uppercase">
                Description
              </span>
            </div>
            <p className="leading-relaxed text-(--ds-gray-900)">{summary}</p>
          </section>

          {/* Divider */}
          <hr className="mb-10 border-(--ds-gray-200)" />
        </>
      )}

      {/* SOUL.md Label */}
      <div className="mb-4 flex items-center gap-4">
        <Ghost className="h-4 w-4 text-(--ds-gray-600)" />
        <span className="text-foreground font-mono text-sm font-medium tracking-normal uppercase">
          SOUL.md
        </span>
      </div>

      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml={true}
        components={{
          h1: ({ children }) => (
            <h1 className="text-foreground mt-8 mb-4 text-3xl font-bold">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-foreground mt-6 mb-3 text-2xl font-semibold">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-foreground mt-5 mb-2 text-xl font-semibold">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-foreground mt-4 mb-2 text-lg font-medium">{children}</h4>
          ),
          p: ({ children }) => (
            <p className="my-4 leading-relaxed text-(--ds-gray-900)">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="my-4 ml-6 list-disc text-(--ds-gray-900)">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-4 ml-6 list-decimal text-(--ds-gray-900)">{children}</ol>
          ),
          li: ({ children }) => <li className="my-1">{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-foreground underline transition-colors hover:text-(--ds-gray-900)"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          code: ({ className, children }) => {
            const isBlock = className?.includes('language-');
            if (isBlock) {
              return (
                <code className="block overflow-x-auto rounded-md bg-(--ds-gray-100) p-4 font-mono text-sm text-(--ds-gray-900)">
                  {children}
                </code>
              );
            }
            return (
              <code className="text-foreground rounded bg-(--ds-gray-200) px-1.5 py-0.5 font-mono text-sm">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="my-4 overflow-x-auto rounded-md bg-(--ds-gray-100) p-4">{children}</pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-2 border-(--ds-gray-400) pl-4 text-(--ds-gray-600) italic">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-8 border-(--ds-gray-300)" />,
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto">
              <table className="min-w-full border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-(--ds-gray-300) bg-(--ds-gray-100) px-4 py-2 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-(--ds-gray-300) px-4 py-2">{children}</td>
          ),
          strong: ({ children }) => (
            <strong className="text-foreground font-semibold">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
