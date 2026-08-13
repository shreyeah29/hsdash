/** Public JOIN US Google Form (HSWF hiring). */
export const DEFAULT_CAREERS_FORM_URL =
  "https://docs.google.com/forms/d/1PWp3k8Vg5L4YxRkDTW0IO_FWdzY0VVBt9Zf7iSrH2F8/viewform";

export function getCareersFormUrl() {
  const fromEnv = (import.meta.env.VITE_CAREERS_FORM_URL as string | undefined)?.trim();
  return fromEnv || DEFAULT_CAREERS_FORM_URL;
}
