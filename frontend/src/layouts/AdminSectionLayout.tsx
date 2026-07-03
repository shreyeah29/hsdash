import { ArrowLeft } from "lucide-react";
import { Link, Outlet } from "react-router-dom";
import { AdminNavBar } from "@/components/admin/AdminNavBar";
import { AdminPageBackground } from "@/components/admin/AdminPageBackground";
import { ADMIN_PALETTE, adminCssVars } from "@/lib/adminTheme";
import { ADMIN_CONTENT } from "@/lib/adminLayout";
import { cn } from "@/lib/utils";

export function AdminSectionLayout({ title }: { title: string }) {
  return (
    <div className="min-h-screen" style={adminCssVars(ADMIN_PALETTE) as React.CSSProperties}>
      <AdminPageBackground className="min-h-screen">
        <AdminNavBar />
        <header
          className="sticky top-[4.25rem] z-20 border-b backdrop-blur-md lg:top-[4.75rem]"
          style={{
            borderColor: ADMIN_PALETTE.border,
            backgroundColor: "rgba(255, 255, 255, 0.08)",
          }}
        >
          <div className={cn(ADMIN_CONTENT, "flex items-center gap-4 py-4")}>
            <Link
              to="/admin"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors hover:bg-white/10"
              style={{ borderColor: ADMIN_PALETTE.border, color: ADMIN_PALETTE.text }}
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold tracking-tight lg:text-2xl" style={{ color: ADMIN_PALETTE.text }}>
              {title}
            </h1>
          </div>
        </header>
        <main className={cn(ADMIN_CONTENT, "py-8 pb-12")}>
          <Outlet />
        </main>
      </AdminPageBackground>
    </div>
  );
}
