import { cn } from "@/lib/utils";

export type BrandHeadingProps = {
  as?: 'h1' | 'h2';
  className?: string;
  children?: React.ReactNode;
};

export function BrandHeading({ as = 'h1', className, children }: BrandHeadingProps) {
  const Comp = as;

  return (
    <Comp
      className={cn(
        "font-medium text-4xl tracking-tight text-slate-100 max-md:text-3xl",
        className
      )}
    >
      {children}
    </Comp>
  );
}
