'use client';

import { useState } from "react";
import { IconCheck, IconCopy } from "@tabler/icons-react";

export function CopyCodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="relative my-6 rounded-xl border border-slate-800 bg-slate-950">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
        <span className="text-xs tracking-wider text-slate-400">Copy and paste</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
        >
          {copied ? <IconCheck size={16} aria-hidden="true" /> : <IconCopy size={16} aria-hidden="true" />}
          {copied ? "Copied" : "Copy prompt"}
        </button>
        <span role="status" className="sr-only">{copied ? "Copied to clipboard" : ""}</span>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed whitespace-pre-wrap text-slate-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}
