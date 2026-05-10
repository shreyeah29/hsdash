import * as React from "react";
import { cn } from "@/lib/utils";

export function Select({
  value,
  onValueChange,
  children,
  disabled,
}: {
  value?: string;
  onValueChange?: (v: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <select
      className={cn("premium-field h-10 cursor-pointer py-0", disabled && "cursor-not-allowed opacity-55")}
      value={value}
      disabled={disabled}
      onChange={(e) => onValueChange?.(e.target.value)}
    >
      {children}
    </select>
  );
}

export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  return <option value={value}>{children}</option>;
}

