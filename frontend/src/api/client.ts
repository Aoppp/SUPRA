import type { SearchResult, AssemblyDetail, AssemblyListItem, BuildingBlock, Morphology, DrivingForce, Property, AssemblyDriveMethod, WorkProgress, VisitListResult, AdminStats, TopMolecule, TrendData, CompoundTypeCount } from '../types';

const BASE = '/api';

async function get<T>(url: string): Promise<T> {
  const res = await fetch(BASE + url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function search(params: Record<string, string | number | boolean | undefined>) {
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') query.set(k, String(v));
  }
  return get<SearchResult>(`/search?${query.toString()}`);
}

export function getAssembly(id: number) {
  return get<AssemblyDetail>(`/assemblies/${id}`);
}

export function getBuildingBlockList() {
  return get<BuildingBlock[]>('/building-blocks');
}

export function getMorphologyList() {
  return get<Morphology[]>('/morphologies');
}

export function getDrivingForceList() {
  return get<DrivingForce[]>('/driving-forces');
}

export function getPropertyList() {
  return get<Property[]>('/properties');
}

export function getAssemblyDriveMethodList() {
  return get<AssemblyDriveMethod[]>('/assembly-drive-methods');
}

export function getCompoundTypes() {
  return get<CompoundTypeCount[]>('/compound-types');
}

export function uploadImage(file: File) {
  const fd = new FormData();
  fd.set('file', file);
  return fetch(BASE + '/upload-image', {
    method: 'POST',
    body: fd,
  }).then(res => {
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json() as Promise<{ path: string }>;
  });
}

export function createAssembly(data: Record<string, unknown>) {
  return fetch(BASE + '/assemblies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(res => {
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json() as Promise<AssemblyDetail>;
  });
}

export function getWorkProgressList() {
  return get<WorkProgress[]>('/workbench');
}

export function batchUploadAssemblies(file: File) {
  const fd = new FormData();
  fd.set('file', file);
  return fetch(BASE + '/assemblies/batch', {
    method: 'POST',
    body: fd,
  }).then(res => {
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json() as Promise<{ created: number; errors: { row: number; error: string }[]; total_rows: number }>;
  });
}

export function deleteAssembly(id: number) {
  return fetch(BASE + `/assemblies/${id}`, { method: 'DELETE' }).then(res => {
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json() as Promise<{ ok: boolean }>;
  });
}

export function searchByCas(cas: string) {
  return get<AssemblyListItem[]>(`/search-by-cas?cas=${encodeURIComponent(cas)}`);
}

export function deleteWorkProgress(id: number) {
  return fetch(BASE + `/workbench/${id}`, { method: 'DELETE' }).then(res => {
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json() as Promise<{ ok: boolean }>;
  });
}

export function uploadWorkProgress(data: FormData) {
  return fetch(BASE + '/workbench', {
    method: 'POST',
    body: data,
  }).then(res => {
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json() as Promise<WorkProgress>;
  });
}

// ── Admin ──────────────────────────────────────────────

function getToken(): string | null {
  return localStorage.getItem('admin_token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export function adminLogin(password: string) {
  return fetch(BASE + '/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  }).then(res => {
    if (!res.ok) throw new Error(`Login failed: ${res.status}`);
    return res.json() as Promise<{ token: string }>;
  });
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function logout() {
  localStorage.removeItem('admin_token');
}

export function getAdminStats(dateFrom?: string, dateTo?: string) {
  const qs = new URLSearchParams();
  if (dateFrom) qs.set('date_from', dateFrom);
  if (dateTo) qs.set('date_to', dateTo);
  const q = qs.toString();
  return fetch(BASE + '/admin/stats' + (q ? `?${q}` : ''), { headers: authHeaders() }).then(res => {
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json() as Promise<AdminStats>;
  });
}

export function getTrendData(dateFrom: string, dateTo: string) {
  return fetch(BASE + `/admin/trend?date_from=${dateFrom}&date_to=${dateTo}`, { headers: authHeaders() }).then(res => {
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json() as Promise<TrendData>;
  });
}

export function getAdminVisits(page = 1, pageSize = 20, dateFrom?: string, dateTo?: string) {
  const qs = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (dateFrom) qs.set('date_from', dateFrom);
  if (dateTo) qs.set('date_to', dateTo);
  return fetch(BASE + `/admin/visits?${qs.toString()}`, { headers: authHeaders() }).then(res => {
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json() as Promise<VisitListResult>;
  });
}

export function getTopMolecules(n = 20) {
  return fetch(BASE + `/admin/top-molecules?n=${n}`, { headers: authHeaders() }).then(res => {
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json() as Promise<TopMolecule[]>;
  });
}

export async function downloadExportVisits() {
  const res = await fetch(BASE + '/admin/export-visits', { headers: authHeaders() });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'visit_logs.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadExportMoleculeStats() {
  const res = await fetch(BASE + '/admin/export-molecule-stats', { headers: authHeaders() });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'molecule_stats.csv';
  a.click();
  URL.revokeObjectURL(url);
}
