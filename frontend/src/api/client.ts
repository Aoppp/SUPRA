import type { SearchResult, AssemblyDetail, AssemblyListItem, BuildingBlock, Morphology, DrivingForce, Property, WorkProgress } from '../types';

const BASE = '/api';

async function get<T>(url: string): Promise<T> {
  const res = await fetch(BASE + url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function search(params: Record<string, string | number | undefined>) {
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
