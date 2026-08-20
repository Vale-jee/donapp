export interface ApiLogEntry {
  requestId: string;
  method: string;
  route: string;
  status: number;
  durationMs: number;
  category: string;
  message: string;
}

export function logApiRequest(entry: ApiLogEntry): void {
  const serializedEntry = JSON.stringify({
    timestamp: new Date().toISOString(),
    ...entry,
  });

  if (entry.status >= 500) {
    console.error(serializedEntry);
    return;
  }

  if (entry.status >= 400) {
    console.warn(serializedEntry);
    return;
  }

  console.info(serializedEntry);
}
