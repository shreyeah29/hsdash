import { ArrowLeft } from "lucide-react";
import { Link, Outlet } from "react-router-dom";
import { TeamNavBar } from "@/components/team/TeamNavBar";
import { AdminPageBackground } from "@/components/admin/AdminPageBackground";
import { ADMIN_PALETTE, adminCssVars } from "@/lib/adminTheme";
import { ADMIN_CONTENT } from "@/lib/adminLayout";
import { cn } from "@/lib/utils";
import "@/components/admin/adminMenuAesthetic.css";

export function TeamSectionLayout({ title }: { title: string }) {
  return (
    <div className="min-h-screen" style={adminCssVars(ADMIN_PALETTE) as React.CSSProperties}>
      <AdminPageBackground className="min-h-screen">
        <TeamNavBar />
        <header className="sticky top-[3.25rem] z-20 border-b-2 border-black bg-white lg:top-[3.75rem]">
          <div className={cn(ADMIN_CONTENT, "flex items-center gap-4 py-4")}>
            <Link to="/team" className="admin-menu-btn w-10 justify-center !px-0" aria-label="Back to home">
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
