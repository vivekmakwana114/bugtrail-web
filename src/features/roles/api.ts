import { api } from '@/lib/api-client';
import type { AccessCatalog } from './types';

export async function getAccessCatalog(): Promise<AccessCatalog> {
  const { data } = await api.get<AccessCatalog>('/roles');
  return data;
}
