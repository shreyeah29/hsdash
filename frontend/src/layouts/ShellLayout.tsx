import { NavLink, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";

export function ShellLayout({
  title,
  links,
}: {
  title: string;
  links: Array<{ to: string; label: string }>;
}) {
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-full bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className="w-64 border-r bg-card">
          <div className="p-4">
            <div className="text-sm font-semibold">{title}</div>
            <div className="mt-1 text-xs text-muted-foreground">Wedding Production</div>
          </div>
          <nav className="px-2 pb-4">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-2 text-sm ${
                    isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="flex-1">
          <header className="flex items-center justify-end gap-3 border-b bg-card px-6 py-3">
            <Button variant="outline" onClick={() => void logout()}>
              Logout
            </Button>
          </header>
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

