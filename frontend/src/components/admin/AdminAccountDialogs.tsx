import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import type { User } from "@/types/domain";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const usernameSchema = z.object({
  username: z
    .string()
    .min(3, "At least 3 characters")
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, and underscores only"),
  currentPassword: z.string().min(1, "Current password is required"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type UsernameForm = z.infer<typeof usernameSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export function AdminChangeUsernameDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const form = useForm<UsernameForm>({
    resolver: zodResolver(usernameSchema),
    defaultValues: { username: user?.username ?? "", currentPassword: "" },
  });

  async function onSubmit(values: UsernameForm) {
    setError(null);
    setOk(false);
    try {
      const { data } = await api.post<{ user: User }>("/auth/change-username", values);
      setUser(data.user);
      setOk(true);
      form.reset({ username: data.user.username, currentPassword: "" });
      setTimeout(() => onOpenChange(false), 800);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not update username.";
      setError(msg);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="admin-card max-w-md border-2 border-black p-0 shadow-[6px_6px_0_#000]">
        <form className="p-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <DialogTitle className="admin-display-title text-xl">Change username</DialogTitle>
          <p className="admin-display-subtitle mt-2 text-sm">Current: {user?.username ?? "—"}</p>

          <label className="admin-kicker mt-6 block" htmlFor="new-username">
            New username
          </label>
          <input id="new-username" className="mt-2 w-full border-2 border-black px-3 py-2 text-sm font-medium" {...form.register("username")} />
          {form.formState.errors.username ? (
            <p className="mt-1 text-xs font-semibold text-red-700">{form.formState.errors.username.message}</p>
          ) : null}

          <label className="admin-kicker mt-4 block" htmlFor="username-current-password">
            Current password
          </label>
          <input
            id="username-current-password"
            type="password"
            className="mt-2 w-full border-2 border-black px-3 py-2 text-sm font-medium"
            {...form.register("currentPassword")}
          />
          {form.formState.errors.currentPassword ? (
            <p className="mt-1 text-xs font-semibold text-red-700">{form.formState.errors.currentPassword.message}</p>
          ) : null}

          {error ? <p className="mt-3 text-sm font-semibold text-red-700">{error}</p> : null}
          {ok ? <p className="mt-3 text-sm font-semibold text-green-800">Username updated.</p> : null}

          <div className="mt-6 flex gap-2">
            <button type="submit" className="admin-btn admin-btn--solid" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving…" : "Save"}
            </button>
            <button type="button" className="admin-btn" onClick={() => onOpenChange(false)}>
              Cancel
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AdminChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const form = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values: PasswordForm) {
    setError(null);
    setOk(false);
    try {
      await api.post("/auth/change-password", {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      setOk(true);
      form.reset();
      setTimeout(() => onOpenChange(false), 800);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not update password.";
      setError(msg);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="admin-card max-w-md border-2 border-black p-0 shadow-[6px_6px_0_#000]">
        <form className="p-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <DialogTitle className="admin-display-title text-xl">Change password</DialogTitle>
          <p className="admin-display-subtitle mt-2 text-sm">Use at least 8 characters.</p>

          <label className="admin-kicker mt-6 block" htmlFor="current-password">
            Current password
          </label>
          <input
            id="current-password"
            type="password"
            className="mt-2 w-full border-2 border-black px-3 py-2 text-sm font-medium"
            {...form.register("currentPassword")}
          />

          <label className="admin-kicker mt-4 block" htmlFor="new-password">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            className="mt-2 w-full border-2 border-black px-3 py-2 text-sm font-medium"
            {...form.register("newPassword")}
          />

          <label className="admin-kicker mt-4 block" htmlFor="confirm-password">
            Confirm new password
          </label>
          <input
            id="confirm-password"
            type="password"
            className="mt-2 w-full border-2 border-black px-3 py-2 text-sm font-medium"
            {...form.register("confirmPassword")}
          />
          {form.formState.errors.confirmPassword ? (
            <p className="mt-1 text-xs font-semibold text-red-700">{form.formState.errors.confirmPassword.message}</p>
          ) : null}

          {error ? <p className="mt-3 text-sm font-semibold text-red-700">{error}</p> : null}
          {ok ? <p className="mt-3 text-sm font-semibold text-green-800">Password updated.</p> : null}

          <div className="mt-6 flex gap-2">
            <button type="submit" className="admin-btn admin-btn--solid" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving…" : "Save"}
            </button>
            <button type="button" className="admin-btn" onClick={() => onOpenChange(false)}>
              Cancel
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
