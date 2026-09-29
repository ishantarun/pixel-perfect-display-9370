/**
 * Thin API client. Every service goes through here, so swapping mock data for
 * a real backend is a single flag + base URL change. No keys are hardcoded.
 */
export const API_BASE_URL = import.meta.env["VITE_API_BASE_URL"] ?? "";

/** When no backend URL is configured the app runs on clearly-labelled demo data. */
export const USING_DEMO_DATA = !API_BASE_URL;

export async function apiGet<T>(path: string, fallback: T): Promise<T> {
  if (USING_DEMO_DATA) return delay(fallback);
  const res = await fetch(`${API_BASE_URL}${path}`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return (await res.json()) as T;
}

export async function apiPost<T>(path: string, body: unknown, fallback: T): Promise<T> {
  if (USING_DEMO_DATA) return delay(fallback);
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return (await res.json()) as T;
}

function delay<T>(value: T, ms = 450): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
