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

const fieldClass = "h-11 w-full border-2 border-black bg-white px-4 text-sm font-medium text-black outline-none focus:border-[var(--admin-accent)]";

export function AdminInput({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldClass} ${className}`} />;
}

export function AdminSelect({
  className = "",
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`${fieldClass} ${className}`}>
      {children}
    </select>
  );
}

export function AdminTextarea({
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${fieldClass} min-h-[100px] py-3 ${className}`} />;
}
