'use client';

import { Grid } from "ldrs/react";
import 'ldrs/react/Grid.css';
import { cn } from "@/lib/utils";

export type BrandLogoProps = {
  size?: 'sm' | 'md';
  showWordmark?: boolean;
  className?: string;
};

export function BrandLogo({ size = 'md', showWordmark = true, className }: BrandLogoProps) {
  const isSmall = size === 'sm';

  return (
    <div
      className={cn(
        "font-medium tracking-tighter flex items-end gap-2",
        isSmall && "text-sm",
        className
      )}
      aria-label={showWordmark ? undefined : "Boolstack.dev"}
    >
      <span className="flex items-center justify-center relative -top-0.5">
        <Grid
          size={isSmall ? "14" : "20"}
          speed="4"
          color="white"
        />
      </span>
      {showWordmark && "Boolstack.dev"}
    </div>
  );
}
