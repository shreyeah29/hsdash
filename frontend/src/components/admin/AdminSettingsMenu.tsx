import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, LogOut, Settings, Shuffle, UserRound } from "lucide-react";
import { useAdminWorkspaceStore } from "@/store/adminWorkspace";
import { useAuthStore } from "@/store/auth";
import { AdminChangePasswordDialog, AdminChangeUsernameDialog } from "@/components/admin/AdminAccountDialogs";

export function AdminSettingsMenu() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const clearProfile = useAdminWorkspaceStore((s) => s.clearProfile);
  const profile = useAdminWorkspaceStore((s) => s.profile);
  const [open, setOpen] = useState(false);
  const [usernameOpen, setUsernameOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="admin-menu-btn"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <Settings className="h-3.5 w-3.5" strokeWidth={2} />
        <span className="hidden lg:inline">Settings</span>
      </button>

      {open ? (
        <div
          className="absolute right-0 top-[calc(100%+8px)] z-[120] min-w-[220px] border-2 border-black bg-white py-1 shadow-[6px_6px_0_#000]"
          role="menu"
        >
          {profile ? (
            <p className="border-b-2 border-black px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-black">
              {profile.name}
            </p>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-black hover:bg-zinc-100"
            onClick={() => {
              setOpen(false);
              setUsernameOpen(true);
            }}
          >
            <UserRound className="h-4 w-4" strokeWidth={2} />
            Change username
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-black hover:bg-zinc-100"
            onClick={() => {
              setOpen(false);
              setPasswordOpen(true);
            }}
          >
            <KeyRound className="h-4 w-4" strokeWidth={2} />
            Change password
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-black hover:bg-zinc-100"
            onClick={() => {
              setOpen(false);
              clearProfile();
              navigate("/admin/profiles", { replace: true });
            }}
          >
            <Shuffle className="h-4 w-4" strokeWidth={2} />
            Switch profile
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-3 border-t-2 border-black px-4 py-3 text-left text-sm font-semibold text-red-700 hover:bg-red-50"
            onClick={() => {
              setOpen(false);
              clearProfile();
              void logout();
            }}
          >
            <LogOut className="h-4 w-4" strokeWidth={2} />
            Sign out
          </button>
        </div>
      ) : null}

      <AdminChangeUsernameDialog open={usernameOpen} onOpenChange={setUsernameOpen} />
      <AdminChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </div>
  );
}
