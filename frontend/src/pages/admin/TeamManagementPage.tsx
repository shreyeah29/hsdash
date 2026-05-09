import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

export function TeamManagementPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["users"], queryFn: fetchUsers });

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState<UserForm>({
    name: "",
    email: "",
    password: "",
    role: Role.TEAM_MEMBER,
    team: Team.PHOTO_TEAM,
    designation: "",
    isActive: true,
  });

  const users = useMemo(() => data ?? [], [data]);

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
      role: Role.TEAM_MEMBER,
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

  const canSubmit =
    !!form.name &&
    !!form.email &&
    (mode === "edit" || (form.password && form.password.length >= 8)) &&
    (form.role === Role.ADMIN || !!form.team);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Team Management</h1>
          <p className="text-sm text-muted-foreground">Add/edit users, activate/deactivate, reset passwords.</p>
        </div>
        <Button onClick={openCreate}>Add Member</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>{users.length} total</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell>{u.team?.replaceAll("_", " ") ?? "-"}</TableCell>
                  <TableCell>{u.designation ?? "-"}</TableCell>
                  <TableCell>{u.isActive ? "Yes" : "No"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(u)}>
                        Edit
                      </Button>
                      {u.role !== Role.ADMIN ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={deleteUser.isPending}
                          onClick={() => deleteUser.mutate(u.id)}
                        >
                          Delete
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    No users yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Add Team Member" : "Edit Team Member"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3">
            <Input placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <Input placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            <Input
              type="password"
              placeholder={mode === "create" ? "Password (min 8 chars)" : "New password (optional)"}
              value={form.password ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Role</div>
                <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                  <SelectItem value={Role.ADMIN}>ADMIN</SelectItem>
                  <SelectItem value={Role.TEAM_MEMBER}>TEAM_MEMBER</SelectItem>
                </Select>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Team</div>
                <Select value={form.team} onValueChange={(v) => setForm((f) => ({ ...f, team: v }))}>
                  <SelectItem value={Team.PHOTO_TEAM}>PHOTO_TEAM</SelectItem>
                  <SelectItem value={Team.CINEMATIC_TEAM}>CINEMATIC_TEAM</SelectItem>
                  <SelectItem value={Team.TRADITIONAL_TEAM}>TRADITIONAL_TEAM</SelectItem>
                  <SelectItem value={Team.ALBUM_TEAM}>ALBUM_TEAM</SelectItem>
                  <SelectItem value={Team.DATA_MANAGEMENT}>DATA_MANAGEMENT</SelectItem>
                </Select>
              </div>
            </div>

            <Input
              placeholder="Designation (e.g. Photo Editor)"
              value={form.designation}
              onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
            />

            <div className="flex items-center justify-between">
              <label className="text-sm">Active</label>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
            </div>

            <div className="flex justify-end gap-2">
              {mode === "edit" && form.id && form.password ? (
                <Button
                  variant="outline"
                  onClick={() => resetPassword.mutate({ id: form.id!, password: form.password! })}
                >
                  Reset Password
                </Button>
              ) : null}
              <Button
                disabled={!canSubmit || createUser.isPending || updateUser.isPending}
                onClick={() => (mode === "create" ? createUser.mutate() : updateUser.mutate())}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

