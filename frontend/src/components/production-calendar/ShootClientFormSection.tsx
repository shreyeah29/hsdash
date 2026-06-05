import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ClientAutocompleteField } from "@/components/production-calendar/ClientAutocompleteField";
import {
  mergeClientProfiles,
  profileFromApiJson,
  shootClientProfilesFromEntries,
} from "@/lib/shootClientProfiles";
import { resolveShootClientName, type ShootClientProfile } from "@/types/shootClientProfile";
import { useWideRangeCalendarEntries } from "@/hooks/useWideRangeCalendarEntries";

export type ShootEventKind = "wedding" | "other";

export type ShootClientFormState = {
  day: string;
  eventKind: ShootEventKind;
  brideName: string;
  groomName: string;
  clientName: string;
  clientType: string;
  clientContact: string;
  phoneNumber: string;
  city: string;
  eventName: string;
  venue: string;
  startTime: string;
  endTime: string;
  photoTeam: string;
  videoTeam: string;
  addons: string;
};

export function emptyShootClientForm(day: string): ShootClientFormState {
  return {
    day,
    eventKind: "wedding",
    brideName: "",
    groomName: "",
    clientName: "",
    clientType: "",
    clientContact: "",
    phoneNumber: "",
    city: "",
    eventName: "",
    venue: "",
    startTime: "",
    endTime: "",
    photoTeam: "",
    videoTeam: "",
    addons: "",
  };
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-xl border border-zinc-200 bg-zinc-50 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
            value === opt.value ? "bg-violet-600 text-white shadow-sm" : "text-zinc-700 hover:bg-white",
          )}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function applyProfile(form: ShootClientFormState, profile: ShootClientProfile): ShootClientFormState {
  const next = { ...form };
  if (profile.isWedding && (profile.brideName || profile.groomName)) {
    next.eventKind = "wedding";
    next.brideName = profile.brideName;
    next.groomName = profile.groomName;
    next.clientName = resolveShootClientName({
      isWedding: true,
      brideName: profile.brideName,
      groomName: profile.groomName,
      clientName: "",
    });
  } else {
    next.eventKind = profile.isWedding ? "wedding" : "other";
    next.clientName = profile.clientName || profile.displayLabel;
    next.brideName = profile.brideName;
    next.groomName = profile.groomName;
  }
  if (profile.clientType) next.clientType = profile.clientType;
  if (profile.clientContact) next.clientContact = profile.clientContact;
  if (profile.phoneNumber) next.phoneNumber = profile.phoneNumber;
  if (profile.city) next.city = profile.city;
  if (profile.venue) next.venue = profile.venue;
  return next;
}

type Props = {
  form: ShootClientFormState;
  setForm: React.Dispatch<React.SetStateAction<ShootClientFormState>>;
  TimePicker: React.ComponentType<{ label: string; value: string; onChange: (next: string) => void }>;
};

