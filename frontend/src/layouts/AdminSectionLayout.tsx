import { ArrowLeft } from "lucide-react";
import { Link, Outlet } from "react-router-dom";
import { AdminNavBar } from "@/components/admin/AdminNavBar";
import { AdminPageBackground } from "@/components/admin/AdminPageBackground";
import { ADMIN_PALETTE, adminCssVars } from "@/lib/adminTheme";
import { ADMIN_CONTENT } from "@/lib/adminLayout";
import { cn } from "@/lib/utils";
import "@/components/admin/adminMenuAesthetic.css";

export function AdminSectionLayout({ title }: { title: string }) {
  return (
    <div className="min-h-screen" style={adminCssVars(ADMIN_PALETTE) as React.CSSProperties}>
      <AdminPageBackground className="min-h-screen">
        <AdminNavBar />
        <header className="sticky top-[3.25rem] z-20 border-b-2 border-black bg-white lg:top-[3.75rem]">
          <div className={cn(ADMIN_CONTENT, "flex items-center gap-4 py-4")}>
            <Link to="/admin" className="admin-menu-btn !px-0 w-10 justify-center" aria-label="Back to home">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="admin-display-title text-2xl lg:text-3xl">{title}</h1>
          </div>
        </header>
        <main className={cn(ADMIN_CONTENT, "py-8 pb-12")}>
          <Outlet />
        </main>
      </AdminPageBackground>
    </div>
  );
}
