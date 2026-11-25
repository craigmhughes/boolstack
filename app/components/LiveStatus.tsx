import { cn } from "@/lib/utils";

export type LiveStatusProps = {
  message: string;
  className?: string;
  politeness?: "polite" | "assertive";
  visible?: boolean;
};

/** Always-mounted live region so screen readers announce text changes. */
export function LiveStatus({
  message,
  className,
  politeness = "polite",
  visible = false,
}: LiveStatusProps) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className={visible ? className : cn("sr-only", className)}
    >
      {message}
    </div>
  );
}
