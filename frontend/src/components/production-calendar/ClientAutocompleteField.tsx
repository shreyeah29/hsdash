import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { ShootClientProfile } from "@/types/shootClientProfile";
import { filterClientProfiles } from "@/lib/shootClientProfiles";

type Props = {
  label: string;
  value: string;
  onChange: (next: string) => void;
  profiles: ShootClientProfile[];
  placeholder?: string;
  onSelectProfile?: (profile: ShootClientProfile) => void;
  className?: string;
};

export function ClientAutocompleteField({
  label,
  value,
  onChange,
  profiles,
  placeholder,
  onSelectProfile,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => filterClientProfiles(profiles, value), [profiles, value]);

  useEffect(() => {
    function onDocClick(ev: MouseEvent) {
      if (!wrapRef.current?.contains(ev.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    setHighlight(0);
  }, [value, suggestions.length]);

  function pick(profile: ShootClientProfile) {
    onChange(profile.displayLabel);
    onSelectProfile?.(profile);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className={cn("relative space-y-1", className)}>
      <div className="text-xs font-medium text-zinc-600">{label}</div>
      <input
        className="premium-field h-10 w-full"
        value={value}
        placeholder={placeholder}
        onChange={(ev) => {
          onChange(ev.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(ev) => {
          if (!open || !suggestions.length) return;
          if (ev.key === "ArrowDown") {
            ev.preventDefault();
            setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
          } else if (ev.key === "ArrowUp") {
            ev.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
          } else if (ev.key === "Enter") {
            ev.preventDefault();
            pick(suggestions[highlight]!);
          } else if (ev.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && suggestions.length > 0 ? (
        <ul className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
          {suggestions.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                className={cn(
                  "flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-violet-50",
                  i === highlight && "bg-violet-50",
                )}
                onMouseDown={(ev) => ev.preventDefault()}
                onClick={() => pick(p)}
              >
                <span className="font-medium text-zinc-900">{p.displayLabel}</span>
                {(p.city || p.phoneNumber) && (
                  <span className="text-xs text-zinc-500">
                    {[p.city, p.phoneNumber].filter(Boolean).join(" · ")}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
