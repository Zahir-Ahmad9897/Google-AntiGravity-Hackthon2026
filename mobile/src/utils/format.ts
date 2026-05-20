export function percent(value?: number): string {
  return `${Math.round((value || 0) * 100)}%`;
}

export function titleCase(value?: string): string {
  if (!value) return 'Unknown';
  return value
    .replaceAll('_', ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function artifactFilename(path: string): string {
  return path.split(/[\\/]/).pop() || path;
}
