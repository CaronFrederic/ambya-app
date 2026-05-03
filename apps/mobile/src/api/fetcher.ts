import { apiFetch as sharedApiFetch, buildApiUrl } from "./client";

type FetchOptions = RequestInit & { auth?: boolean };

export function apiFetch<T>(path: string, opts: FetchOptions = {}) {
  const { auth: _auth = false, ...rest } = opts;
  return sharedApiFetch<T>(path, rest);
}

export { buildApiUrl };
