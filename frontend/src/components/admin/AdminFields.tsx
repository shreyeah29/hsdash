import { useAdminThemeStore } from "@/store/adminTheme";

/** Applies admin palette to native inputs inside admin pages. */
export function adminFieldStyle() {
  const palette = useAdminThemeStore.getState().palette;
  return {
    backgroundColor: palette.card,
    borderColor: palette.border,
    color: palette.text,
  } as const;
}

export function AdminInput({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  const palette = useAdminThemeStore((s) => s.palette);
  return (
    <input
      {...props}
      className={`h-11 w-full rounded-2xl border px-4 text-sm outline-none ring-0 focus:border-[var(--admin-accent)] ${className}`}
      style={{
        backgroundColor: palette.card,
        borderColor: palette.border,
        color: palette.text,
      }}
    />
  );
}

export function AdminSelect({
  className = "",
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const palette = useAdminThemeStore((s) => s.palette);
  return (
    <select
      {...props}
      className={`h-11 w-full rounded-2xl border px-4 text-sm outline-none ${className}`}
      style={{
        backgroundColor: palette.card,
        borderColor: palette.border,
        color: palette.text,
      }}
    >
      {children}
    </select>
  );
}
