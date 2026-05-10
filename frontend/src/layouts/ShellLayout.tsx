import { NavLink, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";

export function ShellLayout({
  title,
  links,
  variant = "default",
}: {
  title: string;
  links: Array<{ to: string; label: string }>;
  variant?: "default" | "coordinator" | "editor";
}) {
  const logout = useAuthStore((s) => s.logout);

  const shell =
    variant === "coordinator"
      ? "min-h-full bg-[radial-gradient(ellipse_at_top,_hsl(260_40%_12%),_hsl(222_47%_6%))] text-[hsl(210_25%_98%)]"
      : variant === "editor"
        ? "min-h-full bg-gradient-to-b from-background via-background to-muted/50 text-foreground"
        : "min-h-full bg-background text-foreground";

  const aside =
    variant === "coordinator"
      ? "w-64 border-r border-white/10 bg-black/25 backdrop-blur-sm"
      : variant === "editor"
        ? "w-64 border-r bg-card/80 backdrop-blur-sm"
        : "w-64 border-r bg-card";

  const navActive =
    variant === "coordinator"
      ? "bg-amber-500/15 text-amber-50 ring-1 ring-amber-400/25"
      : undefined;

  return (
    <div className={shell}>
      <div className="flex min-h-screen">
        <aside className={aside}>
          <div className="p-4">
            <div className="text-sm font-semibold">{title}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {variant === "coordinator" ? "Operations pipeline" : variant === "editor" ? "Focus mode" : "Wedding Production"}
            </div>
          </div>
          <nav className="px-2 pb-4">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-2 text-sm ${
                    isActive
                      ? navActive ?? "bg-secondary text-foreground"
                      : variant === "coordinator"
                        ? "text-white/70 hover:bg-white/10"
                        : "text-muted-foreground hover:bg-secondary/60"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="flex-1">
          <header
            className={`flex items-center justify-end gap-3 border-b px-6 py-3 ${
              variant === "coordinator" ? "border-white/10 bg-black/20" : "bg-card"
            }`}
          >
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

