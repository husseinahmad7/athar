import * as React from "react"
import { cn } from "@/utils"

const Badge = React.forwardRef(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: "bg-emerald-100 text-emerald-800 border-emerald-200",
    outline: "border-2 border-gray-300 bg-white",
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  )
})

export { Badge }
