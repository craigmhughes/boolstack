import { cn } from "@/lib/utils";
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

type DotColor = {
  light: string;
  dark: string;
};

export interface FineGrainPatternProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  dotColor1?: DotColor;
  dotColor2?: DotColor;
  backgroundColor?: string;
}

const FineGrainPattern = forwardRef<HTMLDivElement, FineGrainPatternProps>(
  (
    {
      children,
      className,
      dotColor1 = { light: "#d4d4d4", dark: "#4a5568" },
      dotColor2 = { light: "#e5e5e5", dark: "#2d3748" },
      backgroundColor = "bg-[#FAFAFA] dark:bg-slate-950",
      ...props
    },
    ref,
  ) => {
    const color1Light = typeof dotColor1 === "string" ? dotColor1 : dotColor1.light;
    const color1Dark = typeof dotColor1 === "string" ? dotColor1 : dotColor1.dark;
    const color2Light = typeof dotColor2 === "string" ? dotColor2 : dotColor2.dark;
    const color2Dark = typeof dotColor2 === "string" ? dotColor2 : dotColor2.dark;

    return (
      <div
        ref={ref}
        data-slot="fine-grain-pattern"
        className={cn(
          `relative isolate overflow-hidden ${backgroundColor}`,
          className,
        )}
        style={
          {
            "--dot-color-1-light": color1Light,
            "--dot-color-1-dark": color1Dark,
            "--dot-color-2-light": color2Light,
            "--dot-color-2-dark": color2Dark,
          } as React.CSSProperties
        }
        {...props}
      >
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 -z-10 [background-size:3px_3px] opacity-55",
            "[background-image:radial-gradient(circle,var(--dot-color-1-light)_1px,transparent_1px)]",
            "dark:[background-image:radial-gradient(circle,var(--dot-color-1-dark)_1px,transparent_1px)]",
          )}
        />

        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 -z-10 [background-size:5px_5px] opacity-40",
            "[background-image:radial-gradient(circle,var(--dot-color-2-light)_1px,transparent_1px)]",
            "dark:[background-image:radial-gradient(circle,var(--dot-color-2-dark)_1px,transparent_1px)]",
          )}
        />

        {children}
      </div>
    );
  },
);

FineGrainPattern.displayName = "FineGrainPattern";

export { FineGrainPattern };