export function ShootClientFormSection({ form, setForm, TimePicker }: Props) {
  const { data: wideEntries = [] } = useWideRangeCalendarEntries();
  const { data: apiClients = [] } = useQuery({
    queryKey: ["production-calendar-clients"],
    queryFn: async () => {
      const { data } = await api.get<{ clients: Record<string, unknown>[] }>("/production-calendar/clients");
      return data.clients.map(profileFromApiJson);
    },
  });

  const profiles = useMemo(() => {
    const fromEntries = shootClientProfilesFromEntries(wideEntries);
    return mergeClientProfiles(fromEntries, apiClients);
  }, [wideEntries, apiClients]);

  const isWedding = form.eventKind === "wedding";

  function onSelectProfile(profile: ShootClientProfile) {
    setForm((f) => applyProfile(f, profile));
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1 sm:col-span-2">
        <div className="text-xs font-medium text-zinc-600">Day</div>
        <Input type="date" value={form.day} onChange={(ev) => setForm((f) => ({ ...f, day: ev.target.value }))} />
      </div>

      <div className="space-y-2 sm:col-span-2">
        <div className="text-xs font-medium text-zinc-600">Event type</div>
        <Segmented
          options={[
            { value: "wedding", label: "Wedding" },
            { value: "other", label: "Other" },
          ]}
          value={form.eventKind}
          onChange={(eventKind) => setForm((f) => ({ ...f, eventKind }))}
        />
      </div>

      {isWedding ? (
        <>
          <ClientAutocompleteField
            label="Bride"
            value={form.brideName}
            onChange={(brideName) =>
              setForm((f) => ({
                ...f,
                brideName,
                clientName: resolveShootClientName({
                  isWedding: true,
                  brideName,
                  groomName: f.groomName,
                  clientName: "",
                }),
              }))
            }
            profiles={profiles}
            placeholder="Bride name"
            onSelectProfile={onSelectProfile}
          />
          <ClientAutocompleteField
            label="Groom"
            value={form.groomName}
            onChange={(groomName) =>
              setForm((f) => ({
                ...f,
                groomName,
                clientName: resolveShootClientName({
                  isWedding: true,
                  brideName: f.brideName,
                  groomName,
                  clientName: "",
                }),
              }))
            }
            profiles={profiles}
            placeholder="Groom name"
            onSelectProfile={onSelectProfile}
          />
        </>
      ) : (
        <div className="sm:col-span-2">
          <ClientAutocompleteField
            label="Client name"
            value={form.clientName}
            onChange={(clientName) => setForm((f) => ({ ...f, clientName }))}
            profiles={profiles}
            placeholder="e.g. Corporate client"
            onSelectProfile={onSelectProfile}
          />
        </div>
      )}

      <div className="space-y-1">
        <div className="text-xs font-medium text-zinc-600">Type of client</div>
        <Input
          value={form.clientType}
          onChange={(ev) => setForm((f) => ({ ...f, clientType: ev.target.value }))}
          placeholder="Wedding, corporate…"
        />
      </div>
      <div className="space-y-1">
        <div className="text-xs font-medium text-zinc-600">Event name</div>
        <Input
          value={form.eventName}
          onChange={(ev) => setForm((f) => ({ ...f, eventName: ev.target.value }))}
          placeholder="Reception, ceremony…"
        />
      </div>
      <div className="space-y-1">
        <div className="text-xs font-medium text-zinc-600">Phone</div>
        <Input
          value={form.phoneNumber}
          onChange={(ev) => setForm((f) => ({ ...f, phoneNumber: ev.target.value }))}
          placeholder="Mobile number"
        />
      </div>
      <div className="space-y-1">
        <div className="text-xs font-medium text-zinc-600">Other contact</div>
        <Input
          value={form.clientContact}
          onChange={(ev) => setForm((f) => ({ ...f, clientContact: ev.target.value }))}
          placeholder="Email / alternate"
        />
      </div>
      <div className="space-y-1">
        <div className="text-xs font-medium text-zinc-600">City</div>
        <Input value={form.city} onChange={(ev) => setForm((f) => ({ ...f, city: ev.target.value }))} placeholder="City" />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <div className="text-xs font-medium text-zinc-600">Venue</div>
        <Input
          value={form.venue}
          onChange={(ev) => setForm((f) => ({ ...f, venue: ev.target.value }))}
          placeholder="Ceremony / reception location"
        />
      </div>
      <TimePicker label="Start time" value={form.startTime} onChange={(startTime) => setForm((f) => ({ ...f, startTime }))} />
      <TimePicker label="End time" value={form.endTime} onChange={(endTime) => setForm((f) => ({ ...f, endTime }))} />
      <div className="space-y-1 sm:col-span-2">
        <div className="text-xs font-medium text-zinc-600">Photo team (on-site)</div>
        <textarea
          className={cn("premium-field min-h-[72px] w-full resize-y")}
          value={form.photoTeam}
          onChange={(ev) => setForm((f) => ({ ...f, photoTeam: ev.target.value }))}
          placeholder="Names / crew going"
        />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <div className="text-xs font-medium text-zinc-600">Video team (on-site)</div>
        <textarea
          className={cn("premium-field min-h-[72px] w-full resize-y")}
          value={form.videoTeam}
          onChange={(ev) => setForm((f) => ({ ...f, videoTeam: ev.target.value }))}
          placeholder="Names / crew going"
        />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <div className="text-xs font-medium text-zinc-600">Notes / add-ons</div>
        <textarea
          className={cn("premium-field min-h-[72px] w-full resize-y")}
          value={form.addons}
          onChange={(ev) => setForm((f) => ({ ...f, addons: ev.target.value }))}
          placeholder="Anything extra to remember"
        />
      </div>
    </div>
  );
}

export function shootFormCanSave(form: ShootClientFormState) {
  if (form.eventKind === "wedding") {
    return !!(form.brideName.trim() || form.groomName.trim());
  }
  return !!form.clientName.trim();
}

export function shootFormToPayload(form: ShootClientFormState) {
  const isWedding = form.eventKind === "wedding";
  const brideName = isWedding ? form.brideName.trim() : "";
  const groomName = isWedding ? form.groomName.trim() : "";
  const clientName = isWedding
    ? resolveShootClientName({ isWedding: true, brideName, groomName, clientName: "" })
    : form.clientName.trim();
  return {
    day: form.day,
    clientName,
    brideName,
    groomName,
    phoneNumber: form.phoneNumber,
    clientType: form.clientType,
    clientContact: form.clientContact,
    city: form.city,
    eventName: form.eventName,
    venue: form.venue,
    startTime: form.startTime,
    endTime: form.endTime,
    photoTeam: form.photoTeam,
    videoTeam: form.videoTeam,
    addons: form.addons,
  };
}

export function shootFormFromEntry(entry: {
  day: string;
  clientName: string;
  brideName?: string | null;
  groomName?: string | null;
  phoneNumber?: string | null;
  clientType: string;
  clientContact: string;
  city: string;
  eventName: string;
  venue: string;
  startTime: string;
  endTime: string;
  photoTeam: string;
  videoTeam: string;
  addons: string;
}): ShootClientFormState {
  const bride = entry.brideName?.trim() ?? "";
  const groom = entry.groomName?.trim() ?? "";
  const isWedding = !!(bride || groom || entry.clientName.includes("&"));
  return {
    day: entry.day.includes("T") ? entry.day.slice(0, 10) : entry.day,
    eventKind: isWedding ? "wedding" : "other",
    brideName: bride,
    groomName: groom,
    clientName: entry.clientName,
    clientType: entry.clientType ?? "",
    clientContact: entry.clientContact ?? "",
    phoneNumber: entry.phoneNumber?.trim() ?? "",
    city: entry.city ?? "",
    eventName: entry.eventName,
    venue: entry.venue ?? "",
    startTime: entry.startTime,
    endTime: entry.endTime,
    photoTeam: entry.photoTeam,
    videoTeam: entry.videoTeam,
    addons: entry.addons,
  };
}
