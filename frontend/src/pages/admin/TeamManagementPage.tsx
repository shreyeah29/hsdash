import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import axios from "axios";
import { Mail, Shield, Sparkles, UserPlus, Users } from "lucide-react";
import { api } from "@/services/api";
import { AnimatedStatCard } from "@/components/premium/AnimatedStatCard";
import { BorderBeam } from "@/components/premium/BorderBeam";
import { GlassPanel } from "@/components/premium/GlassPanel";
import { GradientShimmerText } from "@/components/premium/GradientShimmerText";
import { Spotlight } from "@/components/premium/Spotlight";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { User } from "@/types/domain";
import { Role, Team } from "@/types/domain";

type UsersResponse = {
  users: User[];
};

async function fetchUsers() {
  const { data } = await api.get<UsersResponse>("/users");
  return data.users;
}

type UserForm = {
  id?: string;
  name: string;
  email: string;
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

function roleChipClasses(role: string) {
  if (role === Role.ADMIN) return "border-violet-400/35 bg-violet-500/12 text-violet-100";
  if (role === Role.COORDINATOR) return "border-amber-400/35 bg-amber-500/12 text-amber-50";
  return "border-emerald-400/35 bg-emerald-500/12 text-emerald-50";
}

const listParent = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.055 } },
};
const listItem = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const } },
};

