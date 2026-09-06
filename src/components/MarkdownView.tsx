import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownViewProps {
  content: string;
  isUser?: boolean;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content, isUser = false }) => {
  return (
    <div className="markdown-content text-xs sm:text-sm leading-relaxed space-y-2 select-text">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-base sm:text-lg font-semibold text-[#111827] dark:text-white mt-3 mb-1.5 tracking-tight font-serif">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm sm:text-base font-semibold text-[#111827] dark:text-white mt-2.5 mb-1 tracking-tight font-serif">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs sm:text-sm font-semibold text-indigo-700 dark:text-indigo-400 mt-2 mb-1 uppercase tracking-wider font-mono">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="leading-relaxed mb-2 last:mb-0 whitespace-pre-wrap">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside ml-4 mb-2 space-y-1 marker:text-indigo-500">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside ml-4 mb-2 space-y-1 marker:text-indigo-500 font-mono">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-1">
              {children}
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-[#111827] dark:text-white">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-indigo-900 dark:text-indigo-200">
              {children}
            </em>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-indigo-500/70 pl-3 my-2.5 italic text-[#4B5563] dark:text-[#9CA3AF] bg-indigo-500/5 py-1 rounded-r-xs font-serif text-sm">
              {children}
            </blockquote>
          ),
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');
            if (isInline) {
              return (
                <code
                  className="font-mono text-[11px] sm:text-xs px-1.5 py-0.5 rounded-xs bg-[#E5E7EB] dark:bg-[#1E1E24] text-indigo-700 dark:text-indigo-300 font-medium"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <div className="my-2.5 rounded-xs overflow-hidden border border-[#E2E4E8] dark:border-[#26262a]">
                {match && (
                  <div className="bg-[#E5E7EB] dark:bg-[#16161A] px-3 py-1 text-[10px] font-mono text-[#6B7280] dark:text-[#888] uppercase tracking-wider border-b border-[#E2E4E8] dark:border-[#26262a]">
                    {match[1]}
                  </div>
                )}
                <pre className="p-3 bg-[#F9FAFC] dark:bg-[#0A0A0C] text-[#1F2937] dark:text-[#E0E0E0] overflow-x-auto font-mono text-xs leading-normal">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 border border-[#E2E4E8] dark:border-[#26262a] rounded-xs shadow-xs">
              <table className="w-full text-xs text-left border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[#F4F4F6] dark:bg-[#141416] border-b border-[#E2E4E8] dark:border-[#26262a] text-[#111827] dark:text-white font-semibold">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="p-2.5 border-b border-[#E2E4E8] dark:border-[#26262a]">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="p-2.5 border-b border-[#E2E4E8] dark:border-[#26262a] text-[#374151] dark:text-[#CCC]">
              {children}
            </td>
          ),
          hr: () => (
            <hr className="my-4 border-t border-[#E2E4E8] dark:border-[#26262a]" />
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
