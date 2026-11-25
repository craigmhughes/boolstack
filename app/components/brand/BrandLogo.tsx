'use client';

import { Grid } from "ldrs/react";
import 'ldrs/react/Grid.css';
import { cn } from "@/lib/utils";
import { BrandWordmark } from "./BrandWordmark";

export type BrandLogoProps = {
  size?: 'sm' | 'md';
  showWordmark?: boolean;
  className?: string;
};

export function BrandLogo({ size = 'md', showWordmark = true, className }: BrandLogoProps) {
  const isSmall = size === 'sm';
  // Plate proportions: Grid size ~2.6x wordmark height, gap ~0.469x height, minus the Grid host padding (~0.2px at md).
  const gridSize = isSmall ? 24 : 32;
  const wordmarkHeight = gridSize / 2.6;

  return (
    <div
      className={cn("text-white flex items-center", className)}
      style={{ gap: wordmarkHeight * 0.453 }}
      aria-label={showWordmark ? undefined : "Boolstack"}
    >
      <span className="flex items-center justify-center">
        <Grid size={String(gridSize)} speed="4" color="#FFF" />
      </span>
      {showWordmark && (
        <BrandWordmark style={{ height: wordmarkHeight }} />
      )}
    </div>
  );
}
