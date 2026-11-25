import { cn } from "@/lib/utils";

export type BrandDividerProps = {
  className?: string;
  children?: React.ReactNode;
};

export function BrandDivider({ className, children }: BrandDividerProps) {
  return (
    <div className={cn("w-full flex items-center gap-4", className)}>
      <hr aria-hidden="true" className="flex-grow border-t border-slate-700" />
      {children != null && (
        <>
          <p className="text-xs whitespace-nowrap text-slate-300">{children}</p>
          <hr aria-hidden="true" className="flex-grow border-t border-slate-700" />
        </>
      )}
    </div>
  );
}
