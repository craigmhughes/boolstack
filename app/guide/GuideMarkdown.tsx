import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { CopyCodeBlock } from "./CopyCodeBlock";

function slugify(children: React.ReactNode): string {
  const text = Array.isArray(children) ? children.join("") : String(children ?? "");
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const components: Components = {
  h1: ({ children }) => (
    <h1 id="guide-title" tabIndex={-1} className="mb-6 text-4xl font-medium tracking-tight text-slate-100 outline-none">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 id={slugify(children)} className="mt-14 mb-4 text-2xl font-medium tracking-tight text-slate-100 scroll-mt-6">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 id={slugify(children)} className="mt-8 mb-3 text-lg font-medium text-slate-100 scroll-mt-6">
      {children}
    </h3>
  ),
  p: ({ children }) => <p className="my-4 leading-relaxed text-slate-300">{children}</p>,
  a: ({ href, children }) => (
    <a href={href} className="text-blue-400 underline underline-offset-4 hover:text-blue-300">
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold text-slate-100">{children}</strong>,
  ul: ({ children }) => <ul className="my-4 list-disc space-y-2 pl-6 text-slate-300 marker:text-slate-500">{children}</ul>,
  ol: ({ children }) => <ol className="my-4 list-decimal space-y-2 pl-6 text-slate-300 marker:text-slate-500">{children}</ol>,
  blockquote: ({ children }) => (
    <blockquote className="my-6 rounded-r-lg border-l-4 border-blue-600 bg-blue-950/40 px-4 py-1">{children}</blockquote>
  ),
  img: ({ src, alt }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={typeof src === "string" ? src : undefined}
      alt={alt ?? ""}
      loading="lazy"
      className="my-6 w-full rounded-xl border border-slate-800"
    />
  ),
  pre: ({ children }) => {
    // react-markdown renders fenced code as <pre><code>; hand the raw text to the copy block.
    const child = Array.isArray(children) ? children[0] : children;
    const code = (child as React.ReactElement<{ children?: React.ReactNode }>)?.props?.children;
    return <CopyCodeBlock code={String(code ?? "").replace(/\n$/, "")} />;
  },
  code: ({ children }) => (
    <code className="rounded bg-slate-800 px-1.5 py-0.5 text-[0.9em] text-slate-100">{children}</code>
  ),
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto rounded-xl border border-slate-800">
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th scope="col" className="border-b border-slate-800 bg-slate-900 px-4 py-3 font-medium text-slate-100">{children}</th>
  ),
  td: ({ children }) => <td className="border-b border-slate-800 px-4 py-3 align-top text-slate-300">{children}</td>,
};

export function GuideMarkdown({ source }: { source: string }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{source}</ReactMarkdown>;
}
