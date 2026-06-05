export type ShootClientProfile = {
  id: string;
  displayLabel: string;
  clientName: string;
  clientType: string;
  clientContact: string;
  city: string;
  venue: string;
  brideName: string;
  groomName: string;
  phoneNumber: string;
  isWedding: boolean;
};

export function looksLikePhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

export function effectiveClientPhone(phoneNumber: string, clientContact: string) {
  const phone = phoneNumber.trim();
  if (phone) return phone;
  const contact = clientContact.trim();
  if (looksLikePhoneNumber(contact)) return contact;
  return "";
}

export function effectiveClientContact(phoneNumber: string, clientContact: string) {
  const phone = phoneNumber.trim();
  const contact = clientContact.trim();
  if (!contact) return "";
  if (phone && contact === phone) return "";
  if (!phone && looksLikePhoneNumber(contact)) return "";
  return contact;
}

export function resolveShootClientName(opts: {
  isWedding: boolean;
  brideName: string;
  groomName: string;
  clientName: string;
}) {
  if (!opts.isWedding) return opts.clientName.trim();
  const b = opts.brideName.trim();
  const g = opts.groomName.trim();
  if (!b && !g) return "";
  if (!b) return g;
  if (!g) return b;
  return `${b} & ${g}`;
}
