export function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export function normalizeTags(tags?: string[]): string[] {
  if (!tags) return [];

  const unique = new Set<string>();
  for (const raw of tags) {
    const normalized = raw.trim().toLowerCase();
    if (!normalized) continue;
    unique.add(normalized.slice(0, 40));
  }

  return Array.from(unique).slice(0, 8);
}

export function uniqueIds(ids?: string[]): string[] {
  return Array.from(new Set(ids ?? []));
}

export function canManageAsAdmin(role: string): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}
