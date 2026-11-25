'use client';

import { Grid } from "ldrs/react";
import 'ldrs/react/Grid.css';
import { cn } from "@/lib/utils";
import { BrandWordmark } from "./BrandWordmark";
import { useReducedMotion } from "@/app/lib/use-reduced-motion";

export type BrandLogoProps = {
  size?: 'sm' | 'md';
  showWordmark?: boolean;
  className?: string;
  color?: string;
};

export function BrandLogo({ size = 'md', showWordmark = true, className, color = "#FFF" }: BrandLogoProps) {
  const reduceMotion = useReducedMotion();
  const isSmall = size === 'sm';
  // Plate proportions: Grid size ~2.6x wordmark height, gap ~0.469x height, minus the Grid host padding (~0.2px at md).
  const gridSize = isSmall ? 24 : 32;
  const wordmarkHeight = gridSize / 2.6;

  return (
    <div
      className={cn("flex items-center", className)}
      style={{ color, gap: wordmarkHeight * 0.453 }}
      role={showWordmark ? undefined : "img"}
      aria-label={showWordmark ? undefined : "Boolstack"}
    >
      <span aria-hidden="true" className="flex items-center justify-center">
        <Grid size={String(gridSize)} speed={reduceMotion ? "0" : "4"} color={color} />
      </span>
      {showWordmark && (
        <BrandWordmark style={{ height: wordmarkHeight }} />
      )}
    </div>
  );
}
