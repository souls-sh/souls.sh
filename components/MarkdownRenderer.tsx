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
            <div className="flex items-center gap-4 mb-3">
              <FileText className="h-4 w-4 text-(--ds-gray-600)" />
              <span className="text-sm font-mono font-medium tracking-normal text-foreground uppercase">
                Description
              </span>
            </div>
            <p className="text-(--ds-gray-900) leading-relaxed">{summary}</p>
          </section>

          {/* Divider */}
          <hr className="border-(--ds-gray-200) mb-10" />
        </>
      )}

      {/* SOUL.md Label */}
      <div className="flex items-center gap-4 mb-4">
        <Ghost className="h-4 w-4 text-(--ds-gray-600)" />
        <span className="text-sm font-mono font-medium tracking-normal text-foreground uppercase">
          SOUL.md
        </span>
      </div>

      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml={true}
        components={{
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold mt-8 mb-4 text-foreground">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-semibold mt-6 mb-3 text-foreground">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-semibold mt-5 mb-2 text-foreground">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-lg font-medium mt-4 mb-2 text-foreground">{children}</h4>
          ),
          p: ({ children }) => (
            <p className="my-4 text-(--ds-gray-900) leading-relaxed">{children}</p>
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
              className="text-foreground underline hover:text-(--ds-gray-900) transition-colors"
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
                <code className="block bg-(--ds-gray-100) rounded-md p-4 overflow-x-auto text-sm font-mono text-(--ds-gray-900)">
                  {children}
                </code>
              );
            }
            return (
              <code className="bg-(--ds-gray-200) px-1.5 py-0.5 rounded text-sm font-mono text-foreground">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="my-4 bg-(--ds-gray-100) rounded-md p-4 overflow-x-auto">{children}</pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-4 pl-4 border-l-2 border-(--ds-gray-400) text-(--ds-gray-600) italic">
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
            <th className="border border-(--ds-gray-300) px-4 py-2 text-left font-semibold bg-(--ds-gray-100)">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-(--ds-gray-300) px-4 py-2">{children}</td>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
