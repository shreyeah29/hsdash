import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "premium-field flex h-10 w-full file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "disabled:cursor-not-allowed",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

