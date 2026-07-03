import { ArrowLeft } from "lucide-react";
import { Link, Outlet } from "react-router-dom";
import { AdminPageBackground } from "@/components/admin/AdminPageBackground";
import { useAdminThemeStore } from "@/store/adminTheme";
import { adminCssVars } from "@/lib/adminTheme";

export function AdminSectionLayout({ title }: { title: string }) {
  const palette = useAdminThemeStore((s) => s.palette);
  const studio = palette.mode === "studio";

  return (
    <div className="min-h-screen" style={adminCssVars(palette) as React.CSSProperties}>
      <AdminPageBackground className="min-h-screen">
        <header
          className="sticky top-0 z-20 border-b backdrop-blur-md"
          style={{
            borderColor: studio ? `${palette.border}38` : palette.border,
            backgroundColor: studio ? `${palette.background}d9` : `${palette.background}f2`,
          }}
        >
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-4 md:px-8">
            <Link
              to="/admin"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors"
              style={{ borderColor: palette.border, color: palette.text }}
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: palette.text }}>
              {title}
            </h1>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-5 py-6 pb-10 md:px-8">
          <Outlet />
        </main>
      </AdminPageBackground>
    </div>
  );
}
