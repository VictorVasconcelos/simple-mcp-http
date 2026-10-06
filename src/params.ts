const PARAM_PATTERN = /\{\{([A-Za-z0-9_]+)\}\}/g;

export function extractParameterNames(url: string): string[] {
  const names = new Set<string>();
  for (const match of url.matchAll(PARAM_PATTERN)) {
    names.add(match[1]);
  }
  return [...names];
}

export function applyParameters(url: string, params: Record<string, string>): string {
  return url.replace(PARAM_PATTERN, (_full, name: string) => {
    if (!(name in params)) {
      throw new Error(`Missing required parameter: ${name}`);
    }
    return encodeURIComponent(params[name]);
  });
}
