import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "./components/ThemeProvider";
import { introInitScript } from "./lib/intro";

const dmSans = DM_Sans({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Boolstack | Apps",
  description: "Local-first admin panel for your personal HTML apps.",
  openGraph: {
    title: "Boolstack",
    description: "Local-first admin panel for your personal HTML apps.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Boolstack",
    description: "Local-first admin panel for your personal HTML apps.",
  },
};

export const viewport: Viewport = { themeColor: "#0F0F0D" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", "font-sans", dmSans.variable)}
      style={{ colorScheme: 'dark', scrollPaddingBottom: '6rem' }}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: introInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-black text-slate-100">
        <div id="intro-cover" aria-hidden="true" />
        <ThemeProvider
          attribute="class"
          forcedTheme="light"
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      
      </body>
    </html>
  );
}
