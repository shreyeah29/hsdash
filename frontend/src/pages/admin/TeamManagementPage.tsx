import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { UserPlus } from "lucide-react";
import { api } from "@/services/api";
import { AdminInput, AdminSelect } from "@/components/admin/AdminFields";
import { AdminSurface } from "@/components/admin/AdminSurface";
import {
  AdminButton,
  AdminPageHeader,
  AdminStatCard,
  useAdminPalette,
} from "@/components/admin/AdminUi";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { User } from "@/types/domain";
import { Role, Team } from "@/types/domain";

async function fetchUsers() {
  const { data } = await api.get<{ users: User[] }>("/users");
  return data.users;
}

type UserForm = {
  id?: string;
  name: string;
  username: string;
  password?: string;
  role: string;
  team: string;
  designation: string;
  isActive: boolean;
};

function errMsg(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const msg = (e.response?.data as { message?: string })?.message;
    if (typeof msg === "string") return msg;
    return e.message;
  }
  return "Something went wrong.";
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export function TeamManagementPage() {
  const palette = useAdminPalette();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["users"], queryFn: fetchUsers });

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState<UserForm>({
    name: "",
    username: "",
    password: "",
    role: Role.EDITOR,
    team: Team.PHOTO_TEAM,
    designation: "",
    isActive: true,
  });

  const users = useMemo(() => data ?? [], [data]);

  const stats = useMemo(() => {
    let admins = 0;
    let coordinators = 0;
    let editors = 0;
    let active = 0;
    for (const u of users) {
      if (u.isActive) active++;
      if (u.role === Role.ADMIN) admins++;
      else if (u.role === Role.COORDINATOR) coordinators++;
      else editors++;
    }
    return { total: users.length, active, admins, coordinators, editors };
  }, [users]);

  const createUser = useMutation({
    mutationFn: async () => {
      await api.post("/users", {
        name: form.name,
        username: form.username,
        password: form.password,
        role: form.role,
        team: form.role === Role.ADMIN ? null : form.team,
        designation: form.role === Role.ADMIN ? null : form.designation,
        isActive: form.isActive,
      });
    },
    onSuccess: async () => {
      setOpen(false);
      await qc.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const updateUser = useMutation({
    mutationFn: async () => {
      await api.put(`/users/${form.id}`, {
        name: form.name,
        username: form.username,
        password: form.password ? form.password : undefined,
        role: form.role,
        team: form.role === Role.ADMIN ? null : form.team,
        designation: form.role === Role.ADMIN ? null : form.designation,
        isActive: form.isActive,
      });
    },
    onSuccess: async () => {
      setOpen(false);
      await qc.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const resetPassword = useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      await api.post(`/users/${id}/reset-password`, { password });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["users"] });
    },
  });

  function openCreate() {
    setMode("create");
    setForm({
      name: "",
      username: "",
      password: "",
      role: Role.EDITOR,
      team: Team.PHOTO_TEAM,
      designation: "",
      isActive: true,
    });
    setOpen(true);
  }

  function openEdit(u: User) {
    setMode("edit");
    setForm({
      id: u.id,
      name: u.name,
      username: u.username,
      password: "",
      role: u.role,
      team: u.team ?? Team.PHOTO_TEAM,
      designation: u.designation ?? "",
      isActive: u.isActive,
    });
    setOpen(true);
  }

  const needsTeam = form.role === Role.EDITOR || form.role === Role.COORDINATOR;
  const canSubmit =
    !!form.name &&
    !!form.username &&
    (mode === "edit" || (form.password && form.password.length >= 8)) &&
    (form.role === Role.ADMIN || (needsTeam && !!form.team));

  return (
    <div className="space-y-8">
      <AdminPageHeader
        label="TEAM"
        title="Studio roster"
        subtitle="Manage editors, coordinators, and access — same as the mobile Team shortcut."
        actions={
          <AdminButton onClick={openCreate}>
            <UserPlus className="h-4 w-4" />
            Add member
          </AdminButton>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Total" value={stats.total} />
        <AdminStatCard label="Active" value={stats.active} />
        <AdminStatCard label="Coordinators" value={stats.coordinators} />
        <AdminStatCard label="Editors" value={stats.editors} />
      </div>

      {isLoading ? (
        <p className="text-sm" style={{ color: palette.textSecondary }}>
          Loading team…
        </p>
      ) : null}

      {!isLoading && users.length === 0 ? (
        <AdminSurface className="py-14 text-center">
          <p className="font-medium" style={{ color: palette.text }}>
            No team members yet
          </p>
          <AdminButton className="mt-6" onClick={openCreate}>
            Create first member
          </AdminButton>
        </AdminSurface>
      ) : null}

      {!isLoading && users.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {users.map((u) => (
            <AdminSurface key={u.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold"
                    style={{ backgroundColor: `${palette.accent}22`, color: palette.accent }}
                  >
                    {initials(u.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold" style={{ color: palette.text }}>
                      {u.name}
                    </p>
                    <p className="truncate text-sm" style={{ color: palette.textSecondary }}>
                      @{u.username}
                    </p>
                  </div>
                </div>
                <span
                  className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase"
                  style={{ borderColor: palette.border, color: palette.textSecondary }}
                >
                  {u.role}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-medium uppercase" style={{ color: palette.textSecondary }}>
                <span className="rounded-lg border px-2 py-1" style={{ borderColor: palette.border }}>
                  {u.team?.replaceAll("_", " ") ?? "No team"}
                </span>
                <span className="rounded-lg border px-2 py-1" style={{ borderColor: palette.border }}>
                  {u.isActive ? "Active" : "Paused"}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t pt-4" style={{ borderColor: palette.border }}>
                <AdminButton variant="outline" onClick={() => openEdit(u)}>
                  Edit
                </AdminButton>
                {u.role !== Role.ADMIN ? (
                  <AdminButton variant="ghost" disabled={deleteUser.isPending} onClick={() => deleteUser.mutate(u.id)}>
                    Remove
                  </AdminButton>
                ) : null}
              </div>
            </AdminSurface>
          ))}
        </div>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto" style={{ backgroundColor: palette.card, borderColor: palette.border }}>
          <DialogHeader>
            <DialogTitle style={{ color: palette.text }}>{mode === "create" ? "Invite teammate" : "Update teammate"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <AdminInput placeholder="Full name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <AdminInput placeholder="Username" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} />
            <AdminInput
              type="password"
              placeholder={mode === "create" ? "Password (min 8)" : "New password (optional)"}
              value={form.password ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminSelect value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                <option value={Role.ADMIN}>Admin</option>
                <option value={Role.COORDINATOR}>Coordinator</option>
                <option value={Role.EDITOR}>Editor</option>
              </AdminSelect>
              <AdminSelect disabled={!needsTeam} value={form.team} onChange={(e) => setForm((f) => ({ ...f, team: e.target.value }))}>
                <option value={Team.PHOTO_TEAM}>Photo team</option>
                <option value={Team.CINEMATIC_TEAM}>Cinematic team</option>
                <option value={Team.TRADITIONAL_TEAM}>Traditional team</option>
                <option value={Team.ALBUM_TEAM}>Album team</option>
                <option value={Team.COORDINATOR_TEAM}>Coordinator team</option>
              </AdminSelect>
            </div>
            <AdminInput
              placeholder="Designation"
              value={form.designation}
              disabled={form.role === Role.ADMIN}
              onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
            />
            <label className="flex items-center justify-between rounded-xl border px-4 py-3" style={{ borderColor: palette.border }}>
              <span className="text-sm" style={{ color: palette.text }}>
                Active seat
              </span>
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
            </label>
            {createUser.isError ? <p className="text-xs" style={{ color: palette.error }}>{errMsg(createUser.error)}</p> : null}
            <div className="flex justify-end gap-2 border-t pt-4" style={{ borderColor: palette.border }}>
              {mode === "edit" && form.id && form.password ? (
                <AdminButton
                  variant="outline"
                  disabled={resetPassword.isPending || form.password.length < 8}
                  onClick={() => resetPassword.mutate({ id: form.id!, password: form.password! })}
                >
                  Reset password
                </AdminButton>
              ) : null}
              <AdminButton variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </AdminButton>
              <AdminButton disabled={!canSubmit || createUser.isPending || updateUser.isPending} onClick={() => (mode === "create" ? createUser.mutate() : updateUser.mutate())}>
                Save
              </AdminButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
