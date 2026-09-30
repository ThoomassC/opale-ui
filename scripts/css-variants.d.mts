export const LAYER_NAME: string;
export const FONTS_IMPORT: string;
export const SHEET_VARIANTS: readonly string[];
export function stripFontsImport(css: string): string;
export function topLevelLayers(css: string): (string | null)[];
export function layerSheet(css: string): string;
export function writeVariants(directory: string): string[];
