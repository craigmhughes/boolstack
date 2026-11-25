'use client';

import { motion } from "motion/react";
import { BrandLogo, type BrandLogoProps } from "./BrandLogo";
import { LOGO_LAYOUT_ID } from "@/app/lib/motion";

export type BrandLogoMotionProps = BrandLogoProps & {
  wrapperClassName?: string;
};

export function BrandLogoMotion({ wrapperClassName, ...props }: BrandLogoMotionProps) {
  return (
    <motion.div
      layoutId={LOGO_LAYOUT_ID}
      layout="position"
      className={wrapperClassName}
    >
      <BrandLogo {...props} />
    </motion.div>
  );
}