export function TeamManagementPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["users"], queryFn: fetchUsers });

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState<UserForm>({
    name: "",
    email: "",
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
      const { data } = await api.post("/users", {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        team: form.role === Role.ADMIN ? null : form.team,
        designation: form.role === Role.ADMIN ? null : form.designation,
        isActive: form.isActive,
      });
      return data;
    },
    onSuccess: async () => {
      setOpen(false);
      await qc.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const updateUser = useMutation({
    mutationFn: async () => {
      const { data } = await api.put(`/users/${form.id}`, {
        name: form.name,
        email: form.email,
        password: form.password ? form.password : undefined,
        role: form.role,
        team: form.role === Role.ADMIN ? null : form.team,
        designation: form.role === Role.ADMIN ? null : form.designation,
        isActive: form.isActive,
      });
      return data;
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
      email: "",
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
      email: u.email,
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
    !!form.email &&
    (mode === "edit" || (form.password && form.password.length >= 8)) &&
    (form.role === Role.ADMIN || (needsTeam && !!form.team));

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-10">
      <Spotlight className="rounded-3xl border border-zinc-200/80" glowColor="rgba(139, 92, 246, 0.08)">
        <div className="relative px-1 py-1 md:px-2 md:py-2">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">People & access</p>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl">
                <GradientShimmerText>Roster command center</GradientShimmerText>
              </h1>
              <p className="text-sm leading-relaxed text-zinc-600">
                Invite editors, seat coordinators, and curate studio defaults — crystal-clear roles without enterprise clutter.
              </p>
            </div>
            <Button variant="premium" className="rounded-xl px-6 py-6 text-[15px] shadow-glow" onClick={openCreate}>
              <UserPlus className="h-4 w-4" />
              Add member
            </Button>
          </div>
        </div>
      </Spotlight>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AnimatedStatCard label="Studio roster" value={stats.total} hint="Accounts provisioned" accent="violet" delay={0} icon={Users} />
        <AnimatedStatCard
          label="Active seats"
          value={stats.active}
          hint="Currently signing in"
          accent="emerald"
          delay={0.06}
          icon={Sparkles}
        />
        <AnimatedStatCard label="Coordinators" value={stats.coordinators} hint="Routing specialists" accent="amber" delay={0.12} icon={Shield} />
        <AnimatedStatCard label="Editors" value={stats.editors} hint="Creative throughput" accent="cyan" delay={0.18} icon={Mail} />
      </div>

      {isLoading ? (
        <GlassPanel className="p-12 text-center text-sm text-zinc-400">Syncing roster…</GlassPanel>
      ) : null}

      {!isLoading && users.length === 0 ? (
        <GlassPanel className="p-14 text-center shine">
          <p className="font-medium text-zinc-900">No team members yet</p>
          <p className="mt-2 text-sm text-zinc-500">Spin up your first editor or coordinator to unlock assignments.</p>
          <Button variant="premium" className="mt-6 rounded-xl" onClick={openCreate}>
            Create first member
          </Button>
        </GlassPanel>
      ) : null}

      {!isLoading && users.length > 0 ? (
        <motion.div variants={listParent} initial="hidden" animate="show" className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {users.map((u) => (
            <motion.div key={u.id} variants={listItem}>
              <BorderBeam>
                <GlassPanel className="relative h-full border-zinc-100 p-6 shine">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-cyan-50 text-lg font-semibold text-violet-900 shadow-inner ring-1 ring-zinc-200/80">
                        {initials(u.name)}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-[17px] font-semibold tracking-tight text-zinc-900">{u.name}</p>
                        <p className="truncate text-sm text-zinc-500">{u.email}</p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide",
                        roleChipClasses(u.role),
                      )}
                    >
                      {u.role}
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                    <span className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-zinc-700">
                      {u.team?.replaceAll("_", " ") ?? "No team"}
                    </span>
                    <span className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-zinc-700">
                      {u.designation?.trim() || "—"}
                    </span>
                    <span
                      className={
                        u.isActive
                          ? "rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 text-emerald-200"
                          : "rounded-lg border border-zinc-200 bg-zinc-100 px-2.5 py-1 text-zinc-600"
                      }
                    >
                      {u.isActive ? "Active" : "Paused"}
                    </span>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2 border-t border-zinc-100 pt-5">
                    <Button size="sm" variant="glass" className="rounded-xl" onClick={() => openEdit(u)}>
                      Edit
                    </Button>
                    {u.role !== Role.ADMIN ? (
                      <Button
                        size="sm"
                        variant="glass"
                        className="rounded-xl border-rose-400/25 text-rose-200 hover:bg-rose-500/10"
                        disabled={deleteUser.isPending}
                        onClick={() => deleteUser.mutate(u.id)}
                      >
                        Remove
                      </Button>
                    ) : null}
                  </div>
                </GlassPanel>
              </BorderBeam>
            </motion.div>
          ))}
        </motion.div>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto border-zinc-200">
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Invite teammate" : "Update teammate"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="space-y-1">
              <div className="text-xs font-medium text-zinc-400">Name</div>
              <Input placeholder="Full name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-zinc-400">Email</div>
              <Input
                type="email"
                placeholder="you@studio.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-zinc-400">
                {mode === "create" ? "Password (min 8 chars)" : "New password (optional)"}
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={form.password ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <div className="text-xs font-medium text-zinc-400">Role</div>
                <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                  <SelectItem value={Role.ADMIN}>Admin</SelectItem>
                  <SelectItem value={Role.COORDINATOR}>Coordinator</SelectItem>
                  <SelectItem value={Role.EDITOR}>Editor</SelectItem>
                </Select>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium text-zinc-400">Team</div>
                <Select disabled={!needsTeam} value={form.team} onValueChange={(v) => setForm((f) => ({ ...f, team: v }))}>
                  <SelectItem value={Team.PHOTO_TEAM}>Photo team</SelectItem>
                  <SelectItem value={Team.CINEMATIC_TEAM}>Cinematic team</SelectItem>
                  <SelectItem value={Team.TRADITIONAL_TEAM}>Traditional team</SelectItem>
                  <SelectItem value={Team.ALBUM_TEAM}>Album team</SelectItem>
                  <SelectItem value={Team.COORDINATOR_TEAM}>Coordinator team</SelectItem>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-medium text-zinc-400">Designation</div>
              <Input
                placeholder="e.g. Lead cinematic editor"
                value={form.designation}
                disabled={form.role === Role.ADMIN}
                onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
              />
            </div>

            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <span className="text-sm text-zinc-800">Active seat</span>
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-zinc-300 bg-white text-violet-600 focus:ring-violet-500/40"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
            </label>

            {createUser.isError ? <p className="text-xs text-rose-300">{errMsg(createUser.error)}</p> : null}
            {updateUser.isError ? <p className="text-xs text-rose-300">{errMsg(updateUser.error)}</p> : null}

            <div className="mt-2 flex flex-wrap justify-end gap-2 border-t border-zinc-100 pt-4">
              {mode === "edit" && form.id && form.password ? (
                <Button
                  variant="glass"
                  className="rounded-xl"
                  type="button"
                  disabled={resetPassword.isPending || form.password.length < 8}
                  onClick={() => resetPassword.mutate({ id: form.id!, password: form.password! })}
                >
                  Reset password
                </Button>
              ) : null}
              <Button variant="glass" className="rounded-xl" type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="premium"
                className="rounded-xl"
                type="button"
                disabled={!canSubmit || createUser.isPending || updateUser.isPending}
                onClick={() => (mode === "create" ? createUser.mutate() : updateUser.mutate())}
              >
                {createUser.isPending || updateUser.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
