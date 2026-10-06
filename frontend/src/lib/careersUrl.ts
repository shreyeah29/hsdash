/** Public JOIN US page — submissions land in the Careers inbox. */
export const DEFAULT_CAREERS_FORM_URL = "https://hswf.app/join";

export function getCareersFormUrl() {
  const fromEnv = (import.meta.env.VITE_CAREERS_FORM_URL as string | undefined)?.trim();
  return fromEnv || DEFAULT_CAREERS_FORM_URL;
}
