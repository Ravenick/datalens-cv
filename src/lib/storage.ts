import type { Dataset } from './types';

const STORAGE_KEY = 'datalens:recent';
const MAX_SAVED = 5;

export interface SavedDatasetMeta {
  id: string;
  name: string;
  rows: number;
  columns: number;
  createdAt: number;
  size: number; // bytes of serialized dataset
}

export function saveDataset(dataset: Dataset): void {
  try {
    const saved = listSavedDatasets();
    const filtered = saved.filter((s) => s.id !== dataset.id);
    const meta: SavedDatasetMeta = {
      id: dataset.id,
      name: dataset.name,
      rows: dataset.rows.length,
      columns: dataset.columns.length,
      createdAt: dataset.createdAt,
      size: JSON.stringify(dataset).length,
    };
    filtered.unshift(meta);
    if (filtered.length > MAX_SAVED) {
      // Remove oldest beyond limit
      const toRemove = filtered.slice(MAX_SAVED);
      toRemove.forEach((r) => localStorage.removeItem(`${STORAGE_KEY}:${r.id}`));
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_SAVED)));
    localStorage.setItem(`${STORAGE_KEY}:${dataset.id}`, JSON.stringify(dataset));
  } catch {
    // storage may be full or unavailable; ignore
  }
}

export function listSavedDatasets(): SavedDatasetMeta[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedDatasetMeta[];
  } catch {
    return [];
  }
}

export function loadDataset(id: string): Dataset | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}:${id}`);
    if (!raw) return null;
    return JSON.parse(raw) as Dataset;
  } catch {
    return null;
  }
}

export function deleteDataset(id: string): void {
  try {
    const saved = listSavedDatasets().filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    localStorage.removeItem(`${STORAGE_KEY}:${id}`);
  } catch {
    // ignore
  }
}
