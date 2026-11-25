import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import { BrandLogo } from "../components/brand/BrandLogo";
import { GuideMarkdown } from "./GuideMarkdown";

export const metadata: Metadata = {
  title: "Boolstack | User Guide",
  description: "How to upload your custom apps from any AI agent and use Boolstack as your central hub.",
};

export default async function GuidePage() {
  const source = await readFile(path.join(process.cwd(), "content", "user-guide.md"), "utf8");

  return (
    <div className="min-h-screen bg-[#0F0F0D] text-slate-100">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-slate-900 focus:shadow-lg"
      >
        Skip to guide
      </a>
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 pt-6 sm:px-6 sm:pt-10">
        <Link href="/" aria-label="Boolstack home">
          <BrandLogo />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-100 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
        >
          <IconArrowLeft size={16} aria-hidden="true" />
          Back to apps
        </Link>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-3xl px-4 pt-12 pb-24 outline-none sm:px-6">
        <GuideMarkdown source={source} />
      </main>
    </div>
  );
}
