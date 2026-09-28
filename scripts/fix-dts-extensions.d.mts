export function addJsExtensions(
  source: string,
  kindOf: (specifier: string) => 'file' | 'dir' | null,
): string;
