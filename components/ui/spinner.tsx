import { IconLoader2 } from "@tabler/icons-react"
import { cn } from "cn"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <IconLoader2 
      data-slot="spinner" 
      aria-hidden="true"
      className={cn("size-4 animate-spin motion-reduce:animate-none", className)} 
      {...props} 
    />
  )
}

export { Spinner }
