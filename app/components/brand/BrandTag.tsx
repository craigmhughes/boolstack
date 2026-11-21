import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type BrandTagProps = {
  tone?: 'blue' | 'danger';
  className?: string;
  children?: React.ReactNode;
};

const toneClasses: Record<NonNullable<BrandTagProps['tone']>, string> = {
  blue: "border-blue-800 bg-blue-950 text-blue-400",
  danger: "border-red-900 bg-red-950! text-red-400",
};

export function BrandTag({ tone = 'blue', className, children }: BrandTagProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "border px-3 py-3 text-[11px] rounded-sm",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </Badge>
  );
}
