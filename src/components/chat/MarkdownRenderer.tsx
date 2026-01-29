import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const CodeBlock = ({ language, children }: { language: string; children: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-3 w-full overflow-hidden" style={{ maxWidth: 'calc(100vw - 4rem)' }}>
      <div className="flex items-center justify-between bg-muted/80 px-2 sm:px-3 py-1.5 rounded-t-lg border border-b-0 border-border">
        <span className="text-xs text-muted-foreground font-mono truncate">
          {language || "plaintext"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto w-full">
        <SyntaxHighlighter
          language={language || "text"}
          style={oneDark}
          customStyle={{
            margin: 0,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderBottomLeftRadius: "0.5rem",
            borderBottomRightRadius: "0.5rem",
            fontSize: "0.75rem",
            lineHeight: "1.5",
            maxWidth: "100%",
          }}
          codeTagProps={{
            style: {
              fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
            },
          }}
          wrapLongLines={false}
        >
          {children}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

const MarkdownRenderer = ({ content, className }: MarkdownRendererProps) => {
  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-full w-full overflow-hidden break-words prose-headings:text-foreground prose-p:text-foreground prose-pre:max-w-full prose-pre:overflow-x-auto", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Code blocks
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !match && !String(children).includes("\n");

            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded-md bg-muted/80 text-[13px] font-mono text-foreground border border-border/50"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <CodeBlock language={match?.[1] || ""}>
                {String(children).replace(/\n$/, "")}
              </CodeBlock>
            );
          },
          // Pre wrapper - let code block handle it
          pre({ children }) {
            return <>{children}</>;
          },
          // Headers
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mt-6 mb-3 text-foreground first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold mt-5 mb-2 text-foreground">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold mt-4 mb-2 text-foreground">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold mt-3 mb-1.5 text-foreground">{children}</h4>
          ),
          // Paragraphs
          p: ({ children }) => (
            <p className="mb-3 last:mb-0 text-foreground leading-relaxed">{children}</p>
          ),
          // Lists
          ul: ({ children }) => (
            <ul className="list-disc pl-6 mb-3 space-y-1.5 text-foreground marker:text-muted-foreground">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 mb-3 space-y-1.5 text-foreground marker:text-muted-foreground">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-foreground leading-relaxed pl-1">{children}</li>
          ),
          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
            >
              {children}
            </a>
          ),
          // Blockquotes - styled like callouts
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/50 bg-muted/50 pl-4 pr-4 py-3 my-4 rounded-r-lg text-foreground not-italic">
              {children}
            </blockquote>
          ),
          // Horizontal rule
          hr: () => <hr className="my-6 border-border" />,
          // Bold
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          // Italic
          em: ({ children }) => (
            <em className="italic text-foreground/90">{children}</em>
          ),
          // Tables
          table: ({ children }) => (
            <div className="my-4 w-full overflow-hidden rounded-lg border border-border" style={{ maxWidth: 'calc(100vw - 4rem)' }}>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-xs sm:text-sm whitespace-nowrap">
                  {children}
                </table>
              </div>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/70">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border-b border-border px-2 sm:px-4 py-2 sm:py-2.5 text-left font-semibold text-foreground">
              {children}
            </th>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-border">{children}</tbody>
          ),
          td: ({ children }) => (
            <td className="px-2 sm:px-4 py-2 sm:py-2.5 text-foreground">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